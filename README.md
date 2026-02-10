# Organic Eight Ball

Browser learning toy with a billiards-style 8-ball table where each settled shot reveals a
functional-group structure image for students to identify.

## Quick start

1. Get the repo:
- New to Git: use ZIP download steps in [docs/INSTALL.md](docs/INSTALL.md).
- Using Git:
```bash
git clone https://github.com/vosslab/organic-eight-ball.git
cd organic-eight-ball
```
2. Start a local server from repo root:
```bash
/opt/homebrew/opt/python@3.12/bin/python3.12 -m http.server 8000
```
3. Open [http://localhost:8000/index.html](http://localhost:8000/index.html).

Direct `file://` open is supported with a reduced fallback group set and an in-app warning.

## Beginner docs

- Install guide: [docs/INSTALL.md](docs/INSTALL.md)
- Usage guide: [docs/USAGE.md](docs/USAGE.md)
- Changelog: [docs/CHANGELOG.md](docs/CHANGELOG.md)

## Features

- Pool-table simulation with cushions, six pockets, cue-ball shooting, and ball-ball collisions.
- True 8-ball rack identity model: cue plus balls 1-15 with black 8 near rack center.
- Object-ball visuals: readable numbers, solid/stripe styling, and rolling decal rotation.
- Pocketed balls remain visible in tray clusters near their pocket locations.
- Top status banner shows mode, active player, and shot lock/unlock state.
- Status HUD includes per-player pocket/quiz stats and team quiz totals.
- Cue-ball affordance on active human turn with helper text near the cue ball.
- Multiple-choice functional-group answering for faster turn flow.
- Hard gate: a shot is locked until the current question is answered correctly.
- Multi-player turn rule: if a player answers incorrectly, turn passes immediately to next player.
- Supports mixed rosters of human players and NPCs set at game start.
- Collision and pocket sounds with speed-scaled volume and a `Sound: On/Off` toggle.
- Functional-group image cards loaded from `functional_groups.json`.
- Alias-based answer checking for common group-name variants.
- Running score tracker for quick classroom practice loops.
- Product terminology note: this is a pool-themed quiz, not full regulation 8-ball rules.
