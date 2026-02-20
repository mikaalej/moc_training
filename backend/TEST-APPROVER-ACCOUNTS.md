# Test Approver Accounts (Approval Level Testing)

These accounts are created automatically when the API runs in **Development** (after the migration that adds `PasswordHash` is applied). Use them to test approval level order on the MOC detail page.

**All five accounts use the same password:**

| Password |
|----------|
| `Test123!` |

---

## Accounts (by approval level order)

| Level | Role               | Username                | Password  |
|-------|--------------------|-------------------------|-----------|
| 1     | Supervisor         | `approver_supervisor`   | `Test123!` |
| 2     | Department Manager | `approver_departmentmanager` | `Test123!` |
| 3     | Division Manager   | `approver_divisionmanager`   | `Test123!` |
| 4     | AVP                | `approver_avp`          | `Test123!` |
| 5     | Super User         | `approver_superuser`    | `Test123!` |

---

## How to get the accounts

1. **Run the API** in Development and ensure the DB is migrated (the new migration adds `PasswordHash` to `AppUsers`).
2. On first run in Development, the initializer creates these five users (or sets their password if they already exist).
3. **Log in** via `POST /api/auth/login` with JSON body: `{ "username": "approver_supervisor", "password": "Test123!" }` (or use any of the usernames above).

---

## Testing approval levels

- The **MOC detail** page shows approvers in level order; only the **first pending** approver can use Approve/Reject.
- To test as each role, call the login API with that role’s username, then (when the UI supports it) use the returned user as the current user for completing approvals.
- The backend enforces order: completing an approver slot is only allowed when all earlier levels have been completed.
