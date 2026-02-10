# Organic Eight Ball

Browser learning toy with a billiards-style 8-ball table where each settled shot reveals a
functional-group structure image for students to identify.

## Quick start

- Preferred startup (local server):
- `/opt/homebrew/opt/python@3.12/bin/python3.12 -m http.server 8000`
- Open `http://localhost:8000/index.html` in a browser.
- Direct `file://` open is supported with a reduced fallback group set and an in-app warning.
- Setup defaults to `1` human player and `1` NPC (editable in setup panel).
- First-run onboarding appears once and explains the answer-first shot gate.
- Gameplay loop:
- Answer correctly to unlock your shot.
- Pick one multiple-choice functional-group button.
- Click and drag from the white cue ball to aim and set power.
- Release to shoot.
- After balls settle, a new question appears.
- Use `Rack and Break` to reset the table and start a new shot sequence.

## Features

- Pool-table simulation with cushions, six pockets, cue-ball shooting, and ball-ball collisions.
- Top status banner shows mode, active player, and shot lock/unlock state.
- Cue-ball affordance on active human turn with helper text near the cue ball.
- Multiple-choice functional-group answering for faster turn flow.
- Hard gate: a shot is locked until the current question is answered correctly.
- Multi-player turn rule: if a player answers incorrectly, turn passes immediately to next player.
- Supports mixed rosters of human players and NPCs set at game start.
- Functional-group image cards loaded from `functional_groups.json`.
- Alias-based answer checking for common group-name variants.
- Running score tracker for quick classroom practice loops.
- Product terminology note: this is a pool-themed quiz, not full regulation 8-ball rules.
