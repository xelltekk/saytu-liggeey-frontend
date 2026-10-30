import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { ref, computed, reactive } from 'vue'

function workflow(external = false) {
  const file = readFileSync(new URL('../src/components/OrderWorkflow.vue', import.meta.url), 'utf8')
  const script = file.split('<script setup>')[1].split('</script>')[0].replace(/^import .*$/gm, '')
  const events = [], calls = []
  const props = reactive({ external, disabled: false, editable: true, record: { id: 9, workflow: { version: 4, offer_hash: 'current-offer' } }, api: { post: async (url, data) => { calls.push({ url, data }); return {} } } })
  const context = vm.createContext({ ref, computed, defineProps: () => props, defineEmits: () => (...args) => events.push(args), crypto: { randomUUID: () => 'unique-action' }, appConfirm: async () => true })
  vm.runInContext(script + '\nglobalThis.subject = { action, body, expected, saving, error };', context)
  return { ...context.subject, props, events, calls }
}

test('client proposal agreement binds exact offer and version', async () => {
  const w = workflow(true); w.body.value = 'Accord'
  await w.action('accept_offer')
  assert.equal(w.calls[0].url, '/commandes/9/actions')
  assert.equal(w.calls[0].data.offer_hash, 'current-offer')
  assert.equal(w.calls[0].data.version, 4)
  assert.ok(w.events.some(e => e[0] === 'changed'))
})

test('failed workflow action preserves message and retry identity', async () => {
  const w = workflow(); const ids = []
  w.body.value = 'Livraison reportée'
  w.props.api.post = async (url, data) => { ids.push(data.request_id); throw new Error('network') }
  await w.action('reply'); await w.action('reply')
  assert.equal(w.body.value, 'Livraison reportée'); assert.equal(ids[0], ids[1])
  assert.ok(!w.events.some(e => e[0] === 'changed'))
})

test('workflow blocks actions during unsaved edits and double clicks', async () => {
  const w = workflow(); w.props.disabled = true
  await w.action('approve'); assert.equal(w.calls.length, 0)
  w.props.disabled = false; let resolve
  w.props.api.post = (url, data) => { w.calls.push(data); return new Promise(r => { resolve = r }) }
  const pending = w.action('approve'); await w.action('approve')
  assert.equal(w.calls.length, 1); resolve({}); await pending
})

test('delivery schedule includes date and reason, internal note uses separate action', async () => {
  const w = workflow(); w.expected.value = '2026-11-02'; w.body.value = 'Date convenue'
  await w.action('schedule')
  assert.equal(w.calls[0].data.expected_at, '2026-11-02')
  w.body.value = 'Interne'; await w.action('note')
  assert.equal(w.calls[1].data.action, 'note')
  const file = readFileSync(new URL('../src/components/OrderWorkflow.vue', import.meta.url), 'utf8')
  assert.doesNotMatch(file, /v-html/)
  assert.match(file, /overflow:auto/)
})
