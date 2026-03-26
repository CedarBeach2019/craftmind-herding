/**
 * @module craftmind-herding/ai/herding-evaluator
 * @description Comparative evaluation for herding — adapted from fishing's evaluator.
 * Scores sessions, finds patterns, ranks dog+skill combinations.
 */

function clamp(min, max, v) { return Math.max(min, Math.min(max, v)); }

export class HerdingEvaluator {
  constructor(dataDir = './data') {
    this.sessions = [];
    this.maxSessions = 500;
  }

  /**
   * Score a herding session on 0-1 scale.
   */
  scoreSession(session) {
    const penned = session.animalsPenned || 0;
    const total = session.animalCount || 1;
    const stress = session.avgStress || 0;
    const duration = session.duration || 1;
    const panics = session.panicEvents || 0;
    const score = session.score || 0;

    let s = 0;

    // Completion (0-0.35)
    s += (penned / total) * 0.35;

    // Overall score factor (0-0.25)
    s += (score / 100) * 0.25;

    // Low stress bonus (0-0.15)
    s += clamp(0, 0.15, (1 - stress) * 0.15);

    // Time efficiency (0-0.15) — faster is better, diminishing
    const timeFactor = Math.min(1, 100 / duration);
    s += timeFactor * 0.15;

    // Panic penalty (0-0.1)
    s -= clamp(0, 0.1, panics * 0.02);

    return clamp(0, 1, s);
  }

  /**
   * Find sessions with similar conditions.
   */
  findSimilar(conditions, limit = 20) {
    return this.sessions
      .map(s => ({ session: s, similarity: this._similarity(conditions, s.conditions) }))
      .filter(({ similarity }) => similarity >= 0.3)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(({ session }) => session);
  }

  _similarity(a, b) {
    if (!a || !b) return 0;
    let matches = 0, total = 0;

    const exact = ['season', 'animalType', 'weather', 'terrain'];
    for (const f of exact) {
      if (a[f] !== undefined || b[f] !== undefined) {
        total++;
        if (a[f] === b[f]) matches++;
      }
    }

    const numeric = [
      { key: 'flockSize', tol: 5 },
      { key: 'temperature', tol: 10 },
    ];
    for (const { key, tol } of numeric) {
      if (a[key] !== undefined && b[key] !== undefined) {
        total++;
        if (Math.abs(a[key] - b[key]) <= tol) matches++;
      }
    }

    return total > 0 ? matches / total : 0;
  }

  /**
   * Add a session and evaluate it against history.
   */
  addSession(session) {
    const scored = { ...session, evalScore: this.scoreSession(session), addedAt: Date.now() };
    this.sessions.push(scored);
    if (this.sessions.length > this.maxSessions) {
      this.sessions = this.sessions.slice(-this.maxSessions);
    }
    return this.evaluate(session);
  }

  /**
   * Evaluate a session against historical data.
   */
  evaluate(session) {
    const score = this.scoreSession(session);
    const similar = this.findSimilar(session.conditions || {});
    const scored = similar.map(s => ({ ...s, evalScore: this.scoreSession(s) }));

    const betterThan = scored.filter(s => s.evalScore > score).length;

    // Rank dog combos
    const comboStats = {};
    for (const s of [...scored, { ...session, evalScore: score }]) {
      const key = s.dogCombo || s.dogId || 'unknown';
      if (!comboStats[key]) comboStats[key] = { scores: [], count: 0 };
      comboStats[key].scores.push(s.evalScore);
      comboStats[key].count++;
    }

    const comboRanking = {};
    let bestCombo = null, bestAvg = 0;
    for (const [name, stats] of Object.entries(comboStats)) {
      const avg = stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length;
      comboRanking[name] = { avgScore: avg, count: stats.count };
      if (avg > bestAvg) { bestAvg = avg; bestCombo = name; }
    }

    // Rank skills
    const skillStats = {};
    for (const s of [...scored, { ...session, evalScore: score }]) {
      const skill = s.primarySkill || 'unknown';
      if (!skillStats[skill]) skillStats[skill] = { scores: [], count: 0 };
      skillStats[skill].scores.push(s.evalScore);
      skillStats[skill].count++;
    }

    const skillRanking = {};
    let bestSkill = null, bestSkillAvg = 0;
    for (const [name, stats] of Object.entries(skillStats)) {
      const avg = stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length;
      skillRanking[name] = { avgScore: avg, count: stats.count };
      if (avg > bestSkillAvg) { bestSkillAvg = avg; bestSkill = name; }
    }

    return {
      sessionScore: score,
      rank: betterThan + 1,
      totalSimilar: scored.length + 1,
      bestCombo,
      comboRanking,
      bestSkill,
      skillRanking,
      insights: this._generateInsights(scored, session.conditions),
    };
  }

  _generateInsights(scored, conditions) {
    if (scored.length < 3) return [];
    const insights = [];

    // Compare by season
    const bySeason = this._groupBy(scored, 'season');
    const seasonInsight = this._compareGroups(bySeason, 'season');
    if (seasonInsight) insights.push(seasonInsight);

    // Compare by animal type
    const byAnimal = this._groupBy(scored, 'animalType');
    const animalInsight = this._compareGroups(byAnimal, 'animalType');
    if (animalInsight) insights.push(animalInsight);

    // Compare by dog combo
    const byCombo = this._groupBy(scored, 'dogCombo');
    const comboInsight = this._compareGroups(byCombo, 'dog combo');
    if (comboInsight) insights.push(comboInsight);

    return insights;
  }

  _groupBy(sessions, key) {
    const groups = {};
    for (const s of sessions) {
      const val = s.conditions?.[key] || s[key] || 'unknown';
      if (!groups[val]) groups[val] = [];
      groups[val].push(s);
    }
    return groups;
  }

  _compareGroups(groups, label) {
    const stats = Object.entries(groups)
      .filter(([, arr]) => arr.length >= 2)
      .map(([name, arr]) => ({
        name,
        avg: arr.reduce((sum, s) => sum + s.evalScore, 0) / arr.length,
        count: arr.length,
      }))
      .sort((a, b) => b.avg - a.avg);

    if (stats.length >= 2) {
      const ratio = stats[0].avg / Math.max(0.01, stats[stats.length - 1].avg);
      if (ratio >= 1.3) {
        return `${label}="${stats[0].name}" scores ${ratio.toFixed(1)}x better than "${stats[stats.length - 1].name}"`;
      }
    }
    return null;
  }
}

export default HerdingEvaluator;
