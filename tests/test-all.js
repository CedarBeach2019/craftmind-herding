// ═══════════════════════════════════════════════════════════════
// CraftMind Herding — Tests
// ═══════════════════════════════════════════════════════════════
//
// Gentle tests. If something breaks, it whispers, not shouts.
// ═══════════════════════════════════════════════════════════════

import { Flock, Animal, ANIMAL_TYPES } from '../src/flock.js';
import { SeasonalSystem, SEASON_CONFIG } from '../src/seasons.js';
import { Boundary, Pen, Gate, Pasture } from '../src/terrain.js';
import { TeachingsSystem, TEACHINGS, TEACHING_CATEGORIES } from '../src/teachings.js';
import { HerdingScore, ComboTracker } from '../src/scoring.js';
import { DogTeam, BARK_TYPES, TeamDog } from '../src/multi-dog.js';
import { getCourse, getCoursesForLevel, COURSES } from '../src/courses.js';
import { HerdingDog, SKILL_LEVELS, PERSONALITIES } from '../src/herding-dog.js';
import { Vec3 } from 'vec3';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ❌ ${name}: ${e.message}`);
  }
}

function assert(condition, message = 'assertion failed') {
  if (!condition) throw new Error(message);
}

function assertClose(actual, expected, epsilon = 0.001) {
  if (Math.abs(actual - expected) > epsilon) {
    throw new Error(`expected ${expected}, got ${actual}`);
  }
}

// ─── Flock Tests ──────────────────────────────────────────────

console.log('\n🐑 Flock AI Tests');

test('Animal creates with defaults', () => {
  const a = new Animal('s1');
  assert(a.id === 's1');
  assert(a.type === 'sheep');
  assert(a.panicLevel === 0);
  assert(!a.isGrazing);
});

test('Animal types have different configs', () => {
  assert(ANIMAL_TYPES.chicken.maxSpeed > ANIMAL_TYPES.cow.maxSpeed);
  assert(ANIMAL_TYPES.cow.stubbornness > ANIMAL_TYPES.sheep.stubbornness);
  assert(ANIMAL_TYPES.pig.flightRadius < ANIMAL_TYPES.sheep.flightRadius);
});

test('Flock computes center', () => {
  const flock = new Flock();
  flock.add(new Animal('a', 'sheep', new Vec3(0, 0, 0)));
  flock.add(new Animal('b', 'sheep', new Vec3(10, 0, 0)));
  flock.add(new Animal('c', 'sheep', new Vec3(0, 0, 10)));
  const center = flock.computeCenter();
  assertClose(center.x, 10 / 3);
  assertClose(center.z, 10 / 3);
});

test('Flock boids — separation works', () => {
  const flock = new Flock();
  const a = new Animal('a', 'sheep', new Vec3(0, 0, 0));
  const b = new Animal('b', 'sheep', new Vec3(1, 0, 0));
  flock.add(a).add(b);
  flock.update(null, 1);
  // They should have moved apart
  assert(a.velocity.norm() > 0 || b.velocity.norm() > 0);
});

test('Flight zone — animals flee dog', () => {
  const flock = new Flock();
  const sheep = new Animal('s1', 'sheep', new Vec3(5, 0, 0));
  flock.add(sheep);
  const dogPos = new Vec3(3, 0, 0); // within flight radius of 6
  flock.update(dogPos, 1);
  // Sheep should have moved away from dog (positive x)
  assert(sheep.velocity.x > 0);
});

test('Grazing reduces movement', () => {
  const flock = new Flock();
  const sheep = new Animal('s1', 'sheep', new Vec3(5, 0, 0));
  sheep.isGrazing = true;
  sheep.grazeTimer = 100;
  flock.add(sheep);
  const dogPos = new Vec3(3, 0, 0);
  flock.update(dogPos, 1);
  // Grazing sheep with low panic should barely move
  assertClose(sheep.velocity.norm(), 0, 0.5);
});

test('Panic spreads through flock', () => {
  const flock = new Flock();
  const a = new Animal('a', 'sheep', new Vec3(0, 0, 0));
  const b = new Animal('b', 'sheep', new Vec3(5, 0, 0)); // within radius 10
  flock.add(a).add(b);
  flock.spreadPanic(a, 10, 0.8);
  assert(b.panicLevel > 0);
});

// ─── Season Tests ─────────────────────────────────────────────

console.log('\n🌤️  Season Tests');

test('Seasons cycle correctly', () => {
  const sys = new SeasonalSystem(7);
  assert(sys.currentSeason === 'spring');
  // Advance through spring
  for (let i = 0; i < 7; i++) sys.advanceDay();
  assert(sys.currentSeason === 'summer');
  for (let i = 0; i < 7; i++) sys.advanceDay();
  assert(sys.currentSeason === 'autumn');
});

test('Weather respects season', () => {
  const sys = new SeasonalSystem(7);
  sys.setDay(21); // winter
  // Winter should never have rain (chance = 0)
  let hasRain = false;
  for (let i = 0; i < 100; i++) {
    if (sys.getWeather() === 'rain') hasRain = true;
  }
  assert(!hasRain, 'Winter should not produce rain');
});

test('Season progress calculation', () => {
  const sys = new SeasonalSystem(10);
  sys.setDay(5);
  assertClose(sys.seasonProgress(), 0.5);
  assert(sys.daysUntilNextSeason() === 5);
});

// ─── Terrain Tests ────────────────────────────────────────────

console.log('\n🗺️  Terrain Tests');

test('Boundary contains points', () => {
  const b = new Boundary(0, 0, 10, 10);
  assert(b.contains(5, 5));
  assert(!b.contains(15, 5));
  assert(b.contains(0, 0));
});

test('Boundary center and size', () => {
  const b = new Boundary(0, 0, 10, 20);
  const c = b.center();
  assertClose(c.x, 5);
  assertClose(c.z, 10);
  const s = b.size();
  assert(s.x === 10);
  assert(s.z === 20);
});

test('Pen counts animals inside', () => {
  const pen = new Pen('test', new Boundary(0, 0, 10, 10));
  const animals = [
    { position: new Vec3(5, 0, 5) },
    { position: new Vec3(15, 0, 5) },
    { position: new Vec3(2, 0, 2) },
  ];
  assert(pen.countInside(animals) === 2);
});

test('Gate toggles', () => {
  const g = new Gate('g1', new Vec3(5, 64, 0), 3, 'north');
  assert(!g.isOpen);
  g.open();
  assert(g.isOpen);
  g.toggle();
  assert(!g.isOpen);
});

// ─── Teaching Tests ───────────────────────────────────────────

console.log('\n📖 Teaching Tests');

test('Teachings unlock when skills demonstrated', () => {
  const sys = new TeachingsSystem();
  assert(sys.unlocked.size === 0);
  sys.demonstrateSkill('approach_sheep');
  // Should unlock identity_1 and sheep_1 (both require approach_sheep, tier 1)
  assert(sys.unlocked.size >= 2);
});

test('Teachings respect tier', () => {
  const sys = new TeachingsSystem();
  // Tier 3 teachings should NOT unlock at tier 1
  sys.demonstrateSkill('herd_complex');
  assert(!sys.unlocked.has('work_3')); // tier 3, can't unlock yet
});

test('Tier advancement unlocks higher teachings', () => {
  const sys = new TeachingsSystem();
  sys.demonstrateSkill('approach_sheep');   // unlocks tier 1
  sys.demonstrateSkill('flank_basic');
  sys.advanceTier();                        // now tier 2
  sys.demonstrateSkill('herd_group');       // should unlock tier 2 teachings
  const unlocked = sys.getUnlocked();
  assert(unlocked.length >= 4);
});

test('Wisdom modifiers improve with teachings', () => {
  const sys = new TeachingsSystem();
  const before = sys.getWisdomModifiers().flankRadius;
  sys.demonstrateSkill('approach_sheep');
  const after = sys.getWisdomModifiers().flankRadius;
  assert(after > before);
});

test('Lesson queue delivers lessons in order', () => {
  const sys = new TeachingsSystem();
  sys.demonstrateSkill('approach_sheep');
  const l1 = sys.getNextLesson();
  const l2 = sys.getNextLesson();
  assert(l1.id !== l2.id);
  assert(l1 !== null);
});

// ─── Scoring Tests ────────────────────────────────────────────

console.log('\n📊 Scoring Tests');

test('Score calculates components', () => {
  const s = new HerdingScore('test', 3);
  s.penAnimal().penAnimal().penAnimal();
  s.setOptimalDistance(50);
  s.complete();
  const result = s.calculate();
  assert(result.animalsPenned === 3);
  assert(result.overall > 0);
  assert(result.starRating.includes('★'));
});

test('Escaped animals lower completion score', () => {
  const s = new HerdingScore('test', 5);
  s.penAnimal().penAnimal(); // only 2 of 5
  s.escapeAnimal();
  s.complete();
  const result = s.calculate();
  assert(result.completionScore === 40); // 2/5 = 0.4
});

test('Combo tracker rewards streaks', () => {
  const combo = new ComboTracker();
  combo.record({ overall: 90, completionScore: 100 });
  combo.record({ overall: 80, completionScore: 95 });
  assert(combo.currentStreak === 2);
  assert(combo.multiplier > 1.0);
});

test('Bad run breaks combo', () => {
  const combo = new ComboTracker();
  combo.record({ overall: 90, completionScore: 100 });
  combo.record({ overall: 30, completionScore: 40 }); // bad run
  assert(combo.currentStreak === 0);
  assertClose(combo.multiplier, 1.0);
});

// ─── Multi-Dog Tests ──────────────────────────────────────────

console.log('\n🐕 Multi-Dog Tests');

test('Team assigns roles', () => {
  const team = new DogTeam();
  team.addDog(new TeamDog('dog1', 'lead'));
  team.addDog(new TeamDog('dog2'));
  team.assignRoles();
  assert(team.dogs[0].role === 'lead');
  assert(team.dogs[1].role === 'flanker');
});

test('Bark logging works', () => {
  const team = new DogTeam();
  team.addDog(new TeamDog('dog1'));
  team.bark('dog1', BARK_TYPES.moving_to, new Vec3(5, 0, 0));
  assert(team.barkLog.length === 1);
});

test('Strategy positions are calculated', () => {
  const team = new DogTeam();
  team.addDog(new TeamDog('dog1', 'lead'));
  team.addDog(new TeamDog('dog2'));
  team.assignRoles();
  const positions = team.calculatePositions(
    new Vec3(0, 0, 0),
    new Vec3(20, 0, 0),
  );
  assert(positions.dog1 !== undefined);
  assert(positions.dog2 !== undefined);
});

// ─── Course Tests ─────────────────────────────────────────────

console.log('\n🏞️  Course Tests');

test('Courses have all required fields', () => {
  for (const course of COURSES) {
    assert(course.id, `Course missing id`);
    assert(course.name, `Course ${course.id} missing name`);
    assert(course.build, `Course ${course.id} missing build`);
    assert(course.animalCount > 0, `Course ${course.id} needs animals`);
  }
});

test('Course builder creates valid pastures', () => {
  for (const course of COURSES) {
    const pasture = course.build();
    assert(pasture instanceof Pasture);
    assert(pasture.pens.length > 0);
    assert(pasture.spawnPoints.length > 0);
  }
});

test('getCourse returns correct course', () => {
  const c = getCourse('first_pen');
  assert(c !== null);
  assert(c.name === 'First Pen');
});

test('getCoursesForLevel filters correctly', () => {
  const apprentice = getCoursesForLevel('apprentice');
  assert(apprentice.length === 1); // only first_pen
  const master = getCoursesForLevel('master');
  assert(master.length >= 4);
});

// ─── Herding Dog Tests ────────────────────────────────────────

console.log('\n🐕‍🦺 Herding Dog Tests');

test('Dog initializes with correct level', () => {
  const dog = new HerdingDog({ level: 'master' });
  assert(dog.level === 'master');
  assert(dog.levelConfig.canFlank);
  assert(dog.levelConfig.canRecover);
});

test('Dog energy drains and regens', () => {
  const dog = new HerdingDog({ level: 'apprentice' });
  const initial = dog.energy;
  dog.drainEnergy(10);
  assert(dog.energy < initial);
  dog.regenEnergy(5);
  assert(dog.energy > 0);
});

test('Low energy triggers rest', () => {
  const dog = new HerdingDog({ level: 'apprentice' });
  dog.energy = 0;
  dog.drainEnergy(0.1); // should trigger goRest
  assert(dog.isResting);
});

test('Dog starts herding correctly', () => {
  const dog = new HerdingDog({ level: 'apprentice' });
  const flock = new Flock();
  flock.add(new Animal('a', 'sheep', new Vec3(0, 64, 0)));
  const pasture = new Pasture('test', 'Test');
  pasture.setBoundary(-20, -20, 20, 20);
  pasture.addPen(new Pen('p', { minX: 10, minZ: 10, maxX: 15, maxZ: 15 }));
  const started = dog.startHerding(flock, pasture, pasture.pens[0]);
  assert(started);
  assert(dog.behaviorState === 'approaching');
});

test('Dog cannot herd while exhausted', () => {
  const dog = new HerdingDog({ level: 'apprentice' });
  dog.energy = 5;
  const flock = new Flock();
  const pasture = new Pasture('test', 'Test');
  pasture.setBoundary(-20, -20, 20, 20);
  pasture.addPen(new Pen('p', { minX: 10, minZ: 10, maxX: 15, maxZ: 15 }));
  // Will go to rest since energy < 20
  const started = dog.startHerding(flock, pasture, pasture.pens[0]);
  assert(!started);
});

test('Level up works', () => {
  const dog = new HerdingDog({ level: 'apprentice' });
  const newLevel = dog.levelUp();
  assert(newLevel !== null);
  assert(dog.level === 'journeyman');
  assert(dog.energy === SKILL_LEVELS.journeyman.energyMax);
});

test('Personality affects approach speed', () => {
  const fast = new HerdingDog({ level: 'apprentice', personality: 'fast' });
  const patient = new HerdingDog({ level: 'apprentice', personality: 'patient' });
  assert(fast.personality.approachSpeed > patient.personality.approachSpeed);
});

// ─── Summary ──────────────────────────────────────────────────

console.log(`\n${'═'.repeat(40)}`);
console.log(`  Results: ${passed} passed, ${failed} failed`);
console.log(`${'═'.repeat(40)}\n`);

if (failed > 0) process.exit(1);
