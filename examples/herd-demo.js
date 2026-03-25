// ═══════════════════════════════════════════════════════════════
// CraftMind Herding — Demo
// ═══════════════════════════════════════════════════════════════
//
// Standalone demo — no Minecraft server needed.
// Creates a simulated herding scenario and runs the AI.
// Watch the flock flow like water toward the pen.
// ═══════════════════════════════════════════════════════════════

import { HerdingDog, SKILL_LEVELS, PERSONALITIES } from '../src/herding-dog.js';
import { Flock, Animal, ANIMAL_TYPES } from '../src/flock.js';
import { SeasonalSystem, SEASON_CONFIG } from '../src/seasons.js';
import { TeachingsSystem } from '../src/teachings.js';
import { getCourse, COURSES } from '../src/courses.js';
import { DogTeam } from '../src/multi-dog.js';
import { Vec3 } from 'vec3';

// ─── Helpers ──────────────────────────────────────────────────

function asciiArt() {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║        🐾 CraftMind Herding 🐾              ║
  ║   Where AI sheepdogs tend pastoral flocks    ║
  ╚══════════════════════════════════════════════╝

        /^ ^\\
       / 0 0 \\
       V\\ Y /V
        / - \\
       |    |
       ||__||

   "The meadow remembers every gentle step."
  `);
}

function renderFlock(flock, dogPos, pen, tick) {
  // Simple ASCII map render (30x15)
  const W = 60, H = 30;
  const grid = Array.from({ length: H }, () => Array(W).fill('·'));

  // Offset to center the action
  const ox = W / 2;
  const oz = H / 2;

  // Draw pen
  if (pen) {
    const b = pen.boundary;
    for (let x = Math.floor(b.minX); x <= b.maxX; x++) {
      const gx = Math.floor(x + ox);
      if (gx >= 0 && gx < W) {
        const gz1 = Math.floor(b.minZ + oz);
        const gz2 = Math.floor(b.maxZ + oz);
        if (gz1 >= 0 && gz1 < H) grid[gz1][gx] = '═';
        if (gz2 >= 0 && gz2 < H) grid[gz2][gx] = '═';
      }
    }
    for (let z = Math.floor(b.minZ); z <= b.maxZ; z++) {
      const gz = Math.floor(z + oz);
      if (gz >= 0 && gz < H) {
        const gx1 = Math.floor(b.minX + ox);
        const gx2 = Math.floor(b.maxX + ox);
        if (gx1 >= 0 && gx1 < W) grid[gz][gx1] = '║';
        if (gx2 >= 0 && gx2 < W) grid[gz][gx2] = '║';
      }
    }
  }

  // Draw animals
  for (const animal of flock.animals) {
    const gx = Math.floor(animal.position.x + ox);
    const gz = Math.floor(animal.position.z + oz);
    if (gx >= 0 && gx < W && gz >= 0 && gz < H) {
      const emoji = animal.type === 'sheep' ? '🐑' : animal.type === 'cow' ? '🐄' : '🐖';
      grid[gz][gx] = animal.panicLevel > 0.5 ? '!' : animal.isGrazing ? '~' : 'o';
    }
  }

  // Draw dog
  if (dogPos) {
    const gx = Math.floor(dogPos.x + ox);
    const gz = Math.floor(dogPos.z + oz);
    if (gx >= 0 && gx < W && gz >= 0 && gz < H) {
      grid[gz][gx] = 'D';
    }
  }

  console.log(`\n── Tick ${tick} ──`);
  for (const row of grid) {
    console.log(row.join(''));
  }
}

// ─── Main Demo ────────────────────────────────────────────────

async function main() {
  asciiArt();

  // Create systems
  const seasons = new SeasonalSystem(7);
  const teachings = new TeachingsSystem();

  // Create the dog
  const dog = new HerdingDog({
    bot: null, // No real bot for demo
    level: 'apprentice',
    personality: 'patient',
    seasons,
    teachings,
  });

  console.log(`\n🐕 ${dog.levelConfig.name} the ${dog.personality.name} dog`);
  console.log(`   ${dog.levelConfig.description}`);
  console.log(`   ${dog.personality.description}\n`);

  // Build the first course
  const course = getCourse('first_pen');
  const pasture = course.build();
  console.log(`📍 Course: "${course.name}" — ${course.description}\n`);

  // Spawn animals
  const flock = new Flock();
  const types = course.animalTypes.length > 0 ? course.animalTypes : ['sheep'];
  for (let i = 0; i < course.animalCount; i++) {
    const spawn = pasture.spawnPoints[i] || pasture.findOpenArea();
    const type = types[i % types.length];
    const animal = new Animal(
      `animal_${i}`,
      type,
      spawn.offset((Math.random() - 0.5) * 4, 0, (Math.random() - 0.5) * 4),
    );
    flock.add(animal);
    console.log(`   + ${ANIMAL_TYPES[type].name} #${i} at (${animal.position.x.toFixed(1)}, ${animal.position.z.toFixed(1)})`);
  }

  const targetPen = pasture.pens[0];
  console.log(`\n   Target pen at (${targetPen.boundary.center().x}, ${targetPen.boundary.center().z})`);

  // Position the dog
  dog.position = new Vec3(-5, 64, -5);
  dog.kennelPosition = pasture.kennelPosition;

  // Start herding
  const started = dog.startHerding(flock, pasture, targetPen);
  if (!started) {
    console.log('❌ Dog too tired to herd!');
    return;
  }

  console.log(`\n🚀 Herding started! Dog state: ${dog.behaviorState}\n`);

  // Teaching callback
  dog.onTeaching = (lesson) => {
    console.log(`\n📖 NEW TEACHING: "${lesson.title}"`);
    console.log(`   "${lesson.text}"\n`);
  };

  // Completion callback
  dog.onHerdingComplete = (result, multiplier) => {
    console.log(`\n${dog.score.toChatMessage()}`);
    console.log(`   Combo multiplier: x${multiplier.toFixed(1)}`);
    console.log(`   Wisdom accumulated: ${teachings.wisdom.toFixed(2)}`);
  };

  // Simulate ticks
  const MAX_TICKS = 500;
  let lastRender = 0;

  for (let tick = 0; tick < MAX_TICKS; tick++) {
    dog.update();

    // Render every 20 ticks
    if (tick - lastRender >= 20) {
      lastRender = tick;
      renderFlock(flock, dog.position, targetPen, tick);

      const penned = flock.countWhere(a =>
        targetPen.contains(a.position.x, a.position.z)
      );
      const grazing = flock.countWhere(a => a.isGrazing);
      console.log(
        `   State: ${dog.behaviorState} | Energy: ${dog.energy.toFixed(0)} | ` +
        `Penned: ${penned}/${flock.animals.length} | Grazing: ${grazing} | ` +
        `Stress: ${flock.averageStress().toFixed(3)}`
      );
    }

    // Day advancement (every 200 ticks = 1 MC day)
    if (tick % 200 === 0 && tick > 0) {
      const newSeason = seasons.advanceDay();
      if (newSeason) {
        console.log(`\n🌤️  Season changed to ${SEASON_CONFIG[newSeason].name}!`);
        console.log(`   ${SEASON_CONFIG[newSeason].ambientMessage}`);
      }
    }

    // Check if done
    if (!dog.isHerding) break;
  }

  // Final summary
  if (dog.isHerding) {
    console.log('\n⏰ Time ran out. Final state:');
    dog.score.complete();
    console.log(dog.score.toChatMessage());
  }

  console.log('\n── Demo Complete ──');
  console.log(`   Teachings unlocked: ${teachings.unlocked.size}`);
  console.log(`   Wisdom: ${teachings.wisdom.toFixed(2)}`);
  console.log(`   Skills demonstrated: ${[...teachings.demonstratedSkills].join(', ') || 'none'}\n`);
}

main().catch(console.error);
