// ═══════════════════════════════════════════════════════════════
// CraftMind Herding — Flock Simulation
// ═══════════════════════════════════════════════════════════════
//
// A more advanced flock simulation with individual sheep personalities,
// grass eating behavior, and realistic fatigue/rest cycles.
// ═══════════════════════════════════════════════════════════════

import { Vec3 } from 'vec3';

/** Sheep personality types - each sheep is unique. */
export const SHEEP_PERSONALITIES = {
  leader: {
    name: 'Leader',
    confidence: 0.9,
    stubbornness: 0.2,
    curiosity: 0.7,
    socialInfluence: 1.5,  // Others follow more strongly
    flightTendency: 0.3,
    description: 'Bold and decisive. Others look to them for direction.',
  },
  follower: {
    name: 'Follower',
    confidence: 0.3,
    stubbornness: 0.5,
    curiosity: 0.3,
    socialInfluence: 0.8,
    flightTendency: 0.6,
    description: 'Seeks safety in numbers. Stays close to the group.',
  },
  wanderer: {
    name: 'Wanderer',
    confidence: 0.6,
    stubbornness: 0.8,
    curiosity: 0.9,
    socialInfluence: 0.5,
    flightTendency: 0.4,
    description: 'Easily distracted. Often drifts away from the flock.',
  },
  nervous: {
    name: 'Nervous',
    confidence: 0.2,
    stubbornness: 0.3,
    curiosity: 0.2,
    socialInfluence: 1.0,
    flightTendency: 0.9,
    description: 'Startles easily. First to flee, last to calm.',
  },
  calm: {
    name: 'Calm',
    confidence: 0.5,
    stubbornness: 0.6,
    curiosity: 0.4,
    socialInfluence: 0.7,
    flightTendency: 0.2,
    description: 'Unflappable. Keeps grazing even when others panic.',
  },
};

/** Grass patches in the pasture. */
class GrassPatch {
  constructor(x, z, quality = 1.0) {
    this.position = new Vec3(x, 64, z);
    this.quality = quality;
    this.eaten = false;
    this.regrowTimer = 0;
  }

  /** Try to eat from this patch. */
  eat() {
    if (this.eaten) return false;
    this.eaten = true;
    this.regrowTimer = 600 + Math.random() * 400; // 30-50 seconds to regrow
    return true;
  }

  /** Regrow grass over time. */
  update(dt) {
    if (this.eaten) {
      this.regrowTimer -= dt;
      if (this.regrowTimer <= 0) {
        this.eaten = false;
      }
    }
  }
}

/** Enhanced sheep with personality and complex behaviors. */
export class Sheep {
  constructor(id, position, personality = 'follower') {
    this.id = id;
    this.position = position.clone();
    this.velocity = new Vec3(0, 0, 0);

    // Personality
    this.personalityType = personality;
    this.personality = SHEEP_PERSONALITIES[personality] || SHEEP_PERSONALITIES.follower;

    // State
    this.energy = 1.0;           // 0-1, tiredness
    this.hunger = 0.0;           // 0-1, gets hungry over time
    this.panicLevel = 0.0;       // 0-1
    this.isGrazing = false;
    this.isResting = false;
    this.grazeTimer = 0;
    this.restTimer = 0;

    // Behavior modifiers
    this.maxSpeed = 0.8 * (0.8 + this.personality.confidence * 0.4);
    this.flightRadius = 6 * (1.2 - this.personality.flightTendency * 0.4);

    // Metrics
    this.distanceTraveled = 0;
    this.panicCount = 0;
    this.grassEaten = 0;
  }

  /** Update sheep behavior state. */
  updateBehavior(grassPatches, nearbySheep, dogPosition) {
    // Update energy and hunger
    this.energy = Math.max(0, this.energy - 0.0001);
    this.hunger = Math.min(1, this.hunger + 0.00005);

    // Resting behavior
    if (this.isResting) {
      this.restTimer--;
      this.energy = Math.min(1, this.energy + 0.002);
      if (this.restTimer <= 0 || this.energy >= 0.9) {
        this.isResting = false;
      }
      return; // Don't move while resting
    }

    // Decide to rest if very tired
    if (this.energy < 0.2 && !this.isGrazing && this.panicLevel < 0.1) {
      this.isResting = true;
      this.restTimer = 100 + Math.random() * 100;
      return;
    }

    // Grazing behavior
    if (this.isGrazing) {
      this.grazeTimer--;
      this.energy = Math.min(1, this.energy + 0.0005); // Recover energy while grazing
      if (this.grazeTimer <= 0) {
        this.isGrazing = false;
      }
      return; // Don't move while grazing
    }

    // Decide to graze if hungry and not panicked
    if (this.hunger > 0.3 && this.panicLevel < 0.2 && !this.isGrazing) {
      const nearbyGrass = this._findNearestGrass(grassPatches);
      if (nearbyGrass && this.position.distanceTo(nearbyGrass.position) < 8) {
        this.isGrazing = true;
        this.grazeTimer = 40 + Math.random() * 60;
        if (nearbyGrass.eat()) {
          this.hunger = Math.max(0, this.hunger - 0.3);
          this.grassEaten++;
        }
        return;
      }
    }

    // Panic decay
    this.panicLevel = Math.max(0, this.panicLevel - 0.01);
  }

  /** Find nearest grass patch. */
  _findNearestGrass(grassPatches) {
    let nearest = null;
    let nearestDist = Infinity;
    for (const grass of grassPatches) {
      if (grass.eaten) continue;
      const dist = this.position.distanceTo(grass.position);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = grass;
      }
    }
    return nearest;
  }

  /** Trigger panic response. */
  panic(intensity = 0.8) {
    this.panicLevel = Math.min(1, this.panicLevel + intensity * this.personality.flightTendency);
    this.isGrazing = false;
    this.isResting = false;
    this.panicCount++;
  }

  /** Get current speed based on state. */
  getCurrentSpeed() {
    let speed = this.maxSpeed;

    // Tired sheep move slower
    if (this.energy < 0.3) speed *= 0.6;
    else if (this.energy < 0.5) speed *= 0.8;

    // Grazing/resting sheep barely move
    if (this.isGrazing || this.isResting) speed *= 0.1;

    // Panic makes sheep faster
    if (this.panicLevel > 0.3) speed *= 1.2;

    return speed;
  }
}

/** Enhanced flock simulation with personalities and complex behaviors. */
export class FlockSimulation {
  constructor() {
    this.sheep = [];
    this.grassPatches = [];
    this.center = new Vec3(0, 64, 0);
    this.dogPosition = new Vec3(0, 64, 0);

    // Boid weights
    this.separationWeight = 1.5;
    this.alignmentWeight = 1.0;
    this.cohesionWeight = 1.0;

    // Personality-based social influence
    this.socialRadius = 10;
  }

  /** Add a sheep to the flock. */
  addSheep(sheep) {
    this.sheep.push(sheep);
    return this;
  }

  /** Remove a sheep by id. */
  removeSheep(id) {
    this.sheep = this.sheep.filter(s => s.id !== id);
    return this;
  }

  /** Get a sheep by id. */
  getSheep(id) {
    return this.sheep.find(s => s.id === id);
  }

  /** Add grass patches to the pasture. */
  addGrassPatches(count, areaRadius = 30) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * areaRadius;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const quality = 0.5 + Math.random() * 0.5;
      this.grassPatches.push(new GrassPatch(x, z, quality));
    }
    return this;
  }

  /** Get current flock state. */
  getFlockState() {
    return {
      count: this.sheep.length,
      center: this.computeCenter(),
      averagePanic: this.averagePanic(),
      averageEnergy: this.averageEnergy(),
      isScattered: this.isScattered(),
      personalityBreakdown: this.getPersonalityBreakdown(),
    };
  }

  /** Compute flock center of mass. */
  computeCenter() {
    if (this.sheep.length === 0) return new Vec3(0, 64, 0);
    let x = 0, z = 0;
    for (const s of this.sheep) {
      x += s.position.x;
      z += s.position.z;
    }
    return new Vec3(x / this.sheep.length, 64, z / this.sheep.length);
  }

  /** Average panic level. */
  averagePanic() {
    if (this.sheep.length === 0) return 0;
    return this.sheep.reduce((sum, s) => sum + s.panicLevel, 0) / this.sheep.length;
  }

  /** Average energy level. */
  averageEnergy() {
    if (this.sheep.length === 0) return 1;
    return this.sheep.reduce((sum, s) => sum + s.energy, 0) / this.sheep.length;
  }

  /** Is flock scattered? */
  isScattered() {
    const avgPanic = this.averagePanic();
    return avgPanic > 0.5 || this.sheep.some(s => s.position.distanceTo(this.center) > 20);
  }

  /** Get breakdown of personalities. */
  getPersonalityBreakdown() {
    const breakdown = {};
    for (const s of this.sheep) {
      breakdown[s.personalityType] = (breakdown[s.personalityType] || 0) + 1;
    }
    return breakdown;
  }

  // ─── Boids Algorithm with Personalities ─────────────────────────

  /** Separation - steer away from nearby sheep. */
  _separation(sheep) {
    const steer = new Vec3(0, 0, 0);
    let count = 0;
    const radius = 3;

    for (const other of this.sheep) {
      if (other.id === sheep.id) continue;
      const dist = sheep.position.distanceTo(other.position);
      if (dist < radius && dist > 0) {
        const diff = sheep.position.minus(other.position).normalize().scale(1 / dist);
        steer.add(diff);
        count++;
      }
    }

    if (count > 0) {
      steer.scale(1 / count);
      if (steer.norm() > 0) steer.normalize();
    }
    return steer;
  }

  /** Alignment - match velocity with neighbors, weighted by social influence. */
  _alignment(sheep) {
    const avgVel = new Vec3(0, 0, 0);
    let totalInfluence = 0;
    const radius = 8;

    for (const other of this.sheep) {
      if (other.id === sheep.id) continue;
      const dist = sheep.position.distanceTo(other.position);
      if (dist < radius) {
        const influence = other.personality.socialInfluence;
        avgVel.add(other.velocity.scale(influence));
        totalInfluence += influence;
      }
    }

    if (totalInfluence > 0) {
      avgVel.scale(1 / totalInfluence);
      if (avgVel.norm() > 0) avgVel.normalize();
    }
    return avgVel;
  }

  /** Cohesion - steer toward center, leaders influence more. */
  _cohesion(sheep) {
    let center = new Vec3(0, 0, 0);
    let totalWeight = 0;
    const radius = 10;

    for (const other of this.sheep) {
      if (other.id === sheep.id) continue;
      const dist = sheep.position.distanceTo(other.position);
      if (dist < radius) {
        const weight = other.personality.socialInfluence;
        center.add(other.position.scale(weight));
        totalWeight += weight;
      }
    }

    if (totalWeight > 0) {
      center.scale(1 / totalWeight);
      const desired = center.minus(sheep.position);
      if (desired.norm() > 0) desired.normalize();
      return desired;
    }
    return new Vec3(0, 0, 0);
  }

  /** Flight response - flee from dog, based on personality. */
  _flightResponse(sheep) {
    const dist = sheep.position.distanceTo(this.dogPosition);
    const radius = sheep.flightRadius;

    if (dist < radius) {
      const away = sheep.position.minus(this.dogPosition).normalize();
      const intensity = (1 - dist / radius) * sheep.personality.flightTendency;
      return away.scale(intensity * 2.5);
    }
    return new Vec3(0, 0, 0);
  }

  /** Wander toward grass if hungry. */
  _grassAttraction(sheep) {
    if (sheep.hunger < 0.3) return new Vec3(0, 0, 0);

    const nearest = sheep._findNearestGrass(this.grassPatches);
    if (nearest) {
      const toGrass = nearest.position.minus(sheep.position);
      const dist = toGrass.norm();
      if (dist > 0) {
        return toGrass.normalize().scale(0.3 * sheep.hunger);
      }
    }
    return new Vec3(0, 0, 0);
  }

  // ─── Main Update ─────────────────────────────────────────────

  /** Update simulation by dt seconds. */
  update(dt = 1) {
    this.center = this.computeCenter();

    // Update grass
    for (const grass of this.grassPatches) {
      grass.update(dt);
    }

    // Update each sheep
    for (const sheep of this.sheep) {
      // Update behavior state
      sheep.updateBehavior(this.grassPatches, this.sheep, this.dogPosition);

      // Skip movement if grazing or resting
      if (sheep.isGrazing || sheep.isResting) {
        sheep.velocity.scale(0.1);
        continue;
      }

      // Calculate boids forces
      const sep = this._separation(sheep).scale(this.separationWeight);
      const ali = this._alignment(sheep).scale(this.alignmentWeight);
      const coh = this._cohesion(sheep).scale(this.cohesionWeight);

      let desired = new Vec3(0, 0, 0);
      desired.add(sep).add(ali).add(coh);

      // Dog response
      desired.add(this._flightResponse(sheep));

      // Grass attraction
      desired.add(this._grassAttraction(sheep));

      // Wanderer personality adds randomness
      if (sheep.personalityType === 'wanderer' && sheep.panicLevel < 0.2) {
        desired.add(new Vec3(
          (Math.random() - 0.5) * 0.5,
          0,
          (Math.random() - 0.5) * 0.5
        ));
      }

      // Panic adds chaos
      if (sheep.panicLevel > 0.1) {
        desired.add(new Vec3(
          (Math.random() - 0.5) * sheep.panicLevel * 2,
          0,
          (Math.random() - 0.5) * sheep.panicLevel * 2
        ));
      }

      // Apply speed limit
      const currentSpeed = sheep.getCurrentSpeed();
      if (desired.norm() > 0) {
        desired.normalize().scale(currentSpeed);
      }

      // Smooth steering
      sheep.velocity = sheep.velocity.add(desired.minus(sheep.velocity).scale(0.1));

      // Update position
      const movement = sheep.velocity.scale(dt);
      sheep.position.add(movement);
      sheep.distanceTraveled += movement.norm();
    }

    // Spread panic contagiously
    this._spreadPanic();

    return this;
  }

  /** Spread panic through the flock - fear is contagious. */
  _spreadPanic() {
    for (const sheep of this.sheep) {
      if (sheep.panicLevel > 0.5) {
        for (const other of this.sheep) {
          if (other.id === sheep.id) continue;
          const dist = sheep.position.distanceTo(other.position);
          if (dist < 8) {
            const transmission = sheep.panicLevel * other.personality.flightTendency * 0.1;
            other.panic(Math.max(0.05, transmission));
          }
        }
      }
    }
  }

  /** Set dog position for flight responses. */
  setDogPosition(position) {
    this.dogPosition = position.clone();
    return this;
  }

  /** Panic the entire flock (loud noise, sudden threat). */
  panicAll(intensity = 0.6) {
    for (const sheep of this.sheep) {
      sheep.panic(intensity);
    }
  }
}
