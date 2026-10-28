// Action types for the complaint timeline, matching the action_type enum.

export const ACTION_TYPES = {
  CREATED: 'CREATED',
  STATUS_CHANGED: 'STATUS_CHANGED',
  ASSIGNED: 'ASSIGNED',
  TRANSFERRED: 'TRANSFERRED',
  ESCALATED: 'ESCALATED',
  REMARK: 'REMARK',
  DOCUMENT_ADDED: 'DOCUMENT_ADDED',
  FIELD_UPDATED: 'FIELD_UPDATED',
  OVERLAP_LINKED: 'OVERLAP_LINKED',
  REOPENED: 'REOPENED',
};

/** Assignment kind values matching the assignment_kind enum. */
export const ASSIGNMENT_KINDS = {
  ASSIGNMENT: 'ASSIGNMENT',
  TRANSFER: 'TRANSFER',
  ESCALATION: 'ESCALATION',
};
