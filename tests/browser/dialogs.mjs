import { createApp, h, ref } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'
import ConfirmDialogHost from '../../src/components/ConfirmDialogHost.vue'
import { requestConfirmation, requestPrompt } from '../../src/composables/useConfirm'
import '../../src/style.css'
const result = ref('')
const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: { render: () => null } }] })
createApp({ render: () => h('main', [
  h('button', { onClick: async () => { result.value = String(await requestConfirmation('Quitter la comparaison ? Les données non exportées seront perdues.')) } }, 'Tester confirmation'),
  h('button', { onClick: async () => { result.value = JSON.stringify(await requestPrompt('Commentaire de validation', 'Contrôle stock validé')) } }, 'Tester saisie'),
  h('output', result.value), h(ConfirmDialogHost),
]) }).use(router).mount('#app')
