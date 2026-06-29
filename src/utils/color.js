export function contrastTextColor(value) {
  const hex = normalizeHex(value)
  if (!hex) return '#ffffff'

  const red = parseInt(hex.slice(0, 2), 16)
  const green = parseInt(hex.slice(2, 4), 16)
  const blue = parseInt(hex.slice(4, 6), 16)
  const luminance = ((red * 299) + (green * 587) + (blue * 114)) / 255000

  return luminance > 0.62 ? '#111827' : '#ffffff'
}

function normalizeHex(value) {
  if (typeof value !== 'string') return ''

  const raw = value.trim().replace(/^#/, '')
  if (/^[0-9a-f]{6}$/i.test(raw)) return raw
  if (/^[0-9a-f]{3}$/i.test(raw)) {
    return raw.split('').map(character => character + character).join('')
  }

  return ''
}
