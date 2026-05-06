# PKM VGC Companion

A mobile-first companion app for **Pokémon Champions** and **Pokémon VGC** players. Built for trainers who want to plan, calculate, and review battles on the go — between rounds at a regional, on the train, or while watching streams.

## Why this exists

Pokémon Champions launched on Nintendo Switch on **April 8, 2026**, with iOS and Android versions following in **June 2026**. With this release, [Play! Pokémon competitions transitioned from the mainline Scarlet & Violet titles to Champions](https://www.pokemon.com/us/pokemon-news/play-pokemon-competitions-transition-to-pokemon-champions-on-april-and-may-2026), making it the official platform for the **2026 Pokémon World Championships** in San Francisco and beyond.

Champions decouples competitive battling from the mainline RPG, supports **cross-play and cross-save** between Switch and mobile, and links with **Pokémon HOME** so players can bring Pokémon over from past games and Pokémon GO.

What Champions does *not* ship with is a deep, fast, mobile-friendly toolkit for team prep and in-tournament reference. That gap is what this companion fills.

## Target audience

- VGC players preparing for **regionals, internationals, and Worlds**
- Casual ranked-ladder grinders climbing the in-game seasonal ladder
- Coaches and content creators analyzing teams and matchups
- New players learning the **Doubles** format

## Format primer (what the app supports)

VGC is **Doubles**: bring 6, pick 4, all Pokémon auto-leveled to 50, Species and Item Clauses apply. Each match has 20 minutes of game time and 90 seconds of team-preview time. The 2026 season uses an **open team list** format. ([Victory Road regulations](https://victoryroad.pro/champions-regulations/), [Pokémon Zone rules](https://www.pokemon-zone.com/champions/guides/rules-and-regulations/))

### Regulations as the organizing concept

A **regulation** is the central organizing concept of the app. Each regulation defines:

- which Pokémon (species and forms) are legal
- which items are legal
- which battle **gimmick(s)** are active
- restrictions on Restricted and Mythical Pokémon

The current Champions regulation features **Mega Evolution** as its gimmick. Whether a future regulation has exactly one active gimmick or several at once (e.g. Mega plus Tera, or Tera plus Z-Moves) is unknown — past franchise sets have shipped **Terastallization**, **Z-Moves**, and **Dynamax / Gigantamax** in different combinations, so the model treats "active gimmicks" as a list, not a single value.

Regulations rotate every few months (e.g. **Set M-A** runs until **June 17, 2026**). A **team is built for one specific regulation**, and its legal roster, legal items, and available gimmick(s) all come from that regulation — not from the team itself.

## Roadmap

The product grows in clearly scoped phases. Each phase is independently useful — a player should get value from Phase 1 even if the rest never ships.

### Phase 1 — MVP: a simple team store
- **Pick a regulation** before building. The regulation is what makes the rest of the form meaningful: it scopes the legal roster, the legal items, and the gimmick options
- **Pokémon search** restricted to that regulation's legal pool
- **Build a competitive team of 6** with species, ability, item, nature, EVs/IVs, four moves, and a **gimmick assignment** drawn from whatever the chosen regulation allows (Mega Evolution today; the slot is a list-typed field so a future regulation with multiple active gimmicks needs no schema change)
- **Persist locally** so the team survives an app restart
- That's it. No calculator, no analysis, no multi-team. The goal is a fast, clean team-entry flow on a phone.

### Phase 2 — Multiple teams
- **Create, name, edit, duplicate, and delete** several teams
- **Switch between teams** quickly
- **Import/export** via Poképaste so teams move in and out painlessly
- Foundation for everything that follows: real prep work means having more than one team in flight.

### Phase 3 — Matchup analysis
- **Pick a target Pokémon** (or a small set of targets) and see how the active team performs against it
- **Coverage and threat view** — which of your six can reliably win the trade, which lose it, and which are neutral
- First piece of "decision support" — moves the app from passive storage toward active prep.

### Phase 4 and beyond — Toward a full companion
Iterative refinement based on what real use surfaces. Likely directions:

- **Damage calculator** with STAB, spread reduction, weather, terrain, screens, abilities (incl. Ruin), held items, multi-hit moves, and the active gimmick (Mega forms today; Tera-boosted STAB, Z-Moves, or Dynamax HP/move upgrades when the regulation calls for them)
- **Speed tier visualizer** with Tailwind, Trick Room, paralysis, Choice Scarf, and stat-stage modifiers
- **Type coverage matrix** that adapts to the active gimmick (e.g. Tera-type interactions when Tera is in rotation)
- **Team audit** that flags common weaknesses (no Fake Out check, no answer to Incineroar, no spread-move user, etc.)
- **Multi-calc** that resolves all attacker × defender combinations across the 6v6 preview at once
- **Move-order resolver** for 2v2 turns with Trick Room, priority, and item interactions
- **Regulation rotation tooling** — countdown to the next set rotation and a "what changed" diff between regulations (the regulation data itself is already in from Phase 1; this layer adds proactive comparison and alerts)
- **Usage stats** backed by Pikalytics-style aggregated feeds
- **Replay annotator** — paste a replay link, mark turns, save lessons learned
- **Tournament mode** — minimal-UI, large-text, glanceable damage rolls and speed checks between rounds
- **Live companion mode** — usable *during* an online ranked match: glance, decide, tap back to the game

### Mobile-first quality of life (applies throughout)
- Works **offline** for everything that doesn't need fresh meta data
- One-handed layout optimized for phones at events
- Dark mode by default for venue lighting
- Optional iCloud / Google Drive sync of teams and notes

## Tech stack

The project is built as a **Progressive Web App** that runs on desktop and mobile browsers, with a cloud-first backend so multi-device use works from day one.

| Layer | Choice |
|---|---|
| Language | TypeScript (strict) |
| Build / bundler | Vite |
| Framework | React 19 |
| Backend / DB / realtime / auth | Convex |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui (on Radix Primitives) |
| Forms / validation | React Hook Form + Zod |
| Server-state | TanStack Query (Convex hooks for the main path) |
| Client-state | Zustand |
| Routing | TanStack Router (file-based) |
| PWA | vite-plugin-pwa (Workbox) |
| Lint / format | Biome |
| Testing | Vitest (unit) + Playwright (E2E) |
| Package manager | pnpm |
| Hosting | Cloudflare Pages (frontend) + Convex Cloud (backend) |
| CI | GitHub Actions |

> **Working with Convex code:** read [`convex/_generated/ai/guidelines.md`](convex/_generated/ai/guidelines.md) first. Generated by `npx convex ai-files install` and committed so all contributors (AI agents and humans) share the same Convex API rules.

### Testing

- Convex backend test pattern: [`convex/example.test.ts`](convex/example.test.ts)
- React component test pattern: [`src/__tests__/example-component.test.tsx`](src/__tests__/example-component.test.tsx)

### Brand palette

| Token | Hex | Name |
|---|---|---|
| `--color-brand-navy` | `#0d3b66` | Regal Navy (primary) |
| `--color-brand-cream` | `#faf0ca` | Lemon Chiffon (background / on-primary text) |

These are the only project-wide brand color tokens. Neutral colors continue to use Tailwind's default palette.

### Why these choices

- **Convex over Supabase.** Reactive queries with end-to-end TypeScript types match the Phase-4 live-companion vision: realtime updates without a backend rewrite.
- **Vite SPA over Next.js.** No SSR/SEO needs (the app is login-gated). A pure SPA is the cleaner home for an offline-first installable PWA.
- **shadcn/ui over a packaged library.** Component code lives in the repo, no black-box dependency, easy to bend for tournament-mode UX.
- **Biome over ESLint + Prettier.** One Rust-based tool replaces two JS-based ones — faster, simpler config.

### Future CI/CD enhancements

The current CI runs lint, Convex schema validation (push to an ephemeral preview deployment), build/typecheck, and unit tests on every PR. The following are deliberately deferred until they pay off:

- **End-to-end tests (Playwright).** Add once Phase 1 ships a real team-builder flow worth covering across browsers. Until then, E2E setup outweighs the value.
- **Visual regression (Storybook + Chromatic or Percy).** Add when the repo grows its own component library beyond the shadcn defaults. With only shadcn primitives in source, snapshots would cover library code we did not author.
- **Lighthouse PWA score (Lighthouse CI).** Add once PWA icons, manifest, and the offline strategy are in place. A score against an incomplete PWA setup is misleading rather than informative.

Auto-rebase of open PR branches against `main` was evaluated and skipped: the existing combination of squash-merge, `auto-merge-copilot.yml`, and GitHub's branch auto-update is sufficient at the current single-developer throughput.

## Non-goals

- This is **not** a battle simulator — Pokémon Showdown and Champions itself cover that space.
- It does **not** ingest data from Champions in real time. Cross-platform battling is between Switch and mobile *via Champions*, not via third-party apps.
- It does **not** scrape or reverse-engineer the Champions client.

## Data sources

- **PokeAPI** provides Pokémon detail data (sprites, types, abilities, base stats) at runtime. **Pokémon Showdown's public data dump** (`play.pokemonshowdown.com/data/*.json`) is consumed once via `pnpm seed:champions` to derive the active regulation's `legalSpecies` and `legalItems`.
- Usage statistics: aggregated public ladder data (e.g. Pikalytics-compatible feeds)
- Regulation rules: tracked manually against the [official Play! Pokémon resources](https://play.pokemon.com/en-us/resources/rules/?category=vgc)

## Status

Phase-1 data model is live in Convex. The active Champions regulation (`champions-mega`) is seeded with legal species/items, and regulation/team-member mutations are in place for backend search-and-add flows. Next up is the search-and-add UI layer.

### Getting started

```bash
pnpm install            # install dependencies
pnpm dev                # start the Vite dev server
pnpm convex:dev         # start the Convex dev backend (first run will prompt to create a deployment)
pnpm seed:champions     # one-time, requires CONVEX_DEPLOY_KEY in env
pnpm check              # Biome lint + format check
pnpm test               # Vitest unit tests
```

## Prior art

These tools inspired the scope and set the bar:

- [VGC Helper](https://vgchelper.com/) — iOS app with team builder, damage calc, and battle assistant
- [Porygon Labs](https://www.porygonlabs.com/) — web damage calculator and team builder for Champions
- [Champions Builder](https://www.championsbuilder.com/) — team builder for Champions VGC
- [Pikalytics](https://www.pikalytics.com/team) — usage stats and team builder
- [ChampDex](https://apps.apple.com/us/app/champdex/id6761497339) — iOS team and meta companion

## License

TBD.

---

*Pokémon and all related trademarks are property of Nintendo, Game Freak, and The Pokémon Company. This project is an unofficial, fan-made companion and is not affiliated with or endorsed by any of them.*
