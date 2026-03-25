# 🐾 CraftMind Herding

> *Where AI sheepdogs tend pastoral flocks through Minecraft's gentle voxel hills.*

```
        /^ ^\\
       / 0 0 \\
       V\\ Y /V
        / - \\
       |    |
       ||__||
```

*"The meadow remembers every gentle step. Move with purpose, rest with peace, and the flock will follow."*
— Alpha Dog

---

## 🌾 What is this?

**CraftMind Herding** is a MIST-inspired Minecraft herding system built on Mineflayer. AI bots act as sheepdogs, using real herding techniques — flanking, pressure-and-release, boundary awareness — to guide flocks of virtual animals through pastoral courses.

It is not a game. It is an art practice, rendered in blocks and wool.

---

## 🏗️ Architecture

```
                    ┌─────────────┐
                    │  HerdingDog │  (The soul — learns, tires, grows)
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────┴────┐ ┌────┴────┐ ┌────┴─────┐
        │  Flock   │ │ Seasons │ │ Teachings│
        │  (boids) │ │ (cycle) │ │ (wisdom) │
        └────┬─────┘ └─────────┘ └──────────┘
             │
        ┌────┴─────┐    ┌──────────┐    ┌──────────┐
        │  Scoring │    │  Courses │    │  DogTeam │
        │ (gentle) │    │ (stories)│    │ (elders) │
        └──────────┘    └──────────┘    └──────────┘
```

### Modules

| Module | Purpose |
|--------|---------|
| `herding-dog.js` | The herding bot — 4 skill levels, personality traits, energy, flanking |
| `flock.js` | Flock AI — boids algorithm, flight/drift zones, panic, grazing |
| `terrain.js` | Pastures, pens, gates, obstacles, terrain analysis |
| `seasons.js` | Seasonal cycle mapped to Minecraft day cycles |
| `teachings.js` | Progressive wisdom from the Alpha Dog mentor |
| `scoring.js` | Performance scoring with combos and star ratings |
| `multi-dog.js` | Multi-dog coordination via bark communication |
| `courses.js` | Pre-built herding courses from tutorial to elder trial |

---

## 🐕 Skill Levels

### 🐾 Apprentice
Young and eager. Learning the shape of the work.
- Basic follow and approach
- Can herd up to 5 animals
- No flanking, no scatter recovery

### 🐕 Journeyman
Knows the basics. Ready to work with purpose.
- Flanking maneuvers
- Herd up to 12 animals
- Medium energy pool

### 🐕‍🦺 Master
An artist of movement. Quiet, efficient, precise.
- Complex route planning
- Scatter recovery
- Up to 25 animals
- Access to advanced teachings

### 🐺 Elder
The old one. Guides not just sheep, but other dogs.
- Multi-dog coordination
- Up to 50 animals
- Maximum wisdom
- The Great Roundup awaits

---

## 🐑 Animal Types

| Animal | Nature |
|--------|--------|
| 🐑 **Sheep** | Gentle, predictable. The heart of any flock. |
| 🐄 **Cow** | Slow, stubborn. Moves on its own time. |
| 🐖 **Pig** | Quick and unpredictable. Keeps you on your paws. |
| 🐔 **Chicken** | Pure chaos in feathers. Herding them is an act of faith. |

Each type has unique flight radius, speed, stubbornness, and grazing behavior.

---

## 📖 The Teaching System

The Alpha Dog speaks in quiet moments, sharing wisdom across five categories:

### 🐾 Identity
*Who you are shapes how you herd.*
> "You are a herder. Not a chaser, not a fighter. A herder. The difference is everything."

### 🐑 Sheep
*Understanding the flock is the first art.*
> "Find the leader. Not the biggest — the one the others watch."

### ⬡ Work
*The craft of moving gently with purpose.*
> "Walk wide. Come around. If they see your face too soon, they scatter."

### 🏡 Family
*We herd together. Always.*
> "Rest is not weakness. The kennel is where you gather strength."

### 🌙 Wisdom
*What the old ones know that cannot be taught.*
> "The best runs are the quiet ones. No barking, no rushing."

Teachings unlock when the dog demonstrates required skills. Wisdom affects herding decisions — experienced dogs make better choices.

---

## 🏞️ Courses

| # | Course | Difficulty | Animals |
|---|--------|:----------:|:-------:|
| 1 | **First Pen** — Tutorial | ★☆☆☆☆ | 3 sheep |
| 2 | **River Crossing** — Guide across water | ★★☆☆☆ | 6 mixed |
| 3 | **Night Gather** — Scatter recovery at dusk | ★★★☆☆ | 10 mixed |
| 4 | **Storm Herd** — Herd through thunderstorm | ★★★★☆ | 8 mixed |
| 5 | **The Great Roundup** — The elder's trial | ★★★★★ | 20 mixed |

---

## 🌸 Seasons

The world turns, and the work changes with it:

- **🌸 Spring** — Lambs born, grass lush, easy herding
- **☀️ Summer** — Long days, animals spread for shade
- **🍂 Autumn** — Animals cluster, preparing for winter
- **❄️ Winter** — Snow slows movement, animals stay near barn

Configurable — default is 7 Minecraft days per season.

---

## 🚀 Quick Start

```bash
# Install
git clone https://github.com/CedarBeach2019/craftmind-herding.git
cd craftmind-herding
npm install

# Run standalone demo (no server needed)
npm run demo

# Run tests
npm test
```

### Connect to a Minecraft Server

```bash
cp .env.example .env
# Edit .env with your server details
node -e "
  import mineflayer from 'mineflayer';
  import { HerdingDog } from './src/herding-dog.js';
  import { SeasonalSystem } from './src/seasons.js';
  import { TeachingsSystem } from './src/teachings.js';

  const bot = mineflayer.createBot({ host: 'localhost', username: 'SheepDog' });
  bot.on('spawn', () => {
    const dog = new HerdingDog({
      bot,
      level: 'apprentice',
      personality: 'patient',
      seasons: new SeasonalSystem(),
      teachings: new TeachingsSystem(),
    });
    dog.connect();
    console.log('🐕 The dog stands at the edge of the meadow...');
  });
"
```

---

## 🎭 Personality Traits

| Trait | Speed | Style | Vibe |
|-------|:-----:|-------|------|
| **Patient** | Slow | Gentle | Low stress, high care |
| **Aggressive** | Fast | Firm | Quick results, watch the flock |
| **Fast** | Very fast | Balanced | Great for catching stragglers |
| **Methodical** | Medium | Calculated | Efficient paths, minimal waste |

---

## 🤝 Multi-Dog Coordination (Elder Level)

Elder dogs can coordinate teams:

- **Lead Dog** — Primary herder, decides strategy
- **Flanker** — Keeps flock from drifting sideways
- **Blocker** — Guards exits, prevents escapes
- **Fetcher** — Retrieves stragglers and runners

Dogs communicate via **barks** — simple chat messages conveying intent.

---

## ⭐ Scoring

Runs are scored on:
- **Completion** (35%) — Animals safely penned
- **Stress** (25%) — Lower flock stress = better herding
- **Time** (15%) — Faster is better (with diminishing returns)
- **Efficiency** (15%) — Distance traveled vs optimal path
- **Panics** — Each panic event costs points

Consecutive clean runs build a **combo multiplier**.

---

## 📄 License

MIT — because the meadow belongs to everyone.

---

*"In spring, the flock is small and trusting. Begin gently."*
