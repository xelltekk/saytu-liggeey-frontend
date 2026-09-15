export function buildMailtoUrl({ to, subject = '', body = '' }) {
  const email = String(to || '').trim()
  if (!email) return ''

  const params = []
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`)
  if (body) params.push(`body=${encodeURIComponent(body)}`)

  const query = params.join('&')
  return `mailto:${encodeURIComponent(email)}${query ? `?${query}` : ''}`
}

export function reserveEmailComposerWindow() {
  return null
}

export function closeReservedEmailComposerWindow(reservedWindow) {
  void reservedWindow
}

function openMailtoWithNativeLink(mailtoUrl) {
  if (typeof document === 'undefined' || !document.body) return false

  const link = document.createElement('a')
  link.href = mailtoUrl
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
  return true
}

export function openEmailComposer(mailtoUrl, reservedWindow = null) {
  if (!mailtoUrl || typeof window === 'undefined') {
    closeReservedEmailComposerWindow(reservedWindow)
    return false
  }

  const composerUrl = String(mailtoUrl || '').trim()

  try {
    if (openMailtoWithNativeLink(composerUrl)) return true
  } catch (error) {
    // Fall back to window.open below.
  }

  try {
    const popup = window.open(composerUrl, '_blank', 'noopener,noreferrer')
    if (popup) {
      popup.opener = null
      return true
    }
  } catch (error) {
    return false
  }

  return false
}
