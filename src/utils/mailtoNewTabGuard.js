function openMailtoInSeparateTab(mailtoUrl) {
  try {
    const popup = window.open(mailtoUrl, '_blank', 'noopener,noreferrer')
    if (popup) {
      popup.opener = null
      return true
    }
  } catch (error) {
    // Fall back to a synthetic link below.
  }

  try {
    const link = document.createElement('a')
    link.href = mailtoUrl
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
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

export function installMailtoNewTabGuard() {
  if (typeof window === 'undefined' || window.__saytuMailtoNewTabGuardInstalled) return

  window.__saytuMailtoNewTabGuardInstalled = true

  window.addEventListener(
    'click',
    (event) => {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const anchor = event.target?.closest?.('a[href^="mailto:"]')
      if (!anchor) return
      if (anchor.dataset?.mailtoGuardFallback === 'true') return

      const mailtoUrl = anchor.href || anchor.getAttribute('href')
      if (!mailtoUrl || !String(mailtoUrl).toLowerCase().startsWith('mailto:')) return

      event.preventDefault()
      openMailtoInSeparateTab(mailtoUrl)
    },
    true,
  )
}
