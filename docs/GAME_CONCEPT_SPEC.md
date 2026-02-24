# Game concept spec

## Purpose

Define the game at a concept level so future versions can be built from a clear design intent,
independent of specific code, engine, or platform choices.

## Product vision

Create a fast, playful learning game that blends a familiar skill game fantasy (pool-style shots)
with short knowledge checks (organic chemistry functional-group recognition). The game should feel
lightweight and repeatable while still producing real learning value.

## Core outcome

- Players complete many short question-and-action cycles in one sitting.
- Correct recognition of key chemistry patterns increases over repeated play.
- The game remains understandable to first-time players within minutes.

## Experience goals

- Keep each turn brief, clear, and rewarding.
- Balance challenge so players feel momentum instead of friction.
- Support solo practice and small-group/classroom play.
- Preserve a game-first feeling while keeping educational purpose explicit.

## Design pillars

### 1) Learn by looped repetition

- Present one focused recognition task at a time.
- Reinforce memory through repeated exposure and variation.
- Favor many small wins over long, high-stakes rounds.

### 2) Action tied to knowledge

- Link game agency (taking a shot) to successful question response.
- Make the relationship between answer quality and turn outcome obvious.
- Keep failure states instructive and forward-moving, not punitive.

### 3) Readable state and fairness

- Always communicate whose turn it is, what action is expected, and what unlocks progress.
- Apply rules consistently across human and automated participants.
- Avoid hidden mechanics that confuse new players.

### 4) Fast reset and replayability

- Allow immediate continuation after each turn.
- Encourage repeated rounds without lengthy setup.
- Keep session length flexible for classroom, study, or casual play windows.

## Target audience

- Primary: students learning introductory organic chemistry concepts.
- Secondary: instructors and tutors needing a quick engagement tool.
- Tertiary: curious players who enjoy short educational games.

## Gameplay concept (implementation-agnostic)

- The game alternates between two phases:
- Question phase: the active player identifies a chemistry concept.
- Action phase: the active player performs a pool-themed shot interaction.
- Turn progression depends on answer correctness and the resulting shot outcome.
- The cycle repeats until session stop conditions are met.

## Learning model

- Focus on recognition before deeper synthesis.
- Use immediate feedback to correct misunderstandings quickly.
- Revisit prior concepts over time to strengthen recall.
- Keep question presentation varied enough to reduce memorization by position alone.

## Motivation and progression

- Provide clear short-term goals each turn.
- Track performance over a session to show improvement.
- Support lightweight competition (player vs player and player vs NPC).
- Allow optional rarity/surprise moments to sustain attention.

## Difficulty and balancing

- Keep baseline play accessible to beginners.
- Increase challenge through content complexity, not interface complexity.
- Ensure mistakes cost progress in a way that feels fair and teachable.
- Tune pacing so downtime between meaningful actions stays low.

## UX and accessibility principles

- Prioritize legible visuals and plain-language status messaging.
- Minimize required instructions by making next actions obvious in context.
- Support common classroom hardware and typical browser environments.
- Design for eventual accessibility improvements (input alternatives, readable contrast, text clarity).

## Audio and visual direction (conceptual)

- Use audiovisual cues to reinforce state changes and outcomes.
- Keep presentation playful, chemistry-themed, and easy to parse at a glance.
- Favor clarity over ornamental effects that can obscure gameplay state.

## Content principles

- Use chemistry content that is accurate, curriculum-aligned, and concise.
- Accept common naming variants where educationally appropriate.
- Organize question content so it can grow over time without redesigning core rules.

## Non-goals

- Full simulation of regulation 8-ball rules.
- Comprehensive organic chemistry mastery in a single game mode.
- Dependency on any specific rendering framework, physics library, or backend stack.

## Success criteria

- New players can explain the turn loop after one round.
- Players can complete multiple turns quickly without facilitator help.
- Session results show visible learning progress within a play period.
- Instructors can use the game as a repeatable practice activity with minimal setup.

## Future-facing design constraints

- The concept should remain portable across platforms and tech stacks.
- Rules and learning goals should stay stable even if presentation changes.
- New modes should extend, not replace, the core question-action loop.
