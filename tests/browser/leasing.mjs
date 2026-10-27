// Isolated local preview. Not an entrypoint of the production build.
import { createApp, h } from 'vue'
import { createRouter, createMemoryHistory, RouterView } from 'vue-router'
import View from '../../src/views/LeasingComparaisonView.vue'
import '../../src/style.css'
const router = createRouter({ history: createMemoryHistory(), routes: [
  { path: '/', name: 'leasing-comparaison', component: View },
  { path: '/leasing', name: 'leasing', component: { render: () => h('p', 'Liste de test') } },
] })
createApp({ render: () => h('main', { style: 'max-width:1400px;margin:auto;padding:20px' }, [h(RouterView)]) }).use(router).mount('#app')
