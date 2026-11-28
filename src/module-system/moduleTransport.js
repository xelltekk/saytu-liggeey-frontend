let generation = 0

// Étiquette les requêtes afin d'écarter celles d'une session précédente.
export function moduleTransportGeneration() { return generation }

// Invalide les réponses encore en vol lors d'un changement de session.
export function resetModuleTransport() { generation += 1 }
