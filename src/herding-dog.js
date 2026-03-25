// ═══════════════════════════════════════════════════════════════
// CraftMind Herding — The Herding Dog
// ═══════════════════════════════════════════════════════════════
//
// The dog stands at the edge of the meadow, ears forward,
// reading the flock. It is not a machine. It is a presence —
// calm, purposeful, alive. Every step is a choice.
//
// This is the heart of CraftMind Herding. The bot that learns,
// tires, rests, and grows from apprentice to elder.
// ═══════════════════════════════════════════════════════════════

import { Vec3 } from 'vec3';
import { Flock, ANIMAL_TYPES } from './flock.js';
import { SeasonalSystem, SEASON_CONFIG } from './seasons.js';
import { Pasture, TerrainAnalyzer } from './terrain.js';
import { TeachingsSystem } from './teachings.js';
import { HerdingScore, ComboTracker } from './scoring.js';
import { DogTeam, BARK_TYPES } from './multi-dog.js';
import { getCoursesForLevel } from './courses.js';

// ─── Skill Levels ──────────────────────────────────────────

export const SKILL_LEVELS = {
  apprentice: {
    name: 'Apprentice',
    emoji: '🐾',
    tier: 1,
    maxFlockSize: 5,
    canFlank: false,
    canRecover: false,
    canCoordinate: false,
    energyMax: 80,
    energyRegen: 0.3,
    description: 'Young and eager. Learning the shape of the work.',
  },
  journeyman: {
    name: 'Journeyman',
    emoji: '🐕',
    tier: 2,
    maxFlockSize: 12,
    canFlank: true,
    canRecover: false,
    canCoordinate: false,
    energyMax: 100,
    energyRegen: 0.4,
    description: 'Knows the basics. Ready to work with purpose.',
  },
  master: {
    name: 'Master',
    emoji: '🐕‍🦺',
    tier: 3,
    maxFlockSize: 25,
    canFlank: true,
    canRecover: true,
    canCoordinate: false,
    energyMax: 120,
    energyRegen: 0.5,
    description: 'An artist of movement. Quiet, efficient, precise.',
  },
  elder: {
    name: 'Elder',
    emoji: '🐺',
    tier: 4,
    maxFlockSize: 50,
    canFlank: true,
    canRecover: true,
    canCoordinate: true,
    energyMax: 150,
    energyRegen: 0.6,
    description: 'The old one. Guides not just sheep, but other dogs.',
  },
};

// ─── Personality Traits ─────────────────────────────────────

export const PERSONALITIES = {
  patient: {
    name: 'Patient',
    approachSpeed: 0.6,
    pressureStyle: 'gentle',
    reactionTime: 5,   // ticks before reacting
    description: 'Slow and steady. Low stress on the flock.',
  },
  aggressive: {
    name: 'Aggressive',
    approachSpeed: 1.2,
    pressureStyle: 'firm',
    reactionTime: 2,
    description: 'Fast and forceful. Gets results, but watch the stress.',
  },
  fast: {
    name: 'Fast',
    approachSpeed: 1.4,
    pressureStyle: 'balanced',
    reactionTime: 3,
    description: 'Quick on their paws. Great for catching stragglers.',
  },
  methodical: {
    name: 'Methodical',
    approachSpeed: 0.8,
    pressureStyle: 'calculated',
    reactionTime: 4,
    description: 'Plans every move. Efficient paths, minimal wasted effort.',
  },
};

// ─── HerdingDog ─────────────────────────────────────────────

export class HerdingDog {
  /**
   * @param {object} options
   * @param {import('mineflayer').Bot} options.bot - Mineflayer bot instance
   * @param {string} options.level - Starting skill level
   * @param {string} options.personality - Personality trait
   * @param {SeasonalSystem} options.seasons - Seasonal system
   * @param {TeachingsSystem} options.teachings - Teachings system
   */
  constructor({ bot, level = 'apprentice', personality = 'patient', seasons, teachings }) {
    this.bot = bot;
    this.level = level;
    this.levelConfig = SKILL_LEVELS[level];
    this.personality = PERSONALITIES[personality] || PERSONALITIES.patient;
    this.personalityName = personality;

    // Systems
    this.seasons = seasons || new SeasonalSystem();
    this.teachings = teachings || new TeachingsSystem();
    this.flock = new Flock();
    this.score = null;
    this.combo = new ComboTracker();
    this.team = null;

    // State
    this.energy = this.levelConfig.energyMax;
    this.isResting = false;
    this.isHerding = false;
    this.currentPasture = null;
    this.currentCourse = null;
    this.targetPen = null;
    this.kennelPosition = new Vec3(0, 64, 0);

    // Behavior
    this.position = new Vec3(0, 64, 0);
    this.targetPosition = null;
    this.behaviorState = 'idle'; // idle, approaching, flanking, pushing, recovering, resting
    this.stateTimer = 0;
    this.flankAngle = 0; // current angle for flanking arc

    // Wisdom modifiers from teachings
    this.wisdomModifiers = this.teachings.getWisdomModifiers();

    // Tick counter
    this.tickCount = 0;

    // Callbacks
    this.onStateChange = null;
    this.onTeaching = null;
    this.onHerdingComplete = null;
  }

  // ─── Connection ─────────────────────────────────────────

  /** Initialize after bot connects to server. */
  async connect() {
    if (this.bot) {
      this.bot.on('spawn', () => {
        this.position = this.bot.entity.position.clone();
      });
      this.bot.on('move', () => {
        this.position = this.bot.entity.position.clone();
      });
    }
  }

  // ─── Energy System ──────────────────────────────────────

  /** Drain energy based on activity. */
  drainEnergy(amount = 0.1) {
    const eff = this.wisdomModifiers.energyEfficiency;
    this.energy -= amount / eff;
    if (this.energy <= 0) {
      this.energy = 0;
      this.goRest();
    }
  }

  /** Regenerate energy. Faster at kennel. */
  regenEnergy(amount = null) {
    const rate = amount || this.levelConfig.energyRegen;
    this.energy = Math.min(this.levelConfig.energyMax, this.energy + rate);

    // At kennel? Extra regen.
    if (this.position.distanceTo(this.kennelPosition) < 5) {
      this.energy = Math.min(this.levelConfig.energyMax, this.energy + rate * 2);
    }

    if (this.energy >= this.levelConfig.energyMax * 0.9 && this.isResting) {
      this.isResting = false;
      this.setState('idle');
    }
  }

  /** Go to kennel to rest. */
  goRest() {
    this.isResting = true;
    this.targetPosition = this.kennelPosition;
    this.setState('resting');
    if (this.team) {
      this.team.bark(this.bot?.username || 'dog', BARK_TYPES.resting);
    }
  }

  // ─── State Machine ──────────────────────────────────────

  setState(state) {
    const old = this.behaviorState;
    this.behaviorState = state;
    this.stateTimer = 0;
    if (this.onStateChange) this.onStateChange(state, old);
  }

  // ─── Herding Behavior ───────────────────────────────────

  /** Start herding a flock into a target pen. */
  startHerding(flock, pasture, targetPen) {
    if (this.energy < 20) {
      this.goRest();
      return false;
    }

    this.flock = flock;
    this.currentPasture = pasture;
    this.targetPen = targetPen;
    this.kennelPosition = pasture.kennelPosition;
    this.isHerding = true;

    this.score = new HerdingScore(
      pasture.name,
      flock.animals.length,
    );

    this.setState('approaching');
    return true;
  }

  /** Main herding tick — called every game tick. */
  update() {
    this.tickCount++;

    if (!this.isHerding) {
      if (this.isResting) this.regenEnergy();
      return;
    }

    // Energy drain
    this.drainEnergy(0.05);
    this.stateTimer++;

    // Record stress periodically
    if (this.tickCount % 20 === 0 && this.score) {
      this.score.recordStress(this.flock.averageStress());
    }

    // Check completion
    if (this.targetPen && this.score) {
      const penned = this.flock.countWhere(a =>
        this.targetPen.contains(a.position.x, a.position.z)
      );
      this.score.animalsPenned = penned;
      this.score.animalsEscaped = this.flock.countWhere(a => a.escaped);

      if (penned >= this.flock.animals.length) {
        this.completeHerding();
        return;
      }
    }

    // State behavior
    const dogPos = this.position;

    switch (this.behaviorState) {
      case 'approaching':
        this._approachBehavior(dogPos);
        break;
      case 'flanking':
        this._flankBehavior(dogPos);
        break;
      case 'pushing':
        this._pushBehavior(dogPos);
        break;
      case 'recovering':
        this._recoverBehavior(dogPos);
        break;
      default:
        break;
    }

    // Update flock AI
    this.flock.update(dogPos);

    // Check panic
    if (this.flock.isScattered() && this.levelConfig.canRecover) {
      this.setState('recovering');
    }
  }

  /** Approaching — get behind the flock. */
  _approachBehavior(dogPos) {
    const flockCenter = this.flock.computeCenter();
    const penCenter = this.targetPen.boundary.center();
    const toPen = penCenter.minus(flockCenter).normalize();

    // Position behind flock, opposite the pen
    const behindPoint = flockCenter.minus(toPen.scale(10));
    this._moveToward(behindPoint);

    if (dogPos.distanceTo(behindPoint) < 3) {
      this.setState('flanking');
    }
  }

  /** Flanking — arc around the flock (real sheepdog technique). */
  _flankBehavior(dogPos) {
    const flockCenter = this.flock.computeCenter();
    const penCenter = this.targetPen.boundary.center();

    // Calculate flank arc
    const flankRadius = 8 + this.wisdomModifiers.flankRadius;
    const toFlock = flockCenter.minus(dogPos);
    const baseAngle = Math.atan2(toFlock.z, toFlock.x);

    // Move along the arc
    const arcSpeed = this.personality.approachSpeed * 0.02;
    this.flankAngle += arcSpeed;

    const targetAngle = baseAngle + this.flankAngle;
    const targetPoint = new Vec3(
      flockCenter.x + Math.cos(targetAngle) * flankRadius,
      64,
      flockCenter.z + Math.sin(targetAngle) * flankRadius,
    );

    this._moveToward(targetPoint);
    this.drainEnergy(0.03);

    // After enough flanking, transition to pushing
    if (this.flankAngle > Math.PI * 0.5) {
      this.setState('pushing');
    }
  }

  /** Pushing — move towards flock to guide them toward pen. */
  _pushBehavior(dogPos) {
    const flockCenter = this.flock.computeCenter();
    const penCenter = this.targetPen.boundary.center();
    const toPen = penCenter.minus(flockCenter).normalize();

    // Position between dog and pen, behind the flock
    const pushPoint = flockCenter.minus(toPen.scale(5));

    // Approach with pressure style
    const dist = dogPos.distanceTo(flockCenter);
    const sensitivity = this.wisdomModifiers.pressureSensitivity;
    const approachDist = 4 * sensitivity;

    if (dist > approachDist + 2) {
      this._moveToward(pushPoint, this.personality.approachSpeed);
    } else if (dist < approachDist - 1) {
      // Too close — back off to avoid panic
      this._moveToward(dogPos.minus(flockCenter).normalize().scale(3).add(dogPos), 0.5);
    } else {
      // In the sweet spot — gentle pressure
      this._moveToward(pushPoint, this.personality.approachSpeed * 0.5);
    }

    this.drainEnergy(0.04);

    // If flock scattered, reset
    if (this.flock.isScattered()) {
      this.flankAngle = 0;
      this.setState('flanking');
    }

    // If animals are getting close to pen, hold
    const nearestToPen = this.flock.animals.reduce((min, a) => {
      const d = a.position.distanceTo(penCenter);
      return d < min ? d : min;
    }, Infinity);

    if (nearestToPen < 5) {
      // Hold position and let them settle in
      this.setState('approaching');
      this.flankAngle = 0;
    }
  }

  /** Recovering — gather scattered animals. */
  _recoverBehavior(dogPos) {
    // Find the most outlying animal
    const flockCenter = this.flock.computeCenter();
    let farthest = null;
    let farthestDist = 0;

    for (const animal of this.flock.animals) {
      const dist = animal.position.distanceTo(flockCenter);
      if (dist > farthestDist) {
        farthestDist = dist;
        farthest = animal;
      }
    }

    if (farthest) {
      // Move behind the straggler to push it back toward flock
      const toFlock = flockCenter.minus(farthest.position).normalize();
      const approachPoint = farthest.position.minus(toFlock.scale(5));
      this._moveToward(approachPoint, this.personality.approachSpeed * 0.8);
      this.drainEnergy(0.06);

      if (this.team) {
        this.team.bark(this.bot?.username || 'dog', BARK_TYPES.retrieved, farthest.id);
      }
    }

    // Check if flock is regrouped
    if (!this.flock.isScattered()) {
      this.setState('approaching');
      this.flankAngle = 0;
      // Demonstrate scatter recovery skill
      this.teachings.demonstrateSkill('recover_scatter');
    }
  }

  /** Move the bot toward a position. */
  _moveToward(target, speed = null) {
    const s = speed || this.personality.approachSpeed;
    this.targetPosition = target;

    if (this.bot && this.bot.entity) {
      const dx = target.x - this.position.x;
      const dz = target.z - this.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 0.5) {
        this.bot.entity.position.x += (dx / dist) * s * 0.1;
        this.bot.entity.position.z += (dz / dist) * s * 0.1;
      }
    }
  }

  /** Complete the herding run. */
  completeHerding() {
    this.isHerding = false;
    const result = this.score.complete();
    const multiplier = this.combo.record(result);

    // Demonstrate skills based on performance
    if (result.completionScore >= 90) {
      this.teachings.demonstrateSkill('herd_gentle');
    }
    if (result.stressScore >= 80) {
      this.teachings.demonstrateSkill('herd_complex');
    }
    if (result.efficiencyScore >= 85) {
      this.teachings.demonstrateSkill('herd_group');
    }

    // Check for new teachings
    const lesson = this.teachings.getNextLesson();
    if (lesson && this.onTeaching) {
      this.onTeaching(lesson);
    }

    if (this.onHerdingComplete) {
      this.onHerdingComplete(result, multiplier);
    }

    this.setState('idle');
    return result;
  }

  // ─── Level Progression ──────────────────────────────────

  /** Advance to next skill level. */
  levelUp() {
    const levels = Object.keys(SKILL_LEVELS);
    const currentIndex = levels.indexOf(this.level);
    if (currentIndex < levels.length - 1) {
      this.level = levels[currentIndex + 1];
      this.levelConfig = SKILL_LEVELS[this.level];
      this.energy = this.levelConfig.energyMax;
      this.wisdomModifiers = this.teachings.getWisdomModifiers();
      this.teachings.advanceTier();
      return this.levelConfig;
    }
    return null;
  }

  /** Check if level up is available. */
  canLevelUp(completedCourses = []) {
    const thresholds = { apprentice: 1, journeyman: 3, master: 5, elder: Infinity };
    return completedCourses.length >= (thresholds[this.level] || Infinity);
  }

  // ─── Multi-Dog ──────────────────────────────────────────

  /** Join a dog team. */
  joinTeam(team) {
    if (!this.levelConfig.canCoordinate && this.level !== 'elder') {
      return false; // Only elder can coordinate
    }
    this.team = team;
    return true;
  }

  // ─── Serialization ──────────────────────────────────────

  toJSON() {
    return {
      level: this.level,
      personality: this.personalityName,
      energy: this.energy,
      isResting: this.isResting,
      behaviorState: this.behaviorState,
      teachings: this.teachings.toJSON(),
      combo: this.combo.toJSON(),
      tickCount: this.tickCount,
    };
  }
}
