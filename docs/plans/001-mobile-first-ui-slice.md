# Plan 001 — Mobile-First UI Slice: Build / Manage / Battle

## Context

Phase 1 of the MVP is shipped (Champions regulation seeded, Pokémon search, `addMember`). The app currently has a single route, no layout chrome, no navigation. The next iteration brings the product into shape: a **mobile-first three-tab navigation** (Build / Manage / Battle), a **slot-based team builder** (max 6, empty slots rendered as "+"), a **full per-Pokémon editor** (ability, stat points, moves, item, stat alignment, nickname, optional Tera type), and **multi-team management** (list, rename, delete).

### Domain correction (May 2026): Pokémon Champions ≠ mainline VGC

| Mainline VGC | Pokémon Champions |
| --- | --- |
| EVs: 510 total, 252/stat cap, step 4 | **Stat Points (SP)**: 66 total, 32/stat cap, step 1 |
| IVs: 0–31 per stat, editable | **IVs removed**, permanently locked at 31, no UI |
| 25 natures, 5 neutral | **Stat Alignments**: 21 options, "Serious" is the only neutral one (Docile/Hardy/Bashful/Quirky removed) |
| Levels 1–100 (50 in VGC) | **Level always 50**, fixed |
| Tera per Pokémon (Gen 9) | only when `regulation.activeGimmicks` includes "tera" — **not active in M-A** |
| Mega Stones in select formats | **active in M-A** as the sole gimmick |

Consequences for UI/schema: no IV editor, stat sliders 0–32 step 1 with a 66-point budget, nature dropdown becomes stat-alignment dropdown, level read-only, Tera picker conditional on the gimmick.

### Strategic decisions (locked with Chris before plan creation)

1. **Multi-team now.** Schema and UI are multi-team capable from day one. Avoids a future migration. URL scheme: `/teams` (list), `/teams/$teamId` (detail), `/teams/$teamId/slot/$slotIndex` (slot editor).
2. **Slot editor as its own route** (full screen): native mobile feel, back button works, deep-linkable.
3. **Battle Navigator** and Manage features beyond list/rename/delete remain **deliberately empty** in this iteration. Routes and tab stub exist; content lands later.
4. **Auto-persist via Convex reactivity.** Every edit writes immediately. The visible "Save" action is semantically a **rename** plus an anchor moment for untitled teams.
5. **Regulation-aware UI.** Fields like Tera type, mega-stone picker, level editor are rendered conditionally on `regulation.activeGimmicks` and Champions constants. Today: Mega on, Tera off, level locked. Schema stays open for future regulations.

## Design direction: "Tactical Almanac"

Editorial-tactical, not kawaii Pokémon. Inspiration: *Monocle* meets a top player's notebook. VGC players are data-literate (Showdown, Pikalytics, Smogon natives), they value craft, and they are tired of gamer-RGB dashboards.

**Deliberately avoided:** Pokémon yellow/red, purple gradients, Inter, Space Grotesk, glassmorphism cards, generic SaaS look.

### Color palette (CSS variables in `src/index.css` `@theme`)

| Token | Value | Role |
| --- | --- | --- |
| `--color-ink` | `#0a1628` | Primary surface (dark), body text on light surface |
| `--color-paper` | `#f7f1de` | Light surface, text on `ink` |
| `--color-ember` | `#8e2929` | Single accent: active states, critical actions, EV bar |
| `--color-fog-50…900` | warm gray scale | Borders, disabled, secondary text |
| `--color-type-{normal…fairy}` | 18 values | Used only in type chips; never as brand color |

The current brand tokens (`brand-navy`, `brand-cream`) in `src/index.css` are replaced. Pull the README "Tech stack" and any component references along.

### Typography

| Role | Font | Source |
| --- | --- | --- |
| Display | **Instrument Serif** | Google Fonts |
| Body / UI | **Geist** | Google Fonts (Vercel) |
| Mono / Stats | **JetBrains Mono** | Google Fonts |

Scale: H1 2.25rem display italic, H2 1.5rem display, body 0.9375rem (15px) Geist 400 / line-height 1.55, stat numbers JetBrains Mono 500. Tab labels in display italic small caps, ~11px. Nickname inputs may use display italic.

### Form language

- 1px ink borders on paper / 1px paper borders on ink. No heavy shadows; at most a `0 1px 0 rgba(...)` for elevated cards.
- Small radii: `--radius-sm: 4px`, `--radius-md: 8px`. No pills except type chips.
- 8-pt spacing base. Tap targets ≥ 44px, empty slots ≥ 96px.
- Restrained motion: sheet slide-up, dialog crossfade, tab underline glide. No scroll choreography.
- Iconography: Lucide, stroke 1.25.

### Mobile-first shell

- Sticky bottom tab bar with three tabs (Build, Manage, Battle), Lucide icons + display-italic labels.
- Active state: 1px ember underline above the icon, icon turns `ink` instead of `fog-500`.
- Safe area: `padding-bottom: env(safe-area-inset-bottom)` on the container.
- Desktop fallback: bottom bar stays visible at ≥ md as well; sidebar layout is Phase 2+.

## URL and component map

```
/                          → redirect to /teams/new (transitional)
/teams                     → ManagePage (team list)
/teams/new                 → creates a fresh team via teams:create, redirect to /teams/$id
/teams/$teamId             → TeamBuilder (slot grid, header with save/rename)
/teams/$teamId/slot/$n     → SlotEditor (tabs: Overview / Stats / Moves / Item)
/battle                    → BattleNavigator (placeholder)
```

Component layout:

```
src/components/
  layout/
    AppShell.tsx              ← Outlet + bottom nav
    BottomNav.tsx
  team/
    TeamSlotGrid.tsx          ← 6 slots, "+" empty state
    SpeciesSearchSheet.tsx    ← sheet for add-slot
    TeamBuilder.tsx           ← composition for /teams/$teamId
    TeamCard.tsx              ← list card for /teams
    SlotEditor/
      OverviewPanel.tsx
      StatsPanel.tsx
      MovesPanel.tsx
      ItemPanel.tsx
      MoveSearchSheet.tsx
      ItemSearchSheet.tsx
  ui/                          ← shadcn primitives
```

## Schema and backend changes

### `convex/schema.ts`

Champions adjustments (breaking, but dev-stage data is minimal):

- **New**: `statPoints: stats` (six-stat block, values 0–32, sum ≤ 66). Replaces `evs` semantically. The field rename prevents value collision (old EV values up to 252 would be invalid for Champions).
- **Drop**: `evs` from `members[]` element.
- **Keep deprecated, optional**: `ivs: v.optional(stats)`. UI does not edit, server does not read. Reasoning: existing dev data still validates, and re-adding later is migration-free if a future regulation reintroduces IVs. Schema comment marks it as "unused under Champions".
- **Rename**: `nature: v.string()` → `statAlignment: v.string()` (default `"Serious"`). Validators accept the 21 Champions alignments.
- **New**: `nickname: v.optional(v.string())`.
- **New**: `level: v.optional(v.number())` (server-side default 50; UI renders read-only badge only).
- **New**: `teraType: v.optional(v.string())` (Showdown type ID, e.g. `"flying"`). Written only when the regulation enables Tera; otherwise undefined.

Final `teams.members[]` element schema:

```ts
{
  species: v.string(),
  ability: v.string(),
  item: v.optional(v.string()),
  statAlignment: v.string(),               // formerly nature
  moves: v.array(v.string()),              // up to 4
  statPoints: v.object({                   // formerly evs, new range
    hp: v.number(), atk: v.number(), def: v.number(),
    spa: v.number(), spd: v.number(), spe: v.number(),
  }),
  ivs: v.optional(v.object({...stats})),   // deprecated, locked at 31
  level: v.optional(v.number()),           // Champions: 50
  nickname: v.optional(v.string()),
  teraType: v.optional(v.string()),        // only with Tera gimmick
  gimmick: v.optional(v.object({           // Mega activation, etc.
    kind: v.union(v.literal("mega"), v.literal("tera"), v.literal("z"), v.literal("dynamax")),
    details: v.optional(v.string()),
  })),
}
```

**Migration**: the Convex schema update drops `evs` and adds `statPoints`. Dev-stage data today is a single team with at most a few members from `addMember`. Acceptance: redeploy Convex dev once and re-create the test team manually if needed. No backfill script required.

### Constants in `src/lib/champions.ts` (new)

```ts
export const SP_TOTAL_BUDGET = 66;
export const SP_PER_STAT_CAP = 32;
export const STAT_ALIGNMENTS: readonly string[] = [
  "Serious",                                       // neutral
  "Lonely","Adamant","Naughty","Brave",            // +Atk
  "Bold","Impish","Lax","Relaxed",                 // +Def
  "Modest","Mild","Rash","Quiet",                  // +SpA
  "Calm","Gentle","Careful","Sassy",               // +SpD
  "Timid","Hasty","Jolly","Naive",                 // +Spe
];
export const NEUTRAL_ALIGNMENT = "Serious";
export const CHAMPIONS_LEVEL = 50;
```

This list is the mainline-natures set minus Docile/Hardy/Bashful/Quirky. The implementer should cross-check against current Champions documentation; the list is not enforced by the schema.

### New / changed Convex functions (`convex/teams.ts`)

| Name | Type | Purpose |
| --- | --- | --- |
| `teams.list` | query | All teams of a regulation, sorted by `_creationTime` desc |
| `teams.get` | query | One team by id |
| `teams.create` | mutation | New empty team with `name = "Untitled team"` |
| `teams.rename` | mutation | Set name |
| `teams.remove` | mutation | Delete team (no cascade needed; members live in the same doc) |
| `teams.updateMember` | mutation | `(teamId, slotIndex, patch)` → merge, validate species/item legality; move legality stays deferred |
| `teams.removeMember` | mutation | `(teamId, slotIndex)` → drop slot |
| `teams.getOrCreateForRegulation` | mutation | **legacy**; mark deprecated in JSDoc until UI fully migrates |

Existing `teams:addMember` stays — the new code paths no longer call it, but it is not removed until no caller remains.

### PokeAPI client extension (`src/lib/pokeapi.ts`)

- Extend `PokeApiPokemon` with `moves: Array<{ move: { name: string, url: string } }>` (PokeAPI already returns this).
- New: `fetchMoveBySlug(slug)` → `{ name, type, damageClass, power, accuracy, pp, priority }` with the same caching strategy.
- New: `getItemSpriteUrl(showdownId)` → `https://play.pokemonshowdown.com/sprites/itemicons/{id}.png` (pure string function, no fetch).

## Issue decomposition (Copilot-friendly, granular)

Order is implementation order. Each issue is scoped so that one PR yields a clearly verifiable result. Gaps (Battle content, Manage features beyond list/rename/delete, move legality, PWA icons, desktop sidebar) are accepted explicitly.

### Phase A — Schema & Backend (4 issues)

**A0 · Rename regulation code to the official identifier "M-A"**
- Files: `convex/seed.ts`, `convex/seed.test.ts`, `convex/teams.test.ts`
- Today: `regulations.code = "champions-mega"` (descriptive, not official). The Pokémon Company calls the regulation **M-A**; the `name` field already reads "Champions — Set M-A".
- Action: replace every occurrence of `"champions-mega"` with `"M-A"`. `name` stays "Champions — Set M-A" (or optionally shortens to "Regulation Set M-A" — not strictly part of this issue).
- Frontend impact: none. `regulations:getActive` filters by `isActive`; no `src/` code references the code string.
- Acceptance: `pnpm test` green; `pnpm exec convex run seed:seedChampionsRegulation` (or `pnpm seed:champions`) produces a regulation row with `code: "M-A"`. Any existing entry with `code: "champions-mega"` in the dev Convex deployment must be deleted or patched once — implementer notes this in the PR body.
- **Order**: this issue must merge **before A1** so all subsequent tests run against the new code from the start.

**A1 · Schema migration to the Champions stat system**
- Files: `convex/schema.ts`, `src/lib/champions.ts` (new)
- Schema changes on the `members[]` element:
  - **Drop** `evs`. **Add** `statPoints: stats` (per-stat 0–32, server validator enforces sum ≤ 66 and per-field max 32).
  - **Rename** `nature` → `statAlignment` (server-side default `"Serious"` where applicable).
  - **Keep deprecated**: `ivs: v.optional(stats)` with a schema comment.
  - **Add**: `level: v.optional(v.number())`, `teraType: v.optional(v.string())`, `nickname: v.optional(v.string())`.
- `src/lib/champions.ts`: constants `SP_TOTAL_BUDGET=66`, `SP_PER_STAT_CAP=32`, `NEUTRAL_ALIGNMENT="Serious"`, `STAT_ALIGNMENTS` (21-value list), `CHAMPIONS_LEVEL=50`. Shared between frontend and Convex (via `import` in `convex/teams.ts`).
- Migration: dev Convex may discard old test data — clean the single dev test team via `teams:remove` and re-create. No backfill needed.
- Acceptance: `pnpm typecheck` green, Convex dev redeployed, a freshly inserted slot contains `statPoints: { hp: 0, ... }` and `statAlignment: "Serious"`.

**A2 · Multi-team Convex queries and mutations**
- Files: `convex/teams.ts`
- Add: `list`, `get`, `create`, `rename`, `remove`. `getOrCreateForRegulation` stays, with `@deprecated` JSDoc and a migration note.
- Acceptance: functions callable via `pnpm exec convex run`, strict input validators, race conditions (rename during delete) fail safely.

**A3 · Per-member mutations: updateMember, removeMember**
- Files: `convex/teams.ts`
- `updateMember(teamId, slotIndex, patch)`: deep merge + validation
  - Species in `legalSpecies`, item in `legalItems`, gimmick kind in `activeGimmicks`
  - `statPoints`: each stat 0–32, sum ≤ 66 (`SP_TOTAL_BUDGET`)
  - `statAlignment` in the constants list from `src/lib/champions.ts`
  - Move legality: TODO comment with a Phase-2 reference
- `removeMember(teamId, slotIndex)`: remove the slot completely. Order is preserved; the builder UI iterates indices 0…5 with empty fallback. Acceptance criterion: after `removeMember(slot=2)` the `members.length` decreases by one.
- Acceptance: mutations testable, validation errors clearly worded (e.g. `"statPoints sum exceeds 66 (got 71)"`).

### Phase B — Frontend foundation (4 issues)

**B1 · Design tokens and fonts**
- Files: `src/index.css`, `index.html`
- Google Fonts link for Instrument Serif, Geist, JetBrains Mono in `index.html` (preconnect + display=swap).
- `@theme` in `src/index.css`: color tokens (`--color-ink`, `--color-paper`, `--color-ember`, `--color-fog-50…900`, 18 type tokens), font tokens (`--font-display`, `--font-body`, `--font-mono`), radius tokens, shadow tokens.
- Remove the existing `--color-brand-navy` and `--color-brand-cream`, provided no component uses them (search the code).
- `body { font-family: var(--font-body); background: var(--color-paper); color: var(--color-ink); }`.
- Acceptance: visual spot-check on the home page — tokens apply, no console errors.

**B2 · Install shadcn primitives**
- Files: `src/components/ui/*` (new)
- `pnpm dlx shadcn@latest add sheet dialog tabs slider select card badge label separator scroll-area tooltip dropdown-menu`
- Optionally in the same PR: review primitives against the design-token naming scheme (shadcn uses `--background`, `--foreground`, etc. — either map them in `index.css` or adjust the primitive files). The `index.css`-mapping variant is more robust against shadcn updates.
- Acceptance: `pnpm check` green, `pnpm build` green.

**B3 · AppShell + BottomNav**
- Files: `src/components/layout/AppShell.tsx`, `src/components/layout/BottomNav.tsx`, `src/routes/__root.tsx`
- AppShell: flex column, `min-h-dvh`, content scrolls, bottom nav sticky.
- BottomNav: three tabs (Build → `/teams/new`, Manage → `/teams`, Battle → `/battle`). Uses TanStack Router `Link` with `activeProps`. Lucide icons (`Hammer`, `LayoutGrid`, `Swords`). Labels in display italic small caps.
- Refactor `__root.tsx` so `<AppShell>` wraps `<Outlet />`.
- Acceptance: navigation works, active tab visually distinct, safe-area applies in iOS Simulator (web devtools).

**B4 · Route skeleton and index redirect**
- Files: `src/routes/teams.index.tsx`, `src/routes/teams.new.tsx`, `src/routes/teams.$teamId.tsx`, `src/routes/teams.$teamId.slot.$slotIndex.tsx`, `src/routes/battle.tsx`, `src/routes/index.tsx`
- All four new routes get minimal placeholder content (heading + lorem note) so the route tree generates.
- `index.tsx` becomes `loader: () => redirect({ to: '/teams/new' })`.
- Acceptance: every route reachable, no 404, `pnpm typecheck` green.

### Phase C — Team-builder core (4 issues)

**C1 · TeamSlotGrid (empty slot with "+", filled slot)**
- Files: `src/components/team/TeamSlotGrid.tsx`
- Pure component, props: `members: TeamMember[]`, `teamId: string`, `onAddSlot(slotIndex): void`.
- Layout: 2 cols < sm, 3 cols sm-md, 6 cols ≥ lg. Slot height = slot width (aspect-ratio).
- Empty: 96×96 minimum, centered "+", `border-dashed` in `--color-fog-300`, hover/active state in `--color-ember`.
- Filled: sprite (PokeAPI via `useQuery`), species name in display italic, small ability and item badges in JetBrains Mono. Click → link to `/teams/$teamId/slot/$slotIndex`.
- Acceptance: no Storybook needed — manual mock props in `teams.$teamId.tsx` are enough.

**C2 · SpeciesSearchSheet**
- Files: `src/components/team/SpeciesSearchSheet.tsx`, optional refactor of `src/components/PokemonSearch.tsx`
- shadcn `Sheet`, slide-up from the bottom. Search input (Geist 400), list of `regulation.legalSpecies` with sprite preview (TanStack Query, `staleTime: Infinity`, `IntersectionObserver` lazy-load for the first 30 results).
- Selection → calls `teams:updateMember(teamId, slotIndex, { species, ability: first default ability, statPoints: { hp:0, atk:0, def:0, spa:0, spd:0, spe:0 }, statAlignment: "Serious", moves: [], level: 50 })`. Sheet closes.
- Refactor question: extract logic from `PokemonSearch.tsx` into a `useSpeciesSearch(query)` hook, or replace `PokemonSearch.tsx` outright. Recommendation: extract; the old caller (`/`) is removed by B4 anyway.
- Acceptance: slot fills, sprite appears, sheet closes cleanly.

**C3 · TeamBuilder + save/rename**
- Files: `src/components/team/TeamBuilder.tsx`, `src/routes/teams.$teamId.tsx`
- Composition: header (team name in large display italic, pencil icon → rename dialog, regulation chip), `TeamSlotGrid`, footer actions (`Delete team` as a quiet ghost button).
- Rename dialog: shadcn `Dialog` with input + save button, calls `teams:rename`. Untitled teams (`name === "Untitled team"`) show a small ember pulse on the pencil as a nudge.
- Delete: `Dialog` with confirmation ("Delete team and all 6 members?"). On confirm → `teams:remove`, redirect to `/teams`.
- Acceptance: rename, delete, slot grid all wired up.

**C4 · ManagePage (team list)**
- Files: `src/routes/teams.index.tsx`, `src/components/team/TeamCard.tsx`
- Query: `teams:list(activeRegulationId)` (regulation comes from `regulations:getActive`).
- TeamCard: name (display italic), member count as "4 of 6 members" in Geist, sprite row (small 32×32). Three-dot dropdown: Rename, Delete.
- Empty state: centered message "You haven't built a team yet" + primary "Start building" → `/teams/new`.
- Acceptance: list renders, cards link to `/teams/$id`, rename and delete from the dropdown work.

### Phase D — Per-Pokémon editor (6 issues)

**D1 · SlotEditor layout (sticky header + tabs)**
- Files: `src/routes/teams.$teamId.slot.$slotIndex.tsx`, `src/components/team/SlotEditor/Layout.tsx`
- Layout: sticky header with back button, sprite, species name, Tera-type chip (right side).
- Body: `Tabs` with four tabs (Overview, Stats, Moves, Item). Default tab via search param (`?tab=overview`).
- Loader: fetch `teams:get(teamId)` and read `members[slotIndex]`. If the slot is empty → redirect to `/teams/$teamId`.
- Acceptance: navigation across all tabs works, back button returns to the builder.

**D2 · OverviewPanel (ability, stat alignment, nickname, optional Tera, optional Mega)**
- Files: `src/components/team/SlotEditor/OverviewPanel.tsx`
- **Ability**: radio list of abilities from the PokeAPI species detail (hidden ability clearly labeled).
- **Stat Alignment**: `Select` with the 21 Champions alignments from `STAT_ALIGNMENTS` (default "Serious"). Shows the stat modifier on the right (e.g. "Adamant · +Atk / -SpA"); pure UI hint, the stored value is just the name.
- **Nickname**: text input, display-italic placeholder "No nickname".
- **Level**: read-only badge "Level 50", not editable (Champions lock). Code comment references `CHAMPIONS_LEVEL`.
- **Tera Type** (conditional): rendered only if `regulation.activeGimmicks` includes `"tera"`. Currently M-A: block hidden. When active: `Select` of the 18 types, each option in its type color.
- **Mega Toggle** (conditional): rendered only if `regulation.activeGimmicks` includes `"mega"` AND the species has a mega form (detection: heuristic over Showdown-id suffix `mega`/`megax`/`megay` in `regulation.legalSpecies`, or via the currently held item being a mega stone). Toggle sets `gimmick: { kind: "mega", details: <stone-id> }`. The heuristic may stay coarse in this iteration (acceptance explicitly allows "may misclassify rare cases").
- All edits go through `teams:updateMember`, debounced (300 ms) for text inputs, immediate for selects/toggles.
- Acceptance: persistence after reload, every field responsive, Tera block invisible under M-A, level badge shows 50.

**D3 · StatsPanel (stat points with 66-point budget)**
- Files: `src/components/team/SlotEditor/StatsPanel.tsx`
- Six stat rows (HP, Atk, Def, SpA, SpD, Spe). Each row: stat name, base stat (small mono), **slider (0–32, step 1)**, number input, `−`/`+` buttons (step 1).
- Header: **"Stat Points · X / 66"** in JetBrains Mono. Once the total reaches 66, further increases are blocked at the UI layer (slider and `+` button visually disabled).
- Stat-alignment hint: small icon/badge on the affected rows (e.g. `+` next to Atk and `−` next to SpA for "Adamant"); pure visualization, does not change values.
- IVs: **no UI block**, not displayed at all (Champions hard-locks at 31). Implementer note as code comment.
- Optional visual touch: thin ember progress bar in the header as "used budget".
- Auto-persist via `teams:updateMember({ statPoints })`.
- Acceptance: 66-point limit hard-enforced (UI also clamps manual number-input entries on blur), persistence after reload.

(D3a IV editor is dropped — IVs do not exist in Champions.)

**D4 · MovesPanel + MoveSearchSheet**
- Files: `src/components/team/SlotEditor/MovesPanel.tsx`, `src/components/team/SlotEditor/MoveSearchSheet.tsx`
- Four move slots. Empty: "+", filled: move name + type chip + damage-class indicator (physical/special/status).
- Slot click → MoveSearchSheet (slide-up). Search filters moves from the PokeAPI species detail (`pokemon.moves[]`). Move detail (type, power, accuracy, PP) lazy via `fetchMoveBySlug`.
- Move legality (level-up vs. TM, form-specific) is **explicitly not validated** — acceptance note: "treats `pokemon.moves[]` as a flat candidate list".
- Acceptance: 4 slots editable, persistence, type chips colored.

**D5 · ItemPanel + ItemSearchSheet**
- Files: `src/components/team/SlotEditor/ItemPanel.tsx`, `src/components/team/SlotEditor/ItemSearchSheet.tsx`
- Search filters `regulation.legalItems`. Render: item sprite (`getItemSpriteUrl`), item name in Geist.
- "No item" option (`item: undefined`).
- Acceptance: item set + cleared, sprite loads.

**D6 · PokeAPI client extension (moves, fetchMoveBySlug, item-sprite)**
- Files: `src/lib/pokeapi.ts`, `src/lib/pokeapi.test.ts`
- Extend `PokeApiPokemon` with `moves`.
- `fetchMoveBySlug(name)`: GET `/move/{name}`, caching like `fetchPokemonBySlug`.
- `getItemSpriteUrl(showdownId): string`.
- Tests: mock fetch for `fetchMoveBySlug`, plain string assertion for `getItemSpriteUrl`.
- Acceptance: tests green, hooks usable from D4/D5.

### Phase E — Polish & sync (3 issues)

**E1 · Empty-state copy and polish pass**
- Files: every empty state in C/D
- Polish copy in the Tactical-Almanac tone. Example: "No team yet. Build your six." instead of generic "Create new team".
- Acceptance: spot-check per empty state.

**E2 · README + CLAUDE.md sync**
- Files: `README.md`, `CLAUDE.md`
- README: status onto the new phase. Tech-stack mention (fonts, tokens). Getting-started steps unchanged.
- CLAUDE.md: extend "Architecture → Frontend" with the new routes + component paths. Review the files-you-may-edit list (`src/index.css` is already in; AppShell components belong to the implementer).
- Acceptance: PR diff shows doc updates synchronized with code.

**E3 · Remove `getOrCreateForRegulation`**
- Files: `convex/teams.ts`, possibly `src/components/PokemonDetailCard.tsx` if not handled in B4 already.
- Once all frontend callers have migrated: drop the legacy function.
- Acceptance: no callers remain, `pnpm check` and Convex dashboard green.

## Gaps — accepted on purpose

| Gap | Reasoning | Future phase |
| --- | --- | --- |
| Battle Navigator content | spec still open | later |
| Manage features (Poképaste import/export, duplicate, share) | not in current scope | Phase 2 |
| Server-side move legality | needs complex data (level-up + TM + form) | Phase 2 |
| Mega/Tera activation in the builder | happens at battle time, not at build time | later |
| PWA icon set + complete manifest | separate asset track | parallel |
| Desktop sidebar layout | mobile-first is the anchor; desktop accepts the bottom bar for now | later |
| Damage calculator, speed tiers, type coverage | Phase 2+ | later |
| Verify Champions stat-alignment list | the list in `src/lib/champions.ts` is current per known docs but may shift with game updates | maintain as needed |
| Mega-form detection (ability and stat display of the mega form) | complex data mapping (Charizardite-Y → Charizard-Mega-Y), polish | later |
| Showdown format `gen9vgc2026regi` as a data-source proxy for Champions M-A | Showdown does not yet (May 2026) provide a Champions-specific format entry. The current seed delivers a mainline-VGC approximation. The comment in `scripts/seed-champions.ts:7` already flags this. | once Showdown or another source publishes Champions data, write a new seeder |

None of these gaps block the plan. All required schema hooks (multi-team, slot index, new member fields) are in place, so future extensions can be additive.

## End-to-end verification

After all issues:

1. Run `pnpm convex:dev` and `pnpm dev` in parallel.
2. Browser → `http://localhost:5173/`, expect a redirect to `/teams/new`.
3. Bottom nav renders three tabs.
4. "New team" → automatically creates a team named "Untitled team", slot grid shows six "+".
5. Tap slot 1 → SpeciesSearchSheet → pick a species → sprite appears in the slot.
6. Tap slot 1 again → SlotEditor opens as a full-screen route → click through tabs: change ability, allocate stat points (counter "X / 66" responds, `+` disabled at 66, single stat capped at 32), assign a move, assign an item, switch stat alignment to "Adamant", set nickname, level badge shows 50, Tera block is hidden.
7. Header pencil → rename dialog → save as "My VGC team".
8. Manage tab → team appears with sprite row. Dropdown "Rename" / "Delete" works.
9. Battle tab → placeholder content, no crash.
10. Reload on every route → state persists (Convex persistence).
11. iOS Safari + Android Chrome (devtools emulator is fine): bottom bar respects the safe area, every tap target ≥ 44px.

Tests: `pnpm test` (PokeAPI client extension) and `pnpm check` green as the minimum requirement per PR.

## Critical files (maintainer scope)

- `convex/seed.ts` + `convex/seed.test.ts` + `convex/teams.test.ts` (A0)
- `convex/schema.ts` (A1)
- `src/lib/champions.ts` (A1, new — constants for SP cap, alignment list, level)
- `src/index.css` (B1)
- `package.json` (if shadcn scripts change, B2)
- `index.html` (font preconnect, B1)
- `vite.config.ts` (PWA manifest update is a separate track)
- `README.md`, `CLAUDE.md` (E2)

All other files (`src/components/*`, `src/routes/*`, `convex/teams.ts` business logic) belong to implementer scope and ship via the issues above.
