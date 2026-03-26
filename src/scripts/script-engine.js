/**
 * Stochastic Script Engine for CraftMind Herding
 *
 * Dogs run SCRIPTS with weighted random choices at strategic points.
 * Each dog has a mood, energy, and context that drive behavior selection.
 *
 * Adapted from craftmind-fishing's script engine for multi-dog herding.
 *
 * Actions: approach, circle, bark, nip, rest, follow
 * Context: sheep count, distance to sheep, energy, trust level
 * Moods: excited (chasing), tired (resting), focused (working), playful (not working)
 */

export function weightedRandom(weights) {
  const entries = weights instanceof Map ? [...weights.entries()] : Object.entries(weights);
  const total = entries.reduce((s, [w]) => s + parseFloat(w), 0);
  if (total <= 0) return entries[0]?.[1] ?? null;
  let roll = Math.random() * total;
  for (const [w, outcome] of entries) {
    roll -= parseFloat(w);
    if (roll <= 0) return outcome;
  }
  return entries[entries.length - 1][1];
}

export class Step {
  static action(name, fn) {
    return { type: 'action', name, fn };
  }

  static chat(msgs) {
    return {
      type: 'chat',
      pick: () => {
        if (typeof msgs === 'string') return msgs;
        if (Array.isArray(msgs)) return msgs[Math.floor(Math.random() * msgs.length)];
        return weightedRandom(msgs);
      },
    };
  }

  static wait(ms) {
    return { type: 'wait', ms };
  }

  /** Core herding actions */
  static approach() { return { type: 'approach' }; }
  static circle(direction = 'cw') { return { type: 'circle', direction }; }
  static bark() { return { type: 'bark' }; }
  static nip() { return { type: 'nip' }; }
  static rest() { return { type: 'rest' }; }
  static follow() { return { type: 'follow' }; }

  /** Stochastic branch */
  static branch(condition, ifTrue, ifFalse) {
    return { type: 'branch', condition, ifTrue, ifFalse };
  }

  static goto(scriptName) {
    return { type: 'goto', scriptName };
  }

  static set(key, value) {
    return { type: 'set', key, value };
  }

  static noop() {
    return { type: 'noop' };
  }
}

export const DOG_MOODS = {
  EXCITED: 'excited',    // chasing, high energy
  TIRED: 'tired',        // resting, low energy
  FOCUSED: 'focused',    // working, steady
  PLAYFUL: 'playful',    // not working, goofing off
};

export class DogMoodSystem {
  constructor() {
    this.mood = DOG_MOODS.FOCUSED;
    this.energy = 1.0;
    this.excitement = 0.3;   // 0-1, decays toward 0
    this.fatigue = 0.0;      // 0-1, builds over time
  }

  /**
   * Shift excitement level. Positive = stimulating event, negative = calming.
   */
  stimulate(amount) {
    this.excitement = Math.max(0, Math.min(1, this.excitement + amount));
    this._recalcMood();
  }

  /** Apply fatigue (called each herding action). */
  tire(amount) {
    this.fatigue = Math.max(0, Math.min(1, this.fatigue + amount));
    this.energy = Math.max(0.1, 1.0 - this.fatigue * 0.8);
    this._recalcMood();
  }

  /** Recover energy (resting). */
  recover(amount = 0.05) {
    this.fatigue = Math.max(0, this.fatigue - amount * 2);
    this.energy = Math.min(1.0, this.energy + amount);
    this.excitement = Math.max(0, this.excitement - amount * 0.5);
    this._recalcMood();
  }

  /** How chatty/barky? Higher excitement = more vocal. */
  get vocalness() {
    return Math.max(0.05, Math.min(0.9, this.excitement * 1.3));
  }

  /** Speed multiplier based on energy + excitement. */
  get speedMultiplier() {
    return 0.5 + (this.energy * 0.7) + (this.excitement * 0.3);
  }

  /** Natural tick: excitement decays, fatigue persists unless resting. */
  tick() {
    this.excitement += (0.2 - this.excitement) * 0.005;
    // Fatigue slowly recovers on its own (very slow)
    if (this.mood !== DOG_MOODS.TIRED) {
      this.fatigue = Math.max(0, this.fatigue - 0.001);
      this.energy = Math.min(1.0, this.energy + 0.001);
    }
  }

  _recalcMood() {
    if (this.fatigue > 0.75) {
      this.mood = DOG_MOODS.TIRED;
    } else if (this.excitement > 0.7 && this.fatigue < 0.4) {
      this.mood = DOG_MOODS.EXCITED;
    } else if (this.excitement > 0.5 && this.fatigue < 0.3) {
      this.mood = DOG_MOODS.PLAYFUL;
    } else {
      this.mood = DOG_MOODS.FOCUSED;
    }
  }
}

export class Script {
  constructor(name, steps) {
    this.name = name;
    this.steps = steps;
  }

  static define(name, steps) {
    return new Script(name, steps);
  }
}

export class HerdingTelemetry {
  constructor() {
    this.reset();
  }

  reset() {
    this.data = {
      sheepPenned: 0,
      sheepTotal: 0,
      startTime: null,
      endTime: null,
      barkCount: 0,
      restCount: 0,
      restDuration: 0,
      closeCalls: 0,
      approachCount: 0,
      circleCount: 0,
      nipCount: 0,
      moodSamples: [],
      energySamples: [],
    };
  }

  startRun(totalSheep) {
    this.data.sheepTotal = totalSheep;
    this.data.startTime = Date.now();
  }

  endRun() {
    this.data.endTime = Date.now();
  }

  record(event, value = 1) {
    switch (event) {
      case 'sheep_pen':
        this.data.sheepPenned += value;
        break;
      case 'bark':
        this.data.barkCount += value;
        break;
      case 'rest':
        this.data.restCount += value;
        break;
      case 'rest_duration':
        this.data.restDuration += value;
        break;
      case 'close_call':
        this.data.closeCalls += value;
        break;
      case 'approach':
        this.data.approachCount += value;
        break;
      case 'circle':
        this.data.circleCount += value;
        break;
      case 'nip':
        this.data.nipCount += value;
        break;
      case 'mood_sample':
        this.data.moodSamples.push({ time: Date.now(), mood: value });
        break;
      case 'energy_sample':
        this.data.energySamples.push({ time: Date.now(), energy: value });
        break;
    }
  }

  /** Time in seconds from start to end. */
  get elapsedSeconds() {
    if (!this.data.startTime) return 0;
    const end = this.data.endTime || Date.now();
    return Math.round((end - this.data.startTime) / 1000);
  }

  /** Sheep penned / total. */
  get successRate() {
    if (this.data.sheepTotal === 0) return 0;
    return this.data.sheepPenned / this.data.sheepTotal;
  }

  get summary() {
    return {
      ...this.data,
      elapsedSeconds: this.elapsedSeconds,
      successRate: Math.round(this.successRate * 100) + '%',
    };
  }
}

export class HerdingScriptRunner {
  /**
   * @param {object} dogAgent - DogAgent instance
   * @param {object} [options]
   */
  constructor(dogAgent, options = {}) {
    this.dog = dogAgent;
    this.scripts = new Map();
    this.mood = options.mood || new DogMoodSystem();
    this.telemetry = options.telemetry || new HerdingTelemetry();
    this.context = {
      sheepNearby: 0,
      sheepPenned: 0,
      distanceToSheep: 10,
      penPosition: { x: 0, y: 64, z: 0 },
      lastBarkTime: 0,
      lastRestTime: 0,
      currentScript: null,
      interrupted: false,
      playerNearby: false,
      runActive: false,
    };
    this._running = false;
    this._currentScript = null;
    this._tickInterval = null;
  }

  register(script) {
    this.scripts.set(script.name, script);
    return this;
  }

  async run(scriptNameOrScript) {
    const script = typeof scriptNameOrScript === 'string'
      ? this.scripts.get(scriptNameOrScript)
      : scriptNameOrScript;

    if (!script) {
      console.error(`[HerdingScriptRunner] Script not found: ${scriptNameOrScript}`);
      return;
    }

    this._currentScript = script;
    this.context.currentScript = script.name;
    this._running = true;

    try {
      await this._executeSteps(script.steps);
    } catch (err) {
      if (err.message !== 'INTERRUPTED') {
        console.error(`[HerdingScriptRunner] Error in ${script.name}:`, err.message);
      }
    } finally {
      this._currentScript = null;
      this.context.currentScript = null;
      this._running = false;
    }
  }

  interrupt(reason) {
    this._running = false;
    this.context.interrupted = true;
    this.context.interruptedReason = reason;
  }

  get isRunning() {
    return this._running;
  }

  startAutoRun(tickMs = 1500) {
    this._tickInterval = setInterval(() => {
      this.mood.tick();
      if (!this._running) {
        this._pickNextScript();
      }
      // Periodic telemetry samples
      this.telemetry.record('mood_sample', this.mood.mood);
      this.telemetry.record('energy_sample', this.mood.energy);
    }, tickMs);
  }

  stopAutoRun() {
    if (this._tickInterval) {
      clearInterval(this._tickInterval);
      this._tickInterval = null;
    }
  }

  _pickNextScript() {
    const ctx = this.context;
    const mood = this.mood.mood;
    const energy = this.mood.energy;

    // Tired? Rest first.
    if (mood === DOG_MOODS.TIRED) {
      this.run('rest');
      return;
    }

    // Playful? Might goof off.
    if (mood === DOG_MOODS.PLAYFUL && Math.random() > 0.4) {
      this.run('play');
      return;
    }

    // Default: work scripts based on sheep situation
    if (ctx.sheepNearby > 0) {
      this.run('herd');
    } else {
      // No sheep visible — look for them or follow player
      if (ctx.playerNearby) {
        this.run('follow_player');
      } else {
        this.run('patrol');
      }
    }
  }

  async _executeSteps(steps) {
    for (let i = 0; i < steps.length; i++) {
      if (!this._running) throw new Error('INTERRUPTED');
      await this._executeStep(steps[i]);
      await this._naturalDelay();
    }
  }

  async _executeStep(step) {
    if (!this._running) throw new Error('INTERRUPTED');

    switch (step.type) {
      case 'action':
        try {
          await step.fn(this.context, this);
        } catch (e) {
          console.error(`[HerdingScriptRunner] Action "${step.name}" error:`, e.message);
        }
        break;

      case 'chat': {
        if (Math.random() > this.mood.vocalness) break;
        if (Date.now() - this.context.lastBarkTime < 3000) break;
        const msg = step.pick();
        if (msg && typeof msg === 'string') {
          console.log(`[${this.dog.name}] ${msg}`);
          this.context.lastBarkTime = Date.now();
        }
        break;
      }

      case 'wait':
        await this._wait(step.ms * (2 - this.mood.speedMultiplier));
        break;

      // ── Herding Actions ──
      case 'approach':
        this.telemetry.record('approach');
        this.mood.tire(0.02);
        this.mood.stimulate(0.05);
        // Position would be updated by the game engine
        await this._naturalDelay();
        break;

      case 'circle':
        this.telemetry.record('circle');
        this.mood.tire(0.03);
        this.mood.stimulate(0.03);
        await this._naturalDelay();
        break;

      case 'bark':
        this.telemetry.record('bark');
        this.mood.stimulate(0.08);
        if (this.dog) {
          this.dog.energy = Math.max(0, this.dog.energy - 0.3);
        }
        await this._wait(300);
        break;

      case 'nip':
        this.telemetry.record('nip');
        this.mood.tire(0.04);
        this.mood.stimulate(0.1);
        await this._naturalDelay();
        break;

      case 'rest':
        this.telemetry.record('rest');
        this.telemetry.record('rest_duration');
        this.mood.recover(0.1);
        if (this.dog) this.dog.isResting = true;
        await this._wait(3000);
        if (this.dog) this.dog.isResting = false;
        break;

      case 'follow':
        this.mood.tire(0.01);
        await this._naturalDelay();
        break;

      case 'branch': {
        const result = step.condition(this.context, this);
        const branch = result ? step.ifTrue : step.ifFalse;
        if (Array.isArray(branch)) {
          await this._executeSteps(branch);
        } else {
          await this._executeStep(branch);
        }
        break;
      }

      case 'goto': {
        const target = this.scripts.get(step.scriptName);
        if (target) {
          this._currentScript = target;
          this.context.currentScript = target.name;
          await this._executeSteps(target.steps);
        }
        break;
      }

      case 'set':
        this.context[step.key] = step.value;
        break;

      case 'noop':
        break;
    }
  }

  _naturalDelay() {
    const base = 300;
    const variance = this.mood.speedMultiplier * 500;
    return this._wait(base + Math.random() * variance);
  }

  _wait(ms) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(resolve, ms);
      this._interruptReject = () => {
        clearTimeout(timeout);
        reject(new Error('INTERRUPTED'));
      };
    });
  }
}

export default HerdingScriptRunner;
