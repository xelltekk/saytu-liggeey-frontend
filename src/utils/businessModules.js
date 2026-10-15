export const businessModules = [
  ['contacts', 'Contacts'],
  ['commandes_clients', 'Commandes clients'],
  ['contrats_services', 'Contrats de services'],
  ['projets', 'Projets et tâches'],
  ['sav', 'Tickets clients / SAV'],
  ['connaissances', 'Base de connaissances'],
]

export function businessPermission(user, key, action = 'view') {
  return (user?.base_role || user?.role) === 'admin' || (user?.permissions?.flat || []).includes(`${key}.${action}`)
}

export function businessPayload(definition, form, record, requestId) {
  if (definition.key === 'commandes_clients' && record && record.statut !== 'brouillon') {
    return { statut: form.statut, version: record.version }
  }
  const payload = { titre: form.titre, statut: form.statut }
  for (const [field] of definition.fields) payload[field] = form[field] === '' ? null : form[field]
  if (definition.children === 'lines') payload.lines = form.lines.map(({ produit_id, designation, quantite, prix, tva }) => ({ produit_id: produit_id || null, designation, quantite, prix, tva }))
  if (definition.children === 'tasks') payload.tasks = form.tasks.map(({ titre, statut, owner_id, echeance, minutes }) => ({ titre, statut, owner_id: owner_id || null, echeance: echeance || null, minutes }))
  return { ...payload, ...(record ? { version: record.version } : { request_id: requestId }) }
}
