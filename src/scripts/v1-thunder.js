/**
 * Script v1: Thunder — The Nervous One (Anxious Rescue)
 *
 * Spooked by loud noises, startled by sudden movement. Hesitant to
 * approach sheep. Sometimes just sits down. Unpredictable.
 *
 * Hypothesis: Most realistic "rescue dog" personality, unpredictable.
 *
 * Behaviors (16 unique):
 * 1. cautious_approach      9. startled_flinch
 * 2. freeze_in_place        10. comfort_scan
 * 3. retreat_to_safe        11. brave_moment
 * 4. nervous_whimper        12. shake_it_off
 * 5. peek_from_behind       13. self_soothe
 * 6. slow_advance           14. panic_dart
 * 7. sudden_stop            15. gradual_calm
 * 8. sit_down_midway        16. tentative_success
 */

import { Step, weightedRandom } from './script-engine.js';

export default {
  name: 'thunder',
  description: 'The Nervous One. Anxious, hesitant, unpredictable. Sometimes brilliant.',
  hypothesis: 'Most realistic "rescue dog" personality, unpredictable results',
  version: 1,
  stats: { sheepPenned: 0, totalBarks: 0, totalNips: 0, restCount: 0, closeCalls: 0, panicEvents: 0, braveMoments: 0 },

  steps: [
    // ── Phase 1: Hesitation ──

    Step.action('cautious_approach', () => {}),
    Step.chat({
      0.3: '*lowers head nervously*',
      0.3: '*takes one step forward*',
      0.2: null,
      0.2: '*ears flat*',
    }),

    Step.branch(
      () => Math.random() > 0.5,
      // Keeps going (brave!)
      [
        Step.action('slow_advance', () => {}),
        Step.chat({ 0.6: null, 0.4: '*moves carefully*' }),
      ],
      // Freezes
      [
        Step.action('freeze_in_place', () => {}),
        Step.chat({ 0.5: '*freezes*', 0.3: '*whimpers quietly*', 0.2: null }),
      ],
    ),

    // ── Phase 2: Reaction to sheep movement ──

    Step.branch(
      () => Math.random() > 0.4,
      // Sheep moved suddenly — scared!
      [
        Step.action('startled_flinch', () => {}),
        Step.branch(
          () => Math.random() > 0.6,
          // Retreats
          [
            Step.action('retreat_to_safe', () => {}),
            Step.action('self_soothe', () => {}),
            Step.chat({ 0.4: '*backs away*', 0.3: '*hides behind player*', 0.3: null }),
          ],
          // Stands ground (barely)
          [
            Step.action('shake_it_off', () => {}),
            Step.chat({ 0.5: null, 0.3: '*trembling but holding*', 0.2: '*whimpers*' }),
          ],
        ),
      ],
      // Sheep calm — Thunder approaches
      [
        Step.action('peek_from_behind', () => {}),
        Step.chat({ 0.5: '*peeks out cautiously*', 0.5: null }),
      ],
    ),

    // ── Phase 3: Sit down or keep going? ──

    Step.branch(
      () => Math.random() > 0.6,
      [
        Step.action('sit_down_midway', () => {}),
        Step.action('nervous_whimper', () => {}),
        Step.chat({ 0.4: '*sits down and looks at you*', 0.3: '*won\'t move*', 0.3: null }),
        Step.branch(
          () => Math.random() > 0.7,
          // Long sit
          [
            Step.rest(),
            Step.action('gradual_calm', () => {}),
          ],
          Step.noop(),
        ),
      ],
      [
        Step.approach(),
        Step.chat({ 0.7: null, 0.3: '*takes a tentative step*' }),
      ],
    ),

    // ── Phase 4: Rare brave moment ──

    Step.branch(
      () => Math.random() > 0.75,
      [
        Step.action('brave_moment', () => {}),
        Step.chat({ 0.3: '*suddenly focused*', 0.3: '*locks eyes on sheep*', 0.4: null }),
        Step.circle('cw'),
        Step.approach(),
        Step.bark(),
        Step.action('tentative_success', () => {}),
      ],
      [
        Step.action('comfort_scan', () => {}),
        Step.chat({ 0.5: null, 0.3: '*checks if player is still there*', 0.2: '*looks anxious*' }),
        Step.action('sudden_stop', () => {}),
      ],
    ),

    // ── Phase 5: Panic or recovery ──

    Step.branch(
      () => Math.random() > 0.7,
      [
        Step.action('panic_dart', () => {}),
        Step.chat({ 0.5: '*bolts!', 0.3: '*panics*', 0.2: null }),
        Step.action('retreat_to_safe', () => {}),
        Step.action('self_soothe', () => {}),
      ],
      [
        Step.action('gradual_calm', () => {}),
        Step.chat({ 0.6: null, 0.4: '*slowly relaxes*' }),
      ],
    ),

    Step.goto('thunder'),
  ],
};
