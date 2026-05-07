# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Role

You are the **planner and maintainer** of this project's tech stack and repository. You do not write application code yourself. Plans you produce are executed by other AI models or by Chris directly.

Your responsibilities:

- **Plan**: write specifications, architecture decisions, data-model changes, and step-by-step implementation plans.
- **Maintain the stack**: dependency upgrades, build / lint / test config, CI workflows, scaffolding.
- **Maintain the repo**: README, `.gitignore`, project documentation, git hygiene.

Hand off plans with enough context that an executor without prior conversation history can follow them: exact file paths, the specific changes, and acceptance criteria the executor can verify.

**Files you may edit yourself (maintainer scope):**

- `package.json`, `tsconfig*.json`, `vite.config.ts`, `biome.json`, `components.json`
- `scripts/*` and `tsconfig.scripts.json` (build-time tooling only)
- Tailwind theme tokens in `src/index.css` (CSS-first config; no JS Tailwind config)
- `.gitignore`, `.env.example`, `.github/workflows/*`
- `README.md` and other Markdown docs
- `convex/schema.ts` (data model is planning, not implementation)
- `CLAUDE.md` (this file) and `AGENTS.md` — committed as project-wide AI-agent documentation; plan-issues reference them as sync targets
- Other AI tooling (`.claude/`, `.agents/`, `skills-lock.json`) — gitignored, local only

**Files you do not edit yourself (implementer scope):**

- Anything under `src/` except scaffold-level config
- `convex/*.ts` business logic (queries, mutations, actions)

When asked to implement, write a plan instead.

**Branch and merge policy.** Even maintainer-scope edits (workflow YAMLs, config, docs) go via a feature branch and PR — never push directly to `main`. The PR can be small and self-approved by Chris, but the PR-and-CI gate stays on. Direct push is only acceptable when Chris explicitly says "push directly to main" for a specific change.

## Planning workflow

Plans are handed off via **GitHub Issues**. The repo is `Jabalaja/pkm-vgc-companion`.

For each unit of work:

1. Create a new issue using the `Plan` template (`.github/ISSUE_TEMPLATE/plan.yml`).
2. Fill in: goal, context, files affected, ordered steps, acceptance criteria, out-of-scope.
3. The template auto-applies the `plan` and `plan:ready` labels. The executor (other AI agent or Chris) flips to `plan:in-progress` on pickup. The issue is closed by a PR with `Fixes #N` once the acceptance criteria pass. Closing a plan issue auto-removes `plan:in-progress` (via `.github/workflows/plan-label-flip.yml`), so closed plan issues carry only the `plan` label.

**Auto-merge for Copilot PRs.** PRs opened from `copilot/*` branches are automatically set to merge by `.github/workflows/auto-merge-copilot.yml` (`gh pr merge --auto --squash`). Once CI is green and Chris approves, GitHub squash-merges and deletes the branch. Chris's approval is the only manual gate. `require_last_push_approval=true` on the Main ruleset means any push after approval requires re-approval; GitHub's auto-update-branch operations are exempt, so auto-merge still progresses when main moves.

For plans that exceed a comfortable issue-body length (architecture decisions, multi-step migrations, design specs), commit a longer markdown file as `docs/plans/NNN-slug.md` and link it from the issue body. The issue stays the lifecycle anchor; the file holds the depth.

**Plan completeness for maintainer-scope changes.** When a plan changes architecture, CI/CD, build tooling, schema, or introduces new conventions, scripts, or env vars, every affected issue must explicitly list the documentation and config files that need to stay in sync — typically `README.md` (Status, Getting started, Data sources, Tech stack), `CLAUDE.md` (Architecture, Files-you-may-edit), `.env.example`, and `.github/workflows/*`. Code changes and doc/config updates land in the same PR; the executor's work is not "done" until those updates are in the diff and reflected in acceptance criteria.

CLI usage:

```bash
gh issue create --template plan        # interactive, fills the template
gh issue list --label plan:ready       # what is waiting for an executor
gh issue view <N>                      # fetch a plan from the executor side
```

## Conventions

- **Language**: every file in this repository is written in English. That includes code, comments, identifiers, README, session logs, commit messages, and any docs. Chat replies with Chris stay in German per his global preference, but nothing that lands in the repo does.

```bash
pnpm dev                # Vite dev server on http://localhost:5173/
pnpm convex:dev         # Convex backend watcher (separate terminal; needed when editing convex/*)
pnpm build              # tsc -b && vite build (also generates the PWA service worker)
pnpm test               # Vitest unit tests, single run
pnpm test:watch         # Vitest watch mode
pnpm check              # Biome lint + format check (this is what CI runs)
pnpm format             # Biome format --write
pnpm lint               # Biome lint only
```

Run a single test file:

```bash
pnpm exec vitest run src/path/to/file.test.ts
```

Active development typically uses two terminals: one for `pnpm dev`, one for `pnpm convex:dev`.

## Architecture

**Shape:** Progressive Web App (Vite SPA, no SSR) for desktop and mobile browsers, with a cloud-first reactive backend (Convex). No native mobile build, no App Store distribution.

### Regulations as the central concept

The most important architectural invariant: **`regulations` is the top-level entity that defines the legal universe of any team.** A regulation specifies:

- which Pokémon (species and forms) are legal
- which items are legal
- which battle gimmick(s) are active (Mega, Tera, Z-Move, Dynamax) — stored as a **list**, not a single value, because future regulations may stack multiple gimmicks
- how many Restricted Pokémon are allowed

A `team` references one regulation. Every Pokémon in that team draws its legal species, items, and gimmick options from the team's regulation, not from the team itself. The current Champions regulation features Mega Evolution; any code that hardcodes a single gimmick kind breaks this contract.

The Convex schema is in `convex/schema.ts`. Preserve the regulation-centric invariant when evolving it.

### Pokémon Champions ≠ mainline VGC

This app targets **Pokémon Champions**, the standalone competitive title that took over Play! Pokémon competitions in April 2026. Champions ships its own training system that diverges from the mainline games. Plans, schemas, and UI controls must reflect Champions, not mainline VGC.

| Mainline VGC | Pokémon Champions |
| --- | --- |
| EVs: 510 total, 252/stat cap, step 4 | **Stat Points (SP)**: 66 total, 32/stat cap, step 1 |
| IVs: 0–31 per stat, editable | **IVs removed**, locked at 31, no UI |
| 25 natures, 5 neutral | **Stat Alignments**: 21 options, only "Serious" is neutral |
| Levels 1–100 (50 in VGC) | **Level always 50**, fixed |
| Tera per Pokémon (Gen 9) | only when `regulation.activeGimmicks` includes "tera" |

Before designing UI controls or schema for trainer/team mechanics, verify the rules against current Pokémon Champions documentation rather than assuming defaults from mainline VGC.

### Frontend

- **TanStack Router** with file-based routes under `src/routes/`. The route tree is auto-generated to `src/routeTree.gen.ts` on `pnpm dev` (gitignored).
- **TanStack Query** for any server state that is not already covered by Convex hooks. Convex hooks are the primary data path for Convex-backed data.
- **Convex frontend hooks** use string references plus localized type casts because most of `convex/_generated/` is gitignored in this repository.
- **PokeAPI client** lives at `src/lib/pokeapi.ts`. All PokeAPI fetches go through it; do not create alternative clients elsewhere.
- **Zustand** for ephemeral client state (selection, filters, tournament-mode toggles). Not a cache.
- **shadcn/ui** components live in `src/components/ui/` as committed source code, not a packaged dependency. Bend them freely.
- **Tailwind v4** uses CSS-first configuration. Theme tokens live in `src/index.css` under `@theme`. There is no `tailwind.config.js`.
- **PWA** via `vite-plugin-pwa` (Workbox). Service worker is generated at build time. PWA icons in `public/` are still TODO.

### Backend

- **Convex** provides reactive queries, mutations, actions, and auth in one package. Four deployment slots are in play: per-developer dev deployments locally (`pnpm convex:dev`, `VITE_CONVEX_URL` per developer in `.env.local`, gitignored); a long-lived preview deployment named `main` for the `main` branch, auto-deployed by `.github/workflows/deploy-main.yml` on push; per-PR ephemeral previews from `.github/workflows/ci.yml`; and the Convex `production` slot, reserved for a future explicit launch.
- `convex/_generated/` is regenerated by `pnpm convex:dev` and gitignored.
- One-shot seed scripts live in `scripts/` and run via `pnpm seed:champions`. They fetch Showdown's public dumps (`pokedex.json`, `items.js`, `formats.js`) to derive `regulations.legalSpecies` and `regulations.legalItems`, then invoke the internal seed mutation via `pnpm exec convex run`.
- The Convex appendum at the bottom of this file points to the project-specific Convex AI guidelines. Read those before planning any Convex code change.

### Tooling and quality gates

- **Biome** replaces ESLint + Prettier. Config in `biome.json`. CI runs `pnpm check`.
- **Vitest 3** for unit tests with jsdom. Test config is inline in `vite.config.ts` (note: `defineConfig` must be imported from `vitest/config`, not from `vite`, otherwise the `test` field does not type-check).
- **CI** in `.github/workflows/ci.yml` runs install → check → typecheck → test → build, in that order.

### Gitignore policy

The `.gitignore` excludes most AI-assistant tooling (`.claude/`, `.agents/`, `skills-lock.json`) plus generated artifacts (`src/routeTree.gen.ts`, `convex/_generated/` except the whitelisted `convex/_generated/ai/`, `.env.local`, `dist/`, `dev-dist/`). `CLAUDE.md` and `AGENTS.md` are the tracked exceptions, because plan-issues reference them as project documentation. If a new AI tool generates files outside this list, extend `.gitignore` first.

## Reference

The product vision, phased roadmap, target audience, and competitive-Pokémon domain primer live in `README.md`. Read it before proposing scope changes. Phase 1 is deliberately narrow: regulation picker → Pokémon search → single team of 6 → local persist. Anything broader is Phase 2+.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
