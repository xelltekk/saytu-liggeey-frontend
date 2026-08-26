import axios from 'axios'

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
  const token = getSessionToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  } else {
    delete config.headers.Authorization
  }

  return config
})

// Intercepteur : si 401, rediriger vers login
api.interceptors.response.use(
  (response) => response,
  (error) => {
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
