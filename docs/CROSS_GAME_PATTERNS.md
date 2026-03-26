# Cross-Game Script Patterns: Fishing ↔ Herding

How stochastic script patterns transfer between CraftMind Fishing and CraftMind Herding.

## Core Loop Mapping

| Fishing                | Herding                  | Pattern                          |
|------------------------|--------------------------|----------------------------------|
| Cast → wait → react    | Approach → circle → redirect | **Observe → Act → Correct**  |
| Evaluate spot          | Evaluate herd position   | **Context assessment before action** |
| Reel in / miss         | Sheep penned / sheep escaped | **Binary outcome with mood shift** |
| Change bait/lure       | Change approach angle    | **Strategy adaptation**           |

## Shared Engine Concepts

### Mood System
Both games use the same mood drift model:
- **Fishing**: mood 0–1 (miserable → elated), affects chattiness
- **Herding**: mood enum + energy/excitement/fatigue, affects vocalness and speed
- Both drift toward baseline over time
- Both respond to events (catch/pen = positive, miss/escape = negative)

### Energy Management
- **Fishing**: `energy` drains slowly, recovers on break
- **Herding**: `fatigue` builds per action, `energy` = 1 - fatigue, recovers on rest
- Same pattern: hard work → tired → forced rest → recover → repeat

### Weighted Random Selection
Identical `weightedRandom()` function in both engines. Every chat message, behavior choice, and strategy branch uses probability weights rather than fixed logic.

## Transferable Step Types

| Step Type      | Fishing Use           | Herding Use              |
|----------------|----------------------|--------------------------|
| `action`       | equip rod, move       | take position, block     |
| `chat`         | player communication  | bark/dog "communication"  |
| `wait`         | reel timing           | movement timing          |
| `branch`       | caught/missed         | sheep scattered/grouped  |
| `goto`         | cast again loop       | herd again loop          |
| `set`          | store fish count      | store sheep count        |
| `noop`         | skip chat             | skip bark (silence)      |

## Herding-Specific Additions

The herding engine adds domain-specific actions that fishing doesn't need:

- **`approach`**, **`circle`**, **`bark`**, **`nip`**, **`rest`**, **`follow`** — physical herding actions
- **`DOG_MOODS`** — enum with excited/tired/focused/playful states
- **`HerdingTelemetry`** — tracks sheep penned, bark frequency, rest frequency, close calls
- **Stimulate/tire/recover** — three-axis mood control (vs fishing's single `shift`)

## Social Scripts (Identical)

Player interaction works identically in both games:
- Greet on player join
- React to player proximity
- Mood shifts from player attention
- Rate-limited chat to avoid spam

In fishing: "Lines in." / "Got one!"
In herding: "*positions himself*" / "*one sharp bark*"

The mechanism is the same — only the flavor text differs.

## Personality Script Structure

Both games export the same shape:

```js
export default {
  name: 'v1_aggressive',
  description: '...',
  hypothesis: '...',
  version: 1,
  stats: { /* counters */ },
  steps: [ /* Step.* calls */ ],
};
```

This means a script registry, A/B testing framework, or hot-swap system works for both games without modification.

## Key Insight

The script engine is **game-agnostic at its core**. The only game-specific parts are:
1. The action vocabulary (fish vs herd)
2. The telemetry counters (fish caught vs sheep penned)
3. The mood elaboration (herding needs more states)

Everything else — weighted random, branching, looping, mood drift, energy management, chat throttling — transfers directly.
