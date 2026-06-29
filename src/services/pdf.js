import api from './api'

function filenameFromContentDisposition(contentDisposition) {
  if (!contentDisposition) return null

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1].replace(/"/g, '').trim())
  }

  const simpleMatch = contentDisposition.match(/filename="?([^";]+)"?/i)
  return simpleMatch?.[1]?.trim() || null
}

function normalizePdfFilename(filename) {
  const base = String(filename || 'document.pdf')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/^[.-]+|[.-]+$/g, '')

  return base.toLowerCase().endsWith('.pdf') ? base : `${base || 'document'}.pdf`
}

/**
 * Télécharge un PDF depuis l'API en utilisant le token Sanctum.
 * Le nom vient d'abord de l'en-tête Content-Disposition, puis du nom fourni.
 */
export async function ouvrirPDF(url, filename = 'document.pdf') {
  try {
    const response = await api.get(url, {
      responseType: 'blob',
      headers: { Accept: 'application/pdf' },
    })

    const disposition = response.headers?.['content-disposition']
    const finalFilename = normalizePdfFilename(filenameFromContentDisposition(disposition) || filename)
    const blob = new Blob([response.data], { type: 'application/pdf' })
    const blobUrl = window.URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = blobUrl
    link.download = finalFilename
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    link.remove()

    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 30000)
  } catch (err) {
    console.error('Erreur PDF:', err)
    throw err
  }
}
