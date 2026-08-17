import { computed, ref } from 'vue'

const STORAGE_KEY = 'saytu_currency'

const currencyCode = ref(readInitialCurrency())

const CURRENCY_LABELS = {
  XOF: 'Francs CFA BCEAO',
  FCFA: 'Francs CFA BCEAO',
  EUR: 'euros',
  USD: 'dollars US',
}

const CURRENCY_CODES = Object.keys(CURRENCY_LABELS)
const MONEY_HEADER_PATTERN = /montant|total|d[ée]bit|cr[ée]dit|solde|prix|reste|pay[ée]|paiement|r[èe]glement|ca\b|loyer|tva|encours|dette|capital|valeur|ht|ttc/i
const CURRENCY_FIELD_PATTERN = /devise|currency|monnaie/i

function readInitialCurrency() {
  if (typeof window === 'undefined') return 'XOF'
  return normalizeCurrency(localStorage.getItem(STORAGE_KEY) || 'XOF')
}

export function normalizeCurrency(value) {
  return String(value || 'XOF').trim().toUpperCase() || 'XOF'
}

export function currencyLabel(code = currencyCode.value) {
  const normalized = normalizeCurrency(code)
  return CURRENCY_LABELS[normalized] || normalized
}

export function amountNote(code = currencyCode.value) {
  return `Montants exprimés en ${currencyLabel(code)}`
}

export function formatMoney(value) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(value || 0))
}

export function formatMoneyCompact(value) {
  return new Intl.NumberFormat('fr-FR', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number(value || 0))
}

export function setCurrency(value) {
  const next = normalizeCurrency(value)
  currencyCode.value = next

  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, next)
  window.dispatchEvent(new CustomEvent('currency:changed', { detail: { currency: next } }))
}

function tableLooksFinancial(table) {
  const headerText = Array.from(table.querySelectorAll('th'))
    .map((cell) => cell.textContent || '')
    .join(' ')

  if (MONEY_HEADER_PATTERN.test(headerText)) return true

  const sampleText = (table.textContent || '').slice(0, 3000)
  return MONEY_HEADER_PATTERN.test(sampleText)
}

function isKnownCurrency(value) {
  return CURRENCY_CODES.includes(normalizeCurrency(value))
}

function isCurrencySelect(select) {
  if (!isKnownCurrency(select.value)) return false

  const context = [
    select.closest('label')?.textContent,
    select.previousElementSibling?.textContent,
    select.getAttribute('aria-label'),
    select.getAttribute('name'),
    select.id,
  ]
    .filter(Boolean)
    .join(' ')

  return CURRENCY_FIELD_PATTERN.test(context)
}

function findScopedCurrency(table) {
  const explicit = table.closest('[data-amount-currency], [data-currency]')
  const explicitValue = explicit?.dataset?.amountCurrency || explicit?.dataset?.currency
  if (isKnownCurrency(explicitValue)) return normalizeCurrency(explicitValue)

  const scopes = [
    table.parentElement,
    table.closest('form'),
    table.closest('[role="dialog"]'),
    table.closest('.modal'),
    table.closest('.app-modal'),
    table.closest('section'),
  ].filter(Boolean)

  for (const scope of scopes) {
    const currencySelect = Array.from(scope.querySelectorAll('select')).find(isCurrencySelect)
    if (currencySelect) return normalizeCurrency(currencySelect.value)
  }

  return currencyCode.value
}

export function syncAmountTableNotes(root = document) {
  if (typeof document === 'undefined') return

  const scope = root instanceof Element || root instanceof Document ? root : document
  const tables = Array.from(scope.querySelectorAll('table'))

  tables.forEach((table) => {
    if (!tableLooksFinancial(table)) return

    const previous = table.previousElementSibling
    const note = previous?.matches?.('[data-auto-currency-note]')
      ? previous
      : document.createElement('p')

    if (!note.dataset.autoCurrencyNote) {
      note.dataset.autoCurrencyNote = 'true'
      note.className = 'amount-unit-note'
      table.parentNode?.insertBefore(note, table)
    }

    const text = amountNote(findScopedCurrency(table))
    if (note.textContent !== text) note.textContent = text
  })
}

export function useCurrency() {
  return {
    currencyCode,
    currencyLabel: computed(() => currencyLabel(currencyCode.value)),
    amountNoteText: computed(() => amountNote(currencyCode.value)),
    formatMoney,
    formatMoneyCompact,
    setCurrency,
    syncAmountTableNotes,
  }
}
