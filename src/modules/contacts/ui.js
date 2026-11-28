// Contacts possède ses métadonnées et ses contributions ; les tiers restent un domaine indépendant.
export const contactsUi = Object.freeze({
  key: 'contacts',
  label: 'Contacts',
  columns: Object.freeze([['client_label', 'Tiers'], ['fonction', 'Fonction'], ['email', 'Email'], ['telephone', 'Téléphone'], ['mobile', 'Mobile']]),
  menu: Object.freeze({ path: '/metier/contacts', moduleKey: 'contacts', label: 'Contacts', group: 'ventes' }),
})

// Les relations Contacts disparaissent sans effacer leur valeur conservée dans le brouillon.
export function contactIntegrationFields(fields = [], available = true) {
  return available ? fields : fields.filter(([field, , type, source]) => !(field === 'contact_id' || (type === 'relation' && source === contactsUi.key)))
}

// Une valeur de contact dormante ne rend pas les autres modifications impossibles à enregistrer.
export function contactAwareSnapshot(value, available = true) {
  if (available || !value || typeof value !== 'object') return JSON.stringify(value)
  const { contact_id, ...visible } = value
  return JSON.stringify(visible)
}

// Les anciens liens chargés ne doivent pas rester affichés lorsque le domaine est désactivé.
export function contactIntegrationLinks(links = {}, available = true) {
  return available ? links : Object.fromEntries(Object.entries(links).filter(([field, path]) => field !== 'contact_id' && !String(path).startsWith('/metier/contacts')))
}
