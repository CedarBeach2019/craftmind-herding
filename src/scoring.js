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

/** Leaderboard entry. */
class LeaderboardEntry {
  constructor(playerName, courseName, scoreData, timestamp = Date.now()) {
    this.playerName = playerName;
    this.courseName = courseName;
    this.score = scoreData.overall;
    this.scoreData = scoreData;
    this.timestamp = timestamp;
  }

  toJSON() {
    return {
      playerName: this.playerName,
      courseName: this.courseName,
      score: this.score,
      scoreData: this.scoreData,
      timestamp: this.timestamp,
    };
  }

  static fromJSON(data) {
    return new LeaderboardEntry(
      data.playerName,
      data.courseName,
      data.scoreData,
      data.timestamp
    );
  }
}

/** Leaderboard persistence system. */
export class Leaderboard {
  constructor() {
    this.entries = [];
    this.maxEntries = 100;  // Keep top 100 per course
    this.storageKey = 'craftmind_herding_leaderboard';
  }

  /** Load leaderboard from localStorage (or file system in Node). */
  load() {
    try {
      // Try localStorage first (browser)
      if (typeof localStorage !== 'undefined') {
        const data = localStorage.getItem(this.storageKey);
        if (data) {
          const parsed = JSON.parse(data);
          this.entries = parsed.map(e => LeaderboardEntry.fromJSON(e));
        }
      } else {
        // Node.js - could read from file here
        // For now, start fresh
        this.entries = [];
      }
    } catch (error) {
      console.warn('Failed to load leaderboard:', error.message);
      this.entries = [];
    }
    return this;
  }

  /** Save leaderboard to localStorage (or file system in Node). */
  save() {
    try {
      const data = JSON.stringify(this.entries);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKey, data);
      } else {
        // Node.js - could write to file here
        // For now, just serialize to JSON
      }
    } catch (error) {
      console.warn('Failed to save leaderboard:', error.message);
    }
    return this;
  }

  /** Record a new score. */
  recordScore(playerName, courseName, scoreData) {
    const entry = new LeaderboardEntry(playerName, courseName, scoreData);
    this.entries.push(entry);

    // Sort by score (descending) and keep only top entries per course
    this.entries.sort((a, b) => b.score - a.score);

    // Trim to max entries per course
    const courseGroups = new Map();
    for (const e of this.entries) {
      const key = e.courseName;
      if (!courseGroups.has(key)) {
        courseGroups.set(key, []);
      }
      if (courseGroups.get(key).length < this.maxEntries) {
        courseGroups.get(key).push(e);
      }
    }

    // Flatten back to entries array
    this.entries = [];
    for (const group of courseGroups.values()) {
      this.entries.push(...group);
    }

    this.save();
    return entry;
  }

  /** Get leaderboard for a specific course. */
  getLeaderboard(courseName, limit = 10) {
    return this.entries
      .filter(e => e.courseName === courseName)
      .slice(0, limit);
  }

  /** Get top scores across all courses. */
  getTopScores(limit = 10) {
    return this.entries.slice(0, limit);
  }

  /** Get player's best scores. */
  getPlayerScores(playerName, limit = 10) {
    return this.entries
      .filter(e => e.playerName === playerName)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /** Get player's best score for a specific course. */
  getPlayerBest(playerName, courseName) {
    const scores = this.entries.filter(e =>
      e.playerName === playerName && e.courseName === courseName
    );
    return scores.length > 0 ? scores[0] : null;
  }

  /** Check if a new score is a personal best. */
  isPersonalBest(playerName, courseName, score) {
    const best = this.getPlayerBest(playerName, courseName);
    return !best || score > best.score;
  }

  /** Get ranking for a score on a course. */
  getRank(courseName, score) {
    const courseScores = this.getLeaderboard(courseName);
    for (let i = 0; i < courseScores.length; i++) {
      if (score >= courseScores[i].score) {
        return i + 1;
      }
    }
    return courseScores.length + 1;
  }

  /** Clear all entries (for testing). */
  clear() {
    this.entries = [];
    this.save();
    return this;
  }

  /** Get statistics. */
  getStats() {
    const totalScores = this.entries.length;
    const uniquePlayers = new Set(this.entries.map(e => e.playerName)).size;
    const courses = new Set(this.entries.map(e => e.courseName));

    return {
      totalScores,
      uniquePlayers,
      courseCount: courses.size,
      courses: Array.from(courses),
    };
  }
}

/** Create a global leaderboard instance. */
export const globalLeaderboard = new Leaderboard().load();
