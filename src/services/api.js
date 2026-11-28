import axios from 'axios'
import { moduleTransportGeneration } from '@/module-system/moduleTransport'

const sessionTokenKey = 'xelltekk_session_token'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
})

export function setSessionToken(token) {
  if (token) {
    sessionStorage.setItem(sessionTokenKey, token)
  }
}

export function clearSessionToken() {
  sessionStorage.removeItem(sessionTokenKey)
}

function getSessionToken() {
  return sessionStorage.getItem(sessionTokenKey)
}

// Intercepteur : le cookie HttpOnly reste prioritaire côté backend.
// Un token de session sert de secours si le navigateur/proxy ne renvoie pas encore le cookie.
api.interceptors.request.use((config) => {
  config.saytuSessionGeneration = moduleTransportGeneration()
  const token = getSessionToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  } else {
    delete config.headers.Authorization
  }

  return config
})

// Signale uniquement une révision ; seul le rechargement serveur fournit l'état des modules.
function notifyModulesRevision(response) {
  if (response?.config?.suppressModuleRevision) return
  const revision = Number(response?.headers?.['x-saytu-modules-revision'])
  const tenantId = response?.headers?.['x-saytu-tenant-id']
  if (tenantId !== undefined && Number.isInteger(revision) && revision >= 0) {
    window.dispatchEvent(new CustomEvent('saytu:modules-revision', { detail: { tenant_id: tenantId, revision } }))
  }
}

// Écarte les anciennes réponses après une déconnexion ou un changement de société.
function isPreviousSession(config) {
  return config?.saytuSessionGeneration !== undefined && config.saytuSessionGeneration !== moduleTransportGeneration()
}

// Intercepteur : si 401, rediriger vers login
api.interceptors.response.use(
  (response) => {
    if (isPreviousSession(response.config)) throw new axios.CanceledError('Réponse d’une session précédente ignorée.')
    notifyModulesRevision(response)
    return response
  },
  (error) => {
    if (isPreviousSession(error.config)) return Promise.reject(new axios.CanceledError('Réponse d’une session précédente ignorée.'))
    notifyModulesRevision(error.response)
    if (error.response?.status === 402 && error.response?.data?.licence) {
      localStorage.setItem('xelltekk_licence_alert', JSON.stringify(error.response.data.licence))
      window.dispatchEvent(new CustomEvent('xelltekk:licence-blocked', {
        detail: error.response.data,
      }))
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('xelltekk_token')
      localStorage.removeItem('xelltekk_user')
      clearSessionToken()
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
