import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Flock, Animal, ANIMAL_TYPES } from '../src/flock.js';
import { SeasonalSystem, SEASON_CONFIG } from '../src/seasons.js';
import { Boundary, Pen, Gate, Pasture, TerrainAnalyzer } from '../src/terrain.js';
import { TeachingsSystem, TEACHINGS } from '../src/teachings.js';
import { HerdingScore, ComboTracker } from '../src/scoring.js';
import { DogTeam, BARK_TYPES, TeamDog } from '../src/multi-dog.js';
import { getCourse, getCoursesForLevel, COURSES } from '../src/courses.js';
import { HerdingDog, SKILL_LEVELS } from '../src/herding-dog.js';
import { registerWithCore } from '../src/index.js';

describe('Flock AI', () => {
  it('creates a flock and adds animals', () => {
    const flock = new Flock();
    flock.add(new Animal('s1', 'sheep'));
    flock.add(new Animal('s2', 'sheep'));
    assert.equal(flock.countWhere(() => true), 2);
  });

  it('updates flock positions via boids', () => {
    const flock = new Flock();
    for (let i = 0; i < 5; i++) flock.add(new Animal(`s${i}`, 'sheep'));
    flock.update({ dogPosition: { x: 5, y: 64, z: 5 } });
    assert.ok(flock.animals.length === 5);
  });

  it('has multiple animal types with different behaviors', () => {
    assert.ok(ANIMAL_TYPES.sheep);
    assert.ok(ANIMAL_TYPES.cow);
    assert.ok(ANIMAL_TYPES.chicken);
  });
});

describe('Multi-Dog Coordination', () => {
  it('creates a dog team with roles', () => {
    const team = new DogTeam();
    team.addDog(new TeamDog('lead', 'lead'));
    team.addDog(new TeamDog('flanker', 'flanker'));
    assert.ok(team.activeCount() >= 2);
  });

  it('supports bark communication types', () => {
    assert.ok(BARK_TYPES.moving_to);
    assert.ok(BARK_TYPES.guarding);
    assert.ok(BARK_TYPES.need_help);
    assert.ok(BARK_TYPES.all_clear);
  });
});

describe('Scoring', () => {
  it('tracks herding distance and stress', () => {
    const score = new HerdingScore();
    score.addDistance(10);
    score.recordStress(0.5);
    const result = score.calculate();
    assert.ok(typeof result === 'object');
  });

  it('combo tracker records actions', () => {
    const combo = new ComboTracker();
    combo.record('gather');
    combo.record('gather');
    combo.record('pen');
    const status = combo.getStatus();
    assert.ok(status !== undefined);
  });
});

describe('Seasons', () => {
  it('has four seasons with different configs', () => {
    assert.ok(SEASON_CONFIG.spring);
    assert.ok(SEASON_CONFIG.summer);
    assert.ok(SEASON_CONFIG.autumn);
    assert.ok(SEASON_CONFIG.winter);
  });

  it('seasonal system tracks current season', () => {
    const sys = new SeasonalSystem();
    assert.ok(sys.currentSeason);
  });
});

describe('Teachings System', () => {
  it('has multiple teachings for herding skills', () => {
    assert.ok(TEACHINGS.length >= 3, 'should have multiple teachings');
  });

  it('teachings system can be instantiated', () => {
    const ts = new TeachingsSystem();
    assert.ok(ts);
  });
});

describe('Courses', () => {
  it('has courses available', () => {
    assert.ok(COURSES.length >= 1);
  });

  it('courses are available for different levels', () => {
    const beginner = getCoursesForLevel('apprentice');
    assert.ok(Array.isArray(beginner));
  });

  it('can get a specific course by id', () => {
    if (COURSES.length === 0) return;
    const course = getCourse(COURSES[0].id);
    assert.ok(course);
    assert.ok(course.name);
  });
});

describe('Terrain', () => {
  it('creates boundaries', () => {
    const b = new Boundary(0, 0, 50, 50);
    assert.ok(b);
  });

  it('creates pens with boundaries', () => {
    const boundary = new Boundary(0, 0, 10, 10);
    const pen = new Pen('p1', boundary);
    assert.ok(pen);
  });
});

describe('Skill Levels', () => {
  it('has progression through skill levels', () => {
    const levels = Object.keys(SKILL_LEVELS);
    assert.ok(levels.length >= 3, 'should have at least 3 skill levels');
    assert.ok(SKILL_LEVELS.apprentice);
    assert.ok(SKILL_LEVELS.elder);
  });

  it('higher levels can handle larger flocks', () => {
    assert.ok(SKILL_LEVELS.elder.maxFlockSize > SKILL_LEVELS.apprentice.maxFlockSize);
  });
});

describe('Index Exports', () => {
  it('exports registerWithCore', () => {
    assert.equal(typeof registerWithCore, 'function');
  });

  it('registerWithCore accepts a core object', () => {
    let called = false;
    const core = { registerPlugin(name, plugin) { called = true; assert.equal(name, 'herding'); } };
    registerWithCore(core);
    assert.ok(called);
  });
});
