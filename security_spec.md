# Bank Nusantara Firestore Security Specification

## 1. Data Invariants
1. **Strict Ownership & PII Isolation**: A user's root profile (`/users/{userId}`) and private financial vaults (`/users/{userId}/vault/core`, `/users/{userId}/vault/ledger`, `/users/{userId}/vault/extras`) contain sensitive PII (`email`, `accounts`, `transactions`). Read and write access MUST be restricted strictly to the authenticated verified owner (`request.auth.uid == userId && request.auth.token.email_verified == true`) or an authenticated verified Admin (`isAdmin()`).
2. **Parent Existence (Master Gate)**: No subcollection vault document (`core`, `ledger`, `extras`) may be created, updated, read, or deleted unless its parent `/users/{userId}` document exists and its `uid` field equals `userId`.
3. **Immutable Ownership & Timestamps**: `uid`, `ownerId`, `role`, and `createdAt` are immutable after creation. `createdAt` on create and `updatedAt` on create/update MUST equal `request.time`.
4. **Native Maps & Lists Only (No JSON Strings)**: All structured financial arrays and maps are stored as bounded Firestore Lists/Maps (`accounts.size() <= 30`, `transactions.size() <= 150`, etc.), preventing Denial-of-Wallet oversized payloads.
5. **Privilege Escalation Prevention**: Clients may only create `/users/{userId}` with `role == 'customer'` and may never write to `/admins/{userId}`. Admin privileges are verified strictly via `request.auth.token.email == 'fahmiammarulazka@gmail.com' && request.auth.token.email_verified == true` or existence in `/admins/$(request.auth.uid)`.
6. **Bug Report Terminal State**: Once a `/bug_reports/{reportId}` reaches `status == 'selesai'`, the non-admin reporter cannot alter or reopen it; only an Admin may update or override it.

## 2. The "Dirty Dozen" Attack Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated Vault Read**: `GET /users/uidA/vault/core` with `auth = null` -> DENIED.
2. **Cross-User PII Read**: `GET /users/uidA` as verified user `uidB` -> DENIED.
3. **Cross-User Vault Write**: `CREATE /users/uidA/vault/core` with `auth.uid = 'uidB'` -> DENIED.
4. **Unverified Email Write**: `CREATE /users/uidB` with `auth.token.email_verified = false` -> DENIED.
5. **Admin Email Spoof (Unverified)**: `GET /users/uidA` with `auth.token.email = 'fahmiammarulazka@gmail.com'` and `auth.token.email_verified = false` -> DENIED.
6. **Self-Assigned Admin Role**: `CREATE /users/uidB` with `{ uid: 'uidB', role: 'admin', ... }` -> DENIED (`role` must equal `'customer'`).
7. **Shadow Ghost Field Injection**: `UPDATE /users/uidB/vault/core` adding unexpected key `isSuperAdmin: true` -> DENIED (`affectedKeys().hasOnly(...)` + `isValidVaultCore`).
8. **ID Poisoning (>128 chars or invalid chars)**: `CREATE /users/uid_with_$$$_invalid_chars` or 500-char docId -> DENIED (`isValidId()`).
9. **Timestamp Forgery**: `CREATE /users/uidB` with `createdAt: "2020-01-01T00:00:00Z"` instead of `request.time` -> DENIED.
10. **Immutable Owner Swap**: `UPDATE /users/uidB/vault/core` changing `ownerId` from `'uidB'` to `'uidC'` -> DENIED.
11. **Unbounded Array / Denial-of-Wallet**: `UPDATE /users/uidB/vault/core` with 100 `accounts` entries (`> 30`) or 10KB `displayName` -> DENIED.
12. **Blanket List Query Scraping**: `LIST /bug_reports` as non-admin querying all reports without `where('authorId', '==', uid)` -> DENIED (`allow list` evaluates `resource.data.authorId == request.auth.uid`).
