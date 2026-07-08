# 🔥 FIRE FIXES — clear these BEFORE inviting anyone (S326)

Case Builder is 2/10 live today. Three fires block onboarding. Owner = who does it.

## FIRE 1 — Production database is DEAD  [OWNER: Commander/ops · ~15 min]
Every Prisma query 500s → login/register write to the DB → **nobody can log in.**
Fix on Railway:
1. Railway → casebuilderhq service → Variables → confirm `DATABASE_URL` points at a live Postgres (the Railway Postgres plugin, not a stale/deleted one).
2. In the service shell (or a redeploy): `npx prisma db push` (schema uses `@@schema("commsunity")` — confirm the schema exists).
3. Verify: `GET /api/users-basic` returns 200 (not 500), and a fresh register→login round-trips.

## FIRE 2 — Passwordless "Quick Entry" = account takeover  [OWNER: dev · NOT a 5-min delete]
`src/auth.ts:22` — the `quick-entry` Credentials provider logs you in as ANY user by typing their display name/email/username. On a legal-case app = impersonation of case accounts.
**BUT it is the ONLY configured login** (no GitHub/Google OAuth env wired). So do NOT just delete it — that locks everyone out. Correct sequence:
1. **Add a real credential:** either wire GitHub/Google OAuth (add `AUTH_GITHUB_ID/SECRET` etc. + providers), OR require an **invite code + password** on quick-entry (hash-checked against the `RoomInvite`/user record).
2. **Then restrict quick-entry:** env-gate it to dev only (`if (process.env.NODE_ENV !== 'production')`) or remove it once the real door works.
3. This fix IS the front half of build-item #2 ("the door") — see 01_USER_FLOW_AND_PERMISSIONS.md. Do them together.

## FIRE 3 — Live GitHub PAT exposed  [OWNER: Commander · ~10 min]
A GitHub personal access token with push scope is in `.git/config` (working-tree remote URL — not in committed files, but live on this machine).
1. GitHub → Settings → Developer settings → revoke that PAT.
2. Re-point the remote to SSH: `git remote set-url origin git@github.com:overkillkulture/comms-unity.git` (add an SSH deploy key), or use a fresh fine-scoped PAT stored outside the URL.

---
**Gate:** none of the crew's build passes (permission spine → door → tasks → files → cockpits → billing) matter until Fires 1 & 2 clear — a builder can't even log in, and the login they'd use is forgeable. Fix these, then open the doors.
