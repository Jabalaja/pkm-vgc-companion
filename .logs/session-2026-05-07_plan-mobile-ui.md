# Session Log: 2026-05-07 Plan Creation — Mobile-First UI Slice

**Date:** 2026-05-07  
**Session:** Plan creation and GitHub Issues workflow  
**Duration:** ~4 hours  
**Branch:** main (session log) / plan/mobile-first-ui-slice (feature branch, PR #16 open)

---

## Executive Summary

Created a comprehensive plan document (`docs/plans/001-mobile-first-ui-slice.md`) for the mobile-first UI slice (Phase 1a build sprint), revising domain mechanics twice to align with Pokémon Champions rules. Opened 21 GitHub Issues (#17–#37) covering work units A0–E3 with explicit dependency chains. Added a Champions-vs-mainline-VGC invariant to CLAUDE.md to prevent future domain-mechanics confusion. PR #16 is open and staged; Copilot has already picked up Issue A0 (#17) on a pre-existing `copilot/rename-regulation-code-to-official-m-a` branch.

---

## Reflection

### Domain Research Friction

Two corrections during planning revealed the same root cause: insufficient pre-planning domain research.

1. **Champions stat system** (first revision):
   - Proposed an EV editor with 510 budget, IV controls, and 25 natures — all mainline-VGC mechanics.
   - Chris corrected: Champions uses 66 Stat Points, no IVs, 21 stat alignments, level 50 fixed.
   - Cause: defaulted to training data on mainline-VGC stats instead of researching the actual game rules.

2. **M-A regulation code** (second revision):
   - Initial plan used `champions-mega` as the regulation identifier.
   - Chris asked whether the official `M-A` code was reflected in the plan.
   - Root cause: did not cross-check the seed script and backend schema (`convex/schema.ts`) against canonical terminology in the README.

### Solution Implemented

Added a permanent invariant block to `CLAUDE.md` under "Regulations as the central concept":

```markdown
### Champions regulation mechanics

The Pokémon Champions format (regulation code `M-A`) differs significantly from
mainline-VGC rules:

- **Stat system:** 66 Stat Points (SP), not EVs. No IVs. Fixed level 50.
- **Stat alignment:** 21 predefined stat alignments (e.g. "Balanced", "Phys Atk",
  "Sp Atk", ...) with name + formula. No custom IV/EV/nature tuning.
- **Legal species/items:** defined per-regulation in `regulations.legalSpecies` /
  `.legalItems`, not hardcoded.
- **Battle gimmicks:** stored as a **list** (e.g. `["mega"]`), never a single value,
  because future regulations may stack multiple gimmicks.
- **Restricted Pokémon limit:** enforced per-regulation.

Any code that assumes EVs, IVs, 25 natures, or a single battle gimmick type is
incorrect for Champions and breaks this invariant.
```

This block is committed on the feature branch (part of PR #16) and will ship to main before Phase 1a implementation begins. Future planning sessions will read it in always-loaded context, preventing the mainline-VGC default.

### Lessons Learned

- **Always cross-check identifiers:** before proposing schema or UI, verify that backend enum values and human-facing names (in README, docs, etc.) are aligned.
- **Domain-specific rules live in CLAUDE.md:** document invariants prominently enough that they appear in context on every planning call, not in a separate game-rules document.

---

## Tasks Completed

### 1. Wrote Plan Document (`docs/plans/001-mobile-first-ui-slice.md`)

**Goal:** specify Phase 1a user-facing build — navigation, team builder, per-Pokémon editor, multi-team management.

**Structure:**
- Context: phase definition, user stories, acceptance criteria
- Data model: Pokémon entity, team entity, regulation link, stat alignment logic
- UI mockups: Build/Manage/Battle nav, slot-based team builder, per-Pokémon detail view, multi-team picker
- Work units: A0–E3 with explicit dependencies and acceptance criteria for each
- Out-of-scope: search ranking, filtering (Phase 1b), tournament mode (Phase 2), PWA (later)

**Revisions:**
1. **First:** Chris corrected stat system (EV→SP, IVs, natures, alignment logic)
2. **Second:** Changed regulation identifier from `champions-mega` to official `M-A` per Chris feedback

### 2. Added Champions Invariant to CLAUDE.md

Committed to plan/mobile-first-ui-slice branch as part of PR #16. Explains the four key differences between Champions and mainline-VGC in code terms (stat system, legal entities, gimmicks, restricted limit).

### 3. Created 21 GitHub Issues (#17–#37)

All opened with the Plan template. Each issue specifies:
- Work unit code (A0, A1, …, E3)
- User story or implementation target
- Acceptance criteria (testable; some reference "manual verification" for nav/UI)
- Explicit `depends-on:` field linking to prerequisites

**Dependency chain structure:**
- **A0 (#17):** Rename `champions-mega` → `M-A` in seed + schema. Blocker for A1–E3.
- **A1–A3:** build info, regulation picker, navigation bar. A0 must ship first.
- **B1–B4:** team builder UI, slot layout, empty-state handling. Depends on A1 (picker).
- **C1–C4:** per-Pokémon editor, stat alignment picker, item/ability selectors. Depends on B4.
- **D1–D6:** multi-team management (list, new, duplicate, rename, delete, switch). Depends on B4.
- **E1–E3:** integration tests, E2E scenarios, manual test checklist. Depends on B4, C4, D6.

All issues labeled `plan` and `plan:ready` (auto-applied by template). Christopher assigned them to `Copilot` via GitHub UI (per MEMORY.md: manual only, not `gh issue edit --add-assignee`).

**A0 Status:** Copilot already picked up and started on `copilot/rename-regulation-code-to-official-m-a` branch before /eos. No action needed.

---

## Files Modified/Created

### Created

1. **`docs/plans/001-mobile-first-ui-slice.md`** (committed to plan/mobile-first-ui-slice)
   - 400+ lines; defines Phase 1a scope, data model, UI mockups, 21 work units with dependencies

### Modified

1. **`CLAUDE.md`** (committed to plan/mobile-first-ui-slice)
   - Added "Champions regulation mechanics" invariant block under "Regulations as the central concept"
   - 10 new lines documenting SP/IV/nature/gimmick/restricted-limit differences
   - Explains why hardcoding mainline-VGC rules breaks the codebase

### GitHub Issues Created (No file changes, but tracked as session output)

- #17 (A0): rename-regulation-code-to-official-m-a
- #18 (A1): build-info-screen
- #19 (A2): regulation-picker
- #20 (A3): mobile-navigation-bar
- #21 (B1): team-builder-grid-layout
- #22 (B2): slot-based-team-builder-core
- #23 (B3): empty-team-state-ui
- #24 (B4): team-builder-add-pokémon-flow
- #25 (C1): pokémon-detail-editor-modal
- #26 (C2): stat-alignment-picker
- #27 (C3): ability-and-item-selectors
- #28 (C4): pokémon-editor-completion
- #29 (D1): multi-team-list-view
- #30 (D2): create-new-team
- #31 (D3): duplicate-and-manage-teams
- #32 (D4): rename-and-delete-teams
- #33 (D5): active-team-switcher
- #34 (D6): multi-team-persistence-and-sync
- #35 (E1): unit-tests-builder-and-editor
- #36 (E2): e2e-tests-team-flow
- #37 (E3): manual-test-checklist-and-handoff

---

## Key Decisions Made

1. **Commit the plan as a long-form document:** `docs/plans/001-mobile-first-ui-slice.md` replaces an unwieldy issue body and allows deep architectural discussion while keeping the GitHub Issue as a lifecycle anchor.

2. **Invariant block in CLAUDE.md, not a separate game-rules file:** ensures every planning session reads the Champions-specific rules in the always-loaded context, preventing future mainline-VGC defaults.

3. **21 issues instead of one mega-issue:** enables parallel executor work and clear progress tracking. A0 is a true blocker; A1–A3 can parallelize; B-series depends on A finishing; C and D parallelize given B4; E depends on all.

4. **Use official `M-A` identifier throughout:** verified against README and seed script to ensure code, docs, and game rules align.

5. **Manual test checklists in E3, not in every issue:** avoids repetition while providing an exhaustive acceptance checklist at the end of the sprint.

---

## Problems Encountered and Solutions

### Problem 1: Stat System Default

**Symptom:** Initial plan proposed EV editor (510 budget, IVs, 25 natures).

**Root Cause:** Training data defaulted to mainline-VGC rules; did not research Champions format before writing the plan.

**Solution:** Chris corrected the mechanics. Updated plan to 66 SP, no IVs, 21 predefined alignments, level 50 fixed. Added Champions invariant block to CLAUDE.md.

### Problem 2: Regulation Identifier Mismatch

**Symptom:** Plan used `champions-mega` (from seed script) while README and expectation was `M-A` (official).

**Root Cause:** Did not cross-check backend schema and seed script against canonical docs.

**Solution:** Chris asked about the identifier. Revised plan and all 21 issues to use `M-A`. Added a note to CLAUDE.md invariant about official terminology.

### Problem 3: None after revisions

After two corrections, the plan, issues, and invariant block aligned and were ready for PR.

---

## Code Changes Summary

### PR #16: plan/mobile-first-ui-slice (open, waiting for review/approval)

**Commits (2):**
1. `docs: add plan for mobile-first UI slice (Phase 1a)`
   - File: `docs/plans/001-mobile-first-ui-slice.md`
   - 400+ lines covering Phase 1a: nav, team builder, per-Pokémon editor, multi-team management
   - Specifies data model, UI mockups, 21 work units (A0–E3) with explicit dependencies

2. `docs: clarify Champions regulation mechanics in CLAUDE.md`
   - File: `CLAUDE.md`
   - Added "Champions regulation mechanics" invariant under "Regulations as the central concept"
   - Documents 4 key differences: SP/IV/nature/gimmick system, legal entities, restricted limit
   - Ensures future planning sessions won't default to mainline-VGC rules

**Status:** Pushed to origin; PR open; waiting for Chris approval before merge.

---

## Next Steps / TODO

### Immediate (before Phase 1a kickoff)

1. **Review and approve PR #16** (plan/mobile-first-ui-slice)
   - Chris reviews the plan document and invariant block
   - Once approved, branch merges to main, plan document lands in repo

2. **Assign executor to A0** (Chris already assigned Copilot; branch exists)
   - `copilot/rename-regulation-code-to-official-m-a` is live
   - Copilot to finish PR, merge, confirm A0 ships with `M-A` identifier in code

### During Phase 1a (once A0 merges)

3. **Assign A1–A3 in parallel:** build info, regulation picker, navigation bar
4. **Assign B1–B4 once A3 merges:** team builder grid, slot builder, empty state, add-Pokémon flow
5. **Assign C1–C4 once B4 merges:** per-Pokémon editor, stat alignment picker, ability/item selectors
6. **Assign D1–D6 in parallel with C:** multi-team management (list, new, duplicate, rename, delete, switch)
7. **Assign E1–E3 once B4, C4, D6 merge:** unit tests, E2E tests, manual checklist

### Documentation (post-Phase 1a)

8. **Update README Phase 1 status** once E3 passes (manual test checklist)
9. **Archive session logs** (weekly summary) once Phase 1a delivery is confirmed

---

## Metrics

- **Plans created:** 1 (001-mobile-first-ui-slice.md)
- **GitHub Issues opened:** 21 (#17–#37)
- **Files modified:** 1 (CLAUDE.md)
- **Files created:** 1 (docs/plans/001-mobile-first-ui-slice.md)
- **Revisions:** 2 (stat system, regulation code)
- **Domain corrections:** 2 (mainline-VGC assumption, identifier mismatch)
- **Commits in PR #16:** 2
- **Branch status:** PR open, awaiting approval

---

## Appendix: Issue Dependency Map

```
A0: Rename to M-A (blocker)
├─ A1: Build info
├─ A2: Regulation picker
└─ A3: Navigation bar
   ├─ B1: Grid layout
   ├─ B2: Slot builder
   ├─ B3: Empty state
   └─ B4: Add Pokémon
      ├─ C1: Detail modal
      ├─ C2: Stat alignment picker
      ├─ C3: Ability/item selectors
      ├─ C4: Editor completion
      ├─ D1: Team list
      ├─ D2: Create team
      ├─ D3: Duplicate/manage
      ├─ D4: Rename/delete
      ├─ D5: Active switcher
      ├─ D6: Persistence/sync
      └─ E1–E3: Tests & manual checklist
```

---

**Session closed:** 2026-05-07 ~18:30 CEST  
**Prepared by:** Claude Code  
**Reviewed by:** N/A (session log only)
