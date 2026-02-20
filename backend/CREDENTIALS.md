# Database credentials (login)

Passwords are stored hashed in the database. These are the **known test credentials** you can use to sign in.

---

## Test approver accounts (password: `Test123!`)

| Username                     | Role                | Password  |
|-----------------------------|---------------------|-----------|
| `approver_supervisor`       | Supervisor          | `Test123!` |
| `approver_departmentmanager` | Department Manager | `Test123!` |
| `approver_divisionmanager`  | Division Manager    | `Test123!` |
| `approver_avp`              | AVP                 | `Test123!` |
| `approver_superuser`        | Super User          | `Test123!` |

**Shared password for all of the above:** `Test123!`

---

## Other users in the database

- **Demo seed users** (e.g. `originator`, `supervisor`, `departmentmanager` …) are created by `SeedDemoDataAsync` when the app runs in Development and the MOC table is empty. They are created **without a password**, so they cannot be used to log in unless a password was set later (e.g. via Admin or SQL).
- **Users created via Signup or Admin** use whatever password was set at creation time; there is no central list of those in code.

To see all usernames (and roles) in the database, use the **Admin → Users** tab in the app or call `GET /api/users`.
