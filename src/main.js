import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useTheme } from './composables/useTheme'
import { installInputMasks } from './utils/inputMasks'
import { installMailtoNewTabGuard } from './utils/mailtoNewTabGuard'
import './style.css'

useTheme().applyTheme()
installMailtoNewTabGuard()

const app = createApp(App)
app.use(createPinia())
app.use(router)
installInputMasks(app)
app.mount('#app')
