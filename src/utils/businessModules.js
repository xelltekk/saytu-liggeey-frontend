export const businessModules = [
  ['contacts', 'Contacts'],
  ['commandes_clients', 'Commandes clients'],
  ['contrats_services', 'Contrats de services'],
  ['projets', 'Projets et tâches'],
  ['sav', 'Tickets clients / SAV'],
  ['connaissances', 'Base de connaissances'],
]

export const activeBusinessModules = businessModules

export const businessSections = {
  ventes: ['contacts', 'commandes_clients'],
  pilotage: ['projets'],
  services: ['contrats_services', 'sav', 'connaissances'],
}

export const businessColumns = {
  contacts: [['client_label', 'Tiers'], ['fonction', 'Fonction'], ['email', 'Email'], ['telephone', 'Téléphone']],
  commandes_clients: [['client_label', 'Client'], ['date_debut', 'Date'], ['date_fin', 'Échéance'], ['total_ttc', 'Total TTC'], ['devise', 'Devise']],
  contrats_services: [['client_label', 'Client'], ['date_fin', 'Fin'], ['renouvellement', 'Renouvellement'], ['montant', 'Montant HT / période'], ['periodicite', 'Périodicité']],
  projets: [['client_label', 'Client'], ['owner_label', 'Responsable'], ['date_fin', 'Échéance'], ['progression', 'Tâches terminées / annulées'], ['minutes', 'Temps (min)']],
  sav: [['client_label', 'Client'], ['owner_label', 'Responsable'], ['priorite', 'Priorité']],
  connaissances: [['categorie', 'Catégorie'], ['updated_at', 'Mis à jour']],
}

export function applyCatalogProduct(line, product) {
  if (!product) return
  line.designation = product.label
  line.prix = String(product.prix_vente_ht ?? '0')
  line.tva = String(product.taux_tva ?? '0')
}

export function businessPermission(user, key, action = 'view') {
  return (user?.base_role || user?.role) === 'admin' || (user?.permissions?.flat || []).includes(`${key}.${action}`)
}

export function businessPayload(definition, form, record, requestId) {
  if (definition.key === 'commandes_clients' && record && record.statut !== 'brouillon') {
    return { statut: form.statut, version: record.version }
  }
  const payload = { titre: form.titre, statut: form.statut }
  if (definition.key === 'commandes_clients' && record?.portal_user_id && record.statut === 'brouillon') payload.portal_review_confirmed = Boolean(form.portal_review_confirmed)
  for (const [field] of definition.fields) payload[field] = form[field] === '' ? null : form[field]
  if (definition.children === 'lines') payload.lines = form.lines.map(({ produit_id, designation, quantite, prix, tva }) => ({ produit_id: produit_id || null, designation, quantite, prix, tva }))
  if (definition.children === 'tasks') payload.tasks = form.tasks.map(({ titre, statut, owner_id, echeance, minutes }) => ({ titre, statut, owner_id: owner_id || null, echeance: echeance || null, minutes }))
  return { ...payload, ...(record ? { version: record.version } : { request_id: requestId }) }
}
