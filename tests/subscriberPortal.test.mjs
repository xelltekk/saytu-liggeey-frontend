import test from 'node:test'
import assert from 'node:assert/strict'
import { canUseSubscriberPortal, subscriberSections } from '../src/utils/subscriberPortal.js'

test('Only subscriber administrators and managers can access the subscriber workspace', () => {
  const tenant = { has_subscription_account: true, is_platform: false }
  for (const role of ['admin', 'gerant']) assert.equal(canUseSubscriberPortal({ role, tenant }), true)
  for (const role of ['caissier', 'commercial', 'comptable', 'magasinier']) assert.equal(canUseSubscriberPortal({ role, tenant }), false)
  assert.equal(canUseSubscriberPortal({ role: 'admin', tenant: { ...tenant, is_platform: true } }), false)
  assert.equal(canUseSubscriberPortal({ role: 'admin', tenant: { ...tenant, has_subscription_account: false } }), false)
  assert.equal(canUseSubscriberPortal(null), false)
  assert.equal(canUseSubscriberPortal({ role: 'custom', base_role: 'gerant', tenant }), true)
  assert.equal(subscriberSections.length, 3)
})
