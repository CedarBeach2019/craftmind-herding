// ═══════════════════════════════════════════════════════════════
// CraftMind Herding — Alpha Dog Teachings
// ═══════════════════════════════════════════════════════════════
//
// The old one speaks in the quiet hours. Not commands —
// wisdom. Each lesson unfolds like a turning leaf, revealing
// something the young dog didn't know it needed to understand.
//
// "You cannot push a sheep where it does not want to go.
//  But you can show it where it already belongs."
// ═══════════════════════════════════════════════════════════════

export const TEACHING_CATEGORIES = {
  identity: {
    name: 'Identity',
    emoji: '🐾',
    description: 'Who you are shapes how you herd.',
  },
  sheep: {
    name: 'Sheep',
    emoji: '🐑',
    description: 'Understanding the flock is the first art.',
  },
  work: {
    name: 'Work',
    emoji: '⬡',
    description: 'The craft of moving gently with purpose.',
  },
  family: {
    name: 'Family',
    emoji: '🏡',
    description: 'We herd together. Always.',
  },
  wisdom: {
    name: 'Wisdom',
    emoji: '🌙',
    description: 'What the old ones know that cannot be taught.',
  },
};

/** All teachings, organized by category and tier. */
export const TEACHINGS = [
  // ─── Identity ────────────────────────────────────────────
  {
    id: 'identity_1',
    category: 'identity',
    tier: 1,
    title: 'The First Step',
    text: 'You are a herder. Not a chaser, not a fighter. A herder. The difference is everything.',
    skillRequired: 'approach_sheep',
    wisdomBonus: 0.05,
    chatMessage: '🐾 "Listen, young one. You are not here to run. You are here to guide. There is a vast difference between the two."',
  },
  {
    id: 'identity_2',
    category: 'identity',
    tier: 2,
    title: 'Your Shadow',
    text: 'Watch your shadow on the grass. See how it moves? The sheep watch it too. Move with intention.',
    skillRequired: 'flank_basic',
    wisdomBonus: 0.08,
    chatMessage: '🐾 "Your shadow precedes you. A sheep sees it before it sees your teeth. Use this."',
  },
  {
    id: 'identity_3',
    category: 'identity',
    tier: 3,
    title: 'Patience as Power',
    text: 'The fastest dog does not win. The calmest dog wins. Speed is for wolves. Patience is for shepherds.',
    skillRequired: 'herd_complex',
    wisdomBonus: 0.12,
    chatMessage: '🐾 "I have watched young dogs burn bright and burn out. The meadow rewards those who endure."',
  },

  // ─── Sheep ──────────────────────────────────────────────
  {
    id: 'sheep_1',
    category: 'sheep',
    tier: 1,
    title: 'The Flight Zone',
    text: 'Every sheep has a circle around it. Inside that circle, it runs. Outside, it grazes. Find the edge.',
    skillRequired: 'approach_sheep',
    wisdomBonus: 0.05,
    chatMessage: '🐑 "See how they stand still when you are far? Move closer... closer... there. That moment before they run. That is the flight zone. Remember it."',
  },
  {
    id: 'sheep_2',
    category: 'sheep',
    tier: 2,
    title: 'Flock Mind',
    text: 'Sheep do not think alone. They think together. Move one, and you have moved them all — if you understand which one.',
    skillRequired: 'herd_group',
    wisdomBonus: 0.1,
    chatMessage: '🐑 "Find the leader. Not the biggest — the one the others watch. Move her, and the flock follows."',
  },
  {
    id: 'sheep_3',
    category: 'sheep',
    tier: 3,
    title: 'The Graze',
    text: 'A grazing sheep is a content sheep. Disturbing contentment costs trust. Work around their peace when you can.',
    skillRequired: 'herd_gentle',
    wisdomBonus: 0.08,
    chatMessage: '🐑 "Let them eat. The work will still be there when they lift their heads. A hungry sheep is a stubborn sheep."',
  },

  // ─── Work ───────────────────────────────────────────────
  {
    id: 'work_1',
    category: 'work',
    tier: 1,
    title: 'The Arc',
    text: 'Never approach from the front. Always from behind, in a wide arc. Head-on is confrontation. Behind is guidance.',
    skillRequired: 'flank_basic',
    wisdomBonus: 0.08,
    chatMessage: '⬡ "Walk wide. Come around. If they see your face too soon, they scatter. If they feel you behind, they gather."',
  },
  {
    id: 'work_2',
    category: 'work',
    tier: 2,
    title: 'Pressure and Release',
    text: 'Push gently, then stop. Push, release. The rhythm is everything. Constant pressure creates panic.',
    skillRequired: 'herd_group',
    wisdomBonus: 0.1,
    chatMessage: '⬡ "Watch me. Forward. Stop. Forward. Stop. Feel it? The pause is as important as the push."',
  },
  {
    id: 'work_3',
    category: 'work',
    tier: 3,
    title: 'Reading the Wind',
    text: 'The land tells you where the sheep will go. Fences, water, shade — they follow the path of least resistance.',
    skillRequired: 'herd_complex',
    wisdomBonus: 0.15,
    chatMessage: '⬡ "The sheep will always try to go where they want. Do not fight the current. Redirect it."',
  },

  // ─── Family ─────────────────────────────────────────────
  {
    id: 'family_1',
    category: 'family',
    tier: 2,
    title: 'Two Voices, One Purpose',
    text: 'When you work with another dog, speak less. Listen more. Your partner\'s position is information.',
    skillRequired: 'herd_group',
    wisdomBonus: 0.1,
    chatMessage: '🏡 "You will work with others. A bark here means nothing if your partner barks there. Coordinate. Breathe together."',
  },
  {
    id: 'family_2',
    category: 'family',
    tier: 3,
    title: 'Trust the Kennel',
    text: 'Rest is not weakness. The kennel is where you gather strength. A tired dog makes mistakes. A rested dog makes art.',
    skillRequired: 'rest_awareness',
    wisdomBonus: 0.08,
    chatMessage: '🏡 "Come home when you are tired. No one judges the dog who rests. We judge the dog who collapses mid-run."',
  },

  // ─── Wisdom ─────────────────────────────────────────────
  {
    id: 'wisdom_1',
    category: 'wisdom',
    tier: 3,
    title: 'The Quiet Herding',
    text: 'The best runs are the quiet ones. No barking, no rushing. Just movement — yours and theirs — flowing like water.',
    skillRequired: 'herd_gentle',
    wisdomBonus: 0.2,
    chatMessage: '🌙 "Someday you will herd in silence. The sheep will move because they choose to. That is mastery."',
  },
  {
    id: 'wisdom_2',
    category: 'wisdom',
    tier: 4,
    title: 'When They Scatter',
    text: 'Panic is not failure. It is information. The flock tells you what went wrong. Listen, adjust, try again.',
    skillRequired: 'recover_scatter',
    wisdomBonus: 0.2,
    chatMessage: '🌙 "They run. You breathe. You find the edges and you begin again. This is the work. This is always the work."',
  },
  {
    id: 'wisdom_3',
    category: 'wisdom',
    tier: 4,
    title: 'The Last Lesson',
    text: 'You are not the master of the flock. You are its servant. The moment you forget that, you have lost everything.',
    skillRequired: 'elder_coordination',
    wisdomBonus: 0.3,
    chatMessage: '🌙 "I have taught you all I know. Now you must forget most of it and listen to the grass. Good hunting, little one."',
  },
];

export class TeachingsSystem {
  constructor() {
    this.unlocked = new Set();
    this.currentTier = 1;
    this.demonstratedSkills = new Set();
    this.wisdom = 0;
    this.lessonQueue = [];
    this.isTeaching = false;
  }

  /** Mark a skill as demonstrated by the dog. */
  demonstrateSkill(skillId) {
    if (this.demonstratedSkills.has(skillId)) return false;
    this.demonstratedSkills.add(skillId);
    return this._checkUnlocks();
  }

  /** Check if any new teachings should be unlocked. */
  _checkUnlocks() {
    let unlockedAny = false;
    for (const teaching of TEACHINGS) {
      if (this.unlocked.has(teaching.id)) continue;
      if (teaching.tier > this.currentTier) continue;
      if (this.demonstratedSkills.has(teaching.skillRequired)) {
        this.unlocked.add(teaching.id);
        this.lessonQueue.push(teaching);
        this.wisdom += teaching.wisdomBonus;
        unlockedAny = true;
      }
    }
    return unlockedAny;
  }

  /** Advance to next tier (triggered by completing courses). */
  advanceTier() {
    if (this.currentTier < 4) {
      this.currentTier++;
      this._checkUnlocks();
    }
  }

  /** Get the next lesson to teach. */
  getNextLesson() {
    return this.lessonQueue.length > 0 ? this.lessonQueue.shift() : null;
  }

  /** Get all unlocked teachings. */
  getUnlocked() {
    return TEACHINGS.filter(t => this.unlocked.has(t.id));
  }

  /** Get all teachings for a category. */
  getByCategory(category) {
    return TEACHINGS.filter(t => t.category === category);
  }

  /** Get wisdom-influenced herding parameters. */
  getWisdomModifiers() {
    return {
      flankRadius: 1 + this.wisdom * 2,         // wider arcs with wisdom
      pressureSensitivity: 1 - this.wisdom * 0.3, // gentler push
      recoverySpeed: 1 + this.wisdom * 0.5,       // better scatter recovery
      energyEfficiency: 1 + this.wisdom * 0.2,    // tire less
    };
  }

  /** Serialize. */
  toJSON() {
    return {
      unlocked: [...this.unlocked],
      currentTier: this.currentTier,
      demonstratedSkills: [...this.demonstratedSkills],
      wisdom: this.wisdom,
    };
  }
}
