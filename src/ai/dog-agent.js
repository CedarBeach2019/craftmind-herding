/**
 * @module craftmind-herding/ai/dog-agent
 * @description Full agent for a herding dog — personality, memory, relationships,
 * skills, energy, trust. Each dog is a complete autonomous agent, not a state machine node.
 *
 * Adapted from craftmind-fishing's Agent class, specialized for multi-dog herding.
 */

import { DogTrust } from './dog-trust.js';
import { PackDynamics } from './pack-dynamics.js';

function clamp(min, max, v) { return Math.max(min, Math.min(max, v)); }

export class DogAgent {
  /**
   * @param {object} config
   * @param {string} config.name
   * @param {string} config.breed - visual identifier
   * @param {object} config.personality - { speed, patience, obedience, social, bravery, gentleness } 0-1
   * @param {string} config.tagline
   * @param {string[]} config.skills - starting skill names
   * @param {object} [config.trust] - trust state if resuming
   */
  constructor(config) {
    this.id = config.name.toLowerCase().replace(/\s+/g, '_');
    this.name = config.name;
    this.breed = config.breed || 'shepherd';

    // Personality axes (0-1 continuous)
    this.personality = {
      speed: config.personality?.speed ?? 0.5,
      patience: config.personality?.patience ?? 0.5,
      obedience: config.personality?.obedience ?? 0.5,
      social: config.personality?.social ?? 0.5,
      bravery: config.personality?.bravery ?? 0.5,
      gentleness: config.personality?.gentleness ?? 0.5,
    };

    this.tagline = config.tagline || '';

    // Trust system (player-dog bond)
    this.trust = new DogTrust(config.trust);

    // Skills with proficiency scores
    this.skills = new Map();
    for (const skill of (config.skills || [])) {
      this.skills.set(skill, { proficiency: 0.5, uses: 0, successes: 0 });
    }

    // Energy
    this.energyMax = 100 + (this.personality.speed * 20);
    this.energy = this.energyMax;
    this.isResting = false;

    // Memory of past herding runs
    this.memory = []; // { timestamp, action, result, conditions }
    this.maxMemory = 100;

    // Pack relationships
    this.bonds = new Map(); // dogId -> { bond: 0-1, rivalry: 0-1, lastInteraction: timestamp }

    // Position / state
    this.position = { x: 0, y: 64, z: 0 };
    this.currentAction = null;
    this.active = false;
    this.preferredRole = null; // emerges over time: 'lead', 'flanker', 'blocker', 'fetcher'

    // Performance tracking
    this.totalRuns = 0;
    this.totalPenned = 0;
    this.bestScore = 0;
  }

  start() { this.active = true; }
  stop() { this.active = false; this.currentAction = null; }

  /**
   * Receive a command from the player. Returns the action to execute,
   * or null if the dog disobeys.
   */
  receiveCommand(command) {
    if (!this.active) return null;

    // Energy check
    if (this.energy < 15) {
      this.currentAction = { type: 'REST', reason: 'too_tired' };
      return this.currentAction;
    }

    // Obedience check — personality determines compliance
    const obedienceRoll = Math.random();
    if (obedienceRoll > this.personality.obedience) {
      // Dog disobeys — returns a "stubborn" action
      this.currentAction = {
        type: 'DISOBEY',
        command,
        reason: this._disobeyReason(),
      };
      return this.currentAction;
    }

    // Trust gates advanced commands
    const advancedCommands = ['SHED', 'GUARD', 'ALERT'];
    if (advancedCommands.includes(command.type) && this.trust.level < 40) {
      this.currentAction = {
        type: 'DISOBEY',
        command,
        reason: 'not_enough_trust',
      };
      return this.currentAction;
    }

    this.currentAction = command;
    return command;
  }

  /**
   * Execute the current action — returns updated position/metadata.
   */
  tick(context = {}) {
    if (!this.active || this.isResting) {
      this._regenEnergy(0.3);
      return null;
    }

    // Energy drain
    this.energy -= 0.05;
    if (this.energy <= 0) {
      this.energy = 0;
      this.isResting = true;
      this.currentAction = { type: 'REST', reason: 'exhausted' };
      return this.currentAction;
    }

    if (!this.currentAction) return null;

    // Skill proficiency affects execution quality
    const actionType = this.currentAction.type;
    const skill = this._getRelevantSkill(actionType);
    const proficiency = skill?.proficiency ?? 0.5;

    // Build tick result
    const result = {
      type: actionType,
      dogId: this.id,
      name: this.name,
      position: { ...this.position },
      proficiency,
      personalityModifiers: this._getPersonalityModifiers(actionType),
    };

    return result;
  }

  /**
   * Record the result of a herding run in memory.
   */
  recordRun(run) {
    this.totalRuns++;
    this.totalPenned += run.animalsPenned || 0;
    if (run.score > this.bestScore) this.bestScore = run.score;

    this.memory.push({
      timestamp: Date.now(),
      action: run.action,
      result: run.score,
      conditions: run.conditions || {},
    });

    if (this.memory.length > this.maxMemory) {
      this.memory = this.memory.slice(-this.maxMemory);
    }

    // Update skill proficiencies
    if (run.skill) {
      const skill = this.skills.get(run.skill);
      if (skill) {
        skill.uses++;
        if (run.score >= 70) skill.successes++;
        skill.proficiency = clamp(0, 1, skill.successes / Math.max(1, skill.uses));
      }
    }

    // Trust change from run
    if (run.score >= 80) this.trust.change(2);
    else if (run.score >= 60) this.trust.change(1);
    if (run.playerHelped) this.trust.change(3);
    if (run.playerIgnored) this.trust.change(-2);
  }

  /**
   * Update bond with another dog.
   */
  interactWith(dogId, type) {
    if (!this.bonds.has(dogId)) {
      this.bonds.set(dogId, { bond: 0.3, rivalry: 0, lastInteraction: Date.now() });
    }
    const b = this.bonds.get(dogId);
    b.lastInteraction = Date.now();

    switch (type) {
      case 'worked_well': b.bond = clamp(0, 1, b.bond + 0.05); break;
      case 'saved': b.bond = clamp(0, 1, b.bond + 0.1); break;
      case 'competed': b.rivalry = clamp(0, 1, b.rivalry + 0.05); break;
      case 'conflict': b.bond = clamp(0, 1, b.bond - 0.1); b.rivalry = clamp(0, 1, b.rivalry + 0.08); break;
      case 'mentored': b.bond = clamp(0, 1, b.bond + 0.15); break;
    }
  }

  /**
   * Get a summary of this dog's state.
   */
  getSummary() {
    return {
      id: this.id,
      name: this.name,
      breed: this.breed,
      personality: { ...this.personality },
      energy: Math.round(this.energy),
      energyMax: Math.round(this.energyMax),
      trust: this.trust.level,
      trustTier: this.trust.getTier(),
      skills: Object.fromEntries(
        Array.from(this.skills.entries()).map(([k, v]) => [k, { ...v, proficiency: Math.round(v.proficiency * 100) + '%' }])
      ),
      totalRuns: this.totalRuns,
      bestScore: this.bestScore,
      preferredRole: this.preferredRole,
      isResting: this.isResting,
      bonds: Object.fromEntries(this.bonds.entries()),
    };
  }

  // ── Internal ──────────────────────────────────

  _getRelevantSkill(actionType) {
    const skillMap = {
      'FLANK_LEFT': 'flank', 'FLANK_RIGHT': 'flank',
      'DRIVE': 'drive', 'GATHER': 'gather', 'HOLD': 'hold',
      'SHED': 'shed', 'GUARD': 'guard', 'RECALL': 'recall',
      'HERD': 'heel',
    };
    const skillName = skillMap[actionType];
    return skillName ? this.skills.get(skillName) : null;
  }

  _getPersonalityModifiers(actionType) {
    const mods = {};
    if (actionType === 'DRIVE') {
      mods.speedFactor = 0.7 + this.personality.speed * 0.6;
      mods.gentlenessFactor = this.personality.gentleness;
    }
    if (actionType === 'GATHER') {
      mods.patienceFactor = 0.5 + this.personality.patience * 0.5;
    }
    if (actionType === 'FLANK_LEFT' || actionType === 'FLANK_RIGHT') {
      mods.arcRadius = 6 + this.personality.speed * 6;
    }
    return mods;
  }

  _disobeyReason() {
    const reasons = ['stubborn', 'distracted', 'knows_better', 'tired'];
    if (this.personality.patience < 0.3) return 'impatient';
    if (this.personality.bravery < 0.3) return 'scared';
    return reasons[Math.floor(Math.random() * reasons.length)];
  }

  _regenEnergy(rate) {
    this.energy = Math.min(this.energyMax, this.energy + rate);
    if (this.energy >= this.energyMax * 0.9) {
      this.isResting = false;
    }
  }
}

export default DogAgent;
