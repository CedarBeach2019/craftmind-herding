/**
 * @module craftmind-herding/ai/pack-dynamics
 * @description Emergent pack behavior: role assignment, rivalry, mentorship,
 * coordination. Dogs develop preferred roles and relationships over time.
 */

import { EventEmitter } from 'events';

export const PACK_ROLES = ['lead', 'flanker', 'blocker', 'fetcher'];

export class PackDynamics extends EventEmitter {
  constructor() {
    super();
    this.dogs = new Map(); // id -> { role, confidence, leadChallenges }
    this.interactionLog = [];
    this.maxLog = 200;
  }

  /**
   * Register a dog with the pack.
   */
  registerDog(dog) {
    this.dogs.set(dog.id, {
      role: dog.preferredRole || null,
      confidence: 0.5,
      leadChallenges: 0,
      mentorTarget: null,
      mentoredBy: null,
    });
  }

  /**
   * Get the current lead dog.
   */
  getLeadDog() {
    for (const [id, info] of this.dogs) {
      if (info.role === 'lead') return id;
    }
    return null;
  }

  /**
   * Assign roles based on dog personalities and historical performance.
   * Emergent: dogs gravitate to roles matching their traits.
   */
  assignRoles(dogs) {
    if (dogs.length === 0) return {};

    const assignments = {};
    const dogIds = dogs.map(d => d.id);

    // Ensure all registered
    for (const dog of dogs) {
      if (!this.dogs.has(dog.id)) this.registerDog(dog);
    }

    // Lead: highest confidence + highest speed + highest bravery
    const leadCandidates = dogs
      .filter(d => d.energy > 20)
      .sort((a, b) => {
        const scoreA = (a.personality.speed * 0.4 + a.personality.bravery * 0.3 + (this.dogs.get(a.id)?.confidence || 0.5) * 0.3);
        const scoreB = (b.personality.speed * 0.4 + b.personality.bravery * 0.3 + (this.dogs.get(b.id)?.confidence || 0.5) * 0.3);
        return scoreB - scoreA;
      });

    if (leadCandidates.length > 0) {
      const leadId = leadCandidates[0].id;
      assignments[leadId] = 'lead';
      this.dogs.get(leadId).role = 'lead';
    }

    // Flanker: high patience + high gentleness + high social
    const flanker = dogs
      .filter(d => !assignments[d.id] && d.energy > 20)
      .sort((a, b) => {
        const scoreA = (a.personality.patience * 0.3 + a.personality.gentleness * 0.4 + a.personality.social * 0.3);
        const scoreB = (b.personality.patience * 0.3 + b.personality.gentleness * 0.4 + b.personality.social * 0.3);
        return scoreB - scoreA;
      })[0];

    if (flanker) {
      assignments[flanker.id] = 'flanker';
      this.dogs.get(flanker.id).role = 'flanker';
    }

    // Blocker: high obedience + low speed
    const blocker = dogs
      .filter(d => !assignments[d.id] && d.energy > 20)
      .sort((a, b) => (a.personality.obedience + (1 - a.personality.speed)) - (b.personality.obedience + (1 - b.personality.speed)))[0];

    if (blocker) {
      assignments[blocker.id] = 'blocker';
      this.dogs.get(blocker.id).role = 'blocker';
    }

    // Remaining: fetcher
    for (const dog of dogs) {
      if (!assignments[dog.id]) {
        assignments[dog.id] = 'fetcher';
        this.dogs.get(dog.id).role = 'fetcher';
      }
    }

    return assignments;
  }

  /**
   * Handle a lead challenge between two dogs.
   */
  challengeLead(challengerId, currentLeadId, dogs) {
    const challenger = dogs.find(d => d.id === challengerId);
    const current = dogs.find(d => d.id === currentLeadId);
    if (!challenger || !current) return currentLeadId;

    const challengerInfo = this.dogs.get(challengerId);
    const currentInfo = this.dogs.get(currentLeadId);
    if (!challengerInfo || !currentInfo) return currentLeadId;

    // Challenge score based on personality + recent performance
    const challengeScore = (
      challenger.personality.speed * 0.3 +
      challenger.personality.bravery * 0.3 +
      challenger.bestScore / 100 * 0.2 +
      Math.random() * 0.2
    );

    const holdScore = (
      current.personality.speed * 0.3 +
      current.personality.bravery * 0.3 +
      current.bestScore / 100 * 0.2 +
      Math.random() * 0.2
    );

    challengerInfo.leadChallenges++;

    this._log('lead_challenge', { challenger: challengerId, current: currentLeadId, winner: challengeScore > holdScore ? challengerId : currentLeadId });

    if (challengeScore > holdScore) {
      currentInfo.role = 'flanker';
      challengerInfo.role = 'lead';
      challengerInfo.confidence = Math.min(1, challengerInfo.confidence + 0.1);
      currentInfo.confidence = Math.max(0, currentInfo.confidence - 0.05);
      this.emit('lead_change', { newLead: challengerId, oldLead: currentLeadId });
      return challengerId;
    }

    currentInfo.confidence = Math.min(1, currentInfo.confidence + 0.05);
    challengerInfo.confidence = Math.max(0, challengerInfo.confidence - 0.05);
    return currentLeadId;
  }

  /**
   * Check for mentorship opportunities (wise dogs near timid dogs).
   */
  checkMentorship(dogs) {
    const wiseDogs = dogs.filter(d => d.personality.patience > 0.8 && d.totalRuns > 5);
    const timidDogs = dogs.filter(d => d.personality.bravery < 0.4 && d.totalRuns < 10);

    for (const wise of wiseDogs) {
      for (const timid of timidDogs) {
        if (wise.id === timid.id) continue;
        const bond = timid.bonds.get(wise.id);
        if (bond && bond.bond > 0.5) {
          const info = this.dogs.get(wise.id);
          if (info && info.mentorTarget !== timid.id) {
            info.mentorTarget = timid.id;
            const timidInfo = this.dogs.get(timid.id);
            if (timidInfo) timidInfo.mentoredBy = wise.id;
            this.emit('mentorship', { mentor: wise.id, student: timid.id });
            this._log('mentorship_start', { mentor: wise.id, student: timid.id });
          }
        }
      }
    }
  }

  /**
   * Update coordination quality based on pack relationships.
   * Returns 0-1 coordination score.
   */
  getCoordinationScore(dogs) {
    if (dogs.length <= 1) return 1;

    let totalBond = 0;
    let pairs = 0;

    for (let i = 0; i < dogs.length; i++) {
      for (let j = i + 1; j < dogs.length; j++) {
        const bond = dogs[i].bonds.get(dogs[j].id);
        if (bond) {
          totalBond += bond.bond - bond.rivalry * 0.5;
          pairs++;
        }
      }
    }

    return pairs > 0 ? Math.max(0, Math.min(1, totalBond / pairs)) : 0.5;
  }

  _log(type, data) {
    this.interactionLog.push({ type, data, timestamp: Date.now() });
    if (this.interactionLog.length > this.maxLog) {
      this.interactionLog = this.interactionLog.slice(-this.maxLog);
    }
  }
}

export default PackDynamics;
