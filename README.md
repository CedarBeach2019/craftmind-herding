# 🐾 CraftMind Herding

> AI sheepdog simulation — watch intelligent dogs herd flocks through pastoral landscapes.

## Features

- **Boid Flocking** — Realistic animal group behavior (separation, alignment, cohesion)
- **Herding Dog AI** — 4 skill levels (apprentice → elder) with increasing abilities
- **5 Personality Types** — Patient, energetic, steady, clever, aggressive
- **Multi-Dog Teams** — Coordinate multiple dogs for complex herding tasks
- **Scoring System** — Combo chains, time bonuses, efficiency ratings
- **Seasonal System** — Weather and terrain effects across 4 seasons
- **Teaching Progression** — Structured learning with tips at each level
- **Terrain & Pastures** — Rivers, hills, fences, and obstacles
- **5 Herding Courses** — Progressive challenges from beginner to expert

## Quick Start

```bash
npm install
node examples/demo.js    # Run standalone demo
node scripts/playtest.js # Simulated plugin test
npm test                 # Run test suite (37 tests)
```

## API Documentation

### HerdingDog (`src/herding-dog.js`)
| Property/Method | Description |
|---|---|
| `new HerdingDog({bot, level, personality})` | Create a dog |
| `dog.level` | Current skill level string |
| `dog.energy` | Current energy (0-max) |
| `dog.personality` | Personality config object |
| `dog.herd(flock, target)` | Execute herding command |

### Flock (`src/flock.js`)
| Property/Method | Description |
|---|---|
| `new Flock({count, animalType})` | Create a flock |
| `flock.animals` | Array of Animal instances |
| `flock.formation` | Current formation type |

### Key Exports
| Export | Description |
|---|---|
| `SKILL_LEVELS` | Config for each level |
| `PERSONALITIES` | 5 personality presets |
| `ANIMAL_TYPES` | Available animal configs |
| `COURSES` | 5 herding courses |

## Plugin Integration

```js
import { registerWithCore } from 'craftmind-herding';
registerWithCore(core); // Registers as 'herding' plugin
```

## Architecture

```
┌──────────────────────────────────────────────────┐
│               CraftMind Herding                   │
├──────────────────────────────────────────────────┤
│  ┌──────────┐  ┌───────────┐  ┌──────────────┐ │
│  │   Dog    │  │  Flock    │  │   Terrain    │ │
│  │  AI      │→ │ (Boids)   │→ │   Analyzer   │ │
│  │ (4 lvl)  │  │           │  │              │ │
│  └────┬─────┘  └─────┬─────┘  └──────┬───────┘ │
│       │              │               │         │
│       ▼              ▼               ▼         │
│  ┌──────────────────────────────────────────┐   │
│  │         Herding Simulation               │   │
│  │  Command → Approach → Drive → Pen        │   │
│  └──────────────────┬───────────────────────┘   │
│                     │                           │
│  ┌──────────┐ ┌─────┴──────┐ ┌────────────┐   │
│  │ Seasons  │ │  Multi-Dog │ │  Scoring   │   │
│  │ System   │ │  Team      │ │  Engine    │   │
│  └──────────┘ └────────────┘ └────────────┘   │
│                                                  │
│  ┌─────────────┐  ┌──────────────────────────┐  │
│  │  Teachings  │  │       Courses            │  │
│  │   System    │  │  (5 progressive levels)  │  │
│  └─────────────┘  └──────────────────────────┘  │
├──────────────────────────────────────────────────┤
│              registerWithCore(core)              │
└──────────────────────────────────────────────────┘
```

## Testing

```bash
npm test          # 37 tests
node examples/demo.js
node scripts/playtest.js
```

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for detailed plans.

## License

MIT
