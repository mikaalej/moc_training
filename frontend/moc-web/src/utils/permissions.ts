/**
 * Role-based permissions for the MOC app.
 *
 * Role hierarchy (most to least privileged):
 * - SuperUser: Admin access, all workflow actions, can approve any slot (when it's their turn).
 * - AVP, DivisionManager, DepartmentManager, Supervisor: Workflow actions (advance, mark inactive, reactivate); can approve only their own slot when it's next in order.
 * - Originator: Can create and view requests; cannot access Admin or perform workflow actions (advance/inactive/reactivate) or approve.
 */

/** Role keys that appear in the approval chain (can complete an approver slot when it's their turn). */
export const APPROVER_ROLE_KEYS = [
  'Supervisor',
  'DepartmentManager',
  'DivisionManager',
  'AVP',
  'SuperUser',
] as const;

/** Only SuperUser can access Admin & User Management (users, approval levels, LOVs). */
export function canAccessAdmin(roleKey: string): boolean {
  return roleKey === 'SuperUser';
}

/** Roles that can advance workflow stage, mark inactive, and reactivate. Originator is view/create only for workflow actions. */
export function canAdvanceOrChangeWorkflowState(roleKey: string): boolean {
  return [
    'SuperUser',
    'AVP',
    'DivisionManager',
    'DepartmentManager',
    'Supervisor',
  ].includes(roleKey);
}

/** User can complete an approver slot only if their role matches the slot's role (and they're in the approval chain). */
export function canCompleteApproverSlot(userRoleKey: string, slotRoleKey: string): boolean {
  return APPROVER_ROLE_KEYS.includes(userRoleKey as (typeof APPROVER_ROLE_KEYS)[number]) && userRoleKey === slotRoleKey;
}

/** Whether the user's role is in the approval chain at all (can see Approve/Reject for their own slot). */
export function isApproverRole(roleKey: string): boolean {
  return APPROVER_ROLE_KEYS.includes(roleKey as (typeof APPROVER_ROLE_KEYS)[number]);
}

/** All authenticated users can create requests (Originator and above). */
export function canCreateRequest(_roleKey: string): boolean {
  return true;
}
