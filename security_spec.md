# Security Specification — GTA World Firestore Rules

## 1. Data Invariants
1. Every document in `/players/{userId}` belongs strictly to the authenticated user whose `request.auth.uid == userId` and whose email is verified (`request.auth.token.email_verified == true`).
2. Users cannot list `/players` to enumerate other players.
3. All `uid` and `createdAt` fields are immutable once created.
4. `createdAt` and `updatedAt` must equal `request.time` on creation, and `updatedAt` must equal `request.time` on update.
5. `money` is bounded (`0 <= money <= 100000000`), `ownedVehicles` is bounded (`1 <= size <= 20`) with a string first element, and string lengths are strictly capped.

## 2. Dirty Dozen Attack Vectors (Must Yield PERMISSION_DENIED)
1. Unauthenticated read on `/players/user1`
2. Unauthenticated write on `/players/user1`
3. Cross-user read (`/players/user2` as `user1`)
4. Cross-user write (`/players/user2` as `user1`)
5. Collection `list` scraping on `/players`
6. Unverified email account (`email_verified: false`) writing `/players/user1`
7. Identity spoofing (`uid: "other_user"` inside `/players/user1`)
8. Shadow field injection (`isAdmin: true` in payload)
9. Poisoned 1MB `characterName` string exceeding maxLength 40
10. Invalid `deviceMode` enum value (`"smartwatch"`)
11. Backdated `createdAt` or `updatedAt` timestamp not equal to `request.time`
12. Mutating immutable `uid` or `createdAt` during `update`
