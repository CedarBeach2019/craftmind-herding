// ═══════════════════════════════════════════════════════════════
// CraftMind Herding — Multi-Dog Coordination
// ═══════════════════════════════════════════════════════════════
//
// Two dogs thinking as one. Three dogs reading the same wind.
// Elder herding is not louder — it is quieter. Less barking,
// more understanding. Each dog knows its place.
// ═══════════════════════════════════════════════════════════════

import { Vec3 } from 'vec3';

/** Roles within a dog team. */
export const DOG_ROLES = {
  lead: {
    name: 'Lead Dog',
    description: 'Primary herder. Decides strategy and directs the flock.',
    emoji: '🐕',
  },
  flanker: {
    name: 'Flanker',
    description: 'Keeps the flock from drifting sideways. Patience matters.',
    emoji: '🐕‍🦺',
  },
  blocker: {
    name: 'Blocker',
    description: 'Guards exits and prevents escapes. The unsung hero.',
    emoji: '🐩',
  },
  fetcher: {
    name: 'Fetcher',
    description: 'Retrieves stragglers and runners. Fast, reliable.',
    emoji: '🐾',
  },
};

/** A bark — how dogs communicate. */
export class Bark {
  constructor(fromId, type, target = null, data = {}) {
    this.fromId = fromId;
    this.type = type;       // see BARK_TYPES
    this.target = target;   // Vec3 or animal id
    this.data = data;
    this.timestamp = Date.now();
  }
}

export const BARK_TYPES = {
  moving_to: 'I am moving to this position. Stay clear.',
  guarding: 'I am guarding this exit. Focus elsewhere.',
  need_help: 'Animals escaping! I need support here.',
  flanking: 'Beginning my approach from this side.',
  retrieved: 'Got the straggler. Flock is whole again.',
  resting: 'Going to kennel to rest. Cover for me.',
  all_clear: 'Pen is secure. Wrap up.',
  scatter: 'Flock has scattered! Regroup!',
  steady: 'Hold position. Waiting for animals to settle.',
};

/** A single dog in the team. */
export class TeamDog {
  constructor(id, role = 'flanker', position = new Vec3(0, 0, 0)) {
    this.id = id;
    this.role = role;
    this.roleConfig = DOG_ROLES[role];
    this.position = position.clone();
    this.energy = 100;
    this.targetPosition = null;
    this.assignedAnimals = [];
  }
}

/** The dog team coordinator — Elder-level capability. */
export class DogTeam {
  constructor() {
    this.dogs = [];
    this.barkLog = [];
    this.leadDogId = null;
    this.strategy = 'basic'; // basic, split, surround, channel
  }

  /** Add a dog to the team. */
  addDog(dog) {
    this.dogs.push(dog);
    if (!this.leadDogId) this.leadDogId = dog.id;
    return this;
  }

  /** Set the lead dog. */
  setLead(dogId) {
    const dog = this.dogs.find(d => d.id === dogId);
    if (dog) {
      this.leadDogId = dogId;
      dog.role = 'lead';
      dog.roleConfig = DOG_ROLES.lead;
    }
    return this;
  }

  /** Assign roles based on dog count and strategy. */
  assignRoles(strategy = null) {
    if (strategy) this.strategy = strategy;

    if (this.dogs.length === 1) {
      this.dogs[0].role = 'lead';
      this.dogs[0].roleConfig = DOG_ROLES.lead;
      return;
    }

    if (this.dogs.length === 2) {
      const lead = this.dogs.find(d => d.id === this.leadDogId) || this.dogs[0];
      const support = this.dogs.find(d => d.id !== this.leadDogId) || this.dogs[1];
      lead.role = 'lead';
      lead.roleConfig = DOG_ROLES.lead;
      support.role = 'flanker';
      support.roleConfig = DOG_ROLES.flanker;
      return;
    }

    // 3+ dogs: lead, flanker, blocker(s), fetcher
    const lead = this.dogs.find(d => d.id === this.leadDogId) || this.dogs[0];
    lead.role = 'lead';
    lead.roleConfig = DOG_ROLES.lead;

    const others = this.dogs.filter(d => d.id !== lead.id);
    const roles = ['flanker', 'blocker', 'fetcher'];
    others.forEach((dog, i) => {
      dog.role = roles[i % roles.length];
      dog.roleConfig = DOG_ROLES[dog.role];
    });
  }

  /** Log a bark from a team member. */
  bark(fromId, type, target = null, data = {}) {
    const bark = new Bark(fromId, type, target, data);
    this.barkLog.push(bark);
    // Keep log manageable
    if (this.barkLog.length > 200) {
      this.barkLog = this.barkLog.slice(-100);
    }
    return bark;
  }

  /** Get recent barks for a dog (so it can react). */
  getRecentBarks(since, excludeId = null) {
    return this.barkLog.filter(b =>
      b.timestamp > since && b.fromId !== excludeId
    );
  }

  /** Calculate strategic positions for each dog based on flock center and target. */
  calculatePositions(flockCenter, targetPen, flockSize = 10) {
    const positions = {};
    const toTarget = targetPen.minus(flockCenter).normalize();

    for (const dog of this.dogs) {
      switch (dog.role) {
        case 'lead':
          // Behind the flock, pushing towards target
          dog.targetPosition = flockCenter.minus(toTarget.scale(flockSize * 0.8));
          break;
        case 'flanker':
          // Side of flock, perpendicular to movement direction
          const side = (dog.id.charCodeAt(0) % 2 === 0) ? 1 : -1;
          dog.targetPosition = flockCenter.offset(
            toTarget.z * side * flockSize * 0.6,
            0,
            -toTarget.x * side * flockSize * 0.6,
          );
          break;
        case 'blocker':
          // Between flock and nearest escape route
          dog.targetPosition = targetPen.clone();
          break;
        case 'fetcher':
          // Far from flock, ready to chase stragglers
          dog.targetPosition = flockCenter.offset(
            (Math.random() - 0.5) * flockSize,
            0,
            (Math.random() - 0.5) * flockSize,
          );
          break;
      }
      positions[dog.id] = dog.targetPosition;
    }

    return positions;
  }

  /** Get active (non-resting) dog count. */
  activeCount() {
    return this.dogs.filter(d => d.energy > 20).length;
  }

  /** Serialize. */
  toJSON() {
    return {
      strategy: this.strategy,
      leadDogId: this.leadDogId,
      dogs: this.dogs.map(d => ({
        id: d.id,
        role: d.role,
        energy: d.energy,
      })),
    };
  }
}
