export function effectiveRole(user) {
  return user?.base_role || user?.role || null
}

export function hasAnyRole(user, roles = []) {
  const allowed = Array.isArray(roles) ? roles : [roles]
  const role = effectiveRole(user)
  const directRole = user?.role || null

  return allowed.includes(role) || allowed.includes(directRole)
}

export function hasPermission(user, permission) {
  if (hasAnyRole(user, 'admin')) return true
  return Array.isArray(user?.permissions?.flat) && user.permissions.flat.includes(permission)
}
