/**
 * @module craftmind-herding/ai/dog-trust
 * @description Trust and bond system between player and dog.
 * Trust gates commands. Low trust = basic commands only.
 * High trust = the dog will follow into danger.
 */

export const TRUST_TIERS = {
  stranger:  { min: 0,  max: 20,  description: "Barely knows you. Won't listen much." },
  familiar:  { min: 20, max: 40,  description: "Recognizes you. Basic commands work." },
  friend:    { min: 40, max: 60,  description: "Trusts your judgment. Works willingly." },
  partner:   { min: 60, max: 80,  description: "Your partner. Advanced commands available." },
  bonded:    { min: 80, max: 100, description: "Inseparable. Will follow anywhere." },
};

export class DogTrust {
  constructor(state = null) {
    this.level = state?.level ?? 10;
    this.history = state?.history || []; // { change, reason, timestamp }
  }

  /**
   * Change trust by an amount. Clamps 0-100.
   */
  change(amount, reason = '') {
    const old = this.level;
    this.level = Math.max(0, Math.min(100, this.level + amount));
    const actual = this.level - old;

    if (actual !== 0) {
      this.history.push({ change: actual, reason, timestamp: Date.now() });
      if (this.history.length > 50) this.history = this.history.slice(-50);
    }

    return actual;
  }

  /**
   * Get the current trust tier name.
   */
  getTier() {
    for (const [name, tier] of Object.entries(TRUST_TIERS)) {
      if (this.level >= tier.min && this.level < tier.max) return name;
    }
    return 'bonded';
  }

  /**
   * Can the dog receive a given command at current trust level?
   */
  canReceive(actionType, isAdvanced = false) {
    if (actionType === 'REST' || actionType === 'RECALL') return true;
    if (isAdvanced && this.level < 40) return false;
    return true;
  }

  /**
   * Get a description of the trust relationship.
   */
  getDescription() {
    const tier = this.getTier();
    return TRUST_TIERS[tier].description;
  }

  /**
   * Serialize state.
   */
  toJSON() {
    return { level: this.level, tier: this.getTier(), history: this.history.slice(-10) };
  }
}

export default DogTrust;
