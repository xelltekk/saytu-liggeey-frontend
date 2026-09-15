import { openEmailComposer } from './emailComposer'

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
      event.stopPropagation()
      event.stopImmediatePropagation?.()

      openEmailComposer(mailtoUrl)
    },
    true,
  )
}
