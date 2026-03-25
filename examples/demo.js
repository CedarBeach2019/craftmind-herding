// ═══════════════════════════════════════════════════════════════
// CraftMind Herding — Demo
// ═══════════════════════════════════════════════════════════════

import { HerdingDog, SKILL_LEVELS, PERSONALITIES } from '../src/herding-dog.js';
import { Flock, Animal, ANIMAL_TYPES } from '../src/flock.js';
import { SeasonalSystem } from '../src/seasons.js';
import { TeachingsSystem } from '../src/teachings.js';
import { getCourse, COURSES } from '../src/courses.js';
import { HerdingScore } from '../src/scoring.js';
import { Pasture } from '../src/terrain.js';

console.log(`
🐾 CraftMind Herding — AI Sheepdog Demo
═════════════════════════════════════════════
`);

// Skill levels
console.log('🐕 Skill Levels:');
for (const [level, cfg] of Object.entries(SKILL_LEVELS)) {
  console.log(`   ${level.padEnd(12)} energy:${cfg.energyMax} speed:${cfg.speedMultiplier} range:${cfg.commandRange}`);
}

// Dog creation (no bot needed for stats)
console.log('\n🐕 Dog: Rex (apprentice, patient)');
const dog = new HerdingDog({ level: 'apprentice', personality: 'patient' });
console.log(`   Level: ${dog.level}`);
console.log(`   Energy: ${dog.energy}/${dog.levelConfig.energyMax}`);
console.log(`   Personality: ${dog.personality.name}`);

// Flock
const flock = new Flock({ count: 8, animalType: 'sheep' });
console.log(`\n🐑 Flock: ${flock.animals.length} ${flock.animalType}s`);
console.log(`   Animal types: ${Object.keys(ANIMAL_TYPES).join(', ')}`);

// Scoring
const score = new HerdingScore({ courseId: 'beginner' });
console.log(`\n📊 Scoring: ${score.totalPoints} pts available`);

// Seasons
const seasons = new SeasonalSystem();
console.log(`\n🌤️  Season: ${seasons.currentSeason}`);

// Courses
console.log('\n🎮 Available Courses:');
for (const c of COURSES) {
  console.log(`   ${c.name} (difficulty ${c.difficulty})`);
}

console.log('\n✨ Demo complete! Run "npm run demo" for the full animated simulation.');
