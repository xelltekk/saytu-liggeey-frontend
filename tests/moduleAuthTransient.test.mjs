import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { moduleSessionIdentity, moduleContextMatchesUser, userWithoutModuleContext } from '../src/module-system/modulePolicy.mjs'

// Exécute les véritables actions d'authentification sans serveur ni stockage du navigateur utilisateur.
function session(error) {
  const user = { id: 7, role: 'commercial', tenant: { id: 7 }, permissions: { flat: ['sav.view'] } }
  const storage = new Map([['xelltekk_user', JSON.stringify(user)]])
  const modules = { context: { tenant_id: 7, revision: 2, modules: [{ key: 'connaissances', enabled: true }] }, reset() { this.context = null } }
  const script = readFileSync(new URL('../src/stores/auth.js', import.meta.url), 'utf8').replace(/^import .*$/gm, '').replace('export const useAuthStore', 'const useAuthStore')
  const context = vm.createContext({
    moduleSessionIdentity, moduleContextMatchesUser, userWithoutModuleContext,
    api: { get: async () => { throw error } }, useModulesStore: () => modules,
    clearSessionToken() {}, setSessionToken() {},
    localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    defineStore: (_id, options) => options,
  })
  vm.runInContext(script + '\nglobalThis.options = useAuthStore;', context)
  const store = { ...context.options.state() }
  store.sessionChecked = true
  for (const [key, action] of Object.entries(context.options.actions)) store[key] = action.bind(store)
  return { store, modules, storage }
}

for (const status of [undefined, 429, 500, 503]) {
  test(`le rafraîchissement de fond conserve session et catalogue pour ${status || 'panne réseau'}`, async () => {
    const cause = status ? { response: { status } } : new Error('network')
    const p = session(cause), original = p.modules.context
    await assert.rejects(p.store.fetchMe({ preserveSessionOnTransientError: true }))
    assert.equal(p.store.user.id, 7)
    assert.equal(p.modules.context, original)
    assert.equal(p.storage.has('xelltekk_user'), true)
  })
}
for (const status of [401, 403]) {
  test(`une véritable expiration ${status} conserve le traitement de sécurité existant`, async () => {
    const p = session({ response: { status } })
    await assert.rejects(p.store.fetchMe({ preserveSessionOnTransientError: true }))
    assert.equal(p.store.user, null)
    assert.equal(p.modules.context, null)
    assert.equal(p.storage.has('xelltekk_user'), false)
  })
}
test('les appels historiques sans option gardent leur comportement de démarrage', async () => {
  const p = session({ response: { status: 503 } })
  await assert.rejects(p.store.fetchMe())
  assert.equal(p.store.user, null)
  assert.equal(p.modules.context, null)
})
