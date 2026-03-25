// ═══════════════════════════════════════════════════════════════
// CraftMind Herding — Scoring
// ═══════════════════════════════════════════════════════════════
//
// Not every good herding is fast. Some are slow and gentle.
// But the score must reflect something — effort, care,
// the quiet art of moving without frightening.
// ═══════════════════════════════════════════════════════════════

export class HerdingScore {
  constructor(courseName, animalCount) {
    this.courseName = courseName;
    this.animalCount = animalCount;
    this.startTime = Date.now();
    this.endTime = null;

    // Tracking
    this.animalsPenned = 0;
    this.animalsEscaped = 0;
    this.totalStress = 0;
    this.distanceTraveled = 0;
    this.optimalDistance = 0;
    this.stressSamples = [];
    this.panicEvents = 0;
  }

  /** Record the optimal path distance (set when course starts). */
  setOptimalDistance(dist) {
    this.optimalDistance = dist;
    return this;
  }

  /** Add distance traveled by the dog. */
  addDistance(dist) {
    this.distanceTraveled += dist;
    return this;
  }

  /** Record a stress sample (called periodically). */
  recordStress(avgStress) {
    this.stressSamples.push(avgStress);
    this.totalStress += avgStress;
    return this;
  }

  /** Record a panic event. */
  recordPanic() {
    this.panicEvents++;
    return this;
  }

  /** Mark an animal as safely penned. */
  penAnimal() {
    this.animalsPenned++;
    return this;
  }

  /** Mark an animal as escaped. */
  escapeAnimal() {
    this.animalsEscaped++;
    return this;
  }

  /** Complete the run and calculate final scores. */
  complete() {
    this.endTime = Date.now();
    return this.calculate();
  }

  /** Calculate all score components. */
  calculate() {
    const duration = (this.endTime || Date.now()) - this.startTime;
    const durationSec = duration / 1000;

    // ─── Time Score (faster = better, diminishing returns) ──
    const timeScore = Math.max(0, 100 - (durationSec / 10));

    // ─── Completion Score ──────────────────────────────────
    const completionRate = this.animalCount > 0
      ? this.animalsPenned / this.animalCount
      : 0;
    const completionScore = completionRate * 100;

    // ─── Stress Score (lower = better) ────────────────────
    const avgStress = this.stressSamples.length > 0
      ? this.totalStress / this.stressSamples.length
      : 0;
    const stressScore = Math.max(0, 100 - (avgStress * 200));

    // ─── Efficiency Score ─────────────────────────────────
    let efficiencyScore = 100;
    if (this.optimalDistance > 0 && this.distanceTraveled > 0) {
      const ratio = this.distanceTraveled / this.optimalDistance;
      efficiencyScore = Math.max(0, 100 - ((ratio - 1) * 50));
    }

    // ─── Panic Penalty ────────────────────────────────────
    const panicPenalty = this.panicEvents * 5;

    // ─── Overall ──────────────────────────────────────────
    const overall = Math.max(0, Math.min(100, (
      timeScore * 0.15 +
      completionScore * 0.35 +
      stressScore * 0.25 +
      efficiencyScore * 0.15 -
      panicPenalty
    )));

    return {
      overall: Math.round(overall),
      timeScore: Math.round(timeScore),
      completionScore: Math.round(completionScore),
      stressScore: Math.round(stressScore),
      efficiencyScore: Math.round(efficiencyScore),
      durationSec: Math.round(durationSec),
      animalsPenned: this.animalsPenned,
      animalsEscaped: this.animalsEscaped,
      panicEvents: this.panicEvents,
      avgStress: Math.round(avgStress * 100) / 100,
      distanceTraveled: Math.round(this.distanceTraveled * 10) / 10,
      starRating: this._starRating(overall, completionRate),
    };
  }

  /** Star rating based on overall score and completion. */
  _starRating(overall, completionRate) {
    if (completionRate < 0.5) return '☆☆☆☆☆';
    if (overall >= 90) return '★★★★★';
    if (overall >= 75) return '★★★★☆';
    if (overall >= 60) return '★★★☆☆';
    if (overall >= 40) return '★★☆☆☆';
    return '★☆☆☆☆';
  }

  /** Format score as a chat message. */
  toChatMessage() {
    const s = this.calculate();
    return [
      `╔══ Herding Report ══╗`,
      `║ Course: ${this.courseName}`,
      `║ Score: ${s.overall}/100 ${s.starRating}`,
      `║ Penned: ${s.animalsPenned}/${this.animalCount}`,
      `║ Time: ${s.durationSec}s`,
      `║ Flock Stress: ${s.avgStress}`,
      `║ Panics: ${s.panicEvents}`,
      `╚════════════════════╝`,
    ].join('\n');
  }
}

/** Combo tracker — rewards consecutive clean herds. */
export class ComboTracker {
  constructor() {
    this.currentStreak = 0;
    this.bestStreak = 0;
    this.lastScore = 0;
    this.multiplier = 1.0;
  }

  /** Record a completed run. */
  record(score) {
    if (score.overall >= 70 && score.completionScore >= 90) {
      this.currentStreak++;
      this.multiplier = 1 + (this.currentStreak - 1) * 0.1;
    } else {
      this.currentStreak = 0;
      this.multiplier = 1.0;
    }
    this.bestStreak = Math.max(this.bestStreak, this.currentStreak);
    this.lastScore = score.overall;
    return this.multiplier;
  }

  /** Get current combo info. */
  getStatus() {
    return {
      currentStreak: this.currentStreak,
      bestStreak: this.bestStreak,
      multiplier: this.multiplier,
    };
  }

  toJSON() {
    return {
      currentStreak: this.currentStreak,
      bestStreak: this.bestStreak,
      multiplier: this.multiplier,
    };
  }
}
