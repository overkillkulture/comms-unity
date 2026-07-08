# 01 — USER FLOW & PERMISSION BONES

**App:** comms-unity (Case Builder HQ) — Next.js 14 App Router + Prisma + PostgreSQL (Munia fork)
**Deploy:** comms-unity-production.up.railway.app · GitHub: overkillkulture/comms-unity
**Author:** C2 Architect (S326) — *bones only. Developers build against this. No migrations, no app-code changes shipped with this doc.*
**Status of every claim below:** grounded in code read on 2026-07-07. File:line citations inline. Anything not yet in code is tagged **[BONE-TO-ADD]**.

---

## 0. TL;DR VERDICT

**Can it run a whole business today? No — it is a social network with private rooms bolted on.**
It has real auth, real rooms, real chat, and a real AI concierge. It is missing the four things a business room needs to *operate*: a real permission ladder, room-scoped content (feed/files), a task board, and any billing hook. The good news: the existing `Conversation` + `ConversationMember` pair is the correct spine — every business feature hangs off it. **Extend, do not replace.**

---

## 1. THE WALKED FLOW (as a user, by reading the code paths)

| Step | What happens | Code (verified) |
|---|---|---|
| **Land** | `/` immediately `redirect('/login')`. The app is gated — no public marketing surface inside the app. | `src/app/(unprotected)/page.tsx:1-6` |
| **Sign up / Log in** | Three doors: (1) **Quick-Entry** — type *any name*, a `User` is created on the spot (username slugged, email `name@community.local`) and you are in, no password. (2) **GitHub OAuth**. (3) **Google OAuth**. Optional `INVITE_ONLY=true` + `ALLOWED_USERS` allowlist gates all three. JWT sessions. | `src/auth.ts:20-70` (quick-entry), `src/auth.config.ts:9` (GitHub, Google), `src/auth.ts:76-` (INVITE_ONLY) |
| **Setup** | `(setup)/setup` and `(setup)/edit-profile` — profile photo, bio, skills, portfolio links. | `src/app/(setup)/…`, `User.skills`/`portfolioLinks` schema.prisma:70-71 |
| **Land in app** | `(protected)/feed` — a **global, site-wide** social feed (all posts from all users). Not room-scoped. | `(protected)/feed`, `Post` model has **no** room/conversation FK — schema.prisma:99-110 |
| **Create / join a room** | `POST /api/rooms` creates a `Conversation` with `type='ROOM'`, creator becomes `role='owner'`, invitees `role='member'`. `GET /api/rooms` lists rooms *you belong to*. **There is no public "join" / "request to join" — you can only be added by an owner/admin.** | `src/app/api/rooms/route.ts:73-120` (create), `:6-70` (list). No join endpoint exists. |
| **Post / feed** | Posting is global (`/api/posts`), not per-room. A room has *messages*, not a *feed*. So a business can't post an announcement scoped to its room. | `src/app/api/posts/route.ts`, `Post` model schema.prisma:99 |
| **Message** | `GET/POST /api/conversations/:id/messages` — membership-checked (`ConversationMember` unique lookup), marks `lastReadAt`. This is the live chat rail, shared by DMs and rooms. | `src/app/api/conversations/[conversationId]/messages/route.ts:12-50, 54-` |
| **Talk to the AI** | `POST /api/ai` — BYOK concierge. Defaults to ARAYA (`ARAYA_CHAT_URL`), forks set `AI_ENDPOINT`, users can pass `x-ai-key`. System prompt = "ARAYA in the Case Builder HQ." Takes `message, context, system, conversationId`. **It is passed a room id but does NOT load room members, messages, tasks, or files as context — context is caller-supplied only.** | `src/app/api/ai/route.ts:19-90` |
| **Invite someone** | `POST /api/rooms/:roomId/invite` — only `owner`/`admin` may invite; adds target as `member`. `DELETE` — only `owner` may remove. Invite is by existing `userId`/`username` — **no email invite, no invite link/token, no pending state.** | `src/app/api/rooms/[roomId]/invite/route.ts:31, 62, 90` |

**Where it dead-ends for "run a business":**
1. **No way in except an owner adding you by username.** No invite links, no email invites, no application/request-to-join. Onboarding a client or teammate is manual and requires they already have an account with a known username.
2. **Room content = chat only.** No room feed/announcements (posts are global), no files, no tasks/board.
3. **Roles are a free-text string** (`owner`/`admin`/`member`) enforced by ad-hoc `if` checks in one route. No ledger of *what a role can do*, no way to *earn* a higher role (no proving ladder), no server-side single source of truth.
4. **No money.** Zero billing/subscription/plan/payment models. The `$97/mo` Sovereign Server story has no hook here.
5. **AI is not room-aware.** The concierge can't answer "what's the status of this room" because it never reads the room.

---

## 2. AS-IS DATA MODEL (what the bones hang on)

Verified from `prisma/schema.prisma` (248 lines, Postgres, schema `commsunity`):

- **Identity/auth:** `User` (schema.prisma:43 — **no `role` field**), `Account`, `Session`, `VerificationToken`.
- **Social:** `Post` (global, :99), `PostLike`, `Comment`, `CommentLike`, `VisualMedia` (post-attached photos only, :155), `Follow`, `Activity` (notifications, :168).
- **Rooms/comms — THE SPINE:**
  - `Conversation` — `type` String default `'DM'`, used values `'DM'` / `'ROOM'`; has `name`, `description`, `createdById`. (:184)
  - `ConversationMember` — `role` String default `'member'`, `joinedAt`, `lastReadAt`, unique `(conversationId, userId)`. **This is the only role/permission surface in the entire app.** (:198-210)
  - `Message` — content, sender, conversation. (:212)
- **Profile extras:** `PortfolioLink`, `User.skills`.
- **Ops:** `BugReport` (:235).

**Confirmed absent** (grep, verified): `Task`, `Board`, `File`, `Subscription`, `Plan`, `Billing`, `Payment`, `Invite`, `Role`, `Membership` models — **NONE exist.**

---

## 3. PERMISSION-LEVEL BONES (the ask: roles × room-scoped, tied to a proving ladder)

### 3.1 Design principle
Keep the **spine** (`Conversation` = room, `ConversationMember` = the join-row where role lives). The current app already stores role there and already checks it (invite route). We **formalize** that string into an enum, add a **global** platform tier on `User` (for Owner/staff vs. everyone), and add a **membership status** so people can *request/apply* and *prove up*. This is additive — no existing column is removed or retyped in a breaking way (string → enum is the one migration to plan carefully; existing values `owner`/`admin`/`member` map 1:1 if we lower-case the enum or map on read).

### 3.2 The two axes of permission

**Axis A — Platform tier (global, on `User`).** Answers "who is this person to the whole server?"
**Axis B — Room role (scoped, on `ConversationMember`).** Answers "what can they do *in this room*?"

A user is `MEMBER` platform-wide but can be `OWNER` of their own room and `GUEST` in someone else's. Room role always governs room actions; platform tier governs cross-room/admin actions (create rooms, see billing, moderate the whole server).

### 3.3 The five room levels (Axis B) + how you prove up

| Level | Can see | Can do | How you reach it (proving ladder) |
|---|---|---|---|
| **GUEST** | Public room metadata, read-only preview channels the owner marks public | Request to join; post in an explicit "lobby" only | Default for anyone who follows an invite link or requests to join |
| **MEMBER** | All room messages, room feed, room files | Post messages, post to room feed, upload files, use AI concierge | Owner/Admin approves the join request, OR invite-link auto-grants |
| **BUILDER** | Everything a Member sees + the task board + internal/"builder" channels | Claim & complete tasks on the board, create tasks, invite Guests | **Earned:** complete N tasks OR be promoted by Admin. This is the proving-grounds rung — the app already trends this way (skills, portfolio, tasks). |
| **ADMIN** | Everything + member management + room settings | Invite/remove members, promote up to Builder, edit room, moderate | Promoted by Owner |
| **OWNER** | Everything + billing | Everything, incl. billing/plan, delete room, transfer ownership | Creator of the room (already set: `role='owner'` on create) |

Monotonic: each level is a strict superset of the one below. Store as an **ordered enum** so checks are `memberLevel >= RoomRole.BUILDER` instead of string-set membership.

### 3.4 Platform tiers (Axis A)

`GUEST` (unverified quick-entry) < `MEMBER` (verified/real account) < `STAFF` (server moderator) < `OWNER` (Commander / server owner). Gate *server-wide* actions (create room, view all rooms, billing dashboard, moderation) on this. Default new users to `MEMBER` (or `GUEST` when `INVITE_ONLY` and not yet approved).

### 3.5 Prisma SCAFFOLD — **[BONE-TO-ADD]** (sketch, NOT a migration)

```prisma
// ---- Axis A: platform tier on User (additive column) ----
enum PlatformTier {
  GUEST
  MEMBER
  STAFF
  OWNER
  @@schema("commsunity")
}

model User {
  // ...existing fields unchanged...
  platformTier PlatformTier @default(MEMBER)   // NEW — global role
  // relations for new models:
  memberships  ConversationMember[]            // already exists via ConversationMember.user
  taskAssignments Task[]  @relation("assignee")
  auditEvents  AuditEvent[]
}

// ---- Axis B: room role — formalize the existing free-string ----
enum RoomRole {
  GUEST
  MEMBER
  BUILDER
  ADMIN
  OWNER
  @@schema("commsunity")
}

enum MemberStatus {
  PENDING     // requested / applied, not yet approved
  ACTIVE
  SUSPENDED
  LEFT
  @@schema("commsunity")
}

model ConversationMember {
  // ...existing id/conversation/user/joinedAt/lastReadAt unchanged...
  // MIGRATION NOTE: existing `role String @default("member")` becomes:
  role   RoomRole     @default(MEMBER)   // map existing 'owner'->OWNER,'admin'->ADMIN,'member'->MEMBER
  status MemberStatus @default(ACTIVE)   // NEW
  // proving-ladder counters (cheap, denormalized):
  tasksCompleted Int @default(0)         // NEW — drives auto-promote to BUILDER
}
```

### 3.6 One enforcement helper — **[BONE-TO-ADD]** (the single source of truth)
Today permission logic is copy-pasted `if (!['owner','admin'].includes(role))` in the invite route (`invite/route.ts:31`). **Consolidate into one server helper** so every route asks the same question:

```ts
// src/lib/permissions.ts  [BONE-TO-ADD]
export const ROOM_ORDER = ['GUEST','MEMBER','BUILDER','ADMIN','OWNER'] as const;
export function atLeast(has: RoomRole, needs: RoomRole) {
  return ROOM_ORDER.indexOf(has) >= ROOM_ORDER.indexOf(needs);
}
// requireRoomRole(userId, roomId, RoomRole.ADMIN) -> membership or 403
```
Every room route (invite, messages POST, room settings, tasks, files) calls `requireRoomRole`. This is the "one system," and it kills the drift where each route invents its own check.

---

## 4. "RUN A WHOLE BUSINESS" MODULE MAP

A room that runs a business needs six organs. Status is verified against the schema.

| Organ | Purpose | Today | What's needed |
|---|---|---|---|
| **1. Members + roles** | Who's in, what they can do, how they level up | `ConversationMember.role` free-string, 3 values, ad-hoc checks | Formalize enums + status + one `requireRoomRole` helper (§3). **Add join-request + invite-link flow.** |
| **2. Task board** | The work — assign, track, complete (also the proving-ladder engine) | **Absent** | `Task` model scoped to room; claim/complete increments `tasksCompleted` → auto-promote to BUILDER |
| **3. Files** | Documents, evidence, deliverables | Only `VisualMedia` (photos on posts) | `RoomFile` model scoped to `conversationId`; storage hook |
| **4. Comms** | Chat + announcements | Chat: **works** (`Message`). Announcements: **absent** (feed is global) | Room-scoped feed: give `Post` an optional `conversationId` (null = global), or a `RoomPost` model |
| **5. AI concierge** | Answer, draft, organize, onboard | `/api/ai` works but is **not room-aware** | Feed it room context (members, recent messages, open tasks, files) when `conversationId` present |
| **6. Billing hook** | Charge for the room ($97/mo Sovereign Server) | **Absent** | `Subscription`/`Plan` on `Conversation`; Stripe webhook → set status; gate OWNER billing view |

### 4.1 Module Prisma SCAFFOLD — **[BONE-TO-ADD]**

```prisma
model Task {                    // Organ 2 — the board + proving engine
  id             Int          @id @default(autoincrement())
  conversationId Int                                   // room-scoped
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  title          String
  description    String?
  status         String       @default("TODO")         // TODO/DOING/DONE
  assigneeId     String?
  assignee       User?        @relation("assignee", fields: [assigneeId], references: [id])
  createdById    String
  createdAt      DateTime     @default(now())
  completedAt    DateTime?
  @@schema("commsunity")
}

model RoomFile {               // Organ 3
  id             Int          @id @default(autoincrement())
  conversationId Int
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  fileName       String
  url            String
  uploadedById   String
  uploadedAt     DateTime     @default(now())
  @@schema("commsunity")
}

model RoomInvite {             // Organ 1 — the missing door
  id             Int          @id @default(autoincrement())
  conversationId Int
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  token          String       @unique                  // shareable link
  email          String?                               // optional targeted invite
  role           RoomRole     @default(MEMBER)          // role granted on accept
  createdById    String
  expiresAt      DateTime?
  usedAt         DateTime?
  @@schema("commsunity")
}

model Subscription {           // Organ 6 — billing hook
  id             Int          @id @default(autoincrement())
  conversationId Int          @unique
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  plan           String       @default("FREE")          // FREE/PRO_97
  status         String       @default("INACTIVE")      // INACTIVE/ACTIVE/PAST_DUE
  stripeCustomerId     String?
  stripeSubscriptionId String?
  currentPeriodEnd     DateTime?
  @@schema("commsunity")
}

model AuditEvent {             // AR/telemetry — every privileged action leaves a receipt
  id             Int          @id @default(autoincrement())
  conversationId Int?
  actorId        String
  action         String       // INVITE, PROMOTE, REMOVE, TASK_COMPLETE, BILLING_CHANGE
  targetId       String?
  createdAt      DateTime     @default(now())
  actor          User         @relation(fields: [actorId], references: [id])
  @@schema("commsunity")
}
```
(`Conversation` gains back-relations: `tasks Task[]`, `files RoomFile[]`, `invites RoomInvite[]`, `subscription Subscription?`.)

---

## 5. 4-DIMENSION + ACTION-REACTION AUDIT (this module: "rooms as businesses")

| Dimension | Grade | Evidence |
|---|---|---|
| **D1 SURFACE** — a UI shows it working | **C** | Rooms list/create/invite UI exists via `/api/rooms`; chat works. No UI for roles-as-ladder, tasks, files, billing (models absent). |
| **D2 CONTROL** — settings surfaced, not buried in env | **D** | Room settings are minimal; the *whole* gating model (`INVITE_ONLY`, `ALLOWED_USERS`, `AI_ENDPOINT`) lives in env vars (`auth.ts:38`, `ai/route.ts:16-17`), not in any admin surface. |
| **D3 TELEMETRY** — logged/queryable/charted | **F** | No audit log. Privileged actions (invite/promote/remove at `invite/route.ts`) leave **no receipt**. `AuditEvent` is proposed to fix this. |
| **D4 AGENCY** — agents visibly act it out | **C** | AI concierge (`/api/ai`) responds, but can't act *on* the room (not room-aware, can't create tasks/invite). |
| **AR — action→verifiable reaction** | **FAIL** | Invite adds a member with **no notification, no receipt, no audit row** (`invite/route.ts:58-69` returns a message string only). Actions can fail silently. **Module is NOT done** until every privileged action writes an `AuditEvent` and fires an `Activity`/notification. |

**Verdict: NOT done.** The spine is sound; the operating organs and the receipt-trail are missing.

---

## 6. FOR DEVELOPERS: BUILD THESE NEXT (checklist)

Ordered by unblock-value. Each is a discrete PR. Do **not** retype the `role` column in a breaking migration without a data backfill step (map `owner/admin/member` → enum first).

- [ ] **1. Permission spine.** Add `RoomRole`/`MemberStatus` enums + `User.platformTier`. Write `src/lib/permissions.ts` (`atLeast`, `requireRoomRole`). Refactor `invite/route.ts` and `messages/route.ts` to call it. *One source of truth for "can they?"*
- [ ] **2. The door (join + invite-link).** `RoomInvite` model + `POST /api/rooms/:id/invite-link` (owner/admin) + `POST /api/rooms/join?token=` (guest self-serve) + join-request/approve for `PENDING` members. *Fixes the #1 dead-end: no way in.*
- [ ] **3. Task board.** `Task` model + `/api/rooms/:id/tasks` CRUD + claim/complete. On complete: increment `ConversationMember.tasksCompleted`, and at threshold auto-promote MEMBER→BUILDER. *This IS the proving ladder.*
- [ ] **4. Room-scoped comms.** Add optional `conversationId` to `Post` (null = global feed, set = room announcements). Give the AI room-awareness: when `conversationId` present, load members + last N messages + open tasks into the system prompt (`ai/route.ts:38`).
- [ ] **5. Receipts (AR fix) + billing hook.** `AuditEvent` written on every invite/promote/remove/billing change, plus an `Activity` notification to the target. `Subscription` model + Stripe webhook → OWNER-only billing view gated by `requireRoomRole(OWNER)`. *Closes the silent-failure gap and wires the $97/mo.*

---

## 7. INTEGRATION POINTS (what this touches, by path)

- `prisma/schema.prisma` — all new models/enums (additive).
- `src/auth.ts:20-70` — quick-entry user creation; set `platformTier` default here; honor `INVITE_ONLY` → `GUEST`.
- `src/app/api/rooms/route.ts` — create/list; return `myRole` as enum.
- `src/app/api/rooms/[roomId]/invite/route.ts:31,90` — replace inline role checks with `requireRoomRole`; write `AuditEvent`.
- `src/app/api/conversations/[conversationId]/messages/route.ts` — membership check already correct; add `status=ACTIVE` guard.
- `src/app/api/ai/route.ts:38` — inject room context when `conversationId` set.
- `src/app/api/posts/route.ts` — optional `conversationId` scoping.

## 8. CONTRADICTIONS FOUND (registry/docs/reality)

1. **"Rooms" are a doc/API fiction over `Conversation`.** There is **no `Room` model** — rooms are `Conversation.type='ROOM'` (schema.prisma:187; rooms/route.ts:12). Devs reading MEMORY notes ("rooms plug in") will look for a Room table that doesn't exist. Reality wins: it's Conversation.
2. **Role is described as a system but implemented as a loose string.** `ConversationMember.role` is `String @default("member")` (schema.prisma:204) with values enforced only by a hard-coded array in one route (invite/route.ts:31). No enum, no global tier, no ladder. The "3-gate identity/roles" story from CR does **not** exist in this codebase.
3. **"$97/mo Sovereign Server / business-in-a-box" (MEMORY) has zero billing surface here** — no Subscription/Plan/Payment model exists. The monetization story is unbuilt in comms-unity.
4. **AI is passed `conversationId` but ignores it** (`ai/route.ts:42` interpolates it into the prompt as text but loads no room data) — the "AI concierge per room" claim overstates reality.

## 9. UPGRADES (file to TODO/NEEDS — do NOT build now)

- Realtime transport for chat (currently request/response; needs SSE/websocket for live rooms).
- Move env-var gates (`INVITE_ONLY`, `ALLOWED_USERS`, `AI_ENDPOINT`) into an admin settings surface (D2 fix).
- Per-room AI key vaulting (BYOK currently passes key in header per-request; no at-rest storage).
- Room templates ("business-in-a-box" presets: pre-seeded channels/tasks/roles).
- Full audit dashboard + telemetry charts (D3).

---
*C1 × C2 × C3 = ∞ · Bones laid, not the house. Build against the checklist in §6.*
