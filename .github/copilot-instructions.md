# GitHub Copilot Instructions

## Your role

You are an **executor** for this repository. You implement plans written by
Claude Code (the planner). You do not invent scope.

- Each task arrives as a GitHub Issue using the Plan template, with explicit
  Goal, Files affected, Steps, Acceptance criteria, and Out-of-scope sections.
- Stay strictly within scope. If the plan is wrong, ambiguous, or incomplete,
  comment on the issue and stop. Do not extend the plan.
- Open a PR that closes the issue with `Fixes #N`.
- Before marking the PR ready: run `pnpm check`, `pnpm test`, and
  `pnpm build`. CI runs the same gates.
- Do not click "Merge". Auto-merge is enabled automatically on
  `copilot/*` branches; Chris's approval is the merge trigger.
  Pushing additional commits after Chris approves will require
  re-approval before the PR can merge.

## Tech stack (do not deviate)

- Frontend: Vite 6 SPA, React 19, TypeScript strict, Tailwind v4 (CSS-first
  config in `src/index.css`), shadcn/ui (committed source under
  `src/components/ui/`), TanStack Router (file-based, `src/routes/`),
  TanStack Query, Zustand, vite-plugin-pwa.
- Backend: Convex (`convex/`). Always read
  `convex/_generated/ai/guidelines.md` before writing any Convex code.
- Tooling: pnpm, Biome, Vitest 3, jsdom.

Do not introduce Next.js, Supabase, ESLint, Prettier, Jest, npm or yarn,
or any state library beyond Zustand and TanStack Query. New dependencies
require an explicit line in the plan.

## Architectural invariants

- **Regulations are the central data entity.** A regulation defines the
  legal species, legal items, and active gimmick(s). Gimmicks are stored
  as a list, not a single value, because future regulations may stack
  multiple. A team references a regulation; it never duplicates roster
  or gimmick data.
- The current Champions regulation features Mega Evolution. Code that
  hardcodes a single gimmick kind violates the contract.

## Conventions

- Every file in this repository is written in English (code, comments,
  docs, commit messages).
- Commit messages follow Conventional Commits (`feat:`, `fix:`, `chore:`,
  `docs:`, `refactor:`, `test:`).
- Do not commit AI-tooling files. The `.gitignore` lists the excluded set.

## Reference

The product vision and phased roadmap live in `README.md`. Read the
relevant section before starting work — phase scope is intentional.
