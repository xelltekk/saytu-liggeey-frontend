export function buildMailtoUrl({ to, subject = '', body = '' }) {
  const email = String(to || '').trim()
  if (!email) return ''

  const params = []
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`)
  if (body) params.push(`body=${encodeURIComponent(body)}`)

  const query = params.join('&')
  return `mailto:${encodeURIComponent(email)}${query ? `?${query}` : ''}`
}

const MAILTO_FRAME_CLEANUP_DELAY = 10000

export function reserveEmailComposerWindow() {
  return { type: 'mailto-launcher' }
}

export function closeReservedEmailComposerWindow(reservedWindow) {
  try {
    reservedWindow?.cleanup?.()
  } catch (error) {
    // Ignore browser restrictions.
  }
}

function launchMailtoFromHiddenFrame(mailtoUrl) {
  if (typeof document === 'undefined' || !document.body) return false

  const frame = document.createElement('iframe')
  frame.title = 'Ouverture de la messagerie'
  frame.setAttribute('aria-hidden', 'true')
  frame.style.position = 'fixed'
  frame.style.width = '1px'
  frame.style.height = '1px'
  frame.style.opacity = '0'
  frame.style.pointerEvents = 'none'
  frame.style.left = '-9999px'
  frame.style.bottom = '0'
  frame.style.border = '0'
  frame.src = 'about:blank'

  document.body.appendChild(frame)

  const cleanupTimer = window.setTimeout(() => {
    try {
      frame.remove()
    } catch (error) {
      // Ignore DOM cleanup restrictions.
    }
  }, MAILTO_FRAME_CLEANUP_DELAY)

  try {
    frame.contentWindow.location.href = mailtoUrl
  } catch (error) {
    frame.src = mailtoUrl
  }

  return () => {
    window.clearTimeout(cleanupTimer)
    frame.remove()
  }
}

export function openEmailComposer(mailtoUrl, reservedWindow = null) {
  if (!mailtoUrl || typeof window === 'undefined') {
    closeReservedEmailComposerWindow(reservedWindow)
    return false
  }

  const composerUrl = String(mailtoUrl || '').trim()

  const cleanup = launchMailtoFromHiddenFrame(composerUrl)
  if (cleanup) {
    if (reservedWindow) reservedWindow.cleanup = cleanup
    return true
  }

  try {
    const link = document.createElement('a')
    link.href = composerUrl
    link.dataset.mailtoGuardFallback = 'true'
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    link.remove()
    return true
  } catch (error) {
    return false
  }
}
