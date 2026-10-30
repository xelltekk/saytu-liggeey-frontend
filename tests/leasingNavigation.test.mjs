import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { leasingTabLocation, leasingComparisonLocation } from '../src/services/leasingNavigation.mjs'

test('comparisons share the readings tab and preserve contract context', () => {
  assert.deepEqual(leasingComparisonLocation({ contrat: '42', search: 'test' }), {
    name: 'leasing', query: { contrat: '42', search: 'test', tab: 'releves', vue: 'comparaison' },
  })
  assert.deepEqual(leasingComparisonLocation({ tab: 'contrats' }).query, { tab: 'releves', vue: 'comparaison' })
})

test('changing tab removes obsolete comparison context without changing the source query', () => {
  const original = { tab: 'releves', vue: 'comparaison', contrat: '42', releve: '3', intervention: '4', search: 'test' }
  assert.deepEqual(leasingTabLocation('contrats', original), { name: 'leasing', query: { tab: 'contrats', search: 'test' } })
  assert.deepEqual(leasingTabLocation('releves', original).query, { tab: 'releves', search: 'test' })
  assert.equal(original.contrat, '42')
  assert.equal(original.vue, 'comparaison')
})

test('the previous new-reading link preserves its contract and resolves conflicting aliases explicitly', () => {
  const query = { contrat_id: '42', periode: '2026-10' }
  assert.deepEqual(leasingComparisonLocation(query), {
    name: 'leasing', query: { contrat: '42', periode: '2026-10', tab: 'releves', vue: 'comparaison' },
  })
  assert.equal(query.contrat_id, '42')
  assert.equal(leasingComparisonLocation({ contrat: '7', contrat_id: '42' }).query.contrat, '7')
  assert.equal(leasingComparisonLocation({ contrat_id: '42' }).query.contrat_id, undefined)
  assert.equal(leasingTabLocation('releves', query).query.contrat_id, undefined)
})

test('the former separate route redirects to the tab and no global comparison action remains', () => {
  const router = readFileSync(new URL('../src/router/index.js', import.meta.url), 'utf8')
  assert.match(router, /name: 'leasing-comparaison',\s+redirect: to => \(\{ \.\.\.leasingComparisonLocation\(to.query\), hash: to.hash \}\)/)
  assert.match(router, /name: 'leasing-releve-create',\s+redirect: to => \(\{ \.\.\.leasingComparisonLocation\(to.query\), hash: to.hash \}\)/)
  assert.doesNotMatch(router, /LeasingReleveDetailView/)
  assert.equal(existsSync(new URL('../src/views/LeasingReleveDetailView.vue', import.meta.url)), false)
  const view = readFileSync(new URL('../src/views/LeasingView.vue', import.meta.url), 'utf8')
  assert.doesNotMatch(view, /name: 'leasing-comparaison'/)
  assert.doesNotMatch(view, />Comparer deux relevés<\/RouterLink>/)
  assert.doesNotMatch(view, />Comparer<\/RouterLink>|showReleveModal|releves\/previsualiser/)
  assert.match(view, /<LeasingComparaisonView v-if="comparisonActive"/)
})
