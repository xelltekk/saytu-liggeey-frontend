import api from './api'

/**
 * Télécharge un PDF depuis l'API en utilisant le token Sanctum,
 * puis l'ouvre dans une nouvelle fenêtre du navigateur.
 */
export async function ouvrirPDF(url, filename = 'document.pdf') {
  try {
    const response = await api.get(url, {
      responseType: 'blob',
      headers: { Accept: 'application/pdf' },
    })

    // Créer une URL blob
    const blob = new Blob([response.data], { type: 'application/pdf' })
    const blobUrl = window.URL.createObjectURL(blob)

    // Ouvrir dans une nouvelle fenêtre
    window.open(blobUrl, '_blank')

    // Libérer la mémoire après 1 minute
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000)
  } catch (err) {
    console.error('Erreur PDF:', err)
    throw err
  }
}