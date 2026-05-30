# Skill: update-docs

Run this skill after completing any feature, fix, or infrastructure change to keep the 4 project docs accurate.

## The 4 docs and what each one covers

| Doc | Audience | Covers |
|-----|----------|--------|
| `ARCHITECTURE.md` | Future Claude sessions + developers | Data flow, schema, cron jobs, free APIs, env vars, infrastructure decisions |
| `PRD.md` | Product decisions | Feature scope, user-facing behaviour, core principles |
| `README.md` | New developers / GitHub visitors | Features summary, tech stack table, getting-started steps |
| `CLAUDE.md` | Claude Code (this file is Claude's instructions) | Stack, coding standards, patterns, skill registry, decision trees |

---

## Trigger → doc mapping

Go through each trigger below. For every one that matches what you just did, update the listed section(s).

### New package installed (`npm install <pkg>`)
- **CLAUDE.md** → `## Stack` — add bullet: `- **Name:** package-name (one-line purpose)`
- **README.md** → tech stack table — add row

### New coding pattern established (new hook, new helper, new import rule)
- **CLAUDE.md** → `## Coding standards` — add rule

### New user-facing page or feature
- **PRD.md** → `## 4. Features` — add or extend the relevant subsection (4.x)
- **README.md** → `## Features` — add bullet
- **CLAUDE.md** → `## Decision trees` — add entry if a repeatable pattern is involved

### New cron job
- **ARCHITECTURE.md** → `## 6. Cron jobs` — add subsection with route, schedule, steps, auth, error handling
- **CLAUDE.md** → `## Decision trees › Adding a new cron job` — update if steps changed
- **vercel.json** already updated by code; doc must match

### New API route (admin, public, or cron)
- **ARCHITECTURE.md** → add to the relevant section (§6 for cron, or a new §8+ for other routes)

### New Supabase table or column
- **ARCHITECTURE.md** → `## 4. Database schema` — update the SQL block
- **ARCHITECTURE.md** → `## 4a. Migrations` — add row to the migrations table

### New migration file (`supabase/migrations/NNN_*.sql`)
- **ARCHITECTURE.md** → `## 4a. Migrations` — add row: `| NNN_name.sql | Description |`

### New environment variable
- **ARCHITECTURE.md** → `## 10. Environment variables` — add row to the table
- **README.md** → `## Getting started` — mention if needed for local setup
- `.env.example` — add the variable with a comment (this is a Boundary — always update)

### New skill file (`tools/skills/*.md`)
- **CLAUDE.md** → `## Skills` — add bullet: `- \`filename.md\` — one-line description`

### Architectural change (new storage tier, new auth pattern, dark mode, PWA, etc.)
- **ARCHITECTURE.md** → add a new numbered section (increment version at top)
- **CLAUDE.md** → `## Stack` and/or `## Coding standards`
- **README.md** → `## Features` and/or tech stack table

### Core principle added or changed
- **PRD.md** → `## 3. Core principles` — add/edit the numbered list

### Auth flow change
- **PRD.md** → `## 5. Auth` — update
- **ARCHITECTURE.md** → `## 8. Auth flow` — update diagram/prose

---

## Version bumps

Bump `**Version:**` in `ARCHITECTURE.md` whenever a section changes (minor: 1.2 → 1.3; major structural rework: 1.x → 2.0).

`PRD.md` version bumps on feature scope changes.

`CLAUDE.md` and `README.md` have no version fields — edit in place.

---

## What does NOT require a doc update

- Bug fixes with no behaviour change
- Styling / CSS tweaks
- Refactors that don't change the public API or project patterns
- Seed data changes in `content/*.json`
- i18n string additions (covered by the `add-i18n-key` skill)

---

## Checklist (copy-paste into your response when running this skill)

```
Doc update checklist
─────────────────────────────────────
[ ] ARCHITECTURE.md — schema / cron / env vars / new sections
[ ] PRD.md          — feature scope / principles / auth
[ ] README.md       — features list / tech stack table / getting started
[ ] CLAUDE.md       — stack / coding standards / skills / decision trees
[ ] .env.example    — new env vars
```
