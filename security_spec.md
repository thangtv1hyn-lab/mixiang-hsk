# MiXiangg HSK — Cloud Firestore Security Specification

## 1. Domain Architecture & Data Ownership

- **Owner / Bootstrapped Admin**: `thangtv1.hyn@gmail.com` (verified Firebase Auth token email).
- **Additional Trusted Admins / Teachers**: Stored in `/admins/{uid}` (writable only by bootstrapped admin).
- **Normalized Collections**:
  1. `/courses/{courseId}` — Public course metadata (no PII). Public read, admin write.
  2. `/courses/{courseId}/lessons/{lessonId}` — Normalized lesson documents (prevents 1MB limit on courses with many lessons). Public read, admin write.
  3. `/vocabDecks/{deckId}` — Public flashcard deck metadata. Public read, admin write.
  4. `/vocabDecks/{deckId}/cards/{cardId}` — Individual vocabulary cards with optional compressed WebP `imageUrl` (supports 3,000+ cards cleanly without hitting the 1MB Firestore document limit). Public read, admin write.
  5. `/exams/{examId}` — HSK 1–5 mock exams. Public read, admin write.
  6. `/forumPosts/{postId}` — Community Q&A posts (no PII). Public read; authenticated create/like/reply; author or admin edit/delete.
  7. `/users/{userId}` — Private user account, email (PII), role, status, and HSK learning progress (`masteredVocabIds`, `learningVocabIds`, `completedLessonIds`, `examHistory`, `studyLog`, reminders, XP, streak). Strictly isolated to owner (`request.auth.uid == userId`) or admin. Never stores plaintext passwords.
  8. `/admins/{uid}` — Trusted admin markers. Owner/bootstrapped admin read, bootstrapped admin write.
  9. `/siteConfig/{configId}` — Branding, homepage banners, posters, classroom moments, and footer settings. Public read, admin write.
  10. `/test/connection` — Health probe document (`allow get` only for `docId == 'connection'`).

## 2. Core Data Invariants

- **Strict Whitelist (`hasOnly`)**: Every collection rejects undocumented/injected fields (including `password`, `isAdmin`, `__proto__`, etc.).
- **Type & Enum Enforcement**: Every string, number, boolean, list, and map field is strictly type-checked with explicit `min`/`max` length and range bounds.
- **ID Integrity**: Document `id` field must match the path wildcard (`{courseId}`, `{lessonId}`, `{deckId}`, `{cardId}`, `{examId}`, `{postId}`, `{userId}`) and match `^[a-zA-Z0-9_\-]+$`.
- **Anti-Escalation**: Non-admin users can only create `/users/{uid}` with `role == 'student'` and `status == 'active'`, and can never alter `role`, `status`, `email`, `provider`, or `id` on update.
- **Zero-Lookup `allow list`**: No `allow list` rule calls `get()` or `exists()`.
- **Scale Bounds**: `masteredVocabIds` & `learningVocabIds` support up to `5000` entries (built for 3,000+ vocabulary words). Compressed WebP image data URLs are bounded to `180000` chars.

## 3. The "Dirty Dozen" Attack Payloads (Must All Be Denied)

1. **Unauthenticated Course Creation**: Anonymous client attempts `create` on `/courses/c-hack` -> **DENIED**.
2. **Student Escalation on User Create**: Student creates `/users/{uid}` with `role: 'admin'` -> **DENIED**.
3. **Student Role Escalation via Shadow Update**: Student updates `/users/{uid}` with `{ role: 'admin', status: 'active' }` -> **DENIED**.
4. **Cross-User PII Enumeration (`list`)**: Regular student calls `list` on `/users` -> **DENIED**.
5. **Cross-User PII Read (`get`)**: Student A calls `get` on `/users/{studentB_uid}` -> **DENIED**.
6. **Password Injection into Firestore**: Any write to `/users/{uid}` containing extra field `password` -> **DENIED** (`hasOnly` rejects it).
7. **Unverified Admin Email Spoofing**: Token with `email == 'thangtv1.hyn@gmail.com'` and `email_verified == false` tries to write `/courses/c-1` -> **DENIED**.
8. **Admin Marker Tampering**: Regular student attempts `create` on `/admins/{uid}` -> **DENIED**.
9. **Forum Like Inflation**: User updates `/forumPosts/{postId}` with `likes: existing.likes + 500` -> **DENIED** (must increment by exactly `+1`).
10. **Forum Author Hijacking**: User B tries to edit `title` or `content` or `delete` a post owned by User A -> **DENIED**.
11. **Oversized Image / Payload DoS**: Admin or user attempts to write a `VocabCard` with `imageUrl.size() > 180000` or invalid `level: 'HSK 99'` -> **DENIED**.
12. **Site Config Defacement by Student**: Non-admin student attempts to update `/siteConfig/main` -> **DENIED**.
