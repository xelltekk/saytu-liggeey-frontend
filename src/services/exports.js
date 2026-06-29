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

  const blob = response.data instanceof Blob
    ? response.data
    : new Blob([response.data], { type: 'text/csv;charset=utf-8' })

  if (blob.size === 0) {
    throw new Error('Le fichier CSV généré est vide.')
  }

  // Une erreur JSON peut être reçue sous forme de Blob quand responseType vaut "blob".
  if (blob.type.includes('application/json')) {
    let message = 'Le serveur n’a pas pu générer le fichier CSV.'
    try {
      const erreur = JSON.parse(await blob.text())
      message = erreur.message || message
    } catch {
      // Conserver le message générique si la réponse n'est pas un JSON valide.
    }
    throw new Error(message)
  }

  // Récupérer le nom du fichier depuis l'en-tête Content-Disposition.
  let nomFichier = nomDefaut
  const contentDisposition = response.headers['content-disposition']
  if (contentDisposition) {
    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
    const simpleMatch = contentDisposition.match(/filename="?([^";]+)"?/i)

    if (utf8Match) {
      try {
        nomFichier = decodeURIComponent(utf8Match[1])
      } catch {
        nomFichier = utf8Match[1]
      }
    } else if (simpleMatch) {
      nomFichier = simpleMatch[1]
    }
  }

  // Créer un lien et déclencher le téléchargement
  const objectUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = nomFichier
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Laisser au navigateur le temps de démarrer le téléchargement avant de libérer l'URL.
  window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 30_000)
}
