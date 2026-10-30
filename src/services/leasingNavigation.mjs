export function leasingTabLocation(tab, currentQuery = {}) {
  const query = { ...currentQuery, tab }
  for (const key of ['vue', 'contrat', 'contrat_id', 'releve', 'intervention']) delete query[key]
  return { name: 'leasing', query }
}

export function leasingComparisonLocation(query = {}) {
  const context = { ...query }
  if (!context.contrat && context.contrat_id) context.contrat = context.contrat_id
  delete context.contrat_id
  return { name: 'leasing', query: { ...context, tab: 'releves', vue: 'comparaison' } }
}
