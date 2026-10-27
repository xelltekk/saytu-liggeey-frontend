import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import vm from 'node:vm'
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { emptyReport, compareReports, comparisonCsv, parseReport, mergeCounterColumn } from '../src/utils/leasingComparison.mjs'
import { readLeasingPdf, validatePdfFile } from '../src/services/leasingPdfReader.mjs'

const sample = () => [
  { date: '2026-08-24', serial: 'TEST12345', counters: { 102: 405666, 409: 139696, 112: 5 } },
  { date: '2026-10-27', serial: 'TEST12345', counters: { 102: 408785, 409: 141377, 112: 6 } },
]
const opts = () => ({ verified: true, a4: true, largeColor: 0, blackPrice: 20, colorPrice: 60 })
test('original conditional example yields 1436 black / 1681 color / 129580 CFA', () => {
  const r = compareReports(sample(), opts())
  assert.equal(r.black, 1436); assert.equal(r.color, 1681); assert.equal(r.total, 129580)
  assert.equal(compareReports(sample(), { ...opts(), largeColor: 2 }).color, 1677)
})
for (const [name, change, pattern] of [
  ['unverified', { verified: false }, /Vérifiez/], ['unknown formats', { a4: false }, /formats/],
  ['missing large formats', { largeColor: '' }, /entier/], ['negative large formats', { largeColor: -1 }, /entier/],
  ['fractional faces', { largeColor: 1.5 }, /entier/], ['missing tariff', { blackPrice: '' }, /tarifs/],
  ['negative tariff', { colorPrice: -1 }, /tarifs/], ['infinite tariff', { blackPrice: Infinity }, /tarifs/],
  ['too many large formats', { largeColor: 1000 }, /négatif/], ['wrong contract printer', { expectedSerial: 'OTHER' }, /contrat/],
]) test(`blocks ${name}`, () => assert.throws(() => compareReports(sample(), { ...opts(), ...change }), pattern))
test('dates, decreasing and missing counters, serials are validated', () => {
  for (const mutate of [r => r[1].date = r[0].date, r => r[0].date = '2026-02-30', r => r[1].serial = 'OTHER', r => r[1].counters[102] = '', r => r[1].counters[102] = 405660, r => r[0].counters[112] = -1]) {
    const reports = sample(); mutate(reports); assert.throws(() => compareReports(reports, opts()))
  }
})
test('zero usage and free tariffs remain valid', () => {
  const reports = sample(); reports[1].counters = { ...reports[0].counters }
  assert.equal(compareReports(reports, opts()).total, 0)
  assert.equal(compareReports(sample(), { ...opts(), blackPrice: 0, colorPrice: 0 }).total, 0)
})
test('CSV exports limits and neutralizes formulas', () => {
  const r = compareReports(sample(), opts()); r.serial = '=HYPERLINK("bad")'
  const csv = comparisonCsv(r)
  assert.match(csv, /"'=HYPERLINK/); assert.match(csv, /hors forfait, loyer et taxes/); assert.match(csv, /129580/)
})
test('OCR excludes scan and label digits; conflicting readings stay empty', () => {
  assert.equal(parseReport('102 Total 2 405666\n501 Lecture 99999').counters[102], 405666)
  assert.equal(parseReport('102 Total 2').counters[102], undefined)
  assert.equal(parseReport('112 Total (Noir/Grand format) 6|').counters[112], 6)
  const r = parseReport('102 Total 2 10\n102 Total 2 20')
  assert.equal(r.counters[102], undefined)
  assert.equal(mergeCounterColumn(r, 'Rapport du compteur iR-ADV C5535', '0\n20\n5\n100').counters[102], undefined)
})
test('file restrictions and abort prevent engine work', async () => {
  assert.throws(() => validatePdfFile({ name: 'a.html', type: 'text/html', size: 5 }), /PDF/)
  assert.throws(() => validatePdfFile({ name: 'a.pdf', size: 31 * 1024 * 1024 }), /30 Mo/)
  const signal = AbortSignal.abort()
  await assert.rejects(readLeasingPdf({ name: 'a.pdf', size: 12 }, { signal, loadEngines: () => { throw Error('must not load') } }), /annulée/)
  await assert.rejects(readLeasingPdf({ name: 'a.pdf', size: 4, arrayBuffer: async () => new TextEncoder().encode('oops').buffer }), /valide/)
})
test('page limit checked and document cleaned up', async () => {
  let destroyed = false
  const file = { name: 'a.pdf', size: 12, arrayBuffer: async () => new TextEncoder().encode('%PDF-1.4').buffer }
  await assert.rejects(readLeasingPdf(file, { loadEngines: async () => ({ pdfjs: { getDocument: () => ({ promise: Promise.resolve({ numPages: 11 }), destroy: async () => { destroyed = true } }) } }) }), /10 pages/)
  assert.equal(destroyed, true)
})
test('cancellation settles even while an engine download is pending', async () => {
  const controller = new AbortController()
  const file = { name: 'a.pdf', size: 12, arrayBuffer: async () => new TextEncoder().encode('%PDF-1.4').buffer }
  const pending = readLeasingPdf(file, { signal: controller.signal, loadEngines: () => new Promise(() => {}) })
  controller.abort()
  await assert.rejects(pending, /annulée/)
})
test('a stalled PDF page reports its stage and does not await a broken cleanup', async () => {
  const statuses = []
  const file = { name: 'a.pdf', size: 12, arrayBuffer: async () => new TextEncoder().encode('%PDF-1.4').buffer }
  const doc = { numPages: 1, getPage: async () => ({ getTextContent: () => new Promise(() => {}) }) }
  let options
  await assert.rejects(readLeasingPdf(file, {
    stageTimeoutMs: 15, timeoutMs: 1000, onProgress: text => statuses.push(text),
    loadEngines: async () => ({ pdfjs: { getDocument: o => { options = o; return { promise: Promise.resolve(doc), destroy: () => new Promise(() => {}) } } } }),
  }), /Extraction du texte.*Délai dépassé/)
  assert.ok(statuses.some(s => s.includes('Extraction du texte')))
  assert.match(options.wasmUrl, /pdf-wasm\/$/)
})
test('asynchronous OCR initialization failure returns a useful error and keeps its preview', async () => {
  const originalDocument = globalThis.document, originalLocation = globalThis.location
  globalThis.location = { origin: 'http://localhost' }
  globalThis.document = { createElement: () => ({ getContext: () => ({ drawImage() {} }), toDataURL: () => 'data:image/jpeg;base64,AA==' }) }
  let preview
  try {
    const file = { name: 'a.pdf', size: 12, arrayBuffer: async () => new TextEncoder().encode('%PDF-1.4').buffer }
    const page = { getTextContent: async () => ({ items: [] }), getViewport: () => ({ width: 100, height: 200 }), render: () => ({ promise: Promise.resolve(), cancel() {} }), cleanup() {} }
    await assert.rejects(readLeasingPdf(file, {
      timeoutMs: 1000, onPreview: p => { preview = p },
      loadEngines: async () => ({
        pdfjs: { getDocument: () => ({ promise: Promise.resolve({ numPages: 1, getPage: async () => page }), destroy: async () => {} }) },
        tesseract: { createWorker: (_language, _oem, options) => { queueMicrotask(() => options.errorHandler('network failure')); return new Promise(() => {}) } },
      }),
    }), /moteur OCR/)
    assert.equal(preview.previews.length, 1)
  } finally { globalThis.document = originalDocument; globalThis.location = originalLocation }
})

function view() {
  const file = readFileSync(new URL('../src/views/LeasingComparaisonView.vue', import.meta.url), 'utf8')
  const script = file.split('<script setup>')[1].split('</script>')[0].replace(/^import .*$/gm, '')
  const cleanup = [], route = { query: {} }, api = { get: async () => ({ data: {} }) }
  const context = vm.createContext({ ref, reactive, computed, watch, nextTick, emptyReport, compareReports, comparisonCsv, AbortController,
    setInterval, clearInterval,
    useRoute: () => route, api, onBeforeRouteLeave() {}, onMounted() {}, onBeforeUnmount: fn => cleanup.push(fn),
    window: { confirm: () => true, removeEventListener() {} }, document: { body: { classList: { remove() {} } } },
    readLeasingPdf: async () => ({ report: sample()[0], previews: [], text: '' }) })
  vm.runInContext(script + '\nglobalThis.v = { reports, options, result, files, busy, calculate, reset, importPdf, cancelReading, loadContract, contract, contractError, contractLoading };', context)
  return { ...context.v, api, route, context, cleanup, file }
}
test('editing a counter removes old result and requires reconfirmation', async () => {
  const p = view(); p.reports.splice(0, 2, ...sample()); Object.assign(p.options, opts()); p.options.verified = true; await nextTick()
  await p.calculate(); assert.equal(p.result.value.total, 129580)
  p.reports[1].counters[102]++
  assert.equal(p.result.value, null); assert.equal(p.options.verified, false)
  await p.calculate(); assert.equal(p.result.value, null)
})
test('late OCR cannot restore erased data', async () => {
  const p = view(); let resolve
  p.context.readLeasingPdf = () => new Promise(r => { resolve = r })
  const pending = p.importPdf({ target: { files: [{}] } }, 0)
  assert.equal(p.busy.value, true)
  p.reset()
  resolve({ report: sample()[0], previews: [], text: '' }); await pending
  assert.equal(p.reports[0].date, ''); assert.equal(p.busy.value, false)
})
test('failed OCR preserves the preview and immediately unlocks manual entry', async () => {
  const p = view()
  p.context.readLeasingPdf = async (_file, options) => { options.onPreview({ previews: ['safe-preview'], text: '' }); throw Error('Lecture trop longue') }
  await p.importPdf({ target: { files: [{}] } }, 0)
  assert.equal(p.busy.value, false)
  assert.equal(p.files[0].previews[0], 'safe-preview')
  assert.match(p.files[0].status, /Saisie manuelle disponible/)
})
test('contract pricing and failed access do not produce calculations', async () => {
  const p = view(); p.route.query.contrat = '4'
  p.api.get = async url => { assert.equal(url, '/leasing/contrats/4'); return { data: { prix_page_noir_ht: 15, prix_page_couleur_ht: 50 } } }
  await p.loadContract(); assert.equal(p.options.blackPrice, 15)
  p.api.get = async () => { throw Error('403') }
  await p.loadContract(); assert.match(p.contractError.value, /inaccessible/); assert.equal(p.contract.value, null)
  await p.calculate(); assert.equal(p.result.value, null)
})
test('native protected route; no HTML injection, customer writes or PDF uploading', () => {
  const p = view()
  assert.doesNotMatch(p.file, /v-html|api\.(post|put|patch)|localStorage/)
  const router = readFileSync(new URL('../src/router/index.js', import.meta.url), 'utf8')
  assert.match(router, /path: 'leasing\/comparaison'/); assert.match(router, /'\/leasing': 'leasing.view'/)
  for (const f of ['pdf.mjs', 'pdf.worker.mjs', 'tesseract.min.js', 'worker.min.js', 'lang/eng.traineddata', 'core/tesseract-core-lstm.wasm.js']) assert.equal(existsSync(new URL('../public/assets/leasing-comparator/runtime/' + f, import.meta.url)), true)
  const reader = readFileSync(new URL('../src/services/leasingPdfReader.mjs', import.meta.url), 'utf8')
  assert.match(reader, /gzip: false/)
  assert.match(reader, /\/assets\/leasing-comparator\/runtime\//)
  for (const f of ['pdf-wasm/openjpeg.wasm', 'pdf-wasm/jbig2.wasm', 'pdf-wasm/qcms_bg.wasm', 'standard_fonts/LiberationSans-Regular.ttf']) assert.equal(existsSync(new URL('../public/assets/leasing-comparator/runtime/' + f, import.meta.url)), true)
})
