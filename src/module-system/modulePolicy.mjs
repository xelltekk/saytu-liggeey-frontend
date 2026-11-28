// Associe les URL historiques aux modules sans déplacer les écrans existants.
const PATH_MODULES = [
  ['/agenda/depenses', ['agenda']],
  ['/leasing/interventions', ['leasing', 'interventions_leasing']],
  ['/configuration/modules', ['core']],
  ['/module-indisponible', ['core']],
  ['/espace-client', ['core']],
  ['/portail-clients', ['portail_clients']],
  ['/categories-produits', ['produits']],
  ['/fournisseurs-reglements', ['fournisseurs_reglements']],
  ['/tresorerie-comptes', ['tresorerie']],
  ['/roles-permissions', ['core']],
  ['/xelltekk-admin', ['core']],
  ['/utilisateurs', ['core']],
  ['/parametres', ['core']],
  ['/securite', ['core']],
  ['/licence', ['core']],
  ['/demarrage', ['core']],
  ['/importation', ['importation']],
  ['/notifications', ['notifications']],
  ['/prospection', ['prospection']],
  ['/recouvrement', ['recouvrement']],
  ['/entrepots', ['stock']],
  ['/produits', ['produits']],
  ['/factures', ['factures']],
  ['/paiements', ['paiements']],
  ['/depenses', ['depenses']],
  ['/leasing', ['leasing']],
  ['/pilotage', ['pilotage']],
  ['/aujourdhui', ['pilotage']],
  ['/activites', ['core']],
  ['/gerant', ['pilotage']],
  ['/agenda', ['agenda']],
  ['/clients', ['clients']],
  ['/devis', ['devis']],
  ['/achats', ['achats']],
  ['/caisse', ['caisse']],
  ['/stock', ['stock']],
  ['/compta', ['comptabilite']],
  ['/ecritures', ['comptabilite']],
  ['/rh', ['rh']],
]

// Identifie le propriétaire réel, y compris les routes métier paramétrées.
export function moduleKeysForPath(value) {
  const path = String(value || '/').split(/[?#]/)[0]
  if (path === '/' || path === '/dashboard') return ['dashboard']
  const match = path.match(/^\/metier\/([^/]+)/)
  if (match) {
    try { return [decodeURIComponent(match[1])] } catch { return ['__unknown__'] }
  }
  const entry = PATH_MODULES.find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`))
  return entry ? [...entry[1]] : ['core']
}

// Une réponse non initialisée conserve le comportement antérieur au déploiement du noyau.
export function moduleIsAvailable(context, key) {
  if (!context || context.configured === false) return true
  if (key === 'core') return true
  const module = context.modules?.find(item => item.key === key || (Array.isArray(item.aliases) && item.aliases.includes(key)))
  // Les licences historiques gardent leurs contrôles existants jusqu'à la migration du module.
  return !!module && (module.core === true || (module.enabled === true && (!module.activation_ready || module.licensed === true)))
}

// Les dépendances d'une URL transversale doivent toutes rester accessibles.
export function moduleRouteIsAvailable(context, path) {
  return moduleKeysForPath(path).every(key => moduleIsAvailable(context, key))
}

// La gestion des modules est réservée aux administrateurs de la société.
export function mayManageModules(user) {
  return (user?.base_role || user?.role) === 'admin' || user?.role === 'admin'
}

// N'accepte que des destinations locales de configuration réellement existantes.
export function configurationTarget(module) {
  const paths = {
    core: ['/parametres'],
    parametres: ['/parametres'],
    rh: ['/rh?tab=administration', '/rh?tab=organisation'],
  }
  return paths[module?.key]?.includes(module?.configuration_path) ? module.configuration_path : null
}

// Distingue les sessions pour ne jamais réutiliser un catalogue d'une autre société.
export function moduleSessionIdentity(user) {
  if (!user) return ''
  return `${user.tenant?.id ?? user.tenant_id ?? 'platform'}:${user.id ?? user.email ?? ''}`
}


// Retire l'état des modules du profil destiné au stockage local de la session.
export function userWithoutModuleContext(user) {
  if (!user || typeof user !== 'object') return null
  const { modules_context, ...profile } = user
  return profile
}

// Un contexte fourni à la connexion doit appartenir à la même société que le profil.
export function moduleContextMatchesUser(context, user) {
  if (!context || !user) return false
  if (context.configured === false) return true
  const tenantId = user.tenant?.id ?? user.tenant_id ?? null
  return context.tenant_id !== undefined && String(context.tenant_id) === String(tenantId)
}


// Calcule un état stable pour tous les domaines migrés, sans dépendre de leur ordre dans le catalogue.
export function moduleAvailabilitySignature(context) {
  if (!context || context.configured === false) return '[]'
  const keys = [...new Set((context.modules || []).filter(module => module.activation_ready === true && !module.core && typeof module.key === 'string').map(module => module.key))].sort()
  return JSON.stringify(keys.map(key => [key, moduleIsAvailable(context, key)]))
}

// Le propriétaire d'un préfixe est toujours la clé canonique, jamais un alias ou une permission étrangère.
export function managedPermissionModuleKeys(context) {
  if (!context || context.configured === false) return []
  return [...new Set((context.modules || []).filter(module => module.activation_ready === true && !module.core && module.key !== 'core' && typeof module.key === 'string')
    .map(module => module.key))].sort()
}
