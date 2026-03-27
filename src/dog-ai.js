// ═══════════════════════════════════════════════════════════════
// CraftMind Herding — Smart Dog AI
// ═══════════════════════════════════════════════════════════════
//
// An intelligent herding dog with path planning, barking mechanics,
// stamina management, and learning from experience.
// ═══════════════════════════════════════════════════════════════

import { Vec3 } from 'vec3';

/** Herding strategies - different approaches for different situations. */
export const HERDING_STRATEGIES = {
  gather: {
    name: 'Gather',
    description: 'Bring scattered sheep together into a tight group',
    idealDistance: 15,
    approachSpeed: 0.8,
    pressure: 'gentle',
  },
  drive: {
    name: 'Drive',
    description: 'Move the flock toward a target pen',
    idealDistance: 8,
    approachSpeed: 1.0,
    pressure: 'moderate',
  },
  hold: {
    name: 'Hold',
    description: 'Keep sheep in place, prevent escapes',
    idealDistance: 5,
    approachSpeed: 0.3,
    pressure: 'minimal',
  },
  flank: {
    name: 'Flank',
    description: 'Circle around to redirect flock movement',
    idealDistance: 12,
    approachSpeed: 1.2,
    pressure: 'calculated',
  },
};

/** Learning data - tracks what works and what doesn't. */
class LearningMemory {
  constructor() {
    this.attempts = [];           // All herding attempts
    this.successPatterns = new Map();  // What leads to success
    this.failurePatterns = new Map();  // What leads to failure
    this.efficiencyMetrics = {
      averageTime: 0,
      averageStress: 0,
      successRate: 0,
    };
  }

  /** Record a herding attempt. */
  recordAttempt(attempt) {
    this.attempts.push(attempt);
    this._updateMetrics();
    this._extractPatterns(attempt);
  }

  /** Update overall efficiency metrics. */
  _updateMetrics() {
    const successes = this.attempts.filter(a => a.success);
    this.efficiencyMetrics.successRate = successes.length / Math.max(1, this.attempts.length);

    if (successes.length > 0) {
      this.efficiencyMetrics.averageTime = successes.reduce((sum, a) => sum + a.duration, 0) / successes.length;
      this.efficiencyMetrics.averageStress = successes.reduce((sum, a) => sum + a.finalStress, 0) / successes.length;
    }
  }

  /** Extract patterns from this attempt. */
  _extractPatterns(attempt) {
    const key = `${attempt.strategy}_${attempt.sheepCount}`;

    if (attempt.success) {
      const existing = this.successPatterns.get(key) || { count: 0, totalTime: 0, totalStress: 0 };
      existing.count++;
      existing.totalTime += attempt.duration;
      existing.totalStress += attempt.finalStress;
      this.successPatterns.set(key, existing);
    } else {
      const existing = this.failurePatterns.get(key) || { count: 0 };
      existing.count++;
      this.failurePatterns.set(key, existing);
    }
  }

  /** Get recommended strategy for situation. */
  getRecommendation(sheepCount, flockState) {
    // Simple recommendation based on flock state
    if (flockState.isScattered) {
      return 'gather';
    } else if (flockState.averagePanic > 0.5) {
      return 'hold';
    } else {
      return 'drive';
    }
  }

  /** Get efficiency bonus based on experience. */
  getEfficiencyBonus() {
    const attemptCount = this.attempts.length;
    const successCount = this.attempts.filter(a => a.success).length;

    // More experience = better efficiency
    return Math.min(0.5, (attemptCount * 0.01) + (successCount * 0.02));
  }
}

/** Path planning around obstacles. */
class PathPlanner {
  constructor() {
    this.obstacles = [];
    this.currentPath = [];
    this.pathIndex = 0;
  }

  /** Set obstacles in the environment. */
  setObstacles(obstacles) {
    this.obstacles = obstacles;
    return this;
  }

  /** Plan path from start to goal avoiding obstacles. */
  planPath(start, goal, stepSize = 2) {
    this.currentPath = [];
    this.pathIndex = 0;

    // Simple obstacle avoidance - add waypoints around obstacles
    let current = start.clone();
    const maxIterations = 100;
    let iterations = 0;

    while (current.distanceTo(goal) > stepSize && iterations < maxIterations) {
      iterations++;

      // Check if direct path is blocked
      const blocked = this._isPathBlocked(current, goal);

      if (!blocked) {
        this.currentPath.push(goal.clone());
        break;
      }

      // Find obstacle to avoid
      const obstacle = this._findNearestObstacle(current);

      if (obstacle) {
        // Calculate waypoint around obstacle
        const toObstacle = obstacle.center.minus(current);
        const perpendicular = new Vec3(-toObstacle.z, 0, toObstacle.x).normalize();
        const waypoint = current.add(perpendicular.scale(obstacle.radius + 3));
        this.currentPath.push(waypoint);
        current = waypoint;
      } else {
        // No obstacle found, move toward goal
        const toGoal = goal.minus(current).normalize().scale(stepSize);
        current = current.add(toGoal);
      }
    }

    return this.currentPath;
  }

  /** Check if path between two points is blocked. */
  _isPathBlocked(from, to) {
    for (const obstacle of this.obstacles) {
      if (this._lineIntersectsCircle(from, to, obstacle.center, obstacle.radius)) {
        return true;
      }
    }
    return false;
  }

  /** Find nearest obstacle to a point. */
  _findNearestObstacle(point) {
    let nearest = null;
    let nearestDist = Infinity;

    for (const obstacle of this.obstacles) {
      const dist = point.distanceTo(obstacle.center);
      if (dist < obstacle.radius + 5 && dist < nearestDist) {
        nearestDist = dist;
        nearest = obstacle;
      }
    }

    return nearest;
  }

  /** Check if line segment intersects circle. */
  _lineIntersectsCircle(from, to, circleCenter, circleRadius) {
    const d = to.minus(from);
    const f = from.minus(circleCenter);

    const a = d.dot(d);
    const b = 2 * f.dot(d);
    const c = f.dot(f) - circleRadius * circleRadius;

    let discriminant = b * b - 4 * a * c;

    if (discriminant < 0) return false;

    discriminant = Math.sqrt(discriminant);
    const t1 = (-b - discriminant) / (2 * a);
    const t2 = (-b + discriminant) / (2 * a);

    return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
  }

  /** Get next waypoint in path. */
  getNextWaypoint() {
    if (this.pathIndex < this.currentPath.length) {
      return this.currentPath[this.pathIndex++];
    }
    return null;
  }

  /** Check if path is complete. */
  isPathComplete() {
    return this.pathIndex >= this.currentPath.length;
  }

  /** Clear current path. */
  clearPath() {
    this.currentPath = [];
    this.pathIndex = 0;
  }
}

/** Smart Dog AI with learning and path planning. */
export class DogAI {
  constructor(options = {}) {
    // Basic properties
    this.name = options.name || 'Shepherd';
    this.position = options.position || new Vec3(0, 64, 0);
    this.targetPosition = null;

    // Stamina system
    this.maxStamina = options.maxStamina || 100;
    this.stamina = this.maxStamina;
    this.staminaDrainRate = 0.05;
    this.staminaRegenRate = 0.1;
    this.isExhausted = false;

    // Barking
    this.barkCooldown = 0;
    this.barkCooldownTime = 60;  // ticks between barks
    this.barkRadius = 15;

    // Learning
    this.memory = new LearningMemory();
    this.experience = 0;
    this.level = 1;

    // Path planning
    this.pathPlanner = new PathPlanner();

    // Current strategy
    this.currentStrategy = null;
    this.strategyStartTime = 0;

    // State
    this.isHerding = false;
    this.currentTarget = null;
    this.pennedSheep = 0;

    // Callbacks
    this.onBark = null;
    this.onExhausted = null;
  }

  /** Main update - call every tick. */
  update(dt = 1) {
    // Regenerate stamina
    if (!this.isHerding) {
      this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRegenRate * dt);
      if (this.isExhausted && this.stamina > this.maxStamina * 0.3) {
        this.isExhausted = false;
      }
    }

    // Update bark cooldown
    if (this.barkCooldown > 0) {
      this.barkCooldown -= dt;
    }

    // Execute current strategy
    if (this.isHerding && this.currentStrategy) {
      this._executeStrategy(dt);
    }
  }

  /** Start herding with a strategy. */
  herd(strategy, flockState, targetPen = null) {
    if (this.isExhausted) {
      return false;
    }

    const strategyConfig = HERDING_STRATEGIES[strategy];
    if (!strategyConfig) {
      console.warn(`Unknown strategy: ${strategy}`);
      return false;
    }

    this.currentStrategy = strategy;
    this.strategyStartTime = Date.now();
    this.isHerding = true;
    this.currentTarget = targetPen;

    // Get AI recommendation and adjust based on experience
    const recommended = this.memory.getRecommendation(
      flockState.count,
      flockState
    );

    // Apply learning bonus
    const efficiencyBonus = this.memory.getEfficiencyBonus();

    return true;
  }

  /** Execute the current herding strategy. */
  _executeStrategy(dt) {
    const config = HERDING_STRATEGIES[this.currentStrategy];

    // Drain stamina based on strategy intensity
    const drainMultiplier = {
      gather: 1.0,
      drive: 1.2,
      hold: 0.3,
      flank: 1.5,
    }[this.currentStrategy] || 1.0;

    this.stamina -= this.staminaDrainRate * drainMultiplier * dt;

    if (this.stamina <= 0) {
      this.stamina = 0;
      this.isExhausted = true;
      this.isHerding = false;
      if (this.onExhausted) {
        this.onExhausted();
      }
      return;
    }

    // Move toward target position
    if (this.targetPosition) {
      this._moveToward(this.targetPosition, config.approachSpeed * dt);
    }
  }

  /** Bark to scare nearby sheep. */
  bark() {
    if (this.barkCooldown > 0 || this.isExhausted) {
      return false;
    }

    this.barkCooldown = this.barkCooldownTime;
    this.stamina -= 2;  // Barking costs stamina

    if (this.onBark) {
      this.onBark(this.position, this.barkRadius);
    }

    return true;
  }

  /** Rest to recover stamina. */
  rest(duration = 100) {
    this.isHerding = false;
    this.stamina = Math.min(this.maxStamina, this.stamina + duration * 0.1);

    if (this.stamina >= this.maxStamina * 0.9) {
      this.isExhausted = false;
    }
  }

  /** Move toward a position. */
  _moveToward(target, speed) {
    const direction = target.minus(this.position);
    const distance = direction.norm();

    if (distance > 0.5) {
      const movement = direction.normalize().scale(Math.min(speed, distance));
      this.position.add(movement);
    } else {
      // Reached target
      return true;
    }

    return false;
  }

  /** Plan path to goal avoiding obstacles. */
  planPath(goal, obstacles = []) {
    this.pathPlanner.setObstacles(obstacles);
    this.pathPlanner.planPath(this.position, goal);
    return this;
  }

  /** Follow planned path. */
  followPath(speed = 1.0) {
    const waypoint = this.pathPlanner.getNextWaypoint();
    if (waypoint) {
      this.targetPosition = waypoint;
      return this._moveToward(waypoint, speed);
    }
    return true;  // Path complete
  }

  /** Complete a herding attempt and learn from it. */
  completeHerding(success, flockState, duration) {
    const attempt = {
      strategy: this.currentStrategy,
      sheepCount: flockState.count,
      success,
      duration,
      finalStress: flockState.averagePanic,
      timestamp: Date.now(),
    };

    this.memory.recordAttempt(attempt);
    this.experience += success ? 10 : 2;

    // Level up based on experience
    const newLevel = Math.floor(this.experience / 100) + 1;
    if (newLevel > this.level) {
      this.level = newLevel;
      // Improve stats
      this.maxStamina = 100 + (this.level - 1) * 10;
      this.stamina = this.maxStamina;
    }

    this.isHerding = false;
    this.currentStrategy = null;

    return attempt;
  }

  /** Get current strategy info. */
  getStrategyInfo() {
    if (!this.currentStrategy) return null;
    return HERDING_STRATEGIES[this.currentStrategy];
  }

  /** Get efficiency metrics. */
  getMetrics() {
    return {
      level: this.level,
      experience: this.experience,
      stamina: this.stamina,
      maxStamina: this.maxStamina,
      isExhausted: this.isExhausted,
      attempts: this.memory.attempts.length,
      successRate: this.memory.efficiencyMetrics.successRate,
      averageTime: this.memory.efficiencyMetrics.averageTime,
      averageStress: this.memory.efficiencyMetrics.averageStress,
    };
  }

  /** Set bark callback. */
  onBark(callback) {
    this.onBark = callback;
  }

  /** Set exhausted callback. */
  onExhausted(callback) {
    this.onExhausted = callback;
  }

  /** Serialize for saving. */
  toJSON() {
    return {
      name: this.name,
      level: this.level,
      experience: this.experience,
      maxStamina: this.maxStamina,
      memory: {
        attempts: this.memory.attempts.slice(-50),  // Keep last 50 attempts
        efficiencyMetrics: this.memory.efficiencyMetrics,
      },
    };
  }

  /** Load from saved data. */
  static fromJSON(data) {
    const dog = new DogAI({
      name: data.name,
      maxStamina: data.maxStamina,
    });
    dog.level = data.level;
    dog.experience = data.experience;
    dog.memory.attempts = data.memory.attempts || [];
    dog.memory.efficiencyMetrics = data.memory.efficiencyMetrics || dog.memory.efficiencyMetrics;
    return dog;
  }
}
