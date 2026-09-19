const CENTRAL_HOSTS = new Set([
  'saytu.xelltekk.com',
  'localhost',
  '127.0.0.1',
])

function normalizedHost(host = window.location.hostname) {
  return String(host || '')
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .split('/')[0]
    .replace(/:\d+$/, '')
    .replace(/\.$/, '')
}

export function isCentralAppHost(host = window.location.hostname) {
  return CENTRAL_HOSTS.has(normalizedHost(host))
}

export function isPlatformSpace(user) {
  return Boolean(user?.tenant?.is_platform) || isCentralAppHost()
}

export function isXelltekkAdmin(user) {
  const email = String(user?.email || '').toLowerCase().trim()
  const hasXelltekkEmail = email.endsWith('@xelltekk.com') || email.endsWith('@xelltekk.sn')

  return Boolean(user?.is_xelltekk_admin)
    || (user?.role === 'admin' && isPlatformSpace(user) && hasXelltekkEmail)
}
