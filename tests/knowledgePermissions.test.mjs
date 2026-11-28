import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { computed, ref, reactive, watch } from 'vue'
import { managedPermissionModuleKeys, moduleAvailabilitySignature } from '../src/module-system/modulePolicy.mjs'

// Exécute les fonctions de projection du vrai écran avec une API entièrement fictive.
function editor(automatic = false) {
  const source = readFileSync(new URL('../src/views/RolesPermissionsView.vue', import.meta.url), 'utf8').split('<script setup>')[1].split('</script>')[0].replace(/^import .*$/gm, '')
  const initial = { revision: 1, initialized: true, enabled: true }
  const moduleState = automatic ? reactive(initial) : initial
  moduleState.allows = key => moduleState.availability ? moduleState.availability[key] !== false : moduleState.enabled
  Object.defineProperty(moduleState, 'context', { configurable: true, get: () => ({ configured: true, modules: [{ key: 'connaissances', activation_ready: true, core: false, enabled: moduleState.enabled, licensed: true, permissions: ['connaissances.view', 'connaissances.create'] }] }) })
  const api = { get: async () => ({ data: {} }) }
  const context = vm.createContext({ computed, ref, watch, managedPermissionModuleKeys, moduleAvailabilitySignature, onMounted() {}, onBeforeUnmount() {}, api, useModulesStore: () => moduleState, useToast: () => ({ success() {}, error() {} }), useConfirm: () => ({ confirm: async () => true }) })
  vm.runInContext(source + '\nglobalThis.editor = { form, selectedRole, definitions, overrideForm, userAccess, refreshModuleAccessProjection };', context)
  return { ...context.editor, api, moduleState }
}
// Représente la projection du rôle enregistré, indépendante du brouillon local.
function schema(enabled) { return { modules: { sav: { label: 'SAV', actions: ['view', 'update'] }, ...(enabled ? { connaissances: { label: 'Connaissances', actions: ['view', 'create'] } } : {}) }, actions: {}, system_roles: {} } }
function roles(enabled) { return [{ id: 12, code: 'commercial_test', label: 'Libellé enregistré', permissions: { sav: { view: true, update: false }, ...(enabled ? { connaissances: { view: true, create: false } } : {}) } }] }
function respond(p, enabled) { p.api.get = async url => ({ data: url.endsWith('/definitions') ? schema(enabled) : url.endsWith('/roles') ? roles(enabled) : {} }) }

test('OFF puis ON préserve le brouillon des autres droits et restaure les bits KB enregistrés', async () => {
  const p = editor()
  p.form.value = { id: 12, label: 'Mon libellé en cours', permissions: { sav: { view: true, update: true }, connaissances: { view: false, create: true } } }
  p.selectedRole.value = roles(true)[0]
  p.definitions.value = schema(true)
  p.overrideForm.value = { module: 'sav', permission: 'update', value: '1', reason: 'Motif non envoyé' }
  p.moduleState.enabled = false; respond(p, false)
  await p.refreshModuleAccessProjection()
  assert.equal(p.form.value.permissions.connaissances, undefined)
  assert.equal(p.form.value.permissions.sav.update, true)
  assert.equal(p.form.value.label, 'Mon libellé en cours')
  assert.equal(p.overrideForm.value.reason, 'Motif non envoyé')
  p.moduleState.enabled = true; respond(p, true)
  await p.refreshModuleAccessProjection()
  assert.equal(p.form.value.permissions.connaissances.view, true)
  assert.equal(p.form.value.permissions.connaissances.create, false)
  assert.equal(p.form.value.permissions.sav.update, true)
  assert.equal(p.form.value.label, 'Mon libellé en cours')
})

test('une ancienne projection ON ne réinjecte aucun droit après une projection OFF plus récente', async () => {
  const p = editor()
  p.form.value = { id: 12, permissions: { sav: { update: true } } }
  let release
  p.api.get = url => url.endsWith('/definitions') ? new Promise(resolve => { release = resolve }) : Promise.resolve({ data: url.endsWith('/roles') ? roles(true) : {} })
  const old = p.refreshModuleAccessProjection()
  p.moduleState.enabled = false; respond(p, false)
  await p.refreshModuleAccessProjection()
  release({ data: schema(true) }); await old
  assert.equal(p.form.value.permissions.connaissances, undefined)
  assert.equal(p.definitions.value.modules.connaissances, undefined)
  assert.equal(p.form.value.permissions.sav.update, true)
})

test('la réactivation ne donne pas les droits dormants d’un autre rôle à un nouveau rôle', async () => {
  const p = editor()
  p.form.value = { id: null, label: 'Nouveau rôle', permissions: { sav: { view: false } } }
  respond(p, true)
  await p.refreshModuleAccessProjection()
  assert.equal(p.form.value.permissions.connaissances.view, false)
  assert.equal(p.form.value.permissions.connaissances.create, false)
  assert.equal(p.form.value.label, 'Nouveau rôle')
})


test('la disponibilité effective rafraîchit les droits même lorsque la révision reste constante', async () => {
  const p = editor(true)
  p.form.value = { id: 12, label: 'Libellé conservé', permissions: { sav: { update: true }, connaissances: { view: true } } }
  p.definitions.value = schema(true)
  respond(p, false); p.moduleState.enabled = false
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(p.form.value.permissions.connaissances, undefined)
  respond(p, true); p.moduleState.enabled = true
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(p.form.value.permissions.connaissances.view, true)
  assert.equal(p.form.value.permissions.sav.update, true)
  assert.equal(p.form.value.label, 'Libellé conservé')
  assert.equal(p.moduleState.revision, 1)
})


test('plusieurs modules migrés se projettent séparément sans écraser les autres brouillons', async () => {
  const p = editor()
  p.moduleState.availability = { contacts: false, projets: true }
  Object.defineProperty(p.moduleState, 'context', { get: () => ({ configured: true, modules: [
    { key: 'contacts', core: false, activation_ready: true, enabled: p.moduleState.availability.contacts, licensed: true, permissions: ['contacts.view'] },
    { key: 'projets', core: false, activation_ready: true, enabled: p.moduleState.availability.projets, licensed: true, permissions: ['projets.view'] },
    { key: 'core', core: true, activation_ready: true, enabled: true, licensed: true },
    { key: 'sav', core: false, activation_ready: false, enabled: false, licensed: true },
  ] }) })
  p.form.value = { id: 12, label: 'Brouillon intact', permissions: { contacts: { view: false }, projets: { view: false, update: true }, sav: { view: true }, core: { manage: true } } }
  p.definitions.value = { modules: { contacts: { actions: ['view'] }, projets: { actions: ['view', 'update'] }, sav: { actions: ['view'] } } }
  p.api.get = async url => ({ data: url.endsWith('/definitions') ? { modules: { ...(p.moduleState.availability.contacts ? { contacts: { actions: ['view'] } } : {}), projets: { actions: ['view', 'update'] }, sav: { actions: ['view'] } } } : url.endsWith('/roles') ? [{ id: 12, permissions: { contacts: { view: true }, projets: { view: true, update: false } } }] : {} })
  await p.refreshModuleAccessProjection()
  assert.equal(p.form.value.permissions.contacts, undefined)
  assert.equal(p.form.value.permissions.projets.update, true)
  p.moduleState.availability.contacts = true
  await p.refreshModuleAccessProjection()
  assert.equal(p.form.value.permissions.contacts.view, true)
  assert.equal(p.form.value.permissions.projets.view, false)
  assert.equal(p.form.value.permissions.projets.update, true)
  assert.equal(p.form.value.permissions.sav.view, true)
  assert.equal(p.form.value.permissions.core.manage, true)
  assert.equal(p.form.value.label, 'Brouillon intact')
})
