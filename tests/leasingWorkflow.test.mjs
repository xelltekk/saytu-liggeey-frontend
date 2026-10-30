import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { readFileSync } from 'node:fs'
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { leasingOptions, pageMeta } from '../src/services/leasingLists.mjs'
import { leasingTabLocation, leasingComparisonLocation } from '../src/services/leasingNavigation.mjs'

function mount(view, extra = {}) {
  const source = readFileSync(new URL(`../src/views/${view}.vue`, import.meta.url), 'utf8').split('<script setup>')[1].split('</script>')[0].replace(/^import .*$/gm, '')
  const calls = [], api = { get: async (url, config) => { calls.push({ url, config }); return { data: { data: [], current_page: 1, last_page: 1, total: 0 } } }, post: async () => ({data:{}}) }
  const context = vm.createContext({ ref, reactive, computed, watch, nextTick, onMounted: () => {}, onBeforeUnmount: () => {},
    useRoute: () => ({query:{},params:{}}), useRouter: () => ({push:()=>{}}),
    useToast: () => ({error:()=>{},success:()=>{}}), useConfirm: () => ({confirm:async()=>true}),
    useAuthStore: () => ({user:{role:'admin'}}), hasAnyRole:()=>true, setTimeout:()=>1, clearTimeout:()=>{}, api,
    pageMeta, leasingOptions, leasingTabLocation, leasingComparisonLocation,
  })
  vm.runInContext(source + `\nglobalThis.component = { ${extra.expose || ''} }`, context)
  return { ...context.component, api, calls }
}

test('select options include every page and refuse a broken pagination response', async () => {
  const calls = [], api = { get: async (url, {params}) => {
    calls.push(params.page)
    return {data:{data:[{id:params.page}],current_page:params.page,last_page:3}}
  } }
  assert.deepEqual((await leasingOptions(api,'/leasing/contrats')).map(r=>r.id),[1,2,3])
  assert.deepEqual(calls,[1,2,3])
  await assert.rejects(()=>leasingOptions({get:async()=>({data:{data:[],current_page:1,last_page:2}})},'/test'),/incomplete/)
})

test('all four lists request their actual page and keep returned metadata', async () => {
  const c=mount('LeasingView',{expose:'loadContrats,loadImprimantes,loadReleves,loadInterventions,pages'})
  c.api.get=async(url,{params})=>{c.calls.push({url,params});return {data:{data:[],current_page:params.page,last_page:3,total:101,from:51,to:100}}}
  for(const [loader,key]of[['loadContrats','contrats'],['loadImprimantes','imprimantes'],['loadReleves','releves'],['loadInterventions','interventions']]) {
    await c[loader](2)
    assert.equal(c.pages[key].current_page,2)
    assert.equal(c.pages[key].total,101)
    assert.equal(c.calls.at(-1).params.page,2)
  }
  await c.loadContrats({type:'click'})
  assert.equal(c.calls.at(-1).params.page,1)
})

test('late list responses cannot replace a newer page or its statistics', async () => {
  const c=mount('LeasingView',{expose:'loadInterventions,interventions,interventionSummary,pages'})
  const replies=[]
  c.api.get=()=>new Promise(resolve=>replies.push(resolve))
  const old=c.loadInterventions(1), recent=c.loadInterventions(2)
  replies[1]({data:{data:[{id:2}],current_page:2,summary:{ouvertes:110}}});await recent
  replies[0]({data:{data:[{id:1}],current_page:1,summary:{ouvertes:2}}});await old
  assert.equal(c.interventions.value[0].id,2)
  assert.equal(c.pages.interventions.current_page,2)
  assert.equal(c.interventionSummary.ouvertes,110)
})

test('changing an intervention contract replaces its printer and clearing it removes the old printer', async () => {
  const c=mount('LeasingInterventionDetailView',{expose:'form,contrats'})
  c.contrats.value=[{id:1,imprimante_id:10},{id:2,imprimante_id:20}]
  c.form.contrat_id=1;await nextTick();assert.equal(c.form.imprimante_id,10)
  c.form.contrat_id=2;await nextTick();assert.equal(c.form.imprimante_id,20)
  c.form.contrat_id='';await nextTick();assert.equal(c.form.imprimante_id,'')
})

test('an unknown legacy baseline stays blank and drafts are not offered for readings', async () => {
  const c=mount('LeasingReleveDetailView',{expose:'form,contrats,contratsReleves,hydrateAncienCompteurs'})
  c.hydrateAncienCompteurs({ancien_compteur_noir:null,ancien_compteur_couleur:null})
  assert.equal(c.form.ancien_compteur_noir,'')
  c.contrats.value=[{id:1,statut:'brouillon'},{id:2,statut:'actif'}]
  assert.deepEqual(Array.from(c.contratsReleves.value,r=>r.id),[2])
})

test('late calculation cannot hydrate a different contract and failures clear the old estimate', async () => {
  const c=mount('LeasingReleveDetailView',{expose:'form,preview,previewError,previewReleve'})
  c.form.contrat_id=1;await nextTick()
  let resolveOld
  c.api.post=()=>new Promise(resolve=>resolveOld=resolve)
  const old=c.previewReleve(true)
  c.form.contrat_id=2;await nextTick()
  resolveOld({data:{ancien_compteur_noir:999,total_ht:500}});await old
  assert.equal(c.preview.value,null)
  assert.equal(c.form.ancien_compteur_noir,'')
  c.preview.value={total_ht:500}
  c.api.post=async()=>{throw {response:{data:{message:'Periode obsolete'}}}}
  await c.previewReleve(true)
  assert.equal(c.preview.value,null)
  assert.match(c.previewError.value,/obsolete/)
})
