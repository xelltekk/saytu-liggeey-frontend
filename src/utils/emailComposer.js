function encodeEmailParam(value) {
  return encodeURIComponent(String(value || ''))
}

export function buildClassicOutlookComposeUrl({ to, subject = '', body = '', cc = '', bcc = '' }) {
  const email = String(to || '').trim()
  if (!email) return ''

  const params = []
  if (cc) params.push(`cc=${encodeEmailParam(cc)}`)
  if (bcc) params.push(`bcc=${encodeEmailParam(bcc)}`)
  if (subject) params.push(`subject=${encodeEmailParam(subject)}`)
  if (body) params.push(`body=${encodeEmailParam(body)}`)

  const query = params.join('&')
  return `mailto:${encodeEmailParam(email)}${query ? `?${query}` : ''}`
}

export function buildOutlookComposeUrl(options) {
  return buildClassicOutlookComposeUrl(options)
}

export function buildMailtoUrl(options) {
  return buildClassicOutlookComposeUrl(options)
}

function safeDecodeMailtoValue(value) {
  try {
    return decodeURIComponent(String(value || '').replace(/\+/g, '%20'))
  } catch (error) {
    return String(value || '')
  }
}

function toClassicOutlookComposeUrl(emailUrl) {
  const rawUrl = String(emailUrl || '').trim()
  if (!rawUrl) return ''
  if (rawUrl.toLowerCase().startsWith('ms-outlook://')) {
    const rawQuery = rawUrl.includes('?') ? rawUrl.slice(rawUrl.indexOf('?') + 1) : ''
    const outlookParams = new URLSearchParams(rawQuery)

    return buildClassicOutlookComposeUrl({
      to: outlookParams.get('to') || '',
      cc: outlookParams.get('cc') || '',
      bcc: outlookParams.get('bcc') || '',
      subject: outlookParams.get('subject') || outlookParams.get('su') || '',
      body: outlookParams.get('body') || '',
    })
  }
  if (!rawUrl.toLowerCase().startsWith('mailto:')) return rawUrl

  const mailtoBody = rawUrl.slice(rawUrl.indexOf(':') + 1)
  const questionIndex = mailtoBody.indexOf('?')
  const rawRecipients = questionIndex >= 0 ? mailtoBody.slice(0, questionIndex) : mailtoBody
  const rawQuery = questionIndex >= 0 ? mailtoBody.slice(questionIndex + 1) : ''
  const mailtoParams = new URLSearchParams(rawQuery)

  return buildClassicOutlookComposeUrl({
    to: mailtoParams.get('to') || safeDecodeMailtoValue(rawRecipients),
    cc: mailtoParams.get('cc') || '',
    bcc: mailtoParams.get('bcc') || '',
    subject: mailtoParams.get('subject') || mailtoParams.get('su') || '',
    body: mailtoParams.get('body') || '',
  })
}

export function reserveEmailComposerWindow() {
  return null
}

export function closeReservedEmailComposerWindow(reservedWindow) {
  void reservedWindow
}

function openClassicOutlookWithNativeLink(outlookUrl) {
  if (typeof document === 'undefined' || !document.body) return false

  const link = document.createElement('a')
  link.href = outlookUrl
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

  const composerUrl = toClassicOutlookComposeUrl(mailtoUrl)

  try {
    if (openClassicOutlookWithNativeLink(composerUrl)) return true
  } catch (error) {
    // Fall back to protocol navigation below.
  }

  try {
    window.location.href = composerUrl
    return true
  } catch (error) {
    return false
  }
}
