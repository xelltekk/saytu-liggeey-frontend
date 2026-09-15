function encodeOutlookParam(value) {
  return encodeURIComponent(String(value || ''))
}

export function buildOutlookComposeUrl({ to, subject = '', body = '', cc = '', bcc = '' }) {
  const email = String(to || '').trim()
  if (!email) return ''

  const params = []
  params.push(`to=${encodeOutlookParam(email)}`)
  if (cc) params.push(`cc=${encodeOutlookParam(cc)}`)
  if (bcc) params.push(`bcc=${encodeOutlookParam(bcc)}`)
  if (subject) params.push(`subject=${encodeOutlookParam(subject)}`)
  if (body) params.push(`body=${encodeOutlookParam(body)}`)

  return `ms-outlook://compose?${params.join('&')}`
}

export function buildMailtoUrl(options) {
  return buildOutlookComposeUrl(options)
}

function safeDecodeMailtoValue(value) {
  try {
    return decodeURIComponent(String(value || '').replace(/\+/g, '%20'))
  } catch (error) {
    return String(value || '')
  }
}

function toOutlookComposeUrl(emailUrl) {
  const rawUrl = String(emailUrl || '').trim()
  if (!rawUrl) return ''
  if (rawUrl.toLowerCase().startsWith('ms-outlook://')) return rawUrl
  if (!rawUrl.toLowerCase().startsWith('mailto:')) return rawUrl

  const mailtoBody = rawUrl.slice(rawUrl.indexOf(':') + 1)
  const questionIndex = mailtoBody.indexOf('?')
  const rawRecipients = questionIndex >= 0 ? mailtoBody.slice(0, questionIndex) : mailtoBody
  const rawQuery = questionIndex >= 0 ? mailtoBody.slice(questionIndex + 1) : ''
  const mailtoParams = new URLSearchParams(rawQuery)

  return buildOutlookComposeUrl({
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

function openOutlookWithNativeLink(outlookUrl) {
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

  const composerUrl = toOutlookComposeUrl(mailtoUrl)

  try {
    if (openOutlookWithNativeLink(composerUrl)) return true
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
