import test from 'node:test'
import assert from 'node:assert/strict'
import { businessModules, businessPayload, businessPermission } from '../src/utils/businessModules.js'

test('six distinct routes and least-privilege permissions', () => {
  assert.equal(new Set(businessModules.map(([key]) => key)).size, 6)
  assert.equal(businessPermission({ role: 'caissier' }, 'contacts'), false)
  assert.equal(businessPermission({ role: 'gerant', permissions: { flat: [] } }, 'contacts'), false)
  assert.equal(businessPermission({ role: 'custom', permissions: { flat: ['contacts.view'] } }, 'contacts'), true)
  assert.equal(businessPermission({ role: 'custom', permissions: { flat: ['contacts.view'] } }, 'contacts', 'update'), false)
})
test('confirmed orders only submit version and status', () => {
  assert.deepEqual(businessPayload({ key: 'commandes_clients' }, { titre: 'Should not be sent', statut: 'cloturee', lines: [] }, { statut: 'confirmee', version: 2 }), { statut: 'cloturee', version: 2 })
})
test('create whitelists fields and preserves retry identity', () => {
  assert.deepEqual(businessPayload({ key: 'contacts', fields: [['client_id'], ['telephone']] }, { titre: 'Nom', statut: 'actif', client_id: 1, telephone: '', societe_id: 999, request_hash: 'bad' }, null, 'retry-id'), { titre: 'Nom', statut: 'actif', client_id: 1, telephone: null, request_id: 'retry-id' })
})
test('children cannot submit their parent, tenant, or calculated totals', () => {
  const result = businessPayload({ key: 'commandes_clients', fields: [], children: 'lines' }, { titre: 'Commande', statut: 'brouillon', lines: [{ id: 8, parent_id: 999, societe_id: 999, produit_id: 1, designation: 'Test', quantite: '1', prix: '10', tva: '0', total_ttc: '99999' }] }, { statut: 'brouillon', version: 1 })
  assert.deepEqual(result.lines, [{ produit_id: 1, designation: 'Test', quantite: '1', prix: '10', tva: '0' }])
})
