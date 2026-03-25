// ═══════════════════════════════════════════════════════════════
// CraftMind Herding — Terrain & Pasture Management
// ═══════════════════════════════════════════════════════════════
//
// The land shapes the work. A wise dog reads the ground —
// where the grass is thick, where the water flows, where
// the gate opens and the pen waits.
// ═══════════════════════════════════════════════════════════════

import { Vec3 } from 'vec3';

/** A rectangular boundary (axis-aligned). */
export class Boundary {
  constructor(minX, minZ, maxX, maxZ) {
    this.minX = minX;
    this.minZ = minZ;
    this.maxX = maxX;
    this.maxZ = maxZ;
  }

  contains(x, z) {
    return x >= this.minX && x <= this.maxX && z >= this.minZ && z <= this.maxZ;
  }

  center() {
    return new Vec3(
      (this.minX + this.maxX) / 2,
      0,
      (this.minZ + this.maxZ) / 2,
    );
  }

  size() {
    return { x: this.maxX - this.minX, z: this.maxZ - this.minZ };
  }

  expand(margin) {
    return new Boundary(
      this.minX - margin, this.minZ - margin,
      this.maxX + margin, this.maxZ + margin,
    );
  }
}

/** A gate — a passage that can be opened or closed. */
export class Gate {
  constructor(id, position, width = 3, direction = 'north') {
    this.id = id;
    this.position = position.clone();
    this.width = width;
    this.direction = direction; // north, south, east, west
    this.isOpen = false;
  }

  toggle() {
    this.isOpen = !this.isOpen;
  }

  open() { this.isOpen = true; }
  close() { this.isOpen = false; }

  /** Get the gate's line segment (for pathfinding). */
  getPassage() {
    const half = this.width / 2;
    switch (this.direction) {
      case 'north':
      case 'south':
        return [this.position.offset(-half, 0, 0), this.position.offset(half, 0, 0)];
      case 'east':
      case 'west':
        return [this.position.offset(0, 0, -half), this.position.offset(0, 0, half)];
      default:
        return [this.position, this.position];
    }
  }
}

/** A pen — an enclosure for holding animals. */
export class Pen {
  constructor(id, boundary, gateId = null) {
    this.id = id;
    this.boundary = boundary instanceof Boundary ? boundary : new Boundary(
      boundary.minX, boundary.minZ, boundary.maxX, boundary.maxZ
    );
    this.gateId = gateId;
    this.capacity = 20; // max animals
  }

  /** Check if a position is inside the pen. */
  contains(x, z) {
    return this.boundary.contains(x, z);
  }

  /** Count animals currently inside. */
  countInside(animals) {
    return animals.filter(a => this.contains(a.position.x, a.position.z)).length;
  }

  /** Is the pen full? */
  isFull(animals) {
    return this.countInside(animals) >= this.capacity;
  }
}

/** Obstacle — something the dog must navigate around. */
export class Obstacle {
  constructor(id, position, radius = 2, type = 'rock') {
    this.id = id;
    this.position = position.clone();
    this.radius = radius;
    this.type = type; // rock, tree, water, fence
  }
}

/** A complete herding course. */
export class Pasture {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.boundary = null;
    this.pens = [];
    this.gates = [];
    this.obstacles = [];
    this.kennelPosition = new Vec3(0, 0, 0);
    this.waterSource = null;
    this.spawnPoints = [];
  }

  setBoundary(minX, minZ, maxX, maxZ) {
    this.boundary = new Boundary(minX, minZ, maxX, maxZ);
    return this;
  }

  addPen(pen) { this.pens.push(pen); return this; }
  addGate(gate) { this.gates.push(gate); return this; }
  addObstacle(obstacle) { this.obstacles.push(obstacle); return this; }

  setKennel(x, y, z) {
    this.kennelPosition = new Vec3(x, y, z);
    return this;
  }

  setWater(x, y, z) {
    this.waterSource = new Vec3(x, y, z);
    return this;
  }

  addSpawnPoint(x, y, z) {
    this.spawnPoints.push(new Vec3(x, y, z));
    return this;
  }

  /** Find the nearest open area suitable for animal spawn. */
  findOpenArea(minRadius = 5) {
    if (this.spawnPoints.length > 0) {
      return this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length)];
    }
    return this.boundary ? this.boundary.center() : new Vec3(0, 0, 0);
  }

  /** Find the nearest pen to a position. */
  nearestPen(position) {
    let nearest = null;
    let nearestDist = Infinity;
    for (const pen of this.pens) {
      const dist = position.distanceTo(pen.boundary.center());
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = pen;
      }
    }
    return nearest;
  }

  /** Check if position is blocked by an obstacle. */
  isBlocked(position, margin = 1) {
    for (const obs of this.obstacles) {
      if (position.distanceTo(obs.position) < obs.radius + margin) {
        return true;
      }
    }
    return false;
  }

  /** Get seasonal movement modifier. */
  getSeasonalModifier(season) {
    switch (season) {
      case 'winter': return 0.6;  // snow
      case 'autumn': return 0.85;
      case 'summer': return 0.9;  // heat
      default: return 1.0;
    }
  }
}

/** Terrain analyzer — reads the Minecraft world to find features. */
export class TerrainAnalyzer {
  constructor(bot) {
    this.bot = bot;
  }

  /** Scan an area and find open grass blocks. */
  findGrassArea(center, radius = 20) {
    const positions = [];
    const cx = Math.floor(center.x);
    const cz = Math.floor(center.z);
    const y = Math.floor(center.y);

    for (let x = cx - radius; x <= cx + radius; x++) {
      for (let z = cz - radius; z <= cz + radius; z++) {
        const block = this.bot.blockAt(new Vec3(x, y, z));
        if (block && block.name.includes('grass')) {
          positions.push(new Vec3(x + 0.5, y + 1, z + 0.5));
        }
      }
    }
    return positions;
  }

  /** Find water blocks near a center point. */
  findWater(center, radius = 30) {
    const sources = [];
    const cx = Math.floor(center.x);
    const cz = Math.floor(center.z);

    for (let x = cx - radius; x <= cx + radius; x += 3) {
      for (let z = cz - radius; z <= cz + radius; z += 3) {
        const block = this.bot.blockAt(new Vec3(x, Math.floor(center.y), z));
        if (block && block.name.includes('water')) {
          sources.push(new Vec3(x + 0.5, center.y, z + 0.5));
        }
      }
    }
    return sources;
  }
}
