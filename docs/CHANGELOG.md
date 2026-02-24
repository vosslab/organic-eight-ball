# Changelog

## 2026-02-24

- Added high-level game concept specification in [docs/GAME_CONCEPT_SPEC.md](docs/GAME_CONCEPT_SPEC.md)
  covering goals, design pillars, learning loop, and non-goals independent of implementation.

## 2026-02-10

- Added first playable browser prototype: `index.html`, `style.css`, and `app.js`.
- Implemented chamber simulation with moving molecule tokens, collisions, and settle detection.
- Added interaction loop for shake button, pointer drag shake, and device motion shake.
- Added controlled answer selection with two modes: physics-mapped and weighted-random.
- Added chemistry-themed prompt pool with tags, weights, and unlockable rare events in `prompts.json`.
- Updated `README.md` with quick start and feature summary.
- Added `pip_requirements.txt` and `pip_requirements-dev.txt` to satisfy repo dependency
  manifest conventions and test requirements.
- Added `rich` to `pip_requirements-dev.txt` to satisfy import policy checks for
  `devel/commit_changelog.py`.
- Replaced answer output flow with image-based functional-group identification workflow.
- Added quiz UI controls for free-text student answers, answer checking, next card, and score.
- Added `functional_groups.json` dataset with aliases for grading accepted answer variants.
- Added starter SVG functional-group cards under `assets/groups/`.
- Updated app logic to draw a group image at settle time and grade typed answers instead of
  showing prompt-based responses.
- Replaced circular chamber motion with a billiards-style table simulation to match 8-ball pool
  gameplay expectations.
- Added cue-ball drag-to-shoot interaction, table pockets, cushion rebounds, and rack reset flow.
- Locked presentation to a strict 2D top-down mode and removed render-mode toggling.
- Added two-player turn gating: incorrect answers immediately pass turn to the opponent.
- Added per-player correctness counters and active-turn status in the score readout.
- Added pre-game setup modal that asks for number of human players and number of NPCs.
- Refactored turn handling to dynamic player rosters (human and NPC participants).
- Added basic NPC auto-answer and auto-shot behavior on NPC turns.
- Added `tests/test_web_game_smoke.py` with pytest smoke checks for setup UI, JSON/assets
  integrity, turn-gating markers, and no-3D rendering guardrails.
- Fixed startup ordering so UI handlers (including `Start Game`) are installed before awaiting
  async group loading.
- Added regression smoke test to enforce input-hook installation before `await loadGroups()`.
- Reworked canvas/table presentation to a clear rectangular 16:9 2D pool-table viewport.
- Updated in-canvas table geometry to fill the frame and removed circular visual framing.
- Switched script loading from module to classic script for better `file://` local-run compatibility
  so setup/start interactions work without a local web server.
- Added Selenium smoke test `tests/test_selenium_smoke.py` to verify Start Game click hides setup
  modal, with clean skip behavior when Selenium/WebDriver is unavailable.
- Added `selenium` to `pip_requirements-dev.txt`.
- Added robust group-loading states: remote JSON, local `file://` fallback set, and explicit failure.
- Added user-facing startup error messages with exact local-server instruction instead of silent fail.
- Added Selenium startup tests for both `file://` and `http://localhost` modes with browser log
  checks when supported.
- Added smoke assertions for fallback behavior and failure messaging in
  `tests/test_web_game_smoke.py`.
- Added always-visible in-game How to Play panel with concise answer-first and cue-drag flow copy.
- Added top status banner with plain-language mode, current player, and shot lock/unlock state.
- Added cue-ball affordance improvements: pulsing highlight and near-cue helper text.
- Enforced lock-state affordance: cue drag interaction is suppressed while shot is locked and
  shows `Shot locked: answer first.`
- Added first-run onboarding overlay (3 steps) with one-time dismiss persistence in localStorage.
- Updated product copy to clarify this is a pool-themed quiz, not regulation 8-ball rules.
- Changed setup defaults to `1` human player and `1` NPC.
- Replaced free-text functional-group entry with multiple-choice answer buttons.
- Updated gameplay docs and smoke tests to cover multiple-choice flow and default setup values.
- Added beginner-focused install and usage docs: [docs/INSTALL.md](docs/INSTALL.md) and
  [docs/USAGE.md](docs/USAGE.md), including no-Git ZIP setup and local-server quick start.
- Simplified root [README.md](../README.md) quick start and added direct links to install and
  usage docs.
- Added explicit gameplay phases (`QUESTION_ACTIVE`, `SHOT_READY`, `BALLS_MOVING`) and phase
  transitions on answer correctness, shot release, and post-settle prompt.
- Fixed shot-readiness UX by hiding the question window in shot phase and restoring it for new
  questions.
- Added pointer capture plus `pointercancel`/`lostpointercapture` handling to prevent stuck drag
  state when pointer release occurs off-canvas.
- Added smoke assertions for phase markers and hidden-overlay pointer-event guardrails.
- Fixed idle relock bug by processing settle/new-question transitions only during `BALLS_MOVING`
  phase, so correct answers are not undone before a shot.
- Added centralized timeout management for NPC actions and clear-on-reset/turn-change behavior to
  prevent stale timer callbacks from firing out of turn.
- Added `Next Group` guard to block bypassing unresolved question/shot cycles.
- Added startup guards for required DOM elements and canvas context creation.
- Moved multiple-choice answer buttons into the question popup window for faster in-context play.
- P0: added deterministic NPC shot planning that targets active object balls and guarantees a
  non-zero cue-ball velocity each NPC turn.
- P0: hardened human correct-answer transition by clearing stale scheduled actions before entering
  shot-ready phase.
- Implemented true object-ball identity model with cue + balls 1-15, suit typing
  (solids/stripes/eight), and black 8-ball rack placement near center.
- Added solid/stripe/number ball rendering with rolling decal rotation based on ball velocity.
- Added pocketed-ball tray rendering near each pocket so sunk balls remain visible.
- Added shot context tracking (shooter, pocketed balls, scratch) and settle-time turn advancement.
- Added per-player pocket stats (total, solids, stripes) into HUD scoring text.
- Added collision and pocket audio hooks with impact-speed scaling and `Sound: On/Off` toggle.
- Added smoke assertions for rack identity primitives, pocket tracking/scoring markers, and audio
  hook wiring.
