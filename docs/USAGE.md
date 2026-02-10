# Usage

Use this project as a browser game: answer a functional-group question, then take a pool shot.

## Quick start

1. Start a local server from the repo root:

```bash
/opt/homebrew/opt/python@3.12/bin/python3.12 -m http.server 8000
```

2. Open [http://localhost:8000/index.html](http://localhost:8000/index.html).
3. In setup, pick player counts and click `Start Game`.

## Game loop

- Answer the displayed functional-group prompt using multiple-choice buttons.
- Correct answer unlocks the shot for the active human player.
- Click and drag from the white cue ball to aim and set power.
- Release to shoot.
- After balls settle, a new question appears.

## Run modes

- Local server mode: full `functional_groups.json` content.
- Direct file mode (`file://`): supported with reduced fallback groups and an in-app warning.

## Controls

- `Rack and Break`: reset the table and begin a new shot sequence.
- `Next Group`: draw a new functional-group prompt.
- Pointer drag on cue ball: aim and shoot when shot is unlocked.

## Inputs and outputs

### Inputs

- Player counts in setup modal (`human-count`, `npc-count`).
- Multiple-choice answer button click.
- Pointer drag gesture on cue ball for shot direction and power.

### Outputs

- Canvas table state and ball motion.
- Prompt image in `group-image`.
- Turn and score status in `answer-meta` and `status-detail`.

## Testing

Run smoke and lint tests:

```bash
/opt/homebrew/opt/python@3.12/bin/python3.12 -m pytest -q
```

## Known gaps

- TODO: Add documented gameplay rules for full regulation 8-ball only if implemented.
- TODO: Add accessibility usage notes (keyboard-only flow and screen-reader behavior).
