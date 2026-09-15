import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useTheme } from './composables/useTheme'
import { installInputMasks } from './utils/inputMasks'
import './style.css'

useTheme().applyTheme()

const app = createApp(App)
app.use(createPinia())
app.use(router)
installInputMasks(app)
app.mount('#app')
