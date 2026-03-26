/**
 * Script v1: Old Blue — The Experienced Veteran (Old Sheepdog)
 *
 * Slow but deliberate. Doesn't waste energy, takes shortcuts.
 * "Seen it all" attitude. Maximum wisdom, minimum wasted motion.
 *
 * Hypothesis: Moderate efficiency, most "wisdom" behaviors.
 *
 * Behaviors (17 unique):
 * 1. measured_approach     10. cut_corner
 * 2. survey_field          11. let_younger_dog_handle
 * 3. patient_wait          12. gentle_block
 * 4. deliberate_circle     13. experience_drive
 * 5. single_soft_bark      14. conserve_energy
 * 6. slow_drive            15. strategic_rest
 * 7. shortcut_through      16. knowing_glance
 * 8. block_inevitable      17. quiet_satisfaction
 * 9. anticipate_straggler
 */

import { Step, weightedRandom } from './script-engine.js';

export default {
  name: 'old_blue',
  description: 'The Experienced Veteran. Slow, wise, deliberate. Knows every trick.',
  hypothesis: 'Moderate efficiency, most "wisdom" behaviors, best energy management',
  version: 1,
  stats: { sheepPenned: 0, totalBarks: 0, totalNips: 0, restCount: 0, closeCalls: 0, shortcuts: 0 },

  steps: [
    // ── Phase 1: Survey (always takes his time) ──

    Step.action('survey_field', () => {}),
    Step.chat({
      0.3: '*stands still, watching*',
      0.3: '*reads the field like a book*',
      0.2: null,
      0.2: '*slow blink*',
    }),

    Step.action('measured_approach', () => {}),
    Step.action('patient_wait', () => {}),
    Step.chat({ 0.6: null, 0.2: '*waits for the right moment*', 0.2: '*no rush*' }),

    // ── Phase 2: Use experience ──

    Step.branch(
      () => Math.random() > 0.3,
      // Experienced move — anticipate and cut off
      [
        Step.action('anticipate_straggler', () => {}),
        Step.action('block_inevitable', () => {}),
        Step.action('cut_corner', () => {}),
        Step.chat({ 0.6: null, 0.2: '*knows where they\'ll go*', 0.2: '*already there*' }),
        Step.approach(),
        Step.action('gentle_block', () => {}),
      ],
      // Patient — let sheep come to him
      [
        Step.action('patient_wait', () => {}),
        Step.action('deliberate_circle', () => {}),
        Step.chat({ 0.7: null, 0.3: '*barely moves*' }),
      ],
    ),

    // ── Phase 3: Drive (slow but unstoppable) ──

    Step.action('experience_drive', () => {}),
    Step.approach(),
    Step.branch(
      () => Math.random() > 0.6,
      // Soft bark to guide (rare)
      [
        Step.action('single_soft_bark', () => {}),
        Step.bark(),
        Step.chat({ 0.7: null, 0.3: '*one quiet bark*' }),
      ],
      Step.noop(),
    ),

    Step.action('slow_drive', () => {}),
    Step.action('gentle_block', () => {}),
    Step.chat({ 0.7: null, 0.3: '*steady as a rock*' }),

    // ── Phase 4: Energy conservation ──

    Step.branch(
      () => Math.random() > 0.5,
      [
        Step.action('shortcut_through', () => {}),
        Step.action('conserve_energy', () => {}),
        Step.chat({ 0.6: null, 0.4: '*takes the easy way*' }),
      ],
      [
        Step.action('strategic_rest', () => {}),
        Step.chat({ 0.5: null, 0.3: '*catches his breath*', 0.2: '*has done this a thousand times*' }),
        Step.rest(),
      ],
    ),

    // ── Phase 5: Wisdom moments ──

    Step.action('knowing_glance', () => {}),
    Step.chat({
      0.2: '*looks at younger dogs with knowing eyes*',
      0.3: '*has seen this exact situation before*',
      0.3: null,
      0.2: '*slight nod to self*',
    }),

    Step.branch(
      () => Math.random() > 0.5,
      [
        Step.action('let_younger_dog_handle', () => {}),
        Step.chat({ 0.5: null, 0.3: '*steps back to observe*', 0.2: '*watches patiently*' }),
      ],
      [
        Step.circle('cw'),
        Step.action('block_inevitable', () => {}),
      ],
    ),

    // ── Phase 6: Quiet satisfaction ──

    Step.action('quiet_satisfaction', () => {}),
    Step.chat({ 0.6: null, 0.4: '*content sigh*' }),

    Step.goto('old_blue'),
  ],
};
