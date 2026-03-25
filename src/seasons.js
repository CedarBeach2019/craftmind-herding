// ═══════════════════════════════════════════════════════════════
// CraftMind Herding — Seasons
// ═══════════════════════════════════════════════════════════════
//
// The world turns. Grass grows tall, sun stretches long,
// leaves turn gold, snow falls soft. Each season reshapes
// the work of herding — and the soul of the dog who tends.
// ═══════════════════════════════════════════════════════════════

export const SEASONS = ['spring', 'summer', 'autumn', 'winter'];

export const SEASON_CONFIG = {
  spring: {
    name: 'Spring',
    emoji: '🌸',
    grassLushness: 1.0,         // grazing multiplier
    animalSpread: 0.6,          // how far animals wander
    movementModifier: 1.0,      // speed multiplier
    grazingFrequency: 1.5,      // animals graze more
    weatherChance: {
      clear: 0.6,
      rain: 0.3,
      thunder: 0.1,
    },
    ambientMessage: 'The meadow wakes. Lambs bleat in the warm grass.',
    wisdom: 'In spring, the flock is small and trusting. Begin gently.',
  },
  summer: {
    name: 'Summer',
    emoji: '☀️',
    grassLushness: 0.8,
    animalSpread: 1.2,          // animals spread to find shade
    movementModifier: 0.9,      // heat slows slightly
    grazingFrequency: 0.8,
    weatherChance: {
      clear: 0.8,
      rain: 0.15,
      thunder: 0.05,
    },
    ambientMessage: 'Long golden days. The flock rests under broad oaks.',
    wisdom: 'Summer teaches patience. Animals know where the shade lies.',
  },
  autumn: {
    name: 'Autumn',
    emoji: '🍂',
    grassLushness: 0.5,
    animalSpread: 0.4,          // animals cluster together
    movementModifier: 0.85,
    grazingFrequency: 1.2,      // eating more before winter
    weatherChance: {
      clear: 0.4,
      rain: 0.4,
      thunder: 0.2,
    },
    ambientMessage: 'The air sharpens. Leaves fall like gentle rain.',
    wisdom: 'Autumn flocks draw close. They sense what is coming.',
  },
  winter: {
    name: 'Winter',
    emoji: '❄️',
    grassLushness: 0.2,
    animalSpread: 0.2,          // animals stay near barn
    movementModifier: 0.6,      // snow slows everyone
    grazingFrequency: 0.3,      // less to eat
    weatherChance: {
      clear: 0.5,
      rain: 0.0,
      thunder: 0.0,
      snow: 0.5,
    },
    ambientMessage: 'Snow blankets the hills. The barn is warm and waiting.',
    wisdom: 'Winter herding is the truest test. Keep them close, keep them safe.',
  },
};

export class SeasonalSystem {
  constructor(daysPerSeason = 7) {
    this.daysPerSeason = daysPerSeason;
    this.totalDaysPerYear = daysPerSeason * 4;
    this.currentDay = 0;
    this.currentSeason = 'spring';
    this.config = SEASON_CONFIG.spring;
    this.listeners = [];
  }

  /** Advance by one Minecraft day. Returns the new season if changed. */
  advanceDay() {
    this.currentDay++;
    const seasonIndex = Math.floor(this.currentDay / this.daysPerSeason) % 4;
    const newSeason = SEASONS[seasonIndex];

    if (newSeason !== this.currentSeason) {
      const oldSeason = this.currentSeason;
      this.currentSeason = newSeason;
      this.config = SEASON_CONFIG[newSeason];
      this.listeners.forEach(fn => fn(newSeason, oldSeason));
      return newSeason;
    }

    return null;
  }

  /** Set day directly (e.g. from server time). */
  setDay(day) {
    this.currentDay = day;
    const seasonIndex = Math.floor(day / this.daysPerSeason) % 4;
    this.currentSeason = SEASONS[seasonIndex];
    this.config = SEASON_CONFIG[this.currentSeason];
  }

  /** Get current weather based on season probabilities. */
  getWeather() {
    const chances = this.config.weatherChance;
    const roll = Math.random();
    let cumulative = 0;
    for (const [weather, chance] of Object.entries(chances)) {
      cumulative += chance;
      if (roll <= cumulative) return weather;
    }
    return 'clear';
  }

  /** Listen for season changes. */
  onSeasonChange(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(fn => fn !== callback);
    };
  }

  /** Get progress through current season (0–1). */
  seasonProgress() {
    const dayInSeason = this.currentDay % this.daysPerSeason;
    return dayInSeason / this.daysPerSeason;
  }

  /** How many days until next season? */
  daysUntilNextSeason() {
    return this.daysPerSeason - (this.currentDay % this.daysPerSeason);
  }

  /** Serialize state. */
  toJSON() {
    return {
      currentDay: this.currentDay,
      currentSeason: this.currentSeason,
      daysPerSeason: this.daysPerSeason,
    };
  }
}
