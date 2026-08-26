import api from './api'

export async function telechargerFichierPrive(url, nomFichier = 'document') {
  const response = await api.get(url, { responseType: 'blob' })
  const blob = response.data instanceof Blob
    ? response.data
    : new Blob([response.data])

  const headerName = response.headers?.['content-disposition'] || response.headers?.['Content-Disposition']
  const filename = filenameFromDisposition(headerName) || nomFichier
  const objectUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = objectUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()

  setTimeout(() => window.URL.revokeObjectURL(objectUrl), 30000)
}

function filenameFromDisposition(disposition) {
  if (!disposition) return null

  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].replace(/["']/g, ''))
    } catch {
      return utf8Match[1].replace(/["']/g, '')
    }
  }

  const filenameMatch = disposition.match(/filename="?([^";]+)"?/i)
  return filenameMatch?.[1] || null
}
