# 02 — AI CONCIERGE + JOB-TITLE COCKPITS

**Author:** C8 Designer (The Pulse) — S326 bones-laying pass
**Status:** BLUEPRINT ONLY. No app code changed. Incoming devs build against this.
**Repo:** overkillkulture/comms-unity (Case Builder HQ — Next.js App Router + Prisma + NextAuth, Railway)
**Sibling doc dependency:** Owner/Admin/Builder/Member/Guest permission model (defined by sibling agent — this doc assumes that 5-role ladder).

---

## PART 0 — GROUND TRUTH (what exists TODAY, verified)

I read the real files before designing. These are receipts, not assumptions.

### The AI route that exists: `src/app/api/ai/route.ts`
- **Auth-gated.** `getServerUser()` — 401 if no user (line 20-21).
- **Contract IN:** `POST /api/ai` body `{ message, context?, system?, conversationId? }` (line 24).
- **Contract OUT:** `{ reply, model }` (line 79-82). On failure returns `{ reply, error:true, model:'error' }` — it fails SOFT (always 200 with a human-readable reply). Good for UX.
- **Provider-swappable already (BYOK):** priority is `x-ai-endpoint` header > `x-ai-key` header > `process.env.AI_ENDPOINT` > default ARAYA netlify function `https://conciousnessrevolution.io/.netlify/functions/araya-chat` (line 16, 32-34). Forks set `AI_ENDPOINT`; users can pass their own key via `x-ai-key` (line 50-53).
- **System prompt** is hardcoded "You are ARAYA... in the Case Builder HQ... never pretend to be a lawyer" (line 38) unless caller overrides via `system`.
- **Response parsing is tolerant:** reads `reply || response || content || text || choices[0].message.content` (line 76-77) — already OpenAI-shape compatible.
- **GET /api/ai** returns a self-describing config object (provider, byok:true, features, fork setup steps) — line 93-118.

### What the route does NOT do yet (the gaps this blueprint fills)
1. No concept of **action links / handoff cards** — it returns a flat text string only.
2. No **escalation** — no way for the AI to say "I'm handing this to Commander" and actually route a thread to a human.
3. No **streaming** and no **voice** (no tie to a TTS rail).
4. No **tool/function calling** — it can't "spring off links" because it has no structured action channel back to the UI.
5. No **room-context awareness by role** — the same ARAYA answers everyone identically regardless of whether they're an Owner or a Guest.

### Rooms + roles ground truth
- Rooms = `Conversation` where `type:'ROOM'` (`src/app/api/rooms/route.ts`).
- Membership = `ConversationMember { role String @default("member") }` (prisma/schema.prisma:204). **Role is PER-ROOM**, surfaced to the client as `myRole` in the rooms list payload.
- No cockpit/dashboard UI exists yet — `src/app/(protected)/` has feed, messages, discover, notifications, profile tabs. The "HQ" today is `src/app/meet/` (Jitsi video). **The cockpit is greenfield.** This is a bones-laying opportunity, not a redesign.

---

## PART 1 — THE AI CONCIERGE

### Concierge design in 3 lines
1. **It greets, answers, and hands you links** — every reply can carry structured `actions[]` (buttons/cards the UI renders) so the AI can literally hand you "your case intake link", an invite, or a route into a cockpit.
2. **It escalates to a human** — when confidence is low or the member asks for a person/decision/money/legal-signoff, it posts the thread to the room's Owner/Admin queue and tells the member "a human's got this."
3. **It stays provider-swappable** — the existing BYOK plumbing (`x-ai-endpoint` / `x-ai-key` / `AI_ENDPOINT` / default ARAYA) is untouched; we only add a structured `actions[]`/`escalate` envelope on top and a role/room-aware system prompt.

### 1.1 — Extend the response envelope (backward-compatible)

Keep `{ reply, model }`. ADD optional fields. Old callers ignore them; new UI reads them.

```jsonc
{
  "reply": "Here's your case intake link — takes about 4 minutes.",
  "model": "araya",
  "actions": [
    {
      "type": "link",              // link | route | copy | escalate | download
      "label": "Start Case Intake",
      "href": "/rooms/{roomId}/intake",   // internal route OR external url
      "style": "primary",          // primary | secondary | danger
      "icon": "clipboard"
    },
    {
      "type": "copy",
      "label": "Copy invite link",
      "value": "https://hq.100xbuilder.io/join?code=ABC123"
    }
  ],
  "escalate": null                 // or an escalation object (see 1.4)
}
```

**Why an envelope, not markdown links:** links inside prose get lost on mobile and can't be styled as thumb-targets. Structured `actions[]` render as full-width tappable cards under the message — one thumb, Xiaomi-friendly.

### 1.2 — How the AI "springs off links" (action generation)

The AI does not invent URLs freely (safety + broken-link risk). Instead the route owns a **whitelist link catalog** and the model requests an action by intent. Two build options for devs — ship (A) first:

- **(A) Server-side intent match (ship first, no model change):** After getting the model's text reply, the route runs a lightweight intent pass over the user message + reply against a catalog map. Example catalog (server-owned, so links are always valid):

  | Intent keywords | Action produced |
  |---|---|
  | intake, start my case, new case | `route → /rooms/{roomId}/intake` "Start Case Intake" |
  | invite, add someone, bring in | `copy → invite link` (calls existing `POST /api/rooms/[roomId]/invite`) |
  | evidence, upload, exhibit | `route → /rooms/{roomId}/evidence` "Open Evidence Locker" |
  | deadline, when is, calendar | `route → /rooms/{roomId}/deadlines` "View Deadlines" |
  | talk to a human, lawyer, commander | `escalate` (see 1.4) |
  | cockpit, dashboard, home | `route → /rooms/{roomId}` "Go to your cockpit" |

- **(B) Tool/function-calling (later, when a tool-capable provider is set):** expose the catalog as tools; model returns tool calls; route maps tool→action. Same envelope out. Gate behind a provider capability flag so BYOK/free defaults still work with option (A).

**Link safety rule:** `href` is either an internal path (starts `/`) OR a domain on an allowlist (`hq.100xbuilder.io`, `conciousnessrevolution.io`, `100xbuilder.io`). The UI refuses to render any other absolute URL as a primary button.

### 1.3 — Role/room-aware system prompt

Inject the caller's `myRole` and room purpose so the concierge answers appropriately. The route already receives `conversationId`; add `role` and `roomType` to the body (client sends them from the rooms payload).

```
You are ARAYA, concierge for the "{roomName}" room in Case Builder HQ.
The person you're talking to is a {ROLE}. Room purpose: {roomType}.
- If ROLE is Guest/Member: answer, orient, hand them the one link that unblocks them. Do NOT expose admin actions.
- If ROLE is Builder: surface tasks, files, PRs. You may hand off dev links.
- If ROLE is Owner/Admin: you may surface metrics, member management, and escalations.
Never pretend to be a lawyer. When unsure, escalate to a human rather than guess.
```

### 1.4 — Escalation (hand a thread to the human team)

The concierge escalates when: (a) user explicitly asks for a human, (b) money/legal-signoff/irreversible action, (c) model confidence low / repeated failure, (d) a HOT case-intent (someone in crisis).

Escalation object in the response:
```jsonc
"escalate": {
  "reason": "user_requested_human",   // user_requested_human | legal_signoff | payment | low_confidence | crisis
  "summary": "Member asks whether to sign the parenting plan by Friday — legal decision.",
  "priority": "high",                 // low | normal | high | crisis
  "routeTo": "owner"                  // owner | admin | builder-team
}
```

What the route DOES on escalate (dev build): post a system message into the room ("🛎️ ARAYA escalated this to the team — a human will respond") AND fire a notification to the room's Owner/Admin (reuse the existing notification/commander-alert rail — see PART 3). The member sees an immediate, honest confirmation (Action-Reaction: never fail silently). This is the "hand a thread to Commander" behavior.

### 1.5 — Voice (plus, tie to the site TTS rail)

Voice is additive, not required. Design:
- Concierge replies carry an optional `speak` boolean per message (default off; user toggles a speaker icon in the composer).
- When on, the client POSTs `reply` text to the CR TTS rail (the site's existing tts function / Kokoro on CP2 — `POST /tts` returns wav) and plays it. Keep TTS client-side so it works regardless of AI provider.
- Mic-in (STT) is phase 2 — reuse the site's Groq STT rail (340ms) the same way. Not blocking for bones.

### 1.6 — Concierge conversation flow (mobile, one thumb)

```
[ Member opens a room ]
        │
        ▼
┌─────────────────────────────┐
│  ARAYA greets by role:      │
│  "Hi Aaron — you're a       │
│   Builder here. Want your   │
│   task board or files?"     │
│  [ Task Board ] [ Files ]   │  ← action cards, full-width
└─────────────────────────────┘
        │  member types a question
        ▼
┌─────────────────────────────┐
│  reply text                 │
│  ┌───────────────────────┐  │
│  │ ▶ Start Case Intake   │  │  ← primary action card
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ ⧉ Copy invite link    │  │  ← secondary
│  └───────────────────────┘  │
└─────────────────────────────┘
        │  member: "I need a person"
        ▼
┌─────────────────────────────┐
│ 🛎️ Handed to the team.      │
│    Commander will reply     │
│    here. (notified)         │
└─────────────────────────────┘
```

---

## PART 2 — JOB-TITLE COCKPITS

**One shell, role-filtered panels.** Everyone enters the same `/rooms/[roomId]` cockpit shell; what renders inside is filtered by `myRole`. This is a widget grid — each panel is a card. Panels the role can't see simply don't mount (not greyed out — hidden, to reduce cognitive load).

### 2.1 — The shell (identical for all roles)

```
┌───────────────────────────────────────────┐
│ ☰  {Room Name}          🔔   [avatar ▾]    │  ← top bar (thumb-left menu)
├───────────────────────────────────────────┤
│                                           │
│   [ ROLE-FILTERED PANEL GRID ]            │  ← the only part that changes
│                                           │
├───────────────────────────────────────────┤
│  💬 Ask ARAYA…                    [ 🎤 ]  │  ← concierge composer, always present
└───────────────────────────────────────────┘
```
Mobile = single column, panels stack in priority order. Desktop = 2–3 column grid (enhancement).

### 2.2 — OWNER / COMMANDER cockpit (sees everything)

Job: run the org. Primary = pulse of the whole room + the escalation queue.

```
┌───────────── OWNER COCKPIT ──────────────┐
│ ⚑ ESCALATIONS (2)         ← PRIMARY, top │
│   • Legal signoff — Aaron      [Open]     │
│   • Payment question — Eden    [Open]     │
├───────────────────────────────────────────┤
│ 📊 METRICS                                │
│   Members 14 · Active 6 · Msgs/day 92     │
│   New leads 3 · Uncontacted 1             │
├───────────────────────────────────────────┤
│ 👥 TEAM            [Manage roles]         │
│   Owner 1 · Admin 2 · Builder 4 · Mem 7   │
├───────────────────────────────────────────┤
│ 📋 ALL PANELS (tasks · cases · files)     │
│   ↳ Owner sees every other role's panel   │
└───────────────────────────────────────────┘
```
Priority order: 1. Escalations  2. Metrics  3. Team  4. Everything else.

### 2.3 — BUILDER cockpit

Job: ship. Primary = what's on me right now (tasks + PRs).

```
┌──────────── BUILDER COCKPIT ─────────────┐
│ ✅ MY TASKS (3)          ← PRIMARY        │
│   ☐ Wire /api/ai actions[]   [Start]      │
│   ☐ Evidence upload fix                   │
├───────────────────────────────────────────┤
│ 🔀 PULL REQUESTS                          │
│   #12 concierge envelope  ● review        │
├───────────────────────────────────────────┤
│ 📁 FILES / REPO           [Open]          │
├───────────────────────────────────────────┤
│ 🧠 ARAYA: "Need the intake schema?"       │
└───────────────────────────────────────────┘
```
No metrics, no team management, no member feed clutter. Task board is the whole point.

### 2.4 — LEGAL / CASE cockpit

Job: move the case. Primary = deadlines (nothing scarier than a missed court date).

```
┌────────── LEGAL / CASE COCKPIT ──────────┐
│ ⏰ DEADLINES              ← PRIMARY        │
│   🔴 De novo — Jul 3 (PAST)               │
│   🟠 Divorce hearing — Jul 8              │
├───────────────────────────────────────────┤
│ 📥 CASE INTAKE            [Start intake]  │
├───────────────────────────────────────────┤
│ 🗄️ EVIDENCE LOCKER (26)   [Upload]        │
├───────────────────────────────────────────┤
│ 🔎 PATTERNS (ARAYA)                       │
│   "3 filings went un-answered → admitted" │
└───────────────────────────────────────────┘
```
Deadlines first because they're irreversible. Evidence + intake are the daily work.

### 2.5 — MEMBER cockpit

Job: participate. Primary = the conversation.

```
┌──────────── MEMBER COCKPIT ──────────────┐
│ 💬 ROOM CHAT / FEED       ← PRIMARY       │
│   latest messages…                        │
├───────────────────────────────────────────┤
│ 📚 RESOURCES              [Browse]        │
│   How pattern recognition works · guides  │
├───────────────────────────────────────────┤
│ 🧠 ARAYA: "New here? I'll show you around"│
│   [ Take the tour ]                       │
└───────────────────────────────────────────┘
```
No tasks, no metrics, no admin. Just: talk, learn, get oriented by the concierge.

### 2.6 — GUEST cockpit (read-mostly)

```
┌──────────── GUEST COCKPIT ───────────────┐
│ 👋 WELCOME + what this room is            │
│ 💬 READ-ONLY feed preview                 │
│ 🔑 [ Request full access ] → escalates    │
│      to Owner/Admin                       │
└──────────────────────────────────────────┘
```
Guest's "Request access" is itself a concierge escalation — closes the loop.

### 2.7 — Panel visibility matrix

| Panel | Owner | Admin | Builder | Member | Guest |
|---|:--:|:--:|:--:|:--:|:--:|
| Escalation queue | ✅ | ✅ | — | — | — |
| Metrics | ✅ | ✅ | — | — | — |
| Team / roles | ✅ | ✅ (no role-change of Owner) | — | — | — |
| Task board | ✅ | ✅ | ✅ | — | — |
| PRs / repo | ✅ | ✅ | ✅ | — | — |
| Deadlines | ✅ | ✅ | view | view (own case) | — |
| Case intake | ✅ | ✅ | — | ✅ | — |
| Evidence locker | ✅ | ✅ | — | ✅ (own) | — |
| Room chat / feed | ✅ | ✅ | ✅ | ✅ | read-only |
| Resources | ✅ | ✅ | ✅ | ✅ | ✅ |
| ARAYA concierge | full | full | dev-scoped | member-scoped | orient-only |

Server enforces this (never trust the client). The route/each panel API re-checks `myRole` before returning data. The role filter in the UI is for clarity; the API check is for security.

---

## PART 3 — WIRING NOTES (reuse what exists)

- **Concierge lives on the existing route** `src/app/api/ai/route.ts` — extend the response envelope, do NOT replace the BYOK plumbing (lines 16, 32-34 stay).
- **Escalation notification** should reuse the CR notification / `commander-alert` rail (SMS + Discord to Commander) rather than inventing a new one — Owner of the room maps to the notify target.
- **Invite action** calls the already-existing `POST /api/rooms/[roomId]/invite`.
- **Role source** = `ConversationMember.role` (prisma:204), surfaced as `myRole` by `GET /api/rooms`. Cockpit reads `myRole` to pick the panel set.
- **TTS/STT** = client-side calls to the site's existing tts/Groq-STT rails; keep out of the AI route so provider-swap stays clean.

---

## FOR DEVELOPERS — BUILD THESE NEXT (checklist)

Ordered by leverage. Ship 1–5 first (that's the bones).

1. **[ ] Extend `/api/ai` response envelope** — add optional `actions[]` + `escalate` to the return in `src/app/api/ai/route.ts`. Keep `{reply, model}`. Backward-compatible. (Part 1.1)
2. **[ ] Server-side intent→action catalog** — the whitelist map in Part 1.2(A). Server owns the links so they're never broken. Add `allowlist` domain guard.
3. **[ ] Concierge chat UI component** — renders `reply` + `actions[]` as full-width thumb-target cards + an escalation confirmation card. Mobile single-column. Add it to the room shell composer (Part 2.1).
4. **[ ] Escalation handler** — on `escalate`, post a system message to the room + notify Owner/Admin via the existing commander-alert rail. Honest, immediate member confirmation (Part 1.4).
5. **[ ] Cockpit shell `/rooms/[roomId]`** — one shell, reads `myRole`, mounts the role's panel set. Start with Owner + Builder + Member panels stubbed (Part 2).
6. **[ ] Panel visibility enforced server-side** — each panel's data API re-checks `myRole` before returning (Part 2.7). Security, not just UI.
7. **[ ] Role/room-aware system prompt** — pass `role` + `roomType` into the `/api/ai` body; inject into the system prompt (Part 1.3).
8. **[ ] Case/Legal cockpit panels** — deadlines, intake, evidence locker (Part 2.4). Highest emotional stakes; do after shell exists.
9. **[ ] Voice toggle (TTS)** — client-side `speak` per message via the site TTS rail (Part 1.5). Additive.
10. **[ ] Tool/function-calling path (option B)** — only when a tool-capable provider is configured; gate behind a capability flag so BYOK/free default still works (Part 1.2B).

---

*C8 Designer — Pulse. Bones laid, not built. If a member has to think, we failed. Blueprint only — no app code touched this pass.*
