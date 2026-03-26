/**
 * @module craftmind-herding/ai/dog-personalities
 * @description Named dog configurations with distinct personalities, skills, and taglines.
 * Each dog feels different to command and work with.
 */

export const DOG_PERSONALITIES = {
  rex: {
    name: 'Rex',
    breed: 'Border Collie',
    personality: { speed: 0.8, patience: 0.4, obedience: 0.7, social: 0.6, bravery: 0.8, gentleness: 0.5 },
    tagline: "I've got this. Watch and learn.",
    skills: ['heel', 'flank', 'drive', 'gather', 'hold', 'recall'],
    preferredRole: 'lead',
    quirks: [
      'always checks the flock count before starting',
      'gets frustrated when other dogs mess up',
      'struts after a successful run',
    ],
    trustThresholds: {
      basic: 10,
      tips: 30,
      advanced: 50,
      secrets: 80,
    },
  },
  biscuit: {
    name: 'Biscuit',
    breed: 'Australian Shepherd',
    personality: { speed: 0.4, patience: 0.9, obedience: 0.8, social: 0.7, bravery: 0.5, gentleness: 0.9 },
    tagline: "Easy now. We'll get there.",
    skills: ['heel', 'flank', 'gather', 'hold', 'recall'],
    preferredRole: 'flanker',
    quirks: [
      'refuses to chase panicked lambs aggressively',
      'calms down stressed sheep just by being nearby',
      'always checks for stragglers before completing',
    ],
    trustThresholds: {
      basic: 5,
      tips: 20,
      advanced: 40,
      secrets: 70,
    },
  },
  thunder: {
    name: 'Thunder',
    breed: 'Kelpie',
    personality: { speed: 0.9, patience: 0.3, obedience: 0.2, social: 0.5, bravery: 0.9, gentleness: 0.3 },
    tagline: "I know what I'm doing. Trust me.",
    skills: ['flank', 'drive', 'gather', 'recall'],
    preferredRole: 'fetcher',
    quirks: [
      'ignores commands when he thinks he knows better',
      'barks at predators before being told',
      'refuses to slow down for tired animals',
    ],
    trustThresholds: {
      basic: 20,
      tips: 50,
      advanced: 70,
      secrets: 90,
    },
  },
  sadie: {
    name: 'Sadie',
    breed: 'Rescue Mix',
    personality: { speed: 0.5, patience: 0.6, obedience: 0.5, social: 0.8, bravery: 0.2, gentleness: 0.8 },
    tagline: "I'll try my best...",
    skills: ['heel', 'hold', 'recall'],
    preferredRole: null,
    quirks: [
      'startles at loud noises',
      'sticks close to other dogs for safety',
      'improves rapidly when praised',
      'freezes during storms',
    ],
    trustThresholds: {
      basic: 30,
      tips: 50,
      advanced: 65,
      secrets: 85,
    },
  },
  old_blue: {
    name: 'Old Blue',
    breed: 'Rough Collie',
    personality: { speed: 0.2, patience: 0.95, obedience: 0.9, social: 0.9, bravery: 0.7, gentleness: 0.8 },
    tagline: "Watch. Learn. The sheep will teach you.",
    skills: ['heel', 'flank', 'drive', 'gather', 'hold', 'shed', 'guard', 'recall'],
    preferredRole: 'lead',
    quirks: [
      'pauses to let younger dogs figure things out',
      'positions himself to block escape routes naturally',
      'slows down on purpose to mentor puppies',
      'knows every inch of the pasture',
    ],
    trustThresholds: {
      basic: 5,
      tips: 15,
      advanced: 30,
      secrets: 60,
    },
  },
};

/** Get all dog configs as DogAgent constructor params. */
export function getAllDogConfigs() {
  return Object.values(DOG_PERSONALITIES);
}

/** Get a specific dog config by id. */
export function getDogConfig(id) {
  return DOG_PERSONALITIES[id] || null;
}

export default DOG_PERSONALITIES;
