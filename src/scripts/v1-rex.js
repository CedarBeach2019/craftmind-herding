/**
 * Script v1: Rex — The Alpha Leader (Border Collie)
 *
 * Always takes the lead position. Minimal barking, maximum movement.
 * Anticipates sheep movement. Works fast and efficient.
 *
 * Hypothesis: Most efficient herding, lowest time to pen.
 *
 * Behaviors (18 unique):
 * 1. take_lead_position     10. wide_flank_left
 * 2. assess_flock           11. wide_flank_right
 * 3. silent_approach        12. anticipate_escape
 * 4. direct_drive           13. block_route
 * 5. quick_circle_cw        14. pin_straggler
 * 6. quick_circle_ccw       15. push_through_gap
 * 7. single_bark_command    16. authority_stare
 * 8. nip_redirect           17. efficiency_scan
 * 9. shoulder_block         18. triumphant_return
 */

import { Step, weightedRandom } from './script-engine.js';

export default {
  name: 'rex',
  description: 'The Alpha Leader. Minimal barking, maximum movement, anticipates sheep.',
  hypothesis: 'Most efficient herding, lowest time to pen',
  version: 1,
  stats: { sheepPenned: 0, totalBarks: 0, totalNips: 0, restCount: 0, closeCalls: 0 },

  steps: [
    // ── Phase 1: Assess & Position ──

    Step.action('take_lead_position', (ctx) => {
      // Move to optimal herding position — between sheep and pen
    }),
    Step.chat({ 0.7: null, 0.3: '*positions himself*' }),

    Step.action('assess_flock', (ctx) => {
      // Count sheep, identify stragglers, plan route
    }),

    // ── Phase 2: Herd ──

    Step.branch(
      (ctx) => ctx.sheepNearby > 3,
      // Many sheep: wide flanking
      [
        Step.branch(
          () => Math.random() > 0.5,
          Step.action('wide_flank_left', () => {}),
          Step.action('wide_flank_right', () => {}),
        ),
        Step.approach(),
        Step.circle('cw'),
        Step.approach(),
        Step.chat({ 0.85: null, 0.15: '*moves decisively*' }),
      ],
      // Few sheep: direct approach
      [
        Step.action('silent_approach', () => {}),
        Step.action('direct_drive', () => {}),
        Step.chat({ 0.9: null, 0.1: '*locks on*' }),
      ],
    ),

    // ── Phase 3: Redirect / Correct ──

    Step.branch(
      () => Math.random() > 0.6,
      // Sheep drifting — correct
      [
        Step.action('anticipate_escape', (ctx) => {
          // Move to where sheep WILL go, not where they are
        }),
        Step.action('block_route', () => {}),
        Step.branch(
          () => Math.random() > 0.4,
          Step.bark(),
          Step.nip(),
        ),
      ],
      // Sheep cooperative — keep driving
      [
        Step.action('shoulder_block', () => {}),
        Step.approach(),
        Step.action('pin_straggler', () => {}),
      ],
    ),

    // ── Phase 4: Push to pen ──

    Step.branch(
      () => Math.random() > 0.3,
      [
        Step.action('push_through_gap', () => {}),
        Step.circle('cw'),
        Step.approach(),
        Step.action('authority_stare', () => {}),
      ],
      [
        Step.action('quick_circle_ccw', () => {}),
        Step.approach(),
        Step.action('nip_redirect', () => {}),
      ],
    ),

    // ── Phase 5: Single commanding bark (rare — Rex doesn't waste breath) ──

    Step.chat({ 0.8: null, 0.2: '*one sharp bark*' }),
    Step.branch(
      () => Math.random() > 0.7,
      Step.bark(),
      Step.noop(),
    ),

    // ── Phase 6: Efficiency check ──

    Step.action('efficiency_scan', (ctx) => {
      // Quick visual sweep — are any sheep breaking away?
    }),

    // Loop back
    Step.goto('rex'),
  ],
};
