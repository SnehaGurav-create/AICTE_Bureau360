// Role codes and data scopes, matching the roles table seed data.

export const ROLES = {
  ADMIN: 'ADMIN',
  REGULATION_BUREAU: 'REGULATION_BUREAU',
  PGRC: 'PGRC',
  OTHER_BUREAU: 'OTHER_BUREAU',
  REGIONAL_OFFICE: 'REGIONAL_OFFICE',
  AUTHORIZED_OFFICER: 'AUTHORIZED_OFFICER',
};

/** Data visibility scope for each role. */
export const SCOPES = {
  ALL: 'ALL',
  REGION: 'REGION',
  BUREAU: 'BUREAU',
  ASSIGNED: 'ASSIGNED',
};
