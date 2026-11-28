// Le pilote possède ses métadonnées et ses composants ; le serveur décide de son activation.
export const connaissancesUi = Object.freeze({
  key: 'connaissances',
  label: 'Base de connaissances',
  columns: Object.freeze([['categorie', 'Catégorie'], ['updated_at', 'Mis à jour']]),
  menu: Object.freeze({ path: '/metier/connaissances', moduleKey: 'connaissances', label: 'Base de connaissances', group: 'services' }),
  // L'import est local et explicite, sans chemin fourni par une API.
  loadReader: () => import('./components/KnowledgeArticleReader.vue'),
})


// Indique l'audience enregistrée sans élargir la visibilité effective du document.
export function knowledgeAudienceLabel(audience) {
  return ({ interne: 'Interne', clients: 'Clients de l’entreprise', abonnes: 'Abonnés Saytu' })[audience] || 'Interne'
}
