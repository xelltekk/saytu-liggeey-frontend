import { createApp, h } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory, RouterView } from 'vue-router'
import List from '../../src/views/LeasingView.vue'
import Reading from '../../src/views/LeasingReleveDetailView.vue'
import Intervention from '../../src/views/LeasingInterventionDetailView.vue'
import ConfirmDialogHost from '../../src/components/ConfirmDialogHost.vue'
import '../../src/style.css'
import { leasingComparisonLocation } from '../../src/services/leasingNavigation.mjs'
const placeholder = { render: () => h('p', 'Fiche de test') }
const router = createRouter({ history:createWebHashHistory(), routes:[
  {path:'/leasing',name:'leasing',component:List},
  {path:'/leasing/comparaison',name:'leasing-comparaison',redirect:to=>leasingComparisonLocation(to.query)},
  {path:'/leasing/releves/nouveau',name:'leasing-releve-create',component:Reading},
  {path:'/leasing/interventions/nouveau',name:'leasing-intervention-create',component:Intervention},
  {path:'/leasing/interventions/:id',name:'leasing-intervention-detail',component:Intervention},
  ...['leasing-contrat-create','leasing-imprimante-create','leasing-imprimante-detail'].map(name=>({path:'/test/'+name,name,component:placeholder})),
] })
createApp({render:()=>h('main',{style:'max-width:1400px;min-width:0;margin:auto;padding:16px'},[h(RouterView),h(ConfirmDialogHost)])})
  .use(createPinia()).use(router).mount('#app')
