// ═══════════════════════════════════════════════════════════════
// CraftMind Herding — Flock AI
// ═══════════════════════════════════════════════════════════════
//
// The flock thinks together, moves together, fears together.
// Each sheep is a small world of instinct — grazing, fleeing,
// drifting. Together they become something wiser than any one.
//
// Boids algorithm + flight/drift zones + panic + grazing.
// Different animal types carry different souls.
// ═══════════════════════════════════════════════════════════════

import { Vec3 } from 'vec3';

/** Animal type definitions — each carries its own nature. */
export const ANIMAL_TYPES = {
  sheep: {
    name: 'Sheep',
    flightRadius: 6,
    driftRadius: 12,
    maxSpeed: 0.8,
    separationWeight: 1.5,
    alignmentWeight: 1.0,
    cohesionWeight: 1.0,
    grazingChance: 0.02,
    stubbornness: 0.3,
    description: 'Gentle, predictable. The heart of any flock.',
  },
  cow: {
    name: 'Cow',
    flightRadius: 8,
    driftRadius: 14,
    maxSpeed: 0.6,
    separationWeight: 1.2,
    alignmentWeight: 0.8,
    cohesionWeight: 1.2,
    grazingChance: 0.04,
    stubbornness: 0.8,
    description: 'Slow, stubborn, strong-willed. Moves on its own time.',
  },
  pig: {
    name: 'Pig',
    flightRadius: 5,
    driftRadius: 10,
    maxSpeed: 1.2,
    separationWeight: 1.0,
    alignmentWeight: 0.6,
    cohesionWeight: 0.8,
    grazingChance: 0.01,
    stubbornness: 0.2,
    description: 'Quick and unpredictable. Keeps you on your paws.',
  },
  chicken: {
    name: 'Chicken',
    flightRadius: 4,
    driftRadius: 8,
    maxSpeed: 1.5,
    separationWeight: 0.5,
    alignmentWeight: 0.3,
    cohesionWeight: 0.4,
    grazingChance: 0.03,
    stubbornness: 0.1,
    description: 'Pure chaos in feathers. Herding them is an act of faith.',
  },
};

/** A single animal in the flock. */
export class Animal {
  constructor(id, type = 'sheep', position = new Vec3(0, 0, 0)) {
    this.id = id;
    this.type = type;
    this.config = ANIMAL_TYPES[type] || ANIMAL_TYPES.sheep;
    this.position = position.clone();
    this.velocity = new Vec3(0, 0, 0);
    this.isGrazing = false;
    this.grazeTimer = 0;
    this.panicLevel = 0;       // 0–1, decays over time
    this.stress = 0;           // cumulative stress for scoring
    this.inPen = false;
    this.escaped = false;
  }

  /** Distance to a point. */
  distanceTo(point) {
    return this.position.distanceTo(point);
  }

  /** Update grazing state — sheep stop to eat, harder to move. */
  updateGrazing() {
    if (this.isGrazing) {
      this.grazeTimer--;
      if (this.grazeTimer <= 0) this.isGrazing = false;
    } else if (Math.random() < this.config.grazingChance) {
      this.isGrazing = true;
      this.grazeTimer = 40 + Math.floor(Math.random() * 60);
    }
  }

  /** Panic response — triggered by loud noises or sudden threats. */
  panic(intensity = 0.8) {
    this.panicLevel = Math.min(1, this.panicLevel + intensity);
    this.isGrazing = false;
    this.stress += intensity * 0.1;
  }

  /** Decay panic over time. Gentle return to calm. */
  decayPanic() {
    this.panicLevel *= 0.95;
    if (this.panicLevel < 0.01) this.panicLevel = 0;
  }
}

/** The flock — a living constellation of instinct. */
export class Flock {
  constructor() {
    this.animals = [];
    this.center = new Vec3(0, 0, 0);
    this.panicThreshold = 0.6;   // average panic above this = scattered
    this.season = 'spring';
  }

  /** Add an animal to the flock. */
  add(animal) {
    this.animals.push(animal);
    return this;
  }

  /** Remove an animal by id. */
  remove(id) {
    this.animals = this.animals.filter(a => a.id !== id);
    return this;
  }

  /** Get flock center of mass. */
  computeCenter() {
    if (this.animals.length === 0) return new Vec3(0, 0, 0);
    let x = 0, y = 0, z = 0;
    for (const a of this.animals) {
      x += a.position.x;
      y += a.position.y;
      z += a.position.z;
    }
    const n = this.animals.length;
    this.center = new Vec3(x / n, y / n, z / n);
    return this.center;
  }

  /** Count animals in a specific state. */
  countWhere(predicate) {
    return this.animals.filter(predicate).length;
  }

  /** Average stress level across flock. */
  averageStress() {
    if (this.animals.length === 0) return 0;
    return this.animals.reduce((sum, a) => sum + a.stress, 0) / this.animals.length;
  }

  /** Average panic level. */
  averagePanic() {
    if (this.animals.length === 0) return 0;
    return this.animals.reduce((sum, a) => sum + a.panicLevel, 0) / this.animals.length;
  }

  /** Is the flock scattered? */
  isScattered() {
    return this.averagePanic() > this.panicThreshold;
  }

  // ─── Boids Algorithm ──────────────────────────────────────

  /** Separation: steer away from nearby flockmates. */
  _separation(animal, radius = 3) {
    const steer = new Vec3(0, 0, 0);
    let count = 0;
    for (const other of this.animals) {
      if (other.id === animal.id) continue;
      const dist = animal.distanceTo(other.position);
      if (dist < radius && dist > 0) {
        const diff = animal.position.minus(other.position).normalize().scale(1 / dist);
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

  /** Alignment: steer towards average heading of neighbors. */
  _alignment(animal, radius = 8) {
    const avgVel = new Vec3(0, 0, 0);
    let count = 0;
    for (const other of this.animals) {
      if (other.id === animal.id) continue;
      if (animal.distanceTo(other.position) < radius) {
        avgVel.add(other.velocity);
        count++;
      }
    }
    if (count > 0) {
      avgVel.scale(1 / count);
      if (avgVel.norm() > 0) avgVel.normalize();
    }
    return avgVel;
  }

  /** Cohesion: steer towards center of mass of neighbors. */
  _cohesion(animal, radius = 10) {
    let center = new Vec3(0, 0, 0);
    let count = 0;
    for (const other of this.animals) {
      if (other.id === animal.id) continue;
      if (animal.distanceTo(other.position) < radius) {
        center.add(other.position);
        count++;
      }
    }
    if (count > 0) {
      center.scale(1 / count);
      const desired = center.minus(animal.position);
      if (desired.norm() > 0) desired.normalize();
      return desired;
    }
    return new Vec3(0, 0, 0);
  }

  // ─── Dog Response Zones ───────────────────────────────────

  /** Flight zone — flee when dog is too close. */
  _flightResponse(animal, dogPosition) {
    const dist = animal.distanceTo(dogPosition);
    if (dist < animal.config.flightRadius) {
      const away = animal.position.minus(dogPosition).normalize();
      const intensity = 1 - (dist / animal.config.flightRadius);
      return away.scale(intensity * 2);
    }
    return new Vec3(0, 0, 0);
  }

  /** Drift zone — gently move away at medium distance. */
  _driftResponse(animal, dogPosition) {
    const dist = animal.distanceTo(dogPosition);
    if (dist >= animal.config.flightRadius && dist < animal.config.driftRadius) {
      const away = animal.position.minus(dogPosition).normalize();
      const intensity = 1 - ((dist - animal.config.flightRadius) /
        (animal.config.driftRadius - animal.config.flightRadius));
      return away.scale(intensity * 0.5);
    }
    return new Vec3(0, 0, 0);
  }

  // ─── Main Update ──────────────────────────────────────────

  /** Update all animals for one tick. dogPosition can be null. */
  update(dogPosition = null, deltaTime = 1) {
    this.computeCenter();

    for (const animal of this.animals) {
      animal.updateGrazing();
      animal.decayPanic();

      // Grazing animals barely move — they're at peace.
      if (animal.isGrazing && animal.panicLevel < 0.2) {
        animal.velocity.scale(0.1);
        animal.position.add(animal.velocity.scale(deltaTime));
        continue;
      }

      const config = animal.config;

      // Boids forces
      const sep = this._separation(animal).scale(config.separationWeight);
      const ali = this._alignment(animal).scale(config.alignmentWeight);
      const coh = this._cohesion(animal).scale(config.cohesionWeight);

      let desired = new Vec3(0, 0, 0);
      desired.add(sep).add(ali).add(coh);

      // Dog response
      if (dogPosition) {
        desired.add(this._flightResponse(animal, dogPosition).scale(3));
        desired.add(this._driftResponse(animal, dogPosition));
      }

      // Panic adds randomness — chaos energy
      if (animal.panicLevel > 0.1) {
        desired.add(new Vec3(
          (Math.random() - 0.5) * animal.panicLevel * 2,
          0,
          (Math.random() - 0.5) * animal.panicLevel * 2
        ));
      }

      // Stubbornness — some animals resist movement
      const stubbornFactor = 1 - config.stubbornness * 0.5;

      // Apply steering
      if (desired.norm() > 0) {
        desired.normalize().scale(config.maxSpeed * stubbornFactor);
      }

      // Smooth steering (don't instantly snap)
      animal.velocity = animal.velocity.add(desired.minus(animal.velocity).scale(0.1));
      animal.position.add(animal.velocity.scale(deltaTime));
    }

    return this;
  }

  /** Spread a panic through the flock — fear is contagious. */
  spreadPanic(sourceAnimal, radius = 10, intensity = 0.4) {
    for (const animal of this.animals) {
      if (animal.id === sourceAnimal.id) continue;
      const dist = animal.distanceTo(sourceAnimal.position);
      if (dist < radius) {
        const falloff = 1 - (dist / radius);
        animal.panic(intensity * falloff);
      }
    }
  }
}
