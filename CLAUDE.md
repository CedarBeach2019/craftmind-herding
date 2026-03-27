# CraftMind Herding - Developer Guide

## Project Overview

CraftMind Herding is a MIST-inspired AI sheepdog simulation for Minecraft. Built as part of the CraftMind ecosystem, it simulates intelligent dogs herding flocks through pastoral voxel landscapes using boids-based flock simulation, personality-driven AI agents, and emergent pack dynamics.

**Key Features:**
- Boid flock simulation (separation, alignment, cohesion)
- Multi-tiered dog progression (apprentice → elder)
- Personality axes (speed, patience, obedience, social, bravery, gentleness)
- Stochastic behavior scripts with cross-game compatibility
- Multi-dog team coordination with emergent roles
- Seasonal system affecting movement and behavior
- Teaching progression with wisdom modifiers
- Scoring system with combos and star ratings
- 5 pre-built herding courses

## Architecture

### Core Systems

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
├─────────────────────────────────────────────────────────────┤
│  HerdingDog    │  DogTeam    │  Flock    │  SeasonalSystem │
│  (state machine)│ (coord.)   │  (boids)  │   (weather)     │
├─────────────────────────────────────────────────────────────┤
│                     AI Layer (New)                          │
├─────────────────────────────────────────────────────────────┤
│  DogAgent      │  PackDynamics  │  DogTrust  │  DogPerson  │
│  (per dog)     │  (emergent)    │  (bond)    │  (axes)      │
│                │                │           │              │
│  HerdingActions│  HerdingEval  │  Scripts   │              │
│  (commands)    │  (comparative)│  (stoch.)  │              │
├─────────────────────────────────────────────────────────────┤
│                   Simulation Layer                          │
├─────────────────────────────────────────────────────────────┤
│  Flock.update() │  Boids      │  Terrain   │  Scoring     │
│  (per tick)    │  (forces)   │  (obstacles)│  (metrics)   │
├─────────────────────────────────────────────────────────────┤
│                    Core Integration                         │
│                  registerWithCore(core)                     │
└─────────────────────────────────────────────────────────────┘
```

### Flock Simulation (Boids)

Located in `src/flock.js`

**Animal Types:** sheep, cow, pig, chicken - each with unique:
- Flight radius (panic distance)
- Drift radius (comfort zone)
- Max speed & stubbornness
- Boids weights (separation, alignment, cohesion)

**Boids Algorithm:**
- `separation()` - steer away from nearby flockmates
- `alignment()` - match velocity with neighbors
- `cohesion()` - steer toward center of mass

**Dog Response Zones:**
- Flight zone - flee when dog is too close
- Drift zone - gently move away at medium distance
- Panic response - adds chaotic movement when stressed

### Dog AI

**Two AI Systems:**

1. **State Machine (`src/herding-dog.js`)** - Original implementation
   - 4 skill levels: apprentice → journeyman → master → elder
   - 5 personality presets: patient, aggressive, fast, methodical
   - Energy system with kennel regeneration
   - State machine: idle → approaching → flanking → pushing → recovering

2. **Agent System (`src/ai/`)** - New AI redesign
   - Personality axes (0-1 continuous, not presets)
   - Memory of past herding runs
   - Trust bonds with player (0-100)
   - Pack relationships (bond, rivalry)
   - Self-improving skills with proficiency tracking
   - Emergent roles from pack dynamics

### Multi-Dog Coordination

Located in `src/multi-dog.js` and `src/ai/pack-dynamics.js`

**Roles:**
- Lead - Primary herder, decides strategy
- Flanker - Keeps flock from drifting sideways
- Blocker - Guards exits and prevents escapes
- Fetcher - Retrieves stragglers and runners

**Communication:**
- Bark system with semantic types (moving_to, guarding, need_help, etc.)
- Bark log for temporal coordination
- Emergent coordination without explicit commands

### Script Engine

Located in `src/scripts/script-engine.js`

**Step Types:**
- `action()` - Execute custom function
- `chat()` - Emit message with weighted random
- `wait()` - Delay with mood-modified duration
- `approach()`, `circle()`, `bark()`, `nip()`, `rest()`, `follow()` - Herding actions
- `branch()` - Conditional logic
- `goto()` - Loop to another script
- `set()` - Store context variable

**Mood System:**
- excited (chasing, high energy)
- tired (resting, low energy)
- focused (working, steady)
- playful (not working, goofing off)

**4 Dog Scripts:**
- v1-rex.js - Alpha leader, minimal barking
- v1-biscuit.js - Gentle herder, patient
- v1-thunder.js - High-energy, ignores commands
- v1-old-blue.js - Wise mentor, teaches young dogs

## File Structure

```
src/
├── ai/
│   ├── dog-agent.js          # Full agent with personality, memory, trust
│   ├── dog-personalities.js  # 5 named dogs (Rex, Biscuit, Thunder, Sadie, Old Blue)
│   ├── dog-trust.js          # Player-dog bond system (0-100)
│   ├── pack-dynamics.js      # Emergent roles, rivalry, mentorship
│   ├── herding-actions.js    # Command schema (HERD, FLANK, DRIVE, etc.)
│   └── herding-evaluator.js  # Comparative evaluation for skill optimization
├── scripts/
│   ├── script-engine.js      # Stochastic script engine
│   ├── v1-rex.js             # Rex's behavior script
│   ├── v1-biscuit.js         # Biscuit's behavior script
│   ├── v1-thunder.js         # Thunder's behavior script
│   └── v1-old-blue.js        # Old Blue's behavior script
├── herding-dog.js            # Main dog class (state machine)
├── flock.js                  # Boids simulation
├── multi-dog.js              # Team coordination
├── scoring.js                # Score calculation with combos
├── seasons.js                # Seasonal system
├── teachings.js              # Alpha dog teachings system
├── terrain.js                # Pasture, pen, gate, obstacle classes
├── courses.js                # 5 pre-built herding courses
└── index.js                  # Main export, core registration

examples/
├── demo.js                   # Basic demo
└── herd-demo.js              # Flocking animation demo

tests/
├── test-all.js               # Test runner
├── ai.test.js                # AI system tests
└── integration.test.js       # Integration tests
```

## Current State

**Completed:**
- ✅ Boid flock simulation with 4 animal types
- ✅ 4-tier dog progression (apprentice → elder)
- ✅ 5 personality presets
- ✅ Multi-dog team with 4 roles
- ✅ Scoring with combos and star ratings
- ✅ Seasonal system (spring, summer, autumn, winter)
- ✅ Teaching system with wisdom modifiers
- ✅ Terrain analysis (grass, water, obstacles)
- ✅ 5 herding courses (beginner → expert)
- ✅ Stochastic script engine with 4 dog personalities
- ✅ AI redesign (DogAgent, PackDynamics, DogTrust)

**Next Steps (v0.2):**
- Real Minecraft server integration testing
- Web dashboard for monitoring
- Multiplayer support

## 5 Most Impactful Improvements

### 1. **Agent System Integration**
Merge `DogAgent` with `HerdingDog` to enable:
- Personality axes instead of presets
- Memory-driven behavior adaptation
- Trust-gated advanced commands
- Self-improving skill proficiency

**Impact:** Each dog becomes unique, learning from experience and building stories with the player.

### 2. **Comparative Evaluator**
Implement `HerdingEvaluator` (adapted from fishing):
- Score herding runs by completion, time, stress, efficiency
- Match conditions (season, animal type, dog combo)
- Extract insights: "flanking left works 1.8x better for sheep in spring"
- Rank skill variants for optimization

**Impact:** Dogs learn which approaches work best, creating emergent expertise.

### 3. **Cross-Game Script Hot-Swap**
Shared script format between Fishing and Herding:
- Same step types, weighted random, branching
- Same mood system (excited/tired/focused/playful)
- Same telemetry structure for A/B testing
- Script registry for runtime swapping

**Impact:** Faster iteration, shared improvements across games.

### 4. **Emergent Pack Dynamics**
Deepen pack behavior:
- Lead challenges with personality-based scoring
- Mentorship (wise dogs near timid dogs)
- Preferred role emergence over time
- Coordination quality from bonds/rivalries

**Impact:** Multi-dog teams feel like real packs with relationships.

### 5. **Natural Language Command Processing**
Enhance `interpretCommand()` in herding-actions:
- Parse "go around the left side" → FLANK_LEFT
- Parse "bring back that straggler" → GATHER
- Context awareness (target pen, sheep count)
- Dog obedience determines compliance

**Impact:** Players speak naturally, dogs respond based on personality.

## Integration with CraftMind Core

### Actions

Herding extends core actions with dog-specific commands:

```javascript
import { HERDING_ACTIONS, command } from 'craftmind-herding';

// Available actions
HERDING_ACTIONS.HERD      // Move flock to target
HERDING_ACTIONS.FLANK_LEFT/RIGHT
HERDING_ACTIONS.HOLD      // Stay in position
HERDING_ACTIONS.GATHER    // Bring stragglers
HERDING_ACTIONS.DRIVE     // Push toward target
HERDING_ACTIONS.SHED      // Separate individual (advanced)
HERDING_ACTIONS.GUARD     // Watch without directing (advanced)
HERDING_ACTIONS.RECALL    // Return to handler
HERDING_ACTIONS.ALERT     // Bark at threat
HERDING_ACTIONS.REST      // Recover energy
```

### Knowledge

Herding contributes:
- Animal behavior patterns (flight zones, grazing)
- Terrain analysis (water sources, grass areas, obstacles)
- Seasonal effects on animal movement
- Course layouts and optimal strategies

### Communication

Dogs communicate through:
- **Barks** - Semantic messages to other dogs
- **Commands** - Player-to-dog instruction
- **Teachings** - Wisdom sharing (dog-to-player)
- **Moods** - Emotional state affecting behavior

### Registration

```javascript
import { registerWithCore } from 'craftmind-herding';

// Register with CraftMind Core
registerWithCore(core);
// Registers modules: Flock, HerdingDog, DogTeam, SeasonalSystem,
//                   TerrainAnalyzer, TeachingsSystem
```

## Development Guidelines

### Adding New Dog Personalities

1. Define in `src/ai/dog-personalities.js`:
```javascript
export const DOG_PERSONALITIES = {
  myDog: {
    name: 'MyDog',
    breed: 'Border Collie',
    personality: { speed: 0.7, patience: 0.6, obedience: 0.8, social: 0.5, bravery: 0.7, gentleness: 0.4 },
    tagline: "Ready to work!",
    skills: ['heel', 'flank', 'drive'],
    preferredRole: 'lead',
  },
};
```

2. Create behavior script in `src/scripts/v1-mydog.js`:
```javascript
export default {
  name: 'mydog',
  description: '...',
  hypothesis: '...',
  version: 1,
  stats: {},
  steps: [/* Step.* calls */],
};
```

### Creating New Courses

Add to `src/courses.js`:
```javascript
{
  id: 'my_course',
  name: 'My Course',
  difficulty: 3,
  description: '...',
  requiredLevel: 'master',
  animalCount: 10,
  animalTypes: ['sheep', 'cow'],
  timeLimit: 200,
  build: () => {
    const pasture = new Pasture('my_course', 'My Course');
    pasture.setBoundary(-30, -30, 30, 30);
    // Add pens, gates, obstacles, spawn points
    return pasture;
  },
  rewardTeaching: 'work_2',
  skillUnlocks: ['herd_group'],
}
```

### Testing

```bash
# Run all tests
npm test

# Run specific test file
node tests/ai.test.js
node tests/integration.test.js

# Run demos
node examples/demo.js
node examples/herd-demo.js
```

## Key Design Patterns

1. **Boids Algorithm** - Emergent flock behavior from simple rules
2. **State Machine** - Dog behavior states with transitions
3. **Stochastic Scripts** - Weighted random choices for variety
4. **Component System** - Modular skills, actions, personalities
5. **Observer Pattern** - Season changes, teaching unlocks
6. **Strategy Pattern** - Different herding strategies per level

## Performance Considerations

- Flock update is O(n²) for boids - limit flock size
- Script runner uses async/await for natural delays
- Memory limited to 100 entries per dog
- Bark log trimmed to 200 entries

## Cross-Game Compatibility

Scripts from `craftmind-fishing` can run in `craftmind-herding` with minimal changes:
- Replace fish actions with herding actions
- Adjust telemetry counters
- Map moods appropriately

See `docs/CROSS_GAME_PATTERNS.md` for details.
