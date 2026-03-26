# CraftMind Herding — AI Redesign

> Adapting the fishing game's agent breakthroughs for multi-dog herding simulation.

## What Changes

The existing herding system has `HerdingDog` as a state machine with 4 skill levels and 4 personality presets. It works, but dogs are interchangeable — same logic, different numbers.

**The fishing game taught us:** agents with real personality, memory, relationships, self-improving scripts, and comparative evaluation create emergent stories players care about.

**This redesign:** each dog becomes a full Agent with personality axes (not presets), memory, relationships, trust bonds, energy, self-improving skills, and pack dynamics that emerge from interaction.

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  src/ai/ (new layer)                               │
│  ┌─────────────┐  ┌──────────────────┐             │
│  │ DogAgent    │  │ PackDynamics     │  emergent   │
│  │ (per dog)   │←→│ (team behavior)  │  roles,    │
│  │ personality │  │ rivalry, mentor  │  coord.    │
│  │ memory      │  │ preferred posns  │             │
│  │ skills      │  └──────────────────┘             │
│  │ energy      │  ┌──────────────────┐             │
│  │ trust       │  │ DogTrust         │  player-dog │
│  └──────┬──────┘  │ bond system      │  bond arc   │
│         │         └──────────────────┘             │
│         ▼                                           │
│  ┌─────────────┐  ┌──────────────────┐             │
│  │ HerdingEval │  │ HerdingActions   │             │
│  │ comparative │  │ command schema   │             │
│  │ which dog   │  │ HERD, FLANK, etc │             │
│  │ combo works │  └──────────────────┘             │
│  └─────────────┘                                   │
└─────────────────────────────────────────────────────┘
```

## A. Dog Agent System

Each dog is a `DogAgent` with:

### Personality Axes (0-1 continuous, not presets)
- **speed**: slow (0) → fast (1) — affects movement and reaction time
- **patience**: restless (0) → patient (1) — how long before giving up
- **obedience**: stubborn (0) → obedient (1) — command compliance
- **social**: lone wolf (0) → pack (1) — preference for group work
- **bravery**: timid (0) → brave (1) — reaction to predators/storms
- **gentleness**: rough (0) → gentle (1) — pressure on flock

### Skills (self-improving)
Each skill is a named approach the dog uses. After each herding run, the evaluator scores which skill variant worked best. Dogs preferentially use higher-scoring variants.

- **heel** — walk alongside the flock without spooking
- **flank** — arc around from left or right
- **drive** — push flock toward target
- **gather** — bring stragglers back
- **hold** — stay in position, keep flock grouped
- **shed** — separate individual animal from group
- **recall** — return to handler
- **guard** — watch flock without directing

### Memory
- Past herding runs: which approach, what worked, what didn't
- Preferred positions (Rex always leads, Biscuit always flanks)
- Emotional peaks: worst scatter, best gather, trust milestones

### Relationships
- **Trust with player** (0-100): gates advanced commands
- **Bond with other dogs** (0-100): affects coordination quality
- **Rivalry score** (0-100): emerges from competing for lead

### Energy
- Depletes with activity, regenerates with rest
- Tired dogs make worse decisions, slower reactions
- Kennel provides faster regen

## B. Herding Action Schema

```js
{ type: 'HERD',       params: { targetPen: 'north_pen', strategy: 'basic' } }
{ type: 'FLANK_LEFT', params: { radius: 12 } }
{ type: 'FLANK_RIGHT',params: { radius: 12 } }
{ type: 'HOLD',       params: { position: [x,y,z] } }
{ type: 'GATHER',     params: { animalId: 3 } }
{ type: 'DRIVE',      params: { direction: 'north', intensity: 0.7 } }
{ type: 'SHED',       params: { animalId: 5, direction: 'east' } }
{ type: 'RECALL',     params: {} }
{ type: 'GUARD',      params: { position: [x,y,z] } }
{ type: 'ALERT',      params: { target: 'wolf', position: [x,y,z] } }
{ type: 'REST',       params: {} }
```

## C. Dog Personality Examples

| Dog | Speed | Patience | Obedience | Social | Bravery | Gentleness | Tagline |
|-----|-------|----------|-----------|--------|---------|------------|---------|
| Rex | 0.8 | 0.4 | 0.7 | 0.6 | 0.8 | 0.5 | "I've got this. Watch and learn." |
| Biscuit | 0.4 | 0.9 | 0.8 | 0.7 | 0.5 | 0.9 | Gentle with lambs. Won't chase hard. |
| Thunder | 0.9 | 0.3 | 0.2 | 0.5 | 0.9 | 0.3 | Ignores commands when he "knows better." |
| Sadie | 0.5 | 0.6 | 0.5 | 0.8 | 0.2 | 0.8 | Eager to please but scares easily. |
| Old Blue | 0.2 | 0.95 | 0.9 | 0.9 | 0.7 | 0.8 | Wise, slow. Teaches the young ones. |

## D. Emergent Pack Dynamics

- **Rivalry**: Rex and Thunder compete for lead → `PackDynamics` tracks lead challenges
- **Mentorship**: Old Blue near Sadie → bond increases, Sadie's bravery grows
- **Preferred roles**: Dogs gravitate to positions matching their personality over time
- **Coordination**: Dogs cover escape routes without explicit command
- **Bark communication**: Dogs alert each other to stragglers, threats, completion

## E. Comparative Evaluation for Herding

Adapts `ComparativeEvaluator` from fishing:

- **Session scoring**: completion rate, time, flock stress, efficiency, panics
- **Condition matching**: season, animal type, terrain, dog combo, weather
- **Insight extraction**: "flanking left works 1.8x better than right for sheep in spring"
- **Script ranking**: which skill variant + which dog combo performs best

## F. Player-Teaching Mechanics

- Player gives natural commands → `HerdingActions` interprets
- Dog obedience trait determines compliance
- Trust gates advanced commands (shed, guard)
- Low-trust dogs (Sadie) ignore commands until bond is built

## G. Cross-Game Synergy

- Herding dogs protect Ranch animals
- Dog personality influenced by Ranch breeding genetics
- Courses teaches animal behavior theory
- Shared `ComparativeEvaluator` engine with Fishing
