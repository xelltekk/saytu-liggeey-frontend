import { ref } from 'vue'

const toasts = ref([])
let nextId = 1

export function useToast() {
  function showToast(message, type = 'success', duration = 3500) {
    const id = nextId++
    const messages = Array.isArray(message) ? message.filter(Boolean) : [message].filter(Boolean)
    toasts.value.push({ id, messages, type })
    setTimeout(() => removeToast(id), duration)
  }

  function removeToast(id) {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) toasts.value.splice(index, 1)
  }

  return {
    toasts,
    success: (msg) => showToast(msg, 'success'),
    error: (msg) => showToast(msg, 'error', 9000),
    info: (msg) => showToast(msg, 'info'),
    removeToast,
  }
}
