/**
 * Script v1: Biscuit — The Friendly Fluffball (Golden Retriever personality)
 *
 * Loves people more than sheep. Gets distracted, plays with sheep instead
 * of herding. Lots of "happy" behaviors. Tail always wagging.
 *
 * Hypothesis: Worst herding efficiency, most "fun" to watch.
 *
 * Behaviors (17 unique):
 * 1. tail_wag            10. bounce_around
 * 2. happy_approach       11. sniff_sheep_nose
 * 3. distracted_pause     12. roll_on_grass
 * 4. play_bow             13. chase_own_tail
 * 5. gentle_nudge         14. look_at_player
 * 6. excited_circle       15. forget_what_doing
 * 7. wander_off           16. accidental_good_herd
 * 8. sniff_ground         17. enthusiastic_return
 * 9. belly_rub_request
 */

import { Step, weightedRandom } from './script-engine.js';

export default {
  name: 'biscuit',
  description: 'The Friendly Fluffball. Distracted, playful, terrible at herding, adorable.',
  hypothesis: 'Worst herding efficiency, most "fun" to watch',
  version: 1,
  stats: { sheepPenned: 0, totalBarks: 0, totalNips: 0, restCount: 0, closeCalls: 0, distractions: 0 },

  steps: [
    // ── Phase 1: Start with enthusiasm! (maybe) ──

    Step.action('tail_wag', () => {}),
    Step.chat({
      0.2: '*tail wagging intensifies*',
      0.3: '*happy panting*',
      0.3: '*bounces excitedly*',
      0.2: null,
    }),

    Step.branch(
      () => Math.random() > 0.4,
      // Actually try to herd (50/50 shot)
      [
        Step.action('happy_approach', () => {}),
        Step.chat({ 0.4: '*prances toward sheep*', 0.3: 'This is fun!', 0.3: null }),

        Step.branch(
          () => Math.random() > 0.5,
          // Distraction hits
          [
            Step.action('distracted_pause', () => {}),
            Step.chat({
              0.25: '*stops to sniff a flower*',
              0.25: '*looks at a butterfly*',
              0.25: '*forgets what he was doing*',
              0.25: '*watches a cloud*',
            }),
            Step.action('wander_off', () => {}),
          ],
          // Keeps going! (briefly)
          [
            Step.action('gentle_nudge', () => {}),
            Step.circle('cw'),
            Step.chat({ 0.6: null, 0.2: '*boops a sheep*', 0.2: 'Hi sheep!' }),
          ],
        ),
      ],
      // Just play instead of working
      [
        Step.action('play_bow', () => {}),
        Step.chat({ 0.5: '*play bow!*', 0.3: 'Wanna play?', 0.2: null }),
        Step.action('bounce_around', () => {}),
        Step.action('chase_own_tail', () => {}),
      ],
    ),

    // ── Phase 2: Interact with sheep (wrong way) ──

    Step.branch(
      () => Math.random() > 0.3,
      [
        Step.action('sniff_sheep_nose', () => {}),
        Step.chat({ 0.4: '*sniff sniff*', 0.3: '*wags at sheep*', 0.3: null }),
        Step.branch(
          () => Math.random() > 0.6,
          Step.action('roll_on_grass', () => {}),
          Step.action('excited_circle', () => {}),
        ),
      ],
      [
        Step.action('sniff_ground', () => {}),
        Step.action('belly_rub_request', () => {}),
        Step.chat({ 0.4: '*rolls over for belly rub*', 0.3: '*looks hopeful*', 0.3: null }),
      ],
    ),

    // ── Phase 3: Player distraction ──

    Step.branch(
      (ctx) => ctx.playerNearby && Math.random() > 0.3,
      [
        Step.action('look_at_player', () => {}),
        Step.chat({
          0.3: '*runs to player for attention*',
          0.3: '*brings a stick*',
          0.2: 'Pet me!',
          0.2: null,
        }),
        Step.action('forget_what_doing', () => {}),
      ],
      Step.noop(),
    ),

    // ── Phase 4: Sometimes accidentally herds well ──

    Step.branch(
      () => Math.random() > 0.8,
      [
        Step.action('accidental_good_herd', () => {}),
        Step.approach(),
        Step.bark(),
        Step.chat({ 0.5: '*accidentally herds sheep perfectly*', 0.5: null }),
      ],
      [
        Step.action('enthusiastic_return', () => {}),
        Step.chat({ 0.6: null, 0.4: '*happy bouncing*' }),
      ],
    ),

    // ── Phase 5: Oops, need to rest from all that "work" ──

    Step.branch(
      () => Math.random() > 0.7,
      Step.rest(),
      Step.noop(),
    ),

    Step.action('tail_wag', () => {}),
    Step.goto('biscuit'),
  ],
};
