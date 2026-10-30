import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
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

test('the former separate route redirects to the tab and no global comparison action remains', () => {
  const router = readFileSync(new URL('../src/router/index.js', import.meta.url), 'utf8')
  assert.match(router, /name: 'leasing-comparaison',\s+redirect: to => \(\{ \.\.\.leasingComparisonLocation\(to.query\), hash: to.hash \}\)/)
  const view = readFileSync(new URL('../src/views/LeasingView.vue', import.meta.url), 'utf8')
  assert.doesNotMatch(view, /name: 'leasing-comparaison'/)
  assert.doesNotMatch(view, />Comparer deux relevés<\/RouterLink>/)
  assert.match(view, /<LeasingComparaisonView v-if="comparisonActive"/)
})
