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
  if (typeof window === 'undefined') return null

  try {
    const popup = window.open('', '_blank')
    if (!popup) return null

    popup.document.write(`
      <!doctype html>
      <html lang="fr">
        <head>
          <meta charset="utf-8" />
          <title>Préparation de l’email</title>
          <style>
            body {
              margin: 0;
              min-height: 100vh;
              display: grid;
              place-items: center;
              font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              background: #f8fafc;
              color: #0f172a;
            }
            div {
              border: 1px solid #dbeafe;
              border-radius: 24px;
              padding: 24px 28px;
              box-shadow: 0 20px 45px rgba(15, 23, 42, 0.12);
              background: white;
              text-align: center;
            }
            strong { display: block; margin-bottom: 6px; }
            span { color: #64748b; font-size: 13px; }
          </style>
        </head>
        <body>
          <div>
            <strong>Préparation de l’email…</strong>
            <span>Votre messagerie par défaut va s’ouvrir depuis cet onglet.</span>
          </div>
        </body>
      </html>
    `)
    popup.document.close()
    popup.opener = null

    return popup
  } catch (error) {
    return null
  }
}

export function closeReservedEmailComposerWindow(popup) {
  try {
    if (popup && !popup.closed) popup.close()
  } catch (error) {
    // Ignore browser restrictions.
  }
}

export function openEmailComposer(mailtoUrl, reservedWindow = null) {
  if (!mailtoUrl || typeof window === 'undefined') {
    closeReservedEmailComposerWindow(reservedWindow)
    return false
  }

  const composerUrl = String(mailtoUrl || '').trim()

  if (reservedWindow && !reservedWindow.closed) {
    try {
      reservedWindow.location.replace(composerUrl)
      return true
    } catch (error) {
      closeReservedEmailComposerWindow(reservedWindow)
    }
  }

  try {
    const popup = reserveEmailComposerWindow()
    if (popup) {
      popup.location.replace(composerUrl)
      return true
    }
  } catch (error) {
    // Fall back to an anchor click below.
  }

  try {
    const link = document.createElement('a')
    link.href = composerUrl
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
