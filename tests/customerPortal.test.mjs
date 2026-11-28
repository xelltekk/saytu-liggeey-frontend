import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { ref, computed } from 'vue'

function portal() {
  const file = readFileSync(new URL('../src/views/CustomerPortalView.vue', import.meta.url), 'utf8')
  const script = file.split('<script setup>')[1].split('</script>')[0].replace(/^import .*$/gm, '')
  const cleanup = [], intervals = []
  const api = { interceptors: { request: { use() {} } }, get: async () => ({ data: {} }) }
  const context = vm.createContext({ ref, computed, onBeforeUnmount: fn => cleanup.push(fn), axios: { create: () => api },
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} }, location: { hash: '' }, URLSearchParams,
    crypto: { randomUUID: () => 'test-id' }, document: { hidden: false, addEventListener() {}, removeEventListener() {} },
    window: { addEventListener() {}, removeEventListener() {} }, setInterval: fn => { intervals.push(fn); return 1 }, clearInterval() {}, appConfirm: async () => true })
  vm.runInContext(script + '\n globalThis.testPortal = { account, kind, selected, replyText, busy, refreshTicket, back, syncError, decideQuote, openQuoteOrder, openOrderQuote, sections, knowledgeAvailable, refreshPortalCapabilities, failed, load, changeSection, records, login };', context)
  return { ...context.testPortal, api, cleanup, intervals, context }
}

test('opened ticket receives public reply without erasing draft', async () => {
  const p = portal()
  p.account.value = { name: 'Client' }
  p.selected.value = { id: 1, messages: [] }
  p.replyText.value = 'Ma réponse en cours'
  p.api.get = async () => ({ data: { id: 1, messages: [{ body: 'Réponse du support' }] } })
  await p.intervals[0]()
  assert.equal(p.selected.value.messages[0].body, 'Réponse du support')
  assert.equal(p.replyText.value, 'Ma réponse en cours')
})

test('saved solution is refreshed on a closed ticket and rendered as text', async () => {
  const p = portal()
  p.account.value = {}; p.selected.value = { id: 1, statut: 'resolu', resolution: null }
  p.api.get = async () => ({ data: { id: 1, statut: 'ferme', resolution: 'Redémarrez le poste.', messages: [] } })
  await p.refreshTicket()
  assert.equal(p.selected.value.resolution, 'Redémarrez le poste.')
  const template = readFileSync(new URL('../src/views/CustomerPortalView.vue', import.meta.url), 'utf8').split('<script setup>')[0]
  assert.match(template, /\{\{ selected\.resolution \}\}/)
  assert.doesNotMatch(template, /v-html/)
})

test('late refresh cannot reopen a ticket after return to list', async () => {
  const p = portal()
  p.account.value = {}; p.selected.value = { id: 1 }
  let resolve
  p.api.get = url => url === '/tickets/1' ? new Promise(r => { resolve = r }) : Promise.resolve({ data: { data: [], current_page: 1, last_page: 1, total: 0 } })
  const pending = p.refreshTicket()
  await p.back()
  resolve({ data: { id: 1, messages: [] } })
  await pending
  assert.equal(p.selected.value, null)
})

test('refresh pauses during sending and on hidden tabs', async () => {
  const p = portal()
  p.account.value = {}; p.selected.value = { id: 1 }; p.busy.value = true
  let count = 0; p.api.get = async () => { count++; return { data: {} } }
  await p.refreshTicket()
  p.busy.value = false; p.context.document.hidden = true
  await p.refreshTicket()
  assert.equal(count, 0)
})

test('network failure preserves conversation and shows retry guidance', async () => {
  const p = portal()
  p.account.value = {}; p.selected.value = { id: 1, messages: [{ body: 'Déjà reçu' }] }
  p.api.get = async () => { throw new Error('offline') }
  await p.refreshTicket()
  assert.equal(p.selected.value.messages[0].body, 'Déjà reçu')
  assert.match(p.syncError.value, /Actualiser/)
})

test('quote decision sends fingerprint, keeps retry ID and blocks double click', async () => {
  const p = portal()
  p.kind.value = 'prix'
  p.selected.value = { id: 7, draftComment: 'Accord', devis: { numero: 'DE-7', total_ttc: 100, devise: 'XOF', can_decide: true, fingerprint: 'snapshot' } }
  const calls = []
  let release
  p.api.post = (url, data) => { calls.push({ url, data }); return new Promise(r => { release = r }) }
  const pending = p.decideQuote('accepte')
  await p.decideQuote('accepte')
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, '/prix/7/devis/decision')
  assert.equal(calls[0].data.fingerprint, 'snapshot')
  assert.equal(calls[0].data.comment, 'Accord')
  p.api.get = async () => ({ data: { id: 7, devis: { can_decide: false }, decision: { decision: 'accepte' } } })
  release({ data: { message: 'Enregistré' } }); await pending
  assert.equal(p.selected.value.decision.decision, 'accepte')
  await p.decideQuote('refuse'); assert.equal(calls.length, 1)
})

test('quote decision network error keeps draft and reuses idempotency ID', async () => {
  const p = portal()
  p.selected.value = { id: 7, draftComment: 'À discuter', devis: { can_decide: true, fingerprint: 'snapshot' } }
  const ids = []
  p.api.post = async (url, data) => { ids.push(data.request_id); throw new Error('offline') }
  await p.decideQuote('refuse'); await p.decideQuote('refuse')
  assert.equal(ids.length, 2); assert.equal(ids[0], ids[1])
  assert.equal(p.selected.value.draftComment, 'À discuter')
  p.context.appConfirm = async () => false
  await p.back(); assert.equal(p.selected.value.id, 7)
})

test('quote order opens order detail without an undefined request', async () => {
  const p = portal(); p.kind.value = 'prix'; p.selected.value = { id: 2, order_id: 9 }
  p.api.get = async url => { assert.equal(url, '/commandes/9'); return { data: { id: 9, statut: 'confirmee' } } }
  await p.openQuoteOrder()
  assert.equal(p.kind.value, 'commandes'); assert.equal(p.selected.value.id, 9)
})

test('source request opens quotation follow-up without a second order agreement', async () => {
  const p = portal(); p.kind.value = 'commandes'; p.selected.value = { id: 9, quote_request_id: 5 }
  p.api.get = async url => { assert.equal(url, '/prix/5'); return { data: { id: 5, devis: { numero: 'DE-5' } } } }
  await p.openOrderQuote()
  assert.equal(p.kind.value, 'prix'); assert.equal(p.selected.value.id, 5)
  const file = readFileSync(new URL('../src/views/CustomerPortalView.vue', import.meta.url), 'utf8')
  assert.doesNotMatch(file, /<OrderWorkflow/)
  const internal = readFileSync(new URL('../src/views/BusinessModuleView.vue', import.meta.url), 'utf8')
  assert.match(internal, /Transformer en devis/)
  assert.match(internal, /history-only/)
})


test('knowledge OFF removes only its portal section without signing the customer out', async () => {
  const p = portal()
  p.account.value = { name: 'Client', capabilities: { connaissances: false } }
  const calls = []; p.api.get = async url => { calls.push(url); return { data: {} } }
  assert.equal(p.sections.value.some(([key]) => key === 'connaissances'), false)
  await p.changeSection('connaissances')
  assert.equal(p.kind.value, 'tickets')
  assert.deepEqual(calls, [])
  assert.equal(p.account.value.name, 'Client')
})

test('remote knowledge OFF invalidates late article data and keeps ticket access', async () => {
  const p = portal()
  p.account.value = { name: 'Client', capabilities: { connaissances: true } }
  p.kind.value = 'connaissances'; p.records.value = [{ id: 101, contenu: 'Ancien texte' }]
  let release
  const calls = []
  p.api.get = url => {
    calls.push(url)
    if (url === '/connaissances') return new Promise(resolve => { release = resolve })
    if (url === '/me') return Promise.resolve({ data: { capabilities: { connaissances: false } } })
    return Promise.resolve({ data: { data: [{ id: 2, titre: 'Mon ticket' }], current_page: 1, last_page: 1, total: 1 } })
  }
  const pending = p.load()
  await p.refreshPortalCapabilities()
  release({ data: { data: [{ id: 101, contenu: 'Réponse tardive' }], current_page: 1, last_page: 1, total: 1 } })
  await pending
  assert.equal(p.kind.value, 'tickets')
  assert.equal(p.records.value[0].id, 2)
  assert.equal(p.account.value.name, 'Client')
  assert.equal(p.sections.value.some(([key]) => key === 'connaissances'), false)
  assert.equal(calls.some(url => /modules\/context|auth\/me/.test(url)), false)
})

test('MODULE_DISABLED keeps the portal session and knowledge can reappear after reactivation', async () => {
  const p = portal()
  p.account.value = { name: 'Client', capabilities: { connaissances: true } }; p.kind.value = 'connaissances'
  p.api.get = async url => ({ data: url === '/me' ? { capabilities: { connaissances: true } } : { data: [], current_page: 1, last_page: 1, total: 0 } })
  p.failed({ response: { status: 403, data: { code: 'MODULE_DISABLED', module: 'connaissances' } } })
  assert.equal(p.account.value.name, 'Client')
  assert.equal(p.knowledgeAvailable.value, false)
  await p.refreshPortalCapabilities()
  assert.equal(p.knowledgeAvailable.value, true)
  assert.equal(p.sections.value.some(([key]) => key === 'connaissances'), true)
})


test('reconnecting from a previous knowledge section selects tickets when knowledge is OFF', async () => {
  const p = portal(); p.kind.value = 'connaissances'
  const calls = []
  p.api.post = async () => ({ data: { token: 'fixture' } })
  p.api.get = async url => { calls.push(url); return { data: url === '/me' ? { name: 'Client', capabilities: { connaissances: false } } : url === '/notifications' ? { unread: 0, items: [] } : { data: [], current_page: 1, last_page: 1, total: 0 } } }
  await p.login()
  assert.equal(p.kind.value, 'tickets')
  assert.equal(p.knowledgeAvailable.value, false)
  assert.equal(calls.filter(url => url === '/tickets').length, 1)
  assert.equal(calls.includes('/connaissances'), false)
})
