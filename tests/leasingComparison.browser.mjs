// Run with SAYTU_TEST_RUNTIME pointing to the bundled node_modules directory.
// Uses only a localhost harness; no ERP database or mail. An optional local PDF
// may be supplied via SAYTU_TEST_PDF; it is never copied into the repository.
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
const require = createRequire(import.meta.url)
const runtime = process.env.SAYTU_TEST_RUNTIME
if (!runtime) throw Error('Set SAYTU_TEST_RUNTIME to the bundled node_modules path')
const { chromium } = require(join(runtime, 'playwright'))
const { PDFDocument, StandardFonts, pushGraphicsState, popGraphicsState, scale, drawObject } = require(join(runtime, 'pdf-lib'))
const { createCanvas } = require(join(runtime, '@napi-rs/canvas'))
const browser = await chromium.launch({ headless: true, ...(process.env.SAYTU_TEST_BROWSER ? { channel: process.env.SAYTU_TEST_BROWSER } : {}) })
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } })
const errors = [], external = [], warnings = []
if (process.env.SAYTU_TEST_CSP_FILE) {
  const policy = readFileSync(process.env.SAYTU_TEST_CSP_FILE, 'utf8').match(/Header always set Content-Security-Policy "([^"]+)"/)[1]
  assert.ok(!policy.includes("'unsafe-eval'"), 'JavaScript eval must remain prohibited')
  await page.route('http://127.0.0.1:5179/**', async route => {
    const response = await route.fetch()
    await route.fulfill({ response, headers: { ...response.headers(), 'content-security-policy': policy } })
  })
}
page.on('console', message => { if (['warning', 'error'].includes(message.type()) || message.text().includes('Warning:')) warnings.push(message.text()) })
page.on('pageerror', error => errors.push(error.message))
page.on('request', request => { if (/^https?:/.test(request.url()) && !request.url().startsWith('http://127.0.0.1:5179/')) external.push(request.url()) })
const fixture = async (recent, scan = false) => {
  const doc = await PDFDocument.create(), p = doc.addPage([595, 842])
  const lines = ['Rapport du compteur Canon', recent ? '27/10/2026' : '24/08/2026', 'Numero de serie TEST12345',
    `102 Total 2 ${recent ? 408785 : 405666}`, `409 Copie Impression (Couleur) ${recent ? 141377 : 139696}`, `112 Total (Noir/Grand format) ${recent ? 6 : 5}`, '501 Lecture 999999']
  if (scan) {
    const canvas = createCanvas(1190, 1684), ctx = canvas.getContext('2d')
    ctx.fillStyle = 'white'; ctx.fillRect(0, 0, 1190, 1684); ctx.fillStyle = 'black'; ctx.font = '28px Arial'
    lines.forEach((line, i) => ctx.fillText(line, 60, 100 + i * 70))
    if (process.env.SAYTU_TEST_PYTHON) {
      const jp2 = execFileSync(process.env.SAYTU_TEST_PYTHON, ['-c', "from PIL import Image; import sys,io; Image.open(io.BytesIO(sys.stdin.buffer.read())).convert('RGB').save(sys.stdout.buffer,format='JPEG2000',no_jp2=True)"], { input: canvas.toBuffer('image/png'), maxBuffer: 8 * 1024 * 1024 })
      assert.equal(jp2.subarray(0, 2).toString('hex'), 'ff4f')
      const image = doc.context.register(doc.context.stream(jp2, { Type: 'XObject', Subtype: 'Image', Width: 1190, Height: 1684, ColorSpace: 'DeviceRGB', BitsPerComponent: 8, Filter: 'JPXDecode' }))
      const name = p.node.newXObject('ScannedPage', image)
      p.pushOperators(pushGraphicsState(), scale(595, 842), drawObject(name), popGraphicsState())
    } else {
      const png = await doc.embedPng(canvas.toBuffer('image/png')); p.drawImage(png, { x: 0, y: 0, width: 595, height: 842 })
    }
  } else {
    const font = await doc.embedFont(StandardFonts.Helvetica)
    lines.forEach((text, i) => p.drawText(text, { x: 30, y: 790 - i * 35, size: 12, font }))
  }
  return Buffer.from(await doc.save())
}
try {
  await page.goto('http://127.0.0.1:5179/tests/browser/leasing.html')
  await page.getByRole('heading', { name: 'Comparer deux relevés', exact: true }).waitFor()
  for (const i of [0, 1]) {
    if (i === 1) {
      // Reproduce a failed OCR model request: it must not hang in page reading.
      const model = '**/assets/leasing-comparator/runtime/lang/eng.traineddata'
      await page.route(model, route => route.fulfill({ status: 503, body: 'Test: OCR temporarily unavailable' }))
      await page.locator('input[type=file]').nth(i).setInputFiles({ name: 'failure-test.pdf', mimeType: 'application/pdf', buffer: await fixture(true, true) })
      await page.getByRole('status').nth(i).filter({ hasText: 'Saisie manuelle disponible' }).waitFor({ timeout: 60000 })
      assert.equal(await page.getByLabel('102 · Total 2 · récent', { exact: true }).isEnabled(), true)
      assert.equal(await page.locator('details img').count() > 0, true)
      await page.unroute(model)
      console.log('OCR download failure safely unlocks manual entry and keeps preview')
    }
    await page.locator('input[type=file]').nth(i).setInputFiles({ name: `releve-${i}.pdf`, mimeType: 'application/pdf', buffer: await fixture(i === 1, i === 1) })
    await page.waitForFunction(() => [...document.querySelectorAll('input[type=file]')].every(input => !input.disabled), null, { timeout: 185000 })
    assert.match(await page.getByRole('status').nth(i).innerText(), /Trois compteurs lus/)
    console.log(i ? 'Scanned PDF OCR passed' : 'Text PDF passed')
  }
  await page.getByLabel('Faces couleur grand format sur la période', { exact: true }).fill('0')
  await page.getByRole('checkbox').nth(0).check(); await page.getByRole('checkbox').nth(1).check()
  await page.getByRole('button', { name: 'Calculer la consommation' }).click()
  await page.locator('#leasing-comparison-result').waitFor()
  assert.match((await page.locator('#leasing-comparison-result').innerText()).replace(/\s/g, ''), /129580CFA/)
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Exporter CSV' }).click()
  const download = await downloadPromise
  assert.match(download.suggestedFilename(), /comparaison-a4-2026-10-27.csv/)
  await page.screenshot({ path: join(tmpdir(), 'saytu-leasing-comparison-desktop.png'), fullPage: true })
  // Validate the print stylesheet without opening a native print dialog.
  await page.evaluate(() => document.body.classList.add('printing-leasing-comparison'))
  const printed = await page.pdf({ path: join(tmpdir(), 'saytu-leasing-comparison-test.pdf'), format: 'A4' })
  assert.equal((await PDFDocument.load(printed)).getPageCount(), 1, 'No blank pages in the printed result')
  await page.evaluate(() => document.body.classList.remove('printing-leasing-comparison'))
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({ path: join(tmpdir(), 'saytu-leasing-comparison-mobile.png'), fullPage: true })
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
  await page.getByLabel('102 · Total 2 · récent', { exact: true }).fill('408786')
  assert.equal(await page.locator('#leasing-comparison-result').count(), 0)
  assert.equal(await page.getByRole('checkbox').nth(1).isChecked(), false)
  if (process.env.SAYTU_TEST_PDF) {
    await page.locator('input[type=file]').first().setInputFiles(process.env.SAYTU_TEST_PDF)
    await page.waitForFunction(() => [...document.querySelectorAll('input[type=file]')].every(input => !input.disabled), null, { timeout: 185000 })
    console.log('Provided PDF status:', await page.getByRole('status').first().innerText())
    console.log('Provided PDF text:', await page.locator('pre').first().textContent())
    assert.match(await page.getByRole('status').first().innerText(), /Trois compteurs lus/)
    await page.screenshot({ path: join(tmpdir(), 'saytu-leasing-provided-pdf.png'), fullPage: true })
  }
  assert.deepEqual(errors, []); assert.deepEqual(external, [])
  if (process.env.SAYTU_TEST_CSP_FILE) {
    // DevTools evaluate itself bypasses CSP; run the probe as an ordinary script.
    await page.route('**/csp-probe.js', route => route.fulfill({ contentType: 'application/javascript', body: "try { new Function('return 1')(); window.cspEvalAllowed=true } catch { window.cspEvalAllowed=false }" }))
    await page.addScriptTag({ url: 'http://127.0.0.1:5179/csp-probe.js' })
    assert.equal(await page.evaluate(() => window.cspEvalAllowed), false)
    console.log('PASS: OCR works under server CSP while JavaScript eval remains blocked')
  }
  console.log('PASS: text PDF + scanned PDF OCR, 129580 CFA, CSV download, print PDF, responsive width, invalidation, no external requests or JS errors')
  console.log('Screenshots and PDF:', tmpdir())
} catch (error) {
  console.error('Page errors:', errors)
  console.error('Warnings:', warnings)
  console.error('Recognized text:', await page.locator('pre').allTextContents())
  console.error('Page status:', await page.locator('[role=status]').allTextContents())
  await page.screenshot({ path: join(tmpdir(), 'saytu-leasing-comparison-failure.png'), fullPage: true })
  throw error
} finally { await browser.close() }
