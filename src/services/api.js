import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
})

// Intercepteur : les requêtes authentifiées utilisent le cookie HttpOnly.
api.interceptors.request.use((config) => {
  delete config.headers.Authorization
  return config
})

// Intercepteur : si 401, rediriger vers login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('xelltekk_token')
      localStorage.removeItem('xelltekk_user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
