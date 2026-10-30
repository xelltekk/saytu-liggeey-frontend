export function leasingTabLocation(tab, currentQuery = {}) {
  const query = { ...currentQuery, tab }
  for (const key of ['vue', 'contrat', 'releve', 'intervention']) delete query[key]
  return { name: 'leasing', query }
}

export function leasingComparisonLocation(query = {}) {
  return { name: 'leasing', query: { ...query, tab: 'releves', vue: 'comparaison' } }
}
