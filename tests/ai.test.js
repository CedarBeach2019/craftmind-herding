/**
 * Tests for CraftMind Herding AI system.
 * Run: node --experimental-vm-modules node_modules/.bin/jest tests/ai.test.js
 * Or simply: node tests/ai.test.js
 */

import { DogAgent } from '../src/ai/dog-agent.js';
import { DOG_PERSONALITIES, getAllDogConfigs, getDogConfig } from '../src/ai/dog-personalities.js';
import { HERDING_ACTIONS, command, getAvailableActions, interpretCommand } from '../src/ai/herding-actions.js';
import { PackDynamics } from '../src/ai/pack-dynamics.js';
import { HerdingEvaluator } from '../src/ai/herding-evaluator.js';
import { DogTrust, TRUST_TIERS } from '../src/ai/dog-trust.js';

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, msg) {
  if (condition) { passed++; }
  else { failed++; failures.push(msg); }
}

function assertEqual(actual, expected, msg) {
  assert(actual === expected, `${msg}: expected ${expected}, got ${actual}`);
}

function assertGT(actual, threshold, msg) {
  assert(actual > threshold, `${msg}: ${actual} not > ${threshold}`);
}

function assertLT(actual, threshold, msg) {
  assert(actual < threshold, `${msg}: ${actual} not < ${threshold}`);
}

// ── DogAgent Tests ──────────────────────────────────────────────

function testDogAgent() {
  const dog = new DogAgent({
    name: 'Rex',
    breed: 'Border Collie',
    personality: { speed: 0.8, patience: 0.4, obedience: 0.7, social: 0.6, bravery: 0.8, gentleness: 0.5 },
    tagline: 'Test dog',
    skills: ['heel', 'flank', 'drive'],
  });

  assertEqual(dog.name, 'Rex', 'dog name');
  assertEqual(dog.id, 'rex', 'dog id');
  assertEqual(dog.breed, 'Border Collie', 'dog breed');
  assert(dog.skills.has('heel'), 'has heel skill');
  assert(dog.skills.has('flank'), 'has flank skill');
  assert(!dog.skills.has('guard'), 'no guard skill');
  assertEqual(dog.energy, dog.energyMax, 'starts at max energy');

  // Start/stop
  dog.start();
  assert(dog.active, 'active after start');
  dog.stop();
  assert(!dog.active, 'inactive after stop');
  dog.start();

  // Command obedience
  const obeyed = dog.receiveCommand({ type: 'DRIVE', params: {} });
  assert(obeyed !== null, 'obeyed command');

  // Receive command
  dog.receiveCommand({ type: 'HOLD', params: {} });
  const tick = dog.tick();
  assert(tick !== null, 'tick returns action');
  assertEqual(tick.dogId, 'rex', 'tick has dog id');

  // Record run
  dog.recordRun({ action: 'HERD', score: 85, animalsPenned: 5, playerHelped: true });
  assertEqual(dog.totalRuns, 1, 'one run recorded');
  assertEqual(dog.totalPenned, 5, 'penned count');
  assertEqual(dog.bestScore, 85, 'best score updated');
  assertEqual(dog.memory.length, 1, 'one memory entry');

  // Trust changed from good run + player help
  assertGT(dog.trust.level, 10, 'trust increased from good run');

  // Skill proficiency updated
  dog.skills.set('heel', { proficiency: 0.5, uses: 0, successes: 0 });
  dog.recordRun({ action: 'HERD', score: 75, skill: 'heel' });
  const heel = dog.skills.get('heel');
  assertEqual(heel.uses, 1, 'heel uses incremented');

  // Bond with another dog
  dog.interactWith('biscuit', 'worked_well');
  assert(dog.bonds.has('biscuit'), 'has bond with biscuit');
  assertGT(dog.bonds.get('biscuit').bond, 0.3, 'bond increased');

  // Summary
  const summary = dog.getSummary();
  assertEqual(summary.name, 'Rex', 'summary has name');
  assert(summary.trust !== undefined, 'summary has trust');

  // Low obedience dog disobeys sometimes
  const stubborn = new DogAgent({
    name: 'Thunder', personality: { speed: 0.9, patience: 0.3, obedience: 0.0, social: 0.5, bravery: 0.9, gentleness: 0.3 },
    skills: ['flank'],
  });
  stubborn.start();
  let obeyCount = 0;
  let disobeyCount = 0;
  for (let i = 0; i < 100; i++) {
    const result = stubborn.receiveCommand({ type: 'DRIVE', params: {} });
    if (result?.type === 'DRIVE') obeyCount++;
    else if (result?.type === 'DISOBEY') disobeyCount++;
  }
  assertEqual(obeyCount, 0, 'zero obedience dog never obeys');
  assertGT(disobeyCount, 50, 'zero obedience dog always disobeys');

  // Advanced commands blocked by low trust
  const sadie = new DogAgent({
    name: 'Sadie', personality: { speed: 0.5, patience: 0.6, obedience: 0.9, social: 0.8, bravery: 0.2, gentleness: 0.8 },
    skills: ['shed'],
  });
  sadie.start();
  const advanced = sadie.receiveCommand({ type: 'SHED', params: {} });
  assertEqual(advanced.type, 'DISOBEY', 'low trust blocks advanced commands');

  // Energy drain → rest
  const tired = new DogAgent({ name: 'Tired', personality: { speed: 0.5, patience: 0.5, obedience: 0.5, social: 0.5, bravery: 0.5, gentleness: 0.5 }, skills: [] });
  tired.start();
  tired.energy = 5;
  const restCmd = tired.receiveCommand({ type: 'DRIVE', params: {} });
  assertEqual(restCmd.type, 'REST', 'low energy triggers rest');
}

// ── Dog Personalities Tests ─────────────────────────────────────

function testDogPersonalities() {
  const configs = getAllDogConfigs();
  assertEqual(configs.length, 5, '5 dog personalities');

  // Each has required fields
  for (const c of configs) {
    assert(c.name, `dog ${c.name} has name`);
    assert(c.personality.speed >= 0 && c.personality.speed <= 1, `${c.name} speed in range`);
    assert(c.skills.length > 0, `${c.name} has skills`);
  }

  // Specific dogs
  const rex = getDogConfig('rex');
  assertEqual(rex.name, 'Rex', 'rex config');
  assertGT(rex.personality.speed, 0.7, 'rex is fast');

  const thunder = getDogConfig('thunder');
  assertLT(thunder.personality.obedience, 0.3, 'thunder is stubborn');

  const oldBlue = getDogConfig('old_blue');
  assertGT(oldBlue.personality.patience, 0.9, 'old blue is patient');
  assertEqual(oldBlue.skills.length, 8, 'old blue has all skills');

  assertEqual(getDogConfig('nonexistent'), null, 'unknown dog returns null');
}

// ── Herding Actions Tests ───────────────────────────────────────

function testHerdingActions() {
  // All actions defined
  assert(HERDING_ACTIONS.HERD, 'HERD action exists');
  assert(HERDING_ACTIONS.FLANK_LEFT, 'FLANK_LEFT exists');
  assert(HERDING_ACTIONS.FLANK_RIGHT, 'FLANK_RIGHT exists');
  assert(HERDING_ACTIONS.HOLD, 'HOLD exists');
  assert(HERDING_ACTIONS.GATHER, 'GATHER exists');
  assert(HERDING_ACTIONS.DRIVE, 'DRIVE exists');
  assert(HERDING_ACTIONS.SHED, 'SHED exists');
  assert(HERDING_ACTIONS.RECALL, 'RECALL exists');
  assert(HERDING_ACTIONS.GUARD, 'GUARD exists');
  assert(HERDING_ACTIONS.ALERT, 'ALERT exists');
  assert(HERDING_ACTIONS.REST, 'REST exists');
  assertEqual(Object.keys(HERDING_ACTIONS).length, 11, '11 actions');

  // Command creation
  const cmd = command('DRIVE', { direction: 'north', intensity: 0.8 });
  assertEqual(cmd.type, 'DRIVE', 'command type');
  assertEqual(cmd.params.intensity, 0.8, 'command params');
  assert(cmd.schema, 'command has schema');

  // Invalid command throws
  let threw = false;
  try { command('INVALID', {}); } catch { threw = true; }
  assert(threw, 'invalid command throws');

  // Available actions filters by skills and trust
  const basic = getAvailableActions(['heel', 'flank', 'drive'], 10);
  assert(basic.includes('HERD'), 'HERD available with heel');
  assert(!basic.includes('SHED'), 'SHED blocked without skill');
  assert(!basic.includes('GUARD'), 'GUARD blocked without skill');

  const withSkill = getAvailableActions(['heel', 'flank', 'drive', 'shed'], 50);
  assert(withSkill.includes('SHED'), 'SHED available with skill and trust');

  // Natural language interpretation
  assertEqual(interpretCommand('herd the sheep to the pen').type, 'HERD', 'interpret herd');
  assertEqual(interpretCommand('flank left').type, 'FLANK_LEFT', 'interpret flank left');
  assertEqual(interpretCommand('go around from the right').type, 'FLANK_RIGHT', 'interpret right');
  assertEqual(interpretCommand('hold position').type, 'HOLD', 'interpret hold');
  assertEqual(interpretCommand('gather the stragglers').type, 'GATHER', 'interpret gather');
  assertEqual(interpretCommand('push them forward').type, 'DRIVE', 'interpret drive');
  assertEqual(interpretCommand('come here').type, 'RECALL', 'interpret recall');
  assertEqual(interpretCommand('take a break').type, 'REST', 'interpret rest');
  assertEqual(interpretCommand('guard the flock').type, 'GUARD', 'interpret guard');
  assertEqual(interpretCommand('separate that one').type, 'SHED', 'interpret shed');
  assertEqual(interpretCommand('random gibberish xyz'), null, 'unrecognized returns null');
}

// ── Pack Dynamics Tests ─────────────────────────────────────────

function testPackDynamics() {
  const pack = new PackDynamics();

  // Create test dogs
  const rex = new DogAgent({ name: 'Rex', personality: { speed: 0.8, patience: 0.4, obedience: 0.7, social: 0.6, bravery: 0.8, gentleness: 0.5 }, skills: ['heel', 'flank', 'drive', 'gather', 'hold', 'recall'] });
  const biscuit = new DogAgent({ name: 'Biscuit', personality: { speed: 0.4, patience: 0.9, obedience: 0.8, social: 0.7, bravery: 0.5, gentleness: 0.9 }, skills: ['heel', 'flank', 'gather', 'hold', 'recall'] });
  const thunder = new DogAgent({ name: 'Thunder', personality: { speed: 0.9, patience: 0.3, obedience: 0.2, social: 0.5, bravery: 0.9, gentleness: 0.3 }, skills: ['flank', 'drive', 'gather', 'recall'] });

  // Register
  pack.registerDog(rex);
  pack.registerDog(biscuit);
  pack.registerDog(thunder);
  assertEqual(pack.dogs.size, 3, '3 dogs registered');

  // Role assignment
  const roles = pack.assignRoles([rex, biscuit, thunder]);
  assert(roles[rex.id], 'rex has role');
  assert(roles[biscuit.id], 'biscuit has role');
  assert(roles[thunder.id], 'thunder has role');

  // Rex or Thunder should be lead (high speed + bravery)
  const leadId = pack.getLeadDog();
  assert(leadId === 'rex' || leadId === 'thunder', 'lead is fast/brave');

  // Lead challenge
  const newLead = pack.challengeLead('thunder', 'rex', [rex, biscuit, thunder]);
  assert(newLead === 'rex' || newLead === 'thunder', 'challenge resolves');

  // Coordination score
  const coord = pack.getCoordinationScore([rex, biscuit, thunder]);
  assert(coord >= 0 && coord <= 1, 'coordination in range');

  // Coordination with bonds
  rex.interactWith('biscuit', 'worked_well');
  rex.interactWith('thunder', 'competed');
  const coord2 = pack.getCoordinationScore([rex, biscuit, thunder]);
  assert(coord2 >= 0, 'coordination with bonds works');

  // Single dog has perfect coordination
  const single = pack.getCoordinationScore([rex]);
  assertEqual(single, 1, 'single dog coordination is 1');

  // Mentorship check
  const sadie = new DogAgent({ name: 'Sadie', personality: { speed: 0.5, patience: 0.6, obedience: 0.5, social: 0.8, bravery: 0.2, gentleness: 0.8 }, skills: ['heel'] });
  const oldBlue = new DogAgent({ name: 'Old Blue', personality: { speed: 0.2, patience: 0.95, obedience: 0.9, social: 0.9, bravery: 0.7, gentleness: 0.8 }, skills: ['heel'] });
  sadie.interactWith('old_blue', 'worked_well');
  // Give old blue some runs
  for (let i = 0; i < 10; i++) oldBlue.recordRun({ score: 80, animalsPenned: 5 });

  pack.registerDog(sadie);
  pack.registerDog(oldBlue);
  pack.checkMentorship([rex, biscuit, thunder, sadie, oldBlue]);

  // Interaction log
  assert(pack.interactionLog.length > 0, 'interaction log has entries');
}

// ── Herding Evaluator Tests ─────────────────────────────────────

function testHerdingEvaluator() {
  const eval_ = new HerdingEvaluator();

  // Score a session
  const session = {
    animalsPenned: 8, animalCount: 10, avgStress: 0.2,
    duration: 60, panicEvents: 0, score: 85,
    conditions: { season: 'spring', animalType: 'sheep', weather: 'clear' },
    dogCombo: 'rex+biscuit', primarySkill: 'flank',
  };

  const score = eval_.scoreSession(session);
  assert(score > 0.5, `session scored ${score} > 0.5`);
  assert(score <= 1, `session scored ${score} <= 1`);

  // Perfect session
  const perfect = eval_.scoreSession({
    animalsPenned: 10, animalCount: 10, avgStress: 0,
    duration: 10, panicEvents: 0, score: 100,
  });
  assert(perfect > score, 'perfect scores higher');

  // Bad session
  const bad = eval_.scoreSession({
    animalsPenned: 2, animalCount: 10, avgStress: 0.8,
    duration: 200, panicEvents: 5, score: 20,
  });
  assert(bad < score, `bad session scores lower: ${bad} < ${score}`);

  // Add sessions and evaluate
  eval_.addSession({ ...session, dogId: 'rex' });
  eval_.addSession({ ...session, score: 90, animalsPenned: 10, dogId: 'rex' });
  eval_.addSession({
    ...session, conditions: { season: 'winter', animalType: 'sheep', weather: 'snow' },
    dogId: 'thunder', primarySkill: 'drive', score: 50, animalsPenned: 5, avgStress: 0.5,
  });

  // Similar sessions
  const similar = eval_.findSimilar({ season: 'spring', animalType: 'sheep' });
  assert(similar.length >= 2, 'found similar sessions');

  // Evaluation
  const result = eval_.evaluate({
    ...session, dogId: 'rex+biscuit', dogCombo: 'rex+biscuit',
  });
  assert(result.sessionScore > 0, 'evaluation has score');
  assert(result.bestCombo !== null, 'evaluation has best combo');
  assert(result.skillRanking !== undefined, 'evaluation has skill ranking');

  // Insights with more data
  for (let i = 0; i < 10; i++) {
    eval_.addSession({
      animalsPenned: 8 + Math.floor(Math.random() * 3),
      animalCount: 10, avgStress: Math.random() * 0.3,
      duration: 40 + Math.random() * 40, panicEvents: 0,
      score: 70 + Math.random() * 30,
      conditions: { season: i < 5 ? 'spring' : 'winter', animalType: 'sheep' },
      dogCombo: i < 5 ? 'rex+biscuit' : 'thunder+rex',
      primarySkill: i < 5 ? 'flank' : 'drive',
    });
  }
  const result2 = eval_.evaluate({ ...session, dogCombo: 'rex+biscuit' });
  assert(result2.totalSimilar > 5, 'enough similar sessions');
  // Insights may or may not generate depending on data distribution
}

// ── Dog Trust Tests ─────────────────────────────────────────────

function testDogTrust() {
  const trust = new DogTrust();

  assertEqual(trust.level, 10, 'starts at 10');
  assertEqual(trust.getTier(), 'stranger', 'starts as stranger');

  trust.change(15, 'good run');
  assertEqual(trust.level, 25, 'trust increased');
  assertEqual(trust.getTier(), 'familiar', 'tier is familiar');

  trust.change(20, 'saved my sheep');
  assertEqual(trust.level, 45, 'trust at friend');
  assertEqual(trust.getTier(), 'friend', 'tier is friend');

  trust.change(20, 'advanced work');
  assertEqual(trust.getTier(), 'partner', 'tier is partner');

  // Clamp upper
  trust.change(100, 'overflow');
  assertEqual(trust.level, 100, 'trust capped at 100');
  assertEqual(trust.getTier(), 'bonded', 'tier is bonded');

  // Clamp lower
  trust.change(-200, 'massive loss');
  assertEqual(trust.level, 0, 'trust floored at 0');

  // Can receive commands
  const lowTrust = new DogTrust();
  assert(lowTrust.canReceive('REST', false), 'REST always available');
  assert(lowTrust.canReceive('RECALL', false), 'RECALL always available');
  assert(!lowTrust.canReceive('SHED', true), 'SHED blocked at low trust');

  const highTrust = new DogTrust({ level: 80 });
  assert(highTrust.canReceive('SHED', true), 'SHED available at high trust');
  assert(highTrust.canReceive('GUARD', true), 'GUARD available at high trust');

  // Description
  assert(lowTrust.getDescription().includes('Barely'), 'stranger description');

  // History
  trust.change(5, 'test');
  assert(trust.history.length > 0, 'history recorded');

  // Serialization
  const json = trust.toJSON();
  assert(json.level !== undefined, 'json has level');
  assert(json.tier !== undefined, 'json has tier');

  // Resume from state
  const restored = new DogTrust({ level: 75, history: [] });
  assertEqual(restored.level, 75, 'restored from state');
}

// ── Integration Tests ───────────────────────────────────────────

function testIntegration() {
  // Full flow: create dogs, assign roles, run session, evaluate
  const configs = getAllDogConfigs();
  const dogs = configs.map(c => new DogAgent(c));
  dogs.forEach(d => d.start());

  const pack = new PackDynamics();
  const roles = pack.assignRoles(dogs);
  assert(Object.keys(roles).length === 5, 'all dogs have roles');

  const evaluator = new HerdingEvaluator();

  // Simulate herding runs
  for (let i = 0; i < 5; i++) {
    const session = {
      animalsPenned: 7 + Math.floor(Math.random() * 3),
      animalCount: 10, avgStress: 0.1 + Math.random() * 0.3,
      duration: 30 + Math.random() * 60, panicEvents: Math.floor(Math.random() * 2),
      score: 60 + Math.random() * 40,
      conditions: { season: 'spring', animalType: 'sheep', weather: 'clear' },
      dogCombo: 'rex+biscuit', primarySkill: 'flank',
    };
    evaluator.addSession(session);
    dogs[0].recordRun({ ...session, skill: 'flank', action: 'HERD', playerHelped: true });
  }

  const eval_result = evaluator.evaluate({
    animalsPenned: 9, animalCount: 10, avgStress: 0.15,
    duration: 45, panicEvents: 0, score: 88,
    conditions: { season: 'spring', animalType: 'sheep', weather: 'clear' },
    dogCombo: 'rex+biscuit', primarySkill: 'flank',
  });

  assert(eval_result.sessionScore > 0.5, 'integration evaluation scored');
  assert(eval_result.bestCombo !== null, 'integration has best combo');

  // Trust progression over runs
  assert(dogs[0].trust.level > 10, 'rex trust grew from runs');

  // Pack coordination
  dogs[0].interactWith('biscuit', 'worked_well');
  dogs[0].interactWith('biscuit', 'saved');
  const coord = pack.getCoordinationScore(dogs);
  assert(coord > 0, 'pack coordination positive');

  // Summary works
  const summary = dogs[0].getSummary();
  assert(summary.totalRuns > 0, 'summary has runs');
  assert(summary.trust > 10, 'summary trust grew');
}

// ── Run ─────────────────────────────────────────────────────────

console.log('🐕 CraftMind Herding AI Tests\n');

testDogAgent();
testDogPersonalities();
testHerdingActions();
testPackDynamics();
testHerdingEvaluator();
testDogTrust();
testIntegration();

console.log(`\n✅ ${passed} passed | ❌ ${failed} failed`);
if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach(f => console.log(`  • ${f}`));
  process.exit(1);
}
