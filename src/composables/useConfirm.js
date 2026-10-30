import { reactive } from 'vue'

const defaultOptions = {
  title: 'Confirmation',
  message: '',
  hint: '',
  confirmLabel: 'OK',
  cancelLabel: 'Annuler',
  tone: 'primary',
  mode: 'confirm',
  inputValue: '',
}

const state = reactive({
  visible: false,
  title: defaultOptions.title,
  message: '',
  hint: '',
  confirmLabel: defaultOptions.confirmLabel,
  cancelLabel: defaultOptions.cancelLabel,
  tone: defaultOptions.tone,
})

const queue = []
let activeResolve = null

function normalizeOptions(options) {
  if (typeof options === 'string') {
    return { ...defaultOptions, message: options }
  }

  return {
    ...defaultOptions,
    ...(options || {}),
  }
}

function showNext() {
  if (activeResolve || !queue.length) return

  const next = queue.shift()
  activeResolve = next.resolve
  Object.assign(state, next.options, { visible: true })
}

export function requestConfirmation(options) {
  return new Promise((resolve) => {
    queue.push({
      options: normalizeOptions(options),
      resolve,
    })
    showNext()
  })
}

export function resolveConfirmation(confirmed) {
  if (!activeResolve) return

  const resolve = activeResolve
  activeResolve = null
  state.visible = false
  resolve(state.mode === 'prompt' ? (confirmed ? state.inputValue : null) : Boolean(confirmed))

  window.requestAnimationFrame(showNext)
}

export function requestPrompt(message, defaultValue = '') {
  return requestConfirmation({ message, mode: 'prompt', inputValue: String(defaultValue), confirmLabel: 'Valider' })
}

export function useConfirm() {
  return {
    confirm: requestConfirmation,
  }
}

export function useConfirmHost() {
  return {
    state,
    confirm: () => resolveConfirmation(true),
    cancel: () => resolveConfirmation(false),
  }
}
