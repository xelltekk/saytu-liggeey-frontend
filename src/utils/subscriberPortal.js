export function canUseSubscriberPortal(user) {
  return Boolean(user?.tenant?.has_subscription_account && !user.tenant.is_platform
    && ['admin', 'gerant'].includes(user.base_role || user.role))
}

export const subscriberSections = [
  ['contrats', 'Mes contrats Saytu'],
  ['tickets', 'Mes tickets support'],
  ['connaissances', 'Base de connaissances'],
]
