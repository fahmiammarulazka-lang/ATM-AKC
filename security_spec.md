# Bank Nusantara Firestore Security Specification

## 1. Data Invariants
1. **Strict Ownership & PII Isolation**: A user's root profile (`/users/{userId}`) and private financial vaults (`/users/{userId}/vault/core`, `/users/{userId}/vault/ledger`, `/users/{userId}/vault/extras`) contain sensitive PII (`email`, `accounts`, `transactions`). Read and write access MUST be restricted strictly to the authenticated verified owner (`request.auth.uid == userId && request.auth.token.email_verified == true`) or an authenticated verified Admin (`isAdmin()`).
2. **Parent Existence (Master Gate)**: No subcollection vault document (`core`, `ledger`, `extras`) may be created, updated, read, or deleted unless its parent `/users/{userId}` document exists and its `uid` field equals `userId`.
3. **Immutable Ownership & Timestamps**: `uid`, `ownerId`, `role`, and `createdAt` are immutable after creation. `createdAt` on create and `updatedAt` on create/update MUST equal `request.time`.
4. **Native Maps & Lists Only (No JSON Strings)**: All structured financial arrays and maps are stored as bounded Firestore Lists/Maps (`accounts.size() <= 30`, `transactions.size() <= 150`, etc.), preventing Denial-of-Wallet oversized payloads.
5. **Privilege Escalation Prevention**: Clients may only create `/users/{userId}` with `role == 'customer'` and may never write to `/admins/{userId}`. Admin privileges are verified strictly via `request.auth.token.email == 'fahmiammarulazka@gmail.com' && request.auth.token.email_verified == true` or existence in `/admins/$(request.auth.uid)`.
6. **Bug Report Terminal State**: Once a `/bug_reports/{reportId}` reaches `status == 'selesai'`, the non-admin reporter cannot alter or reopen it; only an Admin may update or override it.
7. **Admin Seal & Signature Registry Protection**: `/bank_state_v1/letter_seal_config` may only be created, updated, or deleted by an authenticated, email-verified Admin (`fahmiammarulazka@gmail.com` or `/admins/{uid}`), with compressed signature data URLs bounded to `<= 66,000` chars.
8. **Gift & Letter Registry Integrity**: Creating, deleting, or altering `deletedGiftEventIds` / `giftEventsInitialized` / `giftEventsUpdatedAtMs` in `/bank_state_v1/gift_events_registry` is strictly restricted to verified Admins; non-admin signed-in users may only update `giftEvents` interaction states (`updatedAtMs`, `updatedAt`, `writerSessionId`).

## 2. The "Dirty Dozen" Attack Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated Vault Read**: `GET /users/uidA/vault/core` with `auth = null` -> DENIED.
2. **Cross-User PII Read**: `GET /users/uidA` as verified user `uidB` -> DENIED.
3. **Cross-User Vault Write**: `CREATE /users/uidA/vault/core` with `auth.uid = 'uidB'` -> DENIED.
4. **Unverified Email Write**: `CREATE /users/uidB` with `auth.token.email_verified = false` -> DENIED.
5. **Admin Email Spoof (Unverified)**: `WRITE /bank_state_v1/letter_seal_config` with `auth.token.email = 'fahmiammarulazka@gmail.com'` and `auth.token.email_verified = false` -> DENIED.
6. **Non-Admin Signature Hijack**: `UPDATE /bank_state_v1/letter_seal_config` by verified customer `uidB` -> DENIED (`isVerifiedAdmin()` required).
7. **Shadow Ghost Field Injection**: `UPDATE /bank_state_v1/gift_events_registry` adding unexpected key `isSuperAdmin: true` -> DENIED (`affectedKeys().hasOnly(...)` + `isValidGiftEventsRegistry`).
8. **ID Poisoning (>128 chars or invalid chars)**: `CREATE /users/uid_with_$$$_invalid_chars` or 500-char docId -> DENIED (`isValidId()`).
9. **Oversized Raw Signature Bomb (> 66KB)**: `WRITE /bank_state_v1/letter_seal_config` with a 500KB uncompressed `signatureDrawingDataUrl` -> DENIED (`size() <= 66000`).
10. **Non-Admin Gift Registry Wipe**: `DELETE /bank_state_v1/gift_events_registry` or updating `deletedGiftEventIds` by non-admin `uidB` -> DENIED.
11. **Unbounded Array / Denial-of-Wallet**: `WRITE /bank_state_v1/gift_events_registry` with `giftEvents.size() > 150` -> DENIED.
12. **Blanket List Query Scraping**: `LIST /bug_reports` as non-admin querying all reports without `where('authorId', '==', uid)` -> DENIED (`allow list` evaluates `resource.data.authorId == request.auth.uid`).

