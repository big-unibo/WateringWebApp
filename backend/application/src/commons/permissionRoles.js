export const ROLES = {
    ADMINISTRATOR: 'administrator',
    ACCOUNTER: 'accounter',
    PLANNER: 'planner',
    VIEWER: 'viewer'
}

const ROLE_HIERARCHY = {
  administrator: [ROLES.ACCOUNTER],
  accounter: [ROLES.PLANNER],
  planner: [ROLES.VIEWER],
  viewer: []
}

export function isRoleAtLeast(actualRole, requiredRole) {
  if (actualRole === requiredRole) return true

  const implied = ROLE_HIERARCHY[actualRole] || []
  return implied.some(r => isRoleAtLeast(r, requiredRole))
}

export const COMPANIES_PERMITS_COLUMN_MAPPING = {
    COMPANY: "company_id",
    FARM: "farm_id",
    SECTOR: "sector_id",
    THESIS: "thesis_id",
}

export const DEVICE_PERMITS_COLUMN_MAPPING = {
    DEVICE: "device_id",
    SIGNAL: "signal_id",
}