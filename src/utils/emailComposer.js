function encodeEmailParam(value) {
  return encodeURIComponent(String(value || ''))
}

function sanitizeHeaderValue(value) {
  return String(value || '').replace(/[\r\n]+/g, ' ').trim()
}

function utf8ToBase64(value) {
  const bytes = new TextEncoder().encode(String(value || ''))
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary)
}

function encodeMimeHeader(value) {
  const clean = sanitizeHeaderValue(value)
  if (!clean) return ''
  return /[^\x20-\x7E]/.test(clean) ? `=?UTF-8?B?${utf8ToBase64(clean)}?=` : clean
}

function normalizeEmailList(value) {
  const items = Array.isArray(value) ? value : [value]
  return items
    .flatMap((item) => String(item || '').split(/[;,]+/))
    .map((email) => sanitizeHeaderValue(email))
    .filter(Boolean)
}

function safeDecodeMailtoValue(value) {
  try {
    return decodeURIComponent(String(value || '').replace(/\+/g, '%20'))
  } catch (error) {
    return String(value || '')
  }
}

function safeFilename(value, fallback = 'email') {
  const text = String(value || fallback)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)

  return text || fallback
}

export function buildEmailDraft({ to, subject = '', body = '', cc = '', bcc = '', from = '', context_type = '', context_id = null } = {}) {
  return {
    to: normalizeEmailList(to).join(', '),
    cc: normalizeEmailList(cc),
    bcc: normalizeEmailList(bcc),
    subject: String(subject || ''),
    body: String(body || ''),
    from: sanitizeHeaderValue(from),
    context_type,
    context_id,
  }
}

export function buildClassicOutlookComposeUrl({ to, subject = '', body = '', cc = '', bcc = '' }) {
  const email = String(to || '').trim()
  if (!email) return ''

  const params = []
  if (cc) params.push(`cc=${encodeEmailParam(Array.isArray(cc) ? cc.join(',') : cc)}`)
  if (bcc) params.push(`bcc=${encodeEmailParam(Array.isArray(bcc) ? bcc.join(',') : bcc)}`)
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

export function draftFromEmailUrl(emailUrl) {
  const rawUrl = String(emailUrl || '').trim()
  if (!rawUrl) return buildEmailDraft()

  if (rawUrl.toLowerCase().startsWith('ms-outlook://')) {
    const rawQuery = rawUrl.includes('?') ? rawUrl.slice(rawUrl.indexOf('?') + 1) : ''
    const outlookParams = new URLSearchParams(rawQuery)

    return buildEmailDraft({
      to: outlookParams.get('to') || '',
      cc: outlookParams.get('cc') || '',
      bcc: outlookParams.get('bcc') || '',
      subject: outlookParams.get('subject') || outlookParams.get('su') || '',
      body: outlookParams.get('body') || '',
    })
  }

  if (!rawUrl.toLowerCase().startsWith('mailto:')) {
    return buildEmailDraft({ to: rawUrl })
  }

  const mailtoBody = rawUrl.slice(rawUrl.indexOf(':') + 1)
  const questionIndex = mailtoBody.indexOf('?')
  const rawRecipients = questionIndex >= 0 ? mailtoBody.slice(0, questionIndex) : mailtoBody
  const rawQuery = questionIndex >= 0 ? mailtoBody.slice(questionIndex + 1) : ''
  const mailtoParams = new URLSearchParams(rawQuery)

  return buildEmailDraft({
    to: mailtoParams.get('to') || safeDecodeMailtoValue(rawRecipients),
    cc: mailtoParams.get('cc') || '',
    bcc: mailtoParams.get('bcc') || '',
    subject: mailtoParams.get('subject') || mailtoParams.get('su') || '',
    body: mailtoParams.get('body') || '',
  })
}

export function buildEmlContent(draft = {}) {
  const email = buildEmailDraft(draft)
  const eol = '\r\n'
  const headers = [
    'X-Unsent: 1',
    `Date: ${new Date().toUTCString()}`,
    email.from ? `From: ${sanitizeHeaderValue(email.from)}` : '',
    email.to ? `To: ${normalizeEmailList(email.to).join(', ')}` : '',
    email.cc?.length ? `Cc: ${email.cc.join(', ')}` : '',
    email.bcc?.length ? `Bcc: ${email.bcc.join(', ')}` : '',
    email.subject ? `Subject: ${encodeMimeHeader(email.subject)}` : '',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
  ].filter(Boolean)

  return `${headers.join(eol)}${eol}${eol}${String(email.body || '').replace(/\r?\n/g, eol)}${eol}`
}

export function downloadOutlookEml(draft = {}, filename = '') {
  if (typeof document === 'undefined' || typeof URL === 'undefined') return false

  const email = buildEmailDraft(draft)
  const content = buildEmlContent(email)
  const blob = new Blob([content], { type: 'message/rfc822;charset=utf-8' })
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = objectUrl
  link.download = `${safeFilename(filename || email.subject || 'email-outlook')}.eml`
  link.rel = 'noopener noreferrer'
  link.style.display = 'none'

  document.body.appendChild(link)
  link.click()
  link.remove()

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30000)
  return true
}

export function reserveEmailComposerWindow() {
  return null
}

export function closeReservedEmailComposerWindow(reservedWindow) {
  void reservedWindow
}

export function openEmailComposer(emailUrlOrDraft, reservedWindow = null) {
  closeReservedEmailComposerWindow(reservedWindow)

  if (!emailUrlOrDraft) return false
  if (typeof emailUrlOrDraft === 'string') {
    return downloadOutlookEml(draftFromEmailUrl(emailUrlOrDraft))
  }

  return downloadOutlookEml(emailUrlOrDraft)
}
