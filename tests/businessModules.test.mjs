import test from 'node:test'
import assert from 'node:assert/strict'
import { businessModules, activeBusinessModules, businessPayload, businessPermission, businessSections, businessColumns, applyCatalogProduct } from '../src/utils/businessModules.js'

test('active modules belong to one relevant section including customer orders', () => {
  const keys = Object.values(businessSections).flat()
  assert.equal(keys.length, 6)
  assert.equal(new Set(keys).size, 6)
  assert.equal(keys.includes('commandes_clients'), true)
  assert.equal(activeBusinessModules.some(([key]) => key === 'commandes_clients'), true)
  assert.equal(businessModules.some(([key]) => key === 'commandes_clients'), true)
  assert.ok(businessSections.pilotage.includes('projets'))
  for (const [key] of activeBusinessModules) {
    assert.ok(keys.includes(key))
    assert.ok(businessColumns[key].length > 0)
  }
})

test('catalog selection copies sale price and VAT, preserving quantity', () => {
  const line = { quantite: '3', designation: 'Libre', prix: '20', tva: '0' }
  applyCatalogProduct(line, { label: 'Ordinateur', prix_vente_ht: '250000.00', taux_tva: '18.00' })
  assert.deepEqual(line, { quantite: '3', designation: 'Ordinateur', prix: '250000.00', tva: '18.00' })
  applyCatalogProduct(line, undefined)
  assert.equal(line.prix, '250000.00')
})

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
