// Ce harnais exige un fournisseur de données fictives ; aucune requête API réelle n'est possible.
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import axios, { AxiosError } from 'axios'
import App from '../src/App.vue'
import router from '../src/router/index.js'
import api from '../src/services/api.js'
import { useAuthStore } from '../src/stores/auth.js'
import { useModulesStore } from '../src/stores/modules.js'
import '../src/style.css'

// Le pilote et les portails utilisent le même adaptateur fermé en l'absence de fixture.
async function adapter(config) {
  if (typeof window.__knowledgeMock !== 'function') throw new Error('Ce harnais doit être lancé par son test local avec des données fictives.')
  const result = await window.__knowledgeMock({ url: config.url, baseURL: config.baseURL, method: config.method, data: config.data })
  const response = { data: result.data, status: result.status || 200, statusText: String(result.status || 200), headers: result.headers || {}, config, request: {} }
  if (response.status >= 400) throw new AxiosError(response.data.message || 'Erreur fictive', AxiosError.ERR_BAD_RESPONSE, config, {}, response)
  return response
}
axios.defaults.adapter = adapter
api.defaults.adapter = adapter
sessionStorage.setItem('saytu_customer_portal_session', 'jeton-fictif-sans-serveur')
const app = createApp(App), pinia = createPinia()
app.use(pinia)
const auth = useAuthStore()
auth.user = { id: 7001, name: 'Administrateur fictif', email: 'demo@example.invalid', role: 'admin', base_role: 'admin', tenant: { id: 7, is_platform: false, has_subscription_account: true }, licence: { configured: false }, permissions: { flat: [] } }
auth.sessionChecked = true
app.use(router)
await router.replace('/metier/sav/1')
await router.isReady()
app.mount('#app')
window.__knowledgeHarness = { router, auth, modules: useModulesStore() }
