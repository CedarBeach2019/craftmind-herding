// ═══════════════════════════════════════════════════════════════
// CraftMind Herding — Pre-Built Courses
// ═══════════════════════════════════════════════════════════════
//
// Each course is a story. A beginning, a challenge, a gate,
// and a home. The first pen is gentle. The Great Roundup
// is a trial of patience and partnership.
// ═══════════════════════════════════════════════════════════════

import { Pasture, Pen, Gate, Obstacle } from './terrain.js';
import { Vec3 } from 'vec3';

export const COURSES = [
  {
    id: 'first_pen',
    name: 'First Pen',
    difficulty: 1,
    description: 'A gentle start. Move three sheep into the nearby pen. The Alpha Dog watches.',
    requiredLevel: 'apprentice',
    animalCount: 3,
    animalTypes: ['sheep'],
    timeLimit: 120,
    build: () => {
      const pasture = new Pasture('first_pen', 'First Pen');
      pasture.setBoundary(-20, -20, 20, 20);
      pasture.setKennel(-15, 64, -15);

      const pen = new Pen('main_pen', { minX: 10, minZ: 10, maxX: 18, maxZ: 18 }, 'main_gate');
      pasture.addPen(pen);
      pasture.addGate(new Gate('main_gate', new Vec3(14, 64, 10), 3, 'south'));
      pasture.addSpawnPoint(0, 64, 0);
      pasture.addSpawnPoint(-5, 64, 3);
      pasture.addSpawnPoint(3, 64, -5);

      return pasture;
    },
    rewardTeaching: 'identity_1',
    skillUnlocks: ['approach_sheep'],
  },
  {
    id: 'river_crossing',
    name: 'River Crossing',
    difficulty: 2,
    description: 'The flock must cross the water. Guide them along the bank to the shallow ford.',
    requiredLevel: 'journeyman',
    animalCount: 6,
    animalTypes: ['sheep', 'sheep', 'sheep', 'cow'],
    timeLimit: 180,
    build: () => {
      const pasture = new Pasture('river_crossing', 'River Crossing');
      pasture.setBoundary(-30, -10, 30, 40);
      pasture.setKennel(-25, 64, -5);

      // River runs through z=5 to z=15
      for (let x = -25; x < 25; x += 4) {
        pasture.addObstacle(new Obstacle(`water_${x}`, new Vec3(x, 63, 10), 3, 'water'));
      }
      // Ford at x=0
      pasture.addObstacle(new Obstacle('ford', new Vec3(0, 63, 10), 1, 'ford'));

      const pen = new Pen('north_pen', { minX: -8, minZ: 30, maxX: 8, maxZ: 38 }, 'pen_gate');
      pasture.addPen(pen);
      pasture.addGate(new Gate('pen_gate', new Vec3(0, 64, 30), 3, 'south'));

      // Spawn south of river
      for (let i = 0; i < 6; i++) {
        pasture.addSpawnPoint(
          -10 + Math.random() * 20,
          64,
          -5 + Math.random() * 5,
        );
      }

      return pasture;
    },
    rewardTeaching: 'work_1',
    skillUnlocks: ['flank_basic'],
  },
  {
    id: 'night_gather',
    name: 'Night Gather',
    difficulty: 3,
    description: 'The flock has scattered across the meadow. Night falls soon. Bring them home.',
    requiredLevel: 'master',
    animalCount: 10,
    animalTypes: ['sheep', 'sheep', 'sheep', 'sheep', 'cow', 'cow', 'pig'],
    timeLimit: 200,
    build: () => {
      const pasture = new Pasture('night_gather', 'Night Gather');
      pasture.setBoundary(-40, -40, 40, 40);
      pasture.setKennel(0, 64, 30);

      // Barn pen near kennel
      const pen = new Pen('barn', { minX: -5, minZ: 25, maxX: 5, maxZ: 35 }, 'barn_gate');
      pasture.addPen(pen);
      pasture.addGate(new Gate('barn_gate', new Vec3(0, 64, 25), 4, 'south'));

      // Obstacles — trees and rocks scattered
      const obstacles = [
        [-15, 0, -10], [10, 0, -20], [-20, 0, 15], [25, 0, 5],
        [0, 0, -30], [-30, 0, -5], [15, 0, 20], [-10, 0, 25],
      ];
      for (const [x, y, z] of obstacles) {
        const type = Math.random() > 0.5 ? 'tree' : 'rock';
        pasture.addObstacle(new Obstacle(`obs_${x}_${z}`, new Vec3(x, 64, z), 2, type));
      }

      // Scattered spawn points
      for (let i = 0; i < 10; i++) {
        pasture.addSpawnPoint(
          -30 + Math.random() * 60,
          64,
          -30 + Math.random() * 50,
        );
      }

      return pasture;
    },
    rewardTeaching: 'sheep_2',
    skillUnlocks: ['herd_group'],
  },
  {
    id: 'storm_herd',
    name: 'Storm Herd',
    difficulty: 4,
    description: 'Thunder rolls across the valley. The flock panics easily. Herd through the storm.',
    requiredLevel: 'master',
    animalCount: 8,
    animalTypes: ['sheep', 'sheep', 'sheep', 'cow', 'pig', 'chicken', 'chicken'],
    timeLimit: 150,
    build: () => {
      const pasture = new Pasture('storm_herd', 'Storm Herd');
      pasture.setBoundary(-35, -35, 35, 35);
      pasture.setKennel(25, 64, 25);

      const pen = new Pen('storm_pen', { minX: 20, minZ: 20, maxX: 30, maxZ: 30 }, 'storm_gate');
      pasture.addPen(pen);
      pasture.addGate(new Gate('storm_gate', new Vec3(25, 64, 20), 3, 'south'));

      // Rocky terrain — more obstacles
      for (let i = 0; i < 12; i++) {
        pasture.addObstacle(new Obstacle(
          `rock_${i}`,
          new Vec3(-25 + Math.random() * 50, 64, -25 + Math.random() * 50),
          1.5 + Math.random(),
          'rock',
        ));
      }

      for (let i = 0; i < 8; i++) {
        pasture.addSpawnPoint(-10 + Math.random() * 5, 64, -15 + Math.random() * 10);
      }

      return pasture;
    },
    rewardTeaching: 'wisdom_2',
    skillUnlocks: ['recover_scatter'],
    isStorm: true,
  },
  {
    id: 'great_roundup',
    name: 'The Great Roundup',
    difficulty: 5,
    description: 'Twenty animals across the valley. Multiple pens. Complex terrain. This is the elder\'s trial.',
    requiredLevel: 'elder',
    animalCount: 20,
    animalTypes: ['sheep', 'sheep', 'sheep', 'sheep', 'sheep', 'sheep', 'sheep', 'sheep',
                  'cow', 'cow', 'cow', 'cow', 'pig', 'pig', 'pig', 'chicken', 'chicken', 'chicken', 'chicken', 'chicken'],
    timeLimit: 300,
    build: () => {
      const pasture = new Pasture('great_roundup', 'The Great Roundup');
      pasture.setBoundary(-50, -50, 50, 50);
      pasture.setKennel(40, 64, 40);

      // Multiple pens — sort animals by type
      pasture.addPen(new Pen('sheep_pen', { minX: 30, minZ: 30, maxX: 40, maxZ: 40 }, 'sheep_gate'));
      pasture.addGate(new Gate('sheep_gate', new Vec3(35, 64, 30), 3, 'south'));

      pasture.addPen(new Pen('cow_pen', { minX: 40, minZ: 20, maxX: 48, maxZ: 28 }, 'cow_gate'));
      pasture.addGate(new Gate('cow_gate', new Vec3(40, 64, 24), 3, 'west'));

      pasture.addPen(new Pen('mixed_pen', { minX: 20, minZ: 40, maxX: 28, maxZ: 48 }, 'mixed_gate'));
      pasture.addGate(new Gate('mixed_gate', new Vec3(24, 64, 40), 3, 'south'));

      // Water features
      pasture.addObstacle(new Obstacle('pond', new Vec3(-10, 63, 10), 6, 'water'));
      pasture.addObstacle(new Obstacle('stream', new Vec3(20, 63, -20), 4, 'water'));

      // Dense obstacles
      for (let i = 0; i < 20; i++) {
        const types = ['tree', 'rock', 'fence'];
        pasture.addObstacle(new Obstacle(
          `obs_${i}`,
          new Vec3(-40 + Math.random() * 80, 64, -40 + Math.random() * 80),
          1 + Math.random() * 2,
          types[Math.floor(Math.random() * types.length)],
        ));
      }

      for (let i = 0; i < 20; i++) {
        pasture.addSpawnPoint(
          -35 + Math.random() * 70,
          64,
          -35 + Math.random() * 70,
        );
      }

      return pasture;
    },
    rewardTeaching: 'wisdom_3',
    skillUnlocks: ['elder_coordination'],
    requiresMultiDog: true,
  },
];

/** Get a course by id. */
export function getCourse(id) {
  return COURSES.find(c => c.id === id) || null;
}

/** Get courses available for a given skill level. */
export function getCoursesForLevel(level) {
  const levels = ['apprentice', 'journeyman', 'master', 'elder'];
  const levelIndex = levels.indexOf(level);
  return COURSES.filter(c => levels.indexOf(c.requiredLevel) <= levelIndex);
}
