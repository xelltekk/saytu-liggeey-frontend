const defaultLabels = {
  name: 'Nom',
  nom: 'Nom / raison sociale',
  email: 'Email',
  phone: 'Téléphone',
  role: 'Rôle',
  password: 'Mot de passe',
  photo: 'Photo',
  type: 'Type',
  statut: 'Statut',
  client_id: 'Client',
  produit_id: 'Produit',
  designation: 'Désignation',
  description: 'Description',
  quantite: 'Quantité',
  unite: 'Unité',
  prix_unitaire_ht: 'Prix unitaire HT',
  remise_pourcent: 'Remise',
  taux_tva: 'TVA',
  date_devis: 'Date du devis',
  date_validite: 'Date de validité',
  date_facture: 'Date facture',
  date_echeance: "Date d'échéance",
  date_paiement: 'Date paiement',
  montant: 'Montant',
  montant_affecte: 'Montant affecté',
  mode_paiement: 'Mode de paiement',
  reference_paiement: 'Référence paiement',
  reference_client: 'Référence client',
  objet: 'Objet',
  lignes: 'Lignes',
  factures: 'Factures',
  adresse: 'Adresse',
  ville: 'Ville',
  pays: 'Pays',
  telephone: 'Téléphone',
  mobile: 'Mobile',
  ninea: 'NINEA',
  rccm: 'RCCM',
}

export function validationErrors(error) {
  return error.response.data.errors || {}
}

export function hasValidationErrors(error) {
  return error.response.status === 422 && Object.keys(validationErrors(error)).length > 0
}

export function fieldLabel(field, labels = {}) {
  const labelMap = { ...defaultLabels, ...labels }
  if (labelMap[field]) return labelMap[field]

  const parts = String(field).split('.')
  if (parts.length >= 3 && /^\d+$/.test(parts[1])) {
    const group = labelMap[parts[0]] || humanize(parts[0])
    const child = labelMap[parts.slice(2).join('.')] || labelMap[parts.at(-1)] || humanize(parts.at(-1))
    return `${group} ${Number(parts[1]) + 1} - ${child}`
  }

  return humanize(field)
}

export function flattenValidationErrors(errors, labels = {}) {
  return Object.entries(errors || {}).flatMap(([field, messages]) => {
    const list = Array.isArray(messages) ? messages : [messages]
    return list.filter(Boolean).map((message) => ({
      field,
      label: fieldLabel(field, labels),
      message: String(message),
    }))
  })
}

export function errorMessagesFromResponse(error, labels = {}, fallback = "Erreur lors de l'enregistrement") {
  if (hasValidationErrors(error)) {
    return flattenValidationErrors(validationErrors(error), labels)
      .map((item) => `${item.label} : ${item.message}`)
  }

  return [error.response.data.message || fallback]
}

function humanize(value) {
  return String(value || '')
    .replace(/\.\d+\./g, ' - ')
    .replace(/[._-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}
