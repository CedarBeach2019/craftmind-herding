/**
 * @file index.js
 * CraftMind Herding — AI herding dog simulation for Minecraft.
 *
 * Flock AI (boids), multi-dog coordination, terrain analysis,
 * seasonal systems, teachings/skills, courses, and scoring.
 */

import { Flock, ANIMAL_TYPES, Animal } from './flock.js';
import { SKILL_LEVELS, PERSONALITIES, HerdingDog } from './herding-dog.js';
import { DOG_ROLES, Bark, BARK_TYPES, TeamDog, DogTeam } from './multi-dog.js';
import { HerdingScore, ComboTracker } from './scoring.js';
import { SEASONS, SEASON_CONFIG, SeasonalSystem } from './seasons.js';
import { TEACHING_CATEGORIES, TEACHINGS, TeachingsSystem } from './teachings.js';
import { Boundary, Gate, Pen, Obstacle, Pasture, TerrainAnalyzer } from './terrain.js';
import { getCourse, getCoursesForLevel, COURSES } from './courses.js';

export { COURSES, getCourse, getCoursesForLevel } from './courses.js';
export { ANIMAL_TYPES, Animal, Flock } from './flock.js';
export { SKILL_LEVELS, PERSONALITIES, HerdingDog } from './herding-dog.js';
export { DOG_ROLES, Bark, BARK_TYPES, TeamDog, DogTeam } from './multi-dog.js';
export { HerdingScore, ComboTracker } from './scoring.js';
export { SEASONS, SEASON_CONFIG, SeasonalSystem } from './seasons.js';
export { TEACHING_CATEGORIES, TEACHINGS, TeachingsSystem } from './teachings.js';
export { Boundary, Gate, Pen, Obstacle, Pasture, TerrainAnalyzer } from './terrain.js';

/**
 * Register herding features with CraftMind Core.
 * @param {object} core - Core instance with registerPlugin()
 */
export function registerWithCore(core) {
  core.registerPlugin('herding', {
    name: 'CraftMind Herding',
    version: '1.0.0',
    modules: { Flock, HerdingDog, DogTeam, SeasonalSystem, TerrainAnalyzer, TeachingsSystem },
  });
}
