import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { readFileSync } from 'node:fs'
import { ref, computed, watch, reactive, nextTick } from 'vue'

function mount() {
  const props = reactive({ result: { total: 129580, blackAmount: 28720, colorAmount: 100860, black: 1436, color: 1681 }, reports: [{ serial: 'TEST' }, { serial: 'TEST' }], options: { blackPrice: 20, colorPrice: 60, largeColor: 0, verified: true, a4: true }, client: null })
  const events = [], calls = [], api = { post: async (url, data) => { calls.push({url, data}); return { data: { facture: { id: 8, numero: 'FA-8' } } } } }
  const auth = { user: { permissions: ['factures.create', 'factures.view'] } }
  const source = readFileSync(new URL('../src/components/LeasingComparisonInvoice.vue', import.meta.url), 'utf8').split('<script setup>')[1].split('</script>')[0].replace(/^import .*$/gm, '')
  const context = vm.createContext({ ref, computed, watch, defineProps: () => props, defineEmits: () => (...args) => events.push(args), api, useAuthStore: () => auth, hasPermission: (user,p) => user.permissions.includes(p) })
  vm.runInContext(source + '\nglobalThis.component = { createInvoice, clientId, confirmed, saving, invoice, error, tva, totalTtc }', context)
  return {...context.component, props, events, calls, api, auth}
}
test('invoice is a confirmed action and double clicks submit only once', async () => {
  const c=mount(); assert.equal(c.totalTtc.value,152904.4)
  await c.createInvoice(); assert.equal(c.calls.length,0)
  c.clientId.value=3; await nextTick(); c.confirmed.value=true
  let release; c.api.post=async (url,data)=>{c.calls.push({url,data}); return new Promise(r=>release=r)}
  const pending=c.createInvoice(); await c.createInvoice(); assert.equal(c.calls.length,1)
  assert.equal(c.calls[0].data.tva,18); assert.equal(c.calls[0].data.client_id,3)
  release({data:{facture:{id:8,numero:'FA-8'}}}); await pending
  await c.createInvoice(); assert.equal(c.calls.length,1); assert.equal(c.saving.value,false)
})
test('retry preserves client and calculation; changing calculation clears old invoice', async () => {
  const c=mount(); c.clientId.value=3; await nextTick(); c.confirmed.value=true
  c.api.post=async ()=>{throw Error('Réseau indisponible')}
  await c.createInvoice(); assert.match(c.error.value,/Réseau/); assert.equal(c.clientId.value,3); assert.equal(c.saving.value,false)
  c.api.post=async ()=>({data:{facture:{id:8,numero:'FA-8'},already_exists:true}})
  await c.createInvoice(); assert.equal(c.invoice.value.id,8)
  c.props.result={...c.props.result,total:10}; await nextTick(); assert.equal(c.invoice.value,null); assert.equal(c.confirmed.value,false)
})
test('creation requires invoice permissions', async () => {
  const c=mount(); c.auth.user.permissions=[]; c.clientId.value=3; await nextTick(); c.confirmed.value=true
  await c.createInvoice(); assert.equal(c.calls.length,0)
})
