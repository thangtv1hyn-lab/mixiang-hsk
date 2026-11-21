/**
 * MiXiangg HSK — Firestore Security Spec & Dirty Dozen Invariant Tests
 *
 * Verifies:
 * 1. All 12 Dirty Dozen attack vectors are explicitly blocked by security invariants.
 * 2. All Firestore document IDs match ^[a-zA-Z0-9_\-]+$.
 * 3. Every entity field matches firebase-blueprint.json and firestore.rules whitelists.
 */

export interface DirtyDozenCase {
  id: number;
  name: string;
  actor: 'anonymous' | 'student_a' | 'student_b' | 'unverified_admin' | 'admin';
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  payload?: Record<string, unknown>;
  expected: 'DENY' | 'ALLOW';
  invariant: string;
}

export const DIRTY_DOZEN_CASES: DirtyDozenCase[] = [
  {
    id: 1,
    name: 'Unauthenticated Course Creation',
    actor: 'anonymous',
    operation: 'create',
    path: '/courses/c-hack',
    payload: { id: 'c-hack', level: 'HSK 1', title: 'Hack' },
    expected: 'DENY',
    invariant: 'Only verified admin may create courses',
  },
  {
    id: 2,
    name: 'Student Privilege Escalation on User Create',
    actor: 'student_a',
    operation: 'create',
    path: '/users/uid_student_a',
    payload: { id: 'uid_student_a', role: 'admin', status: 'active' },
    expected: 'DENY',
    invariant: 'Self-registered users must have role == student and status == active',
  },
  {
    id: 3,
    name: 'Student Role Escalation via Shadow Update',
    actor: 'student_a',
    operation: 'update',
    path: '/users/uid_student_a',
    payload: { role: 'admin' },
    expected: 'DENY',
    invariant: 'Owner update cannot modify role, status, email, provider, or id',
  },
  {
    id: 4,
    name: 'Cross-User PII List Enumeration',
    actor: 'student_a',
    operation: 'list',
    path: '/users',
    expected: 'DENY',
    invariant: 'Only bootstrapped admin may list /users (zero-lookup list rule)',
  },
  {
    id: 5,
    name: 'Cross-User PII Direct Read',
    actor: 'student_a',
    operation: 'get',
    path: '/users/uid_student_b',
    expected: 'DENY',
    invariant: 'Users may only read their own /users/{uid} document',
  },
  {
    id: 6,
    name: 'Password Field Injection into Firestore User Doc',
    actor: 'student_a',
    operation: 'update',
    path: '/users/uid_student_a',
    payload: { password: 'plaintext-secret' },
    expected: 'DENY',
    invariant: 'Strict hasOnly whitelist rejects password and undocumented keys',
  },
  {
    id: 7,
    name: 'Unverified Admin Email Spoofing',
    actor: 'unverified_admin',
    operation: 'create',
    path: '/courses/c-spoof',
    payload: { id: 'c-spoof', level: 'HSK 1', title: 'Spoof' },
    expected: 'DENY',
    invariant: 'isBootstrappedAdmin requires email_verified == true',
  },
  {
    id: 8,
    name: 'Unauthorized Admin Marker Creation',
    actor: 'student_a',
    operation: 'create',
    path: '/admins/uid_student_a',
    payload: { uid: 'uid_student_a', email: 'a@example.com' },
    expected: 'DENY',
    invariant: 'Only bootstrapped admin may write /admins/{uid}',
  },
  {
    id: 9,
    name: 'Forum Like Inflation (+500)',
    actor: 'student_b',
    operation: 'update',
    path: '/forumPosts/fp-1',
    payload: { likes: 501 },
    expected: 'DENY',
    invariant: 'Non-admin like update must increment likes by exactly +1',
  },
  {
    id: 10,
    name: 'Forum Post Hijack by Another Student',
    actor: 'student_b',
    operation: 'delete',
    path: '/forumPosts/fp-owned-by-a',
    expected: 'DENY',
    invariant: 'Only post author or admin may delete a forum post',
  },
  {
    id: 11,
    name: 'Oversized VocabCard Image Payload DoS',
    actor: 'admin',
    operation: 'create',
    path: '/vocabDecks/deck-1/cards/card-1',
    payload: { id: 'card-1', deckId: 'deck-1', imageUrl: 'x'.repeat(200000) },
    expected: 'DENY',
    invariant: 'VocabCard imageUrl is strictly bounded to <= 180000 chars',
  },
  {
    id: 12,
    name: 'Site Config Defacement by Student',
    actor: 'student_a',
    operation: 'update',
    path: '/siteConfig/main',
    payload: { brandName: 'Hacked' },
    expected: 'DENY',
    invariant: 'Only verified admin may modify /siteConfig/{configId}',
  },
];
