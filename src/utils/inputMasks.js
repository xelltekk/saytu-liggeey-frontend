const NUMERIC_SELECTOR = 'input[type="number"], input[data-numeric-input]'
const PHONE_SELECTOR = 'input[data-phone-input]'

let masksInstalled = false

const numericEnhanced = new WeakSet()
const phoneEnhanced = new WeakSet()

function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

function getDecimalPlaces(input) {
  const explicit = input.dataset.decimals
  if (explicit !== undefined && explicit !== '') {
    const value = Number.parseInt(explicit, 10)
    return Number.isFinite(value) ? Math.max(0, value) : 0
  }

  const step = String(input.getAttribute('step') || '').trim().toLowerCase()
  if (!step || step === '1') return 0
  if (step === 'any') return 6

  const decimalPart = step.split(/[.,]/)[1]
  return decimalPart ? decimalPart.replace(/0+$/, '').length || decimalPart.length : 0
}

function numericOptions(input) {
  const decimalPlaces = getDecimalPlaces(input)
  return {
    allowDecimal: decimalPlaces > 0,
    decimalPlaces,
  }
}

function cleanNumericValue(value, options) {
  const text = String(value ?? '')
  let cleaned = ''
  let hasDecimal = false

  for (const char of text) {
    if (/\d/.test(char)) {
      cleaned += char
      continue
    }

    if (options.allowDecimal && (char === '.' || char === ',') && !hasDecimal) {
      cleaned += '.'
      hasDecimal = true
    }
  }

  if (!options.allowDecimal) {
    return cleaned.replace(/^0+(?=\d)/, '')
  }

  const [integerPart = '', decimalPart = ''] = cleaned.split('.')
  const normalizedInteger = integerPart.replace(/^0+(?=\d)/, '') || (cleaned.startsWith('.') ? '0' : '')

  if (!hasDecimal) return normalizedInteger

  return `${normalizedInteger || '0'}.${decimalPart.slice(0, options.decimalPlaces)}`
}

function formatThousands(value) {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

function formatNumericValue(raw, options) {
  if (raw === '' || raw === null || raw === undefined) return ''

  const text = String(raw)
  const hasTrailingDecimal = options.allowDecimal && text.endsWith('.')
  const [integerPart = '', decimalPart = ''] = text.split('.')
  const formattedInteger = formatThousands(integerPart || '0')

  if (!options.allowDecimal || (!text.includes('.') && !hasTrailingDecimal)) {
    return formattedInteger
  }

  return `${formattedInteger},${decimalPart}`
}

function rawNumberToString(value, decimals) {
  if (!Number.isFinite(value)) return ''
  if (decimals <= 0) return String(Math.trunc(value))

  return String(Number(value.toFixed(decimals))).replace(',', '.')
}

function clampNumericValue(raw, input, options) {
  if (raw === '' || raw.endsWith('.')) return raw

  const value = Number(raw)
  if (!Number.isFinite(value)) return ''

  const minAttr = input.getAttribute('min')
  const maxAttr = input.getAttribute('max')
  let nextValue = value

  if (minAttr !== null && minAttr !== '' && Number.isFinite(Number(minAttr))) {
    nextValue = Math.max(nextValue, Number(minAttr))
  }

  if (maxAttr !== null && maxAttr !== '' && Number.isFinite(Number(maxAttr))) {
    nextValue = Math.min(nextValue, Number(maxAttr))
  }

  return rawNumberToString(nextValue, options.decimalPlaces)
}

function scheduleNumericDisplay(input, raw) {
  const options = numericOptions(input)
  window.requestAnimationFrame(() => {
    if (!document.contains(input)) return
    input.value = formatNumericValue(cleanNumericValue(raw, options), options)
  })
}

function normalizeNumericInput(input, { clamp = false, dispatch = false } = {}) {
  const options = numericOptions(input)
  const currentValue = input.value
  let raw = cleanNumericValue(currentValue, options)

  if (clamp) {
    raw = clampNumericValue(raw, input, options)
  }

  input.value = raw

  if (dispatch) {
    input.dispatchEvent(new Event('input', { bubbles: true }))
  } else {
    scheduleNumericDisplay(input, raw)
  }

  return raw
}

function formatExistingNumericInput(input) {
  const raw = cleanNumericValue(input.value, numericOptions(input))
  input.value = formatNumericValue(raw, numericOptions(input))
}

function enhanceNumericInput(input) {
  if (!(input instanceof HTMLInputElement)) return
  if (phoneEnhanced.has(input)) return

  const options = numericOptions(input)

  if (input.type === 'number') {
    input.dataset.originalType = 'number'
    input.type = 'text'
  }

  input.dataset.numericInput = 'true'
  input.inputMode = options.allowDecimal ? 'decimal' : 'numeric'
  input.autocomplete = input.autocomplete || 'off'
  numericEnhanced.add(input)
  formatExistingNumericInput(input)
}

function stripSenegalPrefix(digits) {
  if (digits.startsWith('00221')) return digits.slice(5)
  if (digits.startsWith('221') && digits.length > 9) return digits.slice(3)
  return digits
}

function cleanPhoneValue(value) {
  return stripSenegalPrefix(String(value ?? '').replace(/\D/g, '')).slice(0, 9)
}

function formatPhoneValue(raw) {
  const digits = cleanPhoneValue(raw)
  const parts = [
    digits.slice(0, 2),
    digits.slice(2, 5),
    digits.slice(5, 7),
    digits.slice(7, 9),
  ].filter(Boolean)

  return parts.join(' ')
}

function schedulePhoneDisplay(input, raw) {
  window.requestAnimationFrame(() => {
    if (!document.contains(input)) return
    input.value = formatPhoneValue(raw)
  })
}

function normalizePhoneInput(input, { dispatch = false } = {}) {
  const raw = cleanPhoneValue(input.value)
  input.value = raw

  if (dispatch) {
    input.dispatchEvent(new Event('input', { bubbles: true }))
  } else {
    schedulePhoneDisplay(input, raw)
  }

  return raw
}

function enhancePhoneInput(input) {
  if (!(input instanceof HTMLInputElement)) return

  input.type = 'tel'
  input.inputMode = 'numeric'
  input.maxLength = 12
  input.autocomplete = input.autocomplete || 'tel'
  phoneEnhanced.add(input)

  const raw = cleanPhoneValue(input.value)
  input.value = formatPhoneValue(raw)
}

function getTargetInput(event) {
  const target = event.target
  return target instanceof HTMLInputElement ? target : null
}

function isNumericInput(input) {
  return input?.dataset.numericInput === 'true'
}

function isPhoneInput(input) {
  return input?.dataset.phoneInput !== undefined
}

function selectionContainsDecimal(input) {
  const start = input.selectionStart ?? 0
  const end = input.selectionEnd ?? 0
  return input.value.slice(start, end).includes(',') || input.value.slice(start, end).includes('.')
}

function valueWithSelection(input, insertedText) {
  const start = input.selectionStart ?? input.value.length
  const end = input.selectionEnd ?? input.value.length
  return `${input.value.slice(0, start)}${insertedText}${input.value.slice(end)}`
}

function handleBeforeInput(event) {
  const input = getTargetInput(event)
  if (!input) return

  if (isPhoneInput(input)) {
    if (!event.data) return
    if (!/^\d+$/.test(event.data)) {
      event.preventDefault()
      return
    }

    const currentDigits = cleanPhoneValue(input.value)
    const selectedDigits = cleanPhoneValue(input.value.slice(input.selectionStart ?? 0, input.selectionEnd ?? 0))
    if (currentDigits.length - selectedDigits.length + event.data.length > 9) {
      event.preventDefault()
    }
    return
  }

  if (!isNumericInput(input) || !event.data) return

  const options = numericOptions(input)
  if (/^\d+$/.test(event.data)) return

  if (
    options.allowDecimal
    && (event.data === '.' || event.data === ',')
    && (!cleanNumericValue(input.value, options).includes('.') || selectionContainsDecimal(input))
  ) {
    return
  }

  event.preventDefault()
}

function handlePaste(event) {
  const input = getTargetInput(event)
  if (!input) return

  if (isPhoneInput(input)) {
    event.preventDefault()
    const pasted = event.clipboardData?.getData('text') || ''
    const nextValue = cleanPhoneValue(valueWithSelection(input, pasted))
    input.value = nextValue
    input.dispatchEvent(new Event('input', { bubbles: true }))
    return
  }

  if (!isNumericInput(input)) return

  event.preventDefault()
  const pasted = event.clipboardData?.getData('text') || ''
  const options = numericOptions(input)
  const nextValue = cleanNumericValue(valueWithSelection(input, pasted), options)
  input.value = nextValue
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

function handleInput(event) {
  const input = getTargetInput(event)
  if (!input) return

  if (isPhoneInput(input)) {
    const raw = normalizePhoneInput(input)
    input.value = raw
    schedulePhoneDisplay(input, raw)
    return
  }

  if (isNumericInput(input)) {
    const raw = normalizeNumericInput(input)
    input.value = raw
    scheduleNumericDisplay(input, raw)
  }
}

function handleFocus(event) {
  const input = getTargetInput(event)
  if (!input) return

  if (isPhoneInput(input)) {
    enhancePhoneInput(input)
    return
  }

  if (input.matches(NUMERIC_SELECTOR) || isNumericInput(input)) {
    enhanceNumericInput(input)
  }
}

function handleBlur(event) {
  const input = getTargetInput(event)
  if (!input) return

  if (isPhoneInput(input)) {
    const raw = normalizePhoneInput(input)
    input.value = formatPhoneValue(raw)
    return
  }

  if (isNumericInput(input)) {
    const currentRaw = cleanNumericValue(input.value, numericOptions(input))
    const raw = normalizeNumericInput(input, { clamp: true })
    if (raw !== currentRaw) {
      input.value = raw
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }
    input.value = formatNumericValue(raw, numericOptions(input))
  }
}

function scanInputs(root = document) {
  if (!root) return

  const elements = []
  if (root instanceof HTMLInputElement) elements.push(root)
  if (root.querySelectorAll) {
    elements.push(...root.querySelectorAll(`${NUMERIC_SELECTOR}, ${PHONE_SELECTOR}`))
  }

  elements.forEach((input) => {
    if (input.matches?.(PHONE_SELECTOR)) {
      enhancePhoneInput(input)
      return
    }

    if (input.matches?.(NUMERIC_SELECTOR)) {
      enhanceNumericInput(input)
    }
  })
}

export function installInputMasks(app) {
  if (app?.directive) {
    app.directive('numeric-input', {
      mounted: enhanceNumericInput,
      updated: enhanceNumericInput,
    })
    app.directive('phone-sn', {
      mounted: (input) => {
        input.dataset.phoneInput = 'true'
        enhancePhoneInput(input)
      },
      updated: enhancePhoneInput,
    })
  }

  if (!isBrowser() || masksInstalled) return
  masksInstalled = true

  document.addEventListener('beforeinput', handleBeforeInput, true)
  document.addEventListener('paste', handlePaste, true)
  document.addEventListener('input', handleInput, true)
  document.addEventListener('focusin', handleFocus, true)
  document.addEventListener('focusout', handleBlur, true)

  window.requestAnimationFrame(() => scanInputs(document))

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) scanInputs(node)
      })
    })
  })

  observer.observe(document.documentElement, { childList: true, subtree: true })
}
