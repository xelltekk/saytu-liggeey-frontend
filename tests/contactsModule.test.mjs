import test from 'node:test'
import assert from 'node:assert/strict'
import { contactsUi, contactIntegrationFields, contactAwareSnapshot, contactIntegrationLinks } from '../src/modules/contacts/ui.js'
import { businessPayload } from '../src/utils/businessModules.js'

test('Contacts possède son menu et ses colonnes sans confondre la fiche du tiers', () => {
  assert.equal(contactsUi.key, 'contacts')
  assert.equal(contactsUi.menu.path, '/metier/contacts')
  assert.equal(contactsUi.columns[0][0], 'client_label')
})
test('une relation dormante reste en mémoire mais ne part pas dans la modification SAV', () => {
  const fields = [['client_id', 'Tiers', 'relation', 'clients'], ['contact_id', 'Contact', 'relation', 'contacts'], ['resolution', 'Solution', 'textarea']]
  const form = { titre: 'SAV', statut: 'resolu', client_id: 1, contact_id: 8, resolution: 'Solution actualisée' }
  const payload = businessPayload({ key: 'sav', fields: contactIntegrationFields(fields, false) }, form, { version: 3 })
  assert.equal(payload.contact_id, undefined)
  assert.equal(form.contact_id, 8)
  assert.equal(payload.client_id, 1)
  assert.equal(payload.resolution, 'Solution actualisée')
  assert.equal(businessPayload({ key: 'sav', fields: contactIntegrationFields(fields, true) }, form, { version: 3 }).contact_id, 8)
})
test('un contact latent ne bloque pas la sauvegarde des autres champs lorsque le module est OFF', () => {
  const saved = { titre: 'SAV', contact_id: 7 }
  const draft = { titre: 'SAV', contact_id: 8 }
  assert.equal(contactAwareSnapshot(saved, false), contactAwareSnapshot(draft, false))
  assert.notEqual(contactAwareSnapshot(saved, true), contactAwareSnapshot(draft, true))
})
test('OFF masque uniquement les liens Contacts tout en gardant les liens vers les autres rubriques', () => {
  const links = { contact_id: '/metier/contacts/7', client_id: '/clients/1', devis_id: '/devis/2' }
  assert.deepEqual(contactIntegrationLinks(links, false), { client_id: '/clients/1', devis_id: '/devis/2' })
  assert.equal(links.contact_id, '/metier/contacts/7')
})
