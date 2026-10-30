import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { readFileSync } from 'node:fs'
import { ref, computed, watch, nextTick, reactive } from 'vue'
import { pageMeta } from '../src/services/leasingLists.mjs'

function mount() {
  const file=readFileSync(new URL('../src/components/LeasingComparisonHistory.vue',import.meta.url),'utf8')
  const source=file.split('<script setup>')[1].split('</script>')[0].replace(/^import .*$/gm,'')
  const route=reactive({query:{}}),api={get:async()=>({data:{data:[],total:0}})},navigation=[]
  const context=vm.createContext({ref,computed,watch,pageMeta,useRoute:()=>route,useRouter:()=>({push:r=>navigation.push(r)}),api,onMounted(){},onBeforeUnmount(){}})
  vm.runInContext(source+'\nglobalThis.component={load,loadDetail,rows,meta,search,invoiceStatus,detail,error,openDetail};',context)
  return {...context.component,api,route,navigation,file}
}

test('history requests server pagination and filters without fetching all invoice payloads',async()=>{
  const c=mount();c.search.value='Canon';c.invoiceStatus.value='brouillon'
  c.api.get=async(url,{params})=>{assert.equal(url,'/leasing/comparaisons');assert.equal(params.page,2);assert.equal(params.search,'Canon');assert.equal(params.statut,'brouillon');return{data:{data:[{id:2}],current_page:2,total:42,last_page:2}}}
  await c.load(2);assert.equal(c.rows.value[0].id,2);assert.equal(c.meta.value.current_page,2)
  c.openDetail(2);assert.equal(c.navigation[0].query.suivi,2)
})

test('late page responses cannot replace newer history and failures leave a retry state',async()=>{
  const c=mount(),replies=[];c.api.get=()=>new Promise(resolve=>replies.push(resolve))
  const old=c.load(1),recent=c.load(2)
  replies[1]({data:{data:[{id:2}],current_page:2}});await recent
  replies[0]({data:{data:[{id:1}],current_page:1}});await old
  assert.equal(c.rows.value[0].id,2)
  c.api.get=async()=>{throw Error('offline')};await c.load();assert.match(c.error.value,/indisponible/)
})

test('switching follow-up prevents an old response from exposing another record',async()=>{
  const c=mount(),replies=[];c.api.get=()=>new Promise(resolve=>replies.push(resolve))
  c.route.query.suivi='1';await nextTick()
  c.route.query.suivi='2';await nextTick()
  replies[1]({data:{id:2}});await nextTick();await nextTick()
  replies[0]({data:{id:1}});await nextTick();await nextTick()
  assert.equal(c.detail.value.id,2)
  c.route.query.suivi='bad';await nextTick();assert.match(c.error.value,/invalide/);assert.equal(c.detail.value,null)
  assert.doesNotMatch(c.file,/v-html|api\.(post|put|delete)/)
})
