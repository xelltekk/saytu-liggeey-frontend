import { FileText, Settings } from 'lucide-vue-next'
import { contactsUi } from '../modules/contacts/ui.js'
import { connaissancesUi } from '../modules/connaissances/ui.js'

// Ce registre local autorise uniquement des destinations dont le code est livré avec l'application.
const localMenus = {
  [contactsUi.menu.path]: contactsUi.menu,
  '/metier/commandes_clients': { moduleKey: 'commandes_clients', label: 'Commandes clients', group: 'ventes' },
  '/metier/contrats_services': { moduleKey: 'contrats_services', label: 'Contrats de services', group: 'services' },
  '/metier/projets': { moduleKey: 'projets', label: 'Projets et tâches', group: 'pilotage' },
  '/metier/sav': { moduleKey: 'sav', label: 'Tickets clients / SAV', group: 'services' },
  [connaissancesUi.menu.path]: connaissancesUi.menu,
  '/configuration/modules': { moduleKey: 'core', label: 'Modules', group: 'configuration', administration: true },
}

// Projette les manifestes validés sans modifier les menus historiques ni importer de code distant.
export function projectDeclaredMenus(declarations) {
  if (!Array.isArray(declarations)) return []
  const menus = []
  const seen = new Set()
  for (const declaration of declarations) {
    const known = localMenus[declaration?.path]
    if (!known || !declaration.activation_ready || declaration.module_key !== known.moduleKey || seen.has(declaration.path)) continue
    seen.add(declaration.path)
    menus.push({
      to: declaration.path,
      label: typeof declaration.label === 'string' && declaration.label.trim() ? declaration.label.slice(0, 100) : known.label,
      icon: known.administration ? Settings : FileText,
      roles: known.administration ? ['admin'] : [],
      permission: known.administration ? 'modules.manage' : `${known.moduleKey}.view`,
      businessKey: known.administration ? undefined : known.moduleKey,
      moduleAdministration: !!known.administration,
      moduleMenuGroup: known.group,
    })
  }
  return menus
}


// Seuls les pilotes livrés et validés quittent la liste de menus historique.
export function manifestManagedModuleKeys(context) {
  if (!Array.isArray(context?.declared_menus)) return []
  return [connaissancesUi.key, contactsUi.key].filter(key => context.modules?.some(module => module.key === key && module.activation_ready === true))
}
