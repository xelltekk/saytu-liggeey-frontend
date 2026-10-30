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
  const navigation = []
  const context = vm.createContext({ ref, reactive, computed, watch, nextTick, onMounted: () => {}, onBeforeUnmount: () => {},
    useRoute: () => ({query:{},params:{}}), useRouter: () => ({push:location=>navigation.push(location)}),
    useToast: () => ({error:()=>{},success:()=>{}}), useConfirm: () => ({confirm:async()=>true}),
    useAuthStore: () => ({user:{role:'admin'}}), hasAnyRole:()=>true, setTimeout:()=>1, clearTimeout:()=>{}, api,
    pageMeta, leasingOptions, leasingTabLocation, leasingComparisonLocation,
  })
  vm.runInContext(source + `\nglobalThis.component = { ${extra.expose || ''} }`, context)
  return { ...context.component, api, calls, navigation }
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

test('every new-reading action opens the replacement comparison without creating a monthly reading', () => {
  const c=mount('LeasingView',{expose:'openReleveModal'})
  c.openReleveModal()
  c.openReleveModal({id:101})
  c.openReleveModal({type:'click'})
  assert.equal(c.navigation[0].name,'leasing')
  assert.equal(c.navigation[0].query.tab,'releves')
  assert.equal(c.navigation[0].query.vue,'comparaison')
  assert.equal(c.navigation[0].query.contrat,undefined)
  assert.equal(c.navigation[1].query.contrat,101)
  assert.equal(c.navigation[2].query.contrat,undefined)
  assert.equal(c.calls.length,0)
})
