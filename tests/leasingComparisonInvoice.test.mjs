import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { readFileSync } from 'node:fs'
import { ref, computed, watch, reactive, nextTick } from 'vue'

function mount(correction = null) {
  const props = reactive({ result: { total: 129580, blackAmount: 28720, colorAmount: 100860, black: 1436, color: 1681 }, reports: [{ serial: 'TEST' }, { serial: 'TEST' }], options: { blackPrice: 20, colorPrice: 60, largeColor: 0, verified: true, a4: true }, client: null, correction })
  const events = [], calls = [], api = { post: async (url, data) => { calls.push({url, data}); return { data: { facture: { id: 8, numero: 'FA-8' }, suivi: {id:3,revision:1} } } } }
  const auth = { user: { permissions: correction ? ['factures.update', 'factures.view', 'leasing.update'] : ['factures.create', 'factures.view'] } }
  const source = readFileSync(new URL('../src/components/LeasingComparisonInvoice.vue', import.meta.url), 'utf8').split('<script setup>')[1].split('</script>')[0].replace(/^import .*$/gm, '')
  const context = vm.createContext({ ref, computed, watch, defineProps: () => props, defineEmits: () => (...args) => events.push(args), api, useAuthStore: () => auth, hasPermission: (user,p) => user.permissions.includes(p) })
  vm.runInContext(source + '\nglobalThis.component = { createInvoice, clientId, confirmed, saving, invoice, error, tva, totalTtc, rentalFee, totalHt, reason, followUp }', context)
  return {...context.component, props, events, calls, api, auth}
}
test('invoice is a confirmed action and double clicks submit only once', async () => {
  const c=mount(); assert.equal(c.totalTtc.value,152904.4)
  await c.createInvoice(); assert.equal(c.calls.length,0)
  c.clientId.value=3; await nextTick(); c.confirmed.value=true
  let release; c.api.post=async (url,data)=>{c.calls.push({url,data}); return new Promise(r=>release=r)}
  const pending=c.createInvoice(); await c.createInvoice(); assert.equal(c.calls.length,1)
  assert.equal(c.calls[0].data.tva,18); assert.equal(c.calls[0].data.client_id,3)
  release({data:{facture:{id:8,numero:'FA-8'},suivi:{id:3,revision:1}}}); await pending
  await c.createInvoice(); assert.equal(c.calls.length,1); assert.equal(c.saving.value,false)
})
test('retry preserves client and calculation; changing calculation clears old invoice', async () => {
  const c=mount(); c.clientId.value=3; await nextTick(); c.confirmed.value=true
  c.api.post=async ()=>{throw Error('Réseau indisponible')}
  await c.createInvoice(); assert.match(c.error.value,/Réseau/); assert.equal(c.clientId.value,3); assert.equal(c.saving.value,false)
  c.api.post=async ()=>({data:{facture:{id:8,numero:'FA-8'},suivi:{id:3,revision:1},already_exists:true}})
  await c.createInvoice(); assert.equal(c.invoice.value.id,8)
  assert.equal(c.events.filter(event=>event[0]==='archived').length,0,'A replay must not claim that different current inputs were archived')
  c.props.result={...c.props.result,total:10}; await nextTick(); assert.equal(c.invoice.value,null); assert.equal(c.confirmed.value,false)
})

const archived = () => ({id:3,revision:2,invoice_token:'a'.repeat(64),client:{id:5,nom:'Client archivé'},facture:{id:8,numero:'FA-8'},payload:{rentalFee:25000,tva:0}})

test('a correction restores billing values, requires a reason and updates the same archive and invoice', async () => {
  const c=mount(archived())
  assert.equal(c.clientId.value,5);assert.equal(c.tva.value,0);assert.equal(c.rentalFee.value,25000)
  c.confirmed.value=true
  await c.createInvoice();assert.match(c.error.value,/motif/);assert.equal(c.calls.length,0)
  c.reason.value='Compteur corrigé après vérification'
  c.api.put=async(url,data)=>{c.calls.push({url,data});return{data:{facture:{id:8,numero:'FA-8'},suivi:{id:3,revision:3}}}}
  await c.createInvoice()
  assert.equal(c.calls[0].url,'/leasing/comparaisons/3');assert.equal(c.calls[0].data.expected_revision,2)
  assert.equal(c.calls[0].data.invoice_token,'a'.repeat(64));assert.equal(c.calls[0].data.client_id,5)
  assert.equal(c.followUp.value.revision,3);assert.equal(c.events.filter(e=>e[0]==='archived').length,1)
  await c.createInvoice();assert.equal(c.calls.length,1)
})

test('a stale correction keeps all user inputs and never falls back to creating another invoice', async () => {
  const c=mount(archived());c.confirmed.value=true;c.reason.value='Compteur vérifié'
  c.api.put=async()=>{throw{response:{status:409,data:{message:'Rechargez le suivi'}}}}
  await c.createInvoice();assert.match(c.error.value,/Rechargez/);assert.equal(c.reason.value,'Compteur vérifié');assert.equal(c.invoice.value,null);assert.equal(c.calls.length,0)
})

test('corrections require update permissions rather than invoice creation permissions', async () => {
  const c=mount(archived());c.auth.user.permissions=['factures.create','factures.view'];c.confirmed.value=true;c.reason.value='Correction vérifiée'
  await c.createInvoice();assert.equal(c.calls.length,0)
})
test('creation requires invoice permissions', async () => {
  const c=mount(); c.auth.user.permissions=[]; c.clientId.value=3; await nextTick(); c.confirmed.value=true
  await c.createInvoice(); assert.equal(c.calls.length,0)
})
test('fixed rental adds to HT and TVA; changes require confirmation', async () => {
  const c=mount(); c.clientId.value=3; c.confirmed.value=true; c.rentalFee.value=25000; await nextTick()
  assert.equal(c.confirmed.value,false); assert.equal(c.totalHt.value,154580); assert.equal(c.totalTtc.value,182404.4)
  c.tva.value=0; await nextTick(); assert.equal(c.totalTtc.value,154580)
  c.confirmed.value=true; await c.createInvoice(); assert.equal(c.calls[0].data.rentalFee,25000)
})
test('invalid rental never submits', async () => {
  for (const amount of [-1, '', 'abc', '1.001']) {
    const c=mount(); c.clientId.value=3; c.rentalFee.value=amount; await nextTick(); c.confirmed.value=true
    await c.createInvoice(); assert.equal(c.calls.length,0); assert.match(c.error.value,/forfait/)
  }
})
