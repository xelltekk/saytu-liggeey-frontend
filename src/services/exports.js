import api from './api'

/**
 * Télécharge un fichier CSV depuis l'API.
 * @param {string} url - Endpoint API (ex: '/exports/clients')
 * @param {object} params - Paramètres de filtre optionnels
 * @param {string} nomDefaut - Nom de fichier par défaut
 */
export async function telechargerCSV(url, params = {}, nomDefaut = 'export.csv') {
  const response = await api.get(url, {
    params,
    responseType: 'blob',
  })

  // Récupérer le nom du fichier depuis l'en-tête Content-Disposition
  let nomFichier = nomDefaut
  const contentDisposition = response.headers['content-disposition']
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="(.+)"/)
    if (match) nomFichier = match[1]
  }

  // Créer un lien et déclencher le téléchargement
  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' })
  const link = document.createElement('a')
  link.href = window.URL.createObjectURL(blob)
  link.download = nomFichier
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(link.href)
}