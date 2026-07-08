# 04 — ADVERSARIAL WALK (C9 Adversary, S326)

**Target:** Case Builder (Munia fork, Next.js 14 + Prisma + Postgres)
**Live:** https://casebuilderhq-production.up.railway.app
**Code:** `C:\Users\dwrek\comms-unity` · GitHub `overkillkulture/comms-unity`
**Method:** Walked the app as an adversarial user — real HTTP against the live deploy + read the code paths. Nothing theorized that could be executed; unexecutable attacks flagged THEORETICAL with the test that settles them.
**Date:** 2026-07-07

---

## 1. LIVE STATUS CODES (observed, casebuilderhq-production)

| Route | Code | Note |
|-------|------|------|
| `GET /` | 307 → `/login` | Gated (INVITE_ONLY on) |
| `GET /login` | 200 | Shell renders |
| `GET /register` | 200 | Shell renders |
| `GET /feed` | 307 → `/login` | Gated |
| `GET /discover` | 307 → `/login` | Gated |
| `GET /meet` | 200 | **PUBLIC — no auth** (public Jitsi) |
| `GET /api/rooms` | 401 | Auth-gated (no session cookie) — never touches DB |
| `GET /api/ai` | 200 | Config only, no secrets |
| `POST /api/ai` (no auth) | 401 | Gated — good |
| `GET /api/posts` | **500** | Prisma read — **crashes** |
| `POST /api/bugs` (anon) | **500** | Prisma write — **crashes** |
| `GET /api/users-basic` | **500** | Prisma read — **crashes** |
| `GET /api/health` | 404 | No health endpoint exists |
| `GET /api/auth/providers` | 200 | Lists `github`, `google`, **`quick-entry`** |
| `GET /api/auth/csrf` | 200 | — |

**The tell:** every route that only checks the session cookie returns a clean `401`; every route that actually issues a Prisma query returns `500`. next-auth here uses JWT sessions, so the `401` paths never hit the database. **Conclusion: the production database/Prisma layer is dead. No application data can be read or written on the live deploy right now.**

---

## 2. RANKED DEAD-ENDS / BREAKS / LEAKS (most severe first)

### #1 — FATAL: Production data layer is completely dead
- **What:** Every Prisma-backed route 500s: `/api/posts`, `/api/users-basic`, `POST /api/bugs`, and by extension registration and login (both write to the DB). Auth-only routes 401 cleanly, proving the crash is at the DB/query layer, not auth.
- **Repro:** `curl -s -o /dev/null -w "%{http_code}" https://casebuilderhq-production.up.railway.app/api/posts` → `500`. `curl -X POST .../api/bugs -d '{"title":"x","description":"x"}'` → `500`.
- **Files:** `src/lib/prisma/prisma.ts` (client), `prisma/schema.prisma`, build step `prisma db push --accept-data-loss` in `package.json`.
- **Impact:** The app is non-functional end to end. A logged-in builder sees a broken/empty feed; nobody can post, message, register, or file a bug. Most likely cause: `DATABASE_URL` misconfigured on Railway, or `prisma db push` did not apply the schema (missing `Post`/`BugReport`/`ConversationMember` tables). Because OAuth uses the Prisma adapter (writes on sign-in) and quick-entry does `prisma.user.findFirst`, **login itself is currently impossible.**
- **This is the single worst thing blocking "run a business" today.**

### #2 — FATAL: Passwordless "Quick Entry" login = impersonation / account takeover
- **What:** `auth.ts` registers a `Credentials` provider `id: 'quick-entry'` — "just type a name and you're in." `authorize()` slugs the name to a username and does `prisma.user.findFirst({ where: { username } })`. **If a user with that username exists, you are logged in as them with no password.** Type "Darrick Preble" → username `darrick-preble` → you become that account.
- **Live confirmation:** `GET /api/auth/providers` lists `quick-entry` with a live `signinUrl` — it is exposed in production, not dev-only.
- **File:** `src/auth.ts` (Credentials `quick-entry`, `authorize`).
- **Impact:** For a tool holding sensitive legal case data, any visitor can assume any existing member's identity by knowing their display name. The `INVITE_ONLY` + `ALLOWED_USERS` allowlist does NOT close this — it only gates *which* names are accepted; an allowed name is still assumable by anyone with no secret. If `ALLOWED_USERS` is empty, `allowList.length === 0` skips the check entirely and it is fully open.
- **Status:** Design-confirmed via code + live provider list. The end-to-end session grab is currently **masked by the dead DB (#1)** — `findFirst` 500s — so I could not complete an actual takeover session. **THEORETICAL on execution only:** once the DB is restored, `POST /api/auth/callback/quick-entry` with a CSRF token and `name=<existing display name>` yields that user's session. That is the test that settles it.

### #3 — SERIOUS: Live GitHub PAT embedded in the repo's git remote
- **What:** `git config remote.origin.url` = `https://x-access-token:<REDACTED_PAT>@github.com/overkillkulture/comms-unity.git`. A working GitHub Personal Access Token with push rights sits in `.git/config`.
- **Repro:** `git -C C:\Users\dwrek\comms-unity remote get-url origin` prints the token.
- **Scope:** NOT in tracked/committed files — `git grep` for `ghp_|github_pat_|sk-|AKIA|xoxb-` across `HEAD` found nothing but `.env.example` placeholders, and only `.env.example` / `.env.local.example` are tracked (real `.env` is gitignored). The leak is in the **working tree's `.git/config`** — anyone with filesystem, backup, or clone-of-this-folder access gets push access to the repo.
- **Fix:** Rotate that PAT now (assume burned), and switch the remote to SSH or a credential helper so the token is never written into `.git/config`.

### #4 — SERIOUS: AI route is an SSRF / outbound-request primitive
- **What:** `POST /api/ai` chooses its upstream as `byokEndpoint || CUSTOM_ENDPOINT || DEFAULT_ENDPOINT`, where `byokEndpoint = request.headers.get('x-ai-endpoint')`. An authenticated user can set `x-ai-endpoint` to **any URL** and the server will `fetch()` it server-side (POST, with any `x-ai-key` the user supplies attached as `Authorization`/`x-api-key`).
- **File:** `src/app/api/ai/route.ts`.
- **Impact:** Server-Side Request Forgery — a logged-in user can make the Railway server hit internal-only addresses (metadata endpoints, internal services, `localhost`), or use the server as a request relay. No allowlist on the endpoint, no scheme/host validation.
- **Status:** **THEORETICAL** — requires a valid session, which the dead DB (#1) currently blocks. Test once DB is up: authenticated `POST /api/ai` with `x-ai-endpoint: http://169.254.169.254/...` and observe the server-side fetch. Fix: allowlist endpoints; reject non-https / private IP ranges.

### #5 — SERIOUS: Sensitive data is world-readable by design
- **Public posts feed:** `src/app/api/posts/GET.ts` header literally says *"No authentication required — open community."* `GET /api/posts` returns every user's posts to anyone. For a legal Case Builder, all shared case content is public (it only 500s today because of #1 — the design intent is fully open).
- **Public video rooms:** `/meet` (`src/app/meet/page.tsx`) uses public Jitsi (`jitsi.riot.im`) with room name `CaseBuilderHQ_<roomParam>`, default `lobby`. No auth, no waiting room, guessable/enumerable room names — anyone who guesses or is handed a room name joins the call. Confirmed live: `GET /meet` → 200 with no session.
- **Fix:** Gate `/api/posts` behind auth (or scope to a tenant/room); move video to authenticated, tokenized rooms with a lobby.

---

## 3. LOWER-SEVERITY / UX DEAD-ENDS

- **MINOR — Invites go nowhere.** `POST /api/rooms/[roomId]/invite` silently `prisma.conversationMember.create` — no notification, no email, no invite link. The invited user has no signal they were added; they'd only find the room by polling `/api/rooms`. (Guards themselves are correct: owner/admin-only, 403 otherwise.)
- **MINOR — No health endpoint.** `/api/health` → 404. A dead DB (#1) surfaces no monitoring signal; the whole outage is silent to any uptime check. This is itself an action→no-reaction (silent failure) violation of the Doctrine.
- **NOTE — Data-access guards that DID survive:** `GET/POST /api/conversations/[id]/messages` correctly 403s non-members (`conversationMember.findUnique` check before read AND write). `GET /api/rooms` filters by membership. Invite/remove enforce owner/admin roles. Room content is NOT leakable to non-members. Middleware matcher excludes `/api`, so API auth is per-route — and the money/data routes I checked do guard. This part is solid.

---

## 4. THE "RUN A BUSINESS" GAP

Even with the DB fixed, this is **Munia — a personal social network** with rooms bolted on, not a business platform. A builder trying to *run something* hits a wall:
- No organization/tenant concept — no data isolation between "businesses"; the feed is one global pool.
- No billing / subscriptions / plans — nothing to charge with.
- No admin panel or member management beyond invite-by-username (and invites are silent, #3.1).
- No document/case/file management surface for the "Case Builder" promise (S3 is wired for post media only, via `toGetPost` → `fileNameToUrl`).
- No roles beyond room owner/admin/member; no per-room permissions, no audit trail.
- Auth is impersonatable (#2) — you cannot trust who anyone is.

**Single worst blocker, today:** #1 — the dead production database. Until `DATABASE_URL`/`prisma db push` is fixed, nobody can even log in, so every other feature is unreachable.

---

## 5. FIX THESE FIRST (ordered)

1. **Restore the DB.** Verify Railway `DATABASE_URL` and that `prisma db push`/migrations actually applied every table. Add `/api/health` that pings the DB so this never fails silently again. *(unblocks everything)*
2. **Remove or lock down `quick-entry`.** Delete the passwordless Credentials provider, or require a real per-user secret. Until then, assume every account is impersonatable.
3. **Rotate the leaked GitHub PAT** and move the remote to SSH / credential helper so no token lives in `.git/config`.
4. **Gate `/api/posts` behind auth** (and scope it) — it is currently designed to serve all content to the public.
5. **Allowlist the AI endpoint** in `/api/ai` — reject arbitrary `x-ai-endpoint` / private-IP targets (SSRF).
6. **Make invites do something** — notification + email/invite link so an invited user knows and can land in the room.

---

## ATTACKS EXECUTED (closed loop)
- `curl` sweep of 14 live routes → status table in §1 (real codes).
- `POST /api/ai` unauth → `{"error":"Not authenticated"}` `[401]` — auth gate confirmed.
- `POST /api/bugs` anon write → `[500]` — DB write confirmed dead.
- `GET /api/posts?limit=5|?sort-direction=desc|(none)` → all `500` — not a param bug, layer is down.
- `GET /api/auth/providers` → `quick-entry` present with live signinUrl — impersonation provider confirmed exposed.
- `GET /meet` no session → `200` — public video confirmed.
- `git remote get-url origin` → PAT present in `.git/config` — leak confirmed (redacted here).
- Code read: membership guards on `conversations/[id]/messages` and `rooms/[id]/invite` → confirmed correct (403/role checks) — these survived.

## THEORETICAL (could not execute — reason + settling test)
- **#2 full session takeover** — blocked by dead DB (#1). Test after restore: CSRF + `POST /api/auth/callback/quick-entry` with `name=<existing display name>`, expect that user's session cookie.
- **#4 AI SSRF** — needs a valid session (DB down). Test after restore: authenticated `POST /api/ai` with `x-ai-endpoint` pointed at an internal/canary URL, observe server-side fetch.

## SURVIVAL RATING: 2/10 (as a live product today)
Data layer down + passwordless impersonation + public content + leaked push token. What survived: room/message membership guards and role checks — genuinely solid. But the front door is off its hinges.

## VERDICT: REVISE — fix #1–#3 before ANY new feature work. Do not onboard builders onto a deploy where login is impossible and identities are forgeable.

## UPGRADES FILED (not built — C9 builds nothing)
- Add DB-pinging `/api/health` + Railway healthcheck so DB death is never silent.
- Replace `quick-entry` with magic-link or keep OAuth-only.
- Endpoint allowlist + SSRF guard helper for `/api/ai`.
- Invite → notification/email/invite-link pipeline.
- Tenant/org model + billing before "run a business" is a real claim.
