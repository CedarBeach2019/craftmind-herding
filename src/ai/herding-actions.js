/**
 * @module craftmind-herding/ai/herding-actions
 * @description Herding-specific action schema. Defines all commands a dog can receive
 * and the parameters they accept.
 */

export const HERDING_ACTIONS = {
  HERD: {
    name: 'Herd',
    description: 'Move the flock to a target location.',
    params: ['targetPen', 'strategy'],
    strategies: ['basic', 'split', 'surround', 'channel'],
    energyCost: 0.08,
    requiredSkill: 'heel',
  },
  FLANK_LEFT: {
    name: 'Flank Left',
    description: 'Circle around the flock from the left side.',
    params: ['radius'],
    energyCost: 0.06,
    requiredSkill: 'flank',
  },
  FLANK_RIGHT: {
    name: 'Flank Right',
    description: 'Circle around the flock from the right side.',
    params: ['radius'],
    energyCost: 0.06,
    requiredSkill: 'flank',
  },
  HOLD: {
    name: 'Hold',
    description: 'Stay in position and keep the flock grouped.',
    params: ['position'],
    energyCost: 0.02,
    requiredSkill: 'hold',
  },
  GATHER: {
    name: 'Gather',
    description: 'Bring stragglers back to the flock.',
    params: ['animalId'],
    energyCost: 0.07,
    requiredSkill: 'gather',
  },
  DRIVE: {
    name: 'Drive',
    description: 'Push the flock forward toward a target.',
    params: ['direction', 'intensity'],
    energyCost: 0.08,
    requiredSkill: 'drive',
  },
  SHED: {
    name: 'Shed',
    description: 'Separate one animal from the group.',
    params: ['animalId', 'direction'],
    energyCost: 0.05,
    requiredSkill: 'shed',
    advanced: true,
  },
  RECALL: {
    name: 'Recall',
    description: 'Come back to the handler.',
    params: [],
    energyCost: 0.03,
    requiredSkill: 'recall',
  },
  GUARD: {
    name: 'Guard',
    description: 'Watch the flock without directing movement.',
    params: ['position'],
    energyCost: 0.02,
    requiredSkill: 'guard',
    advanced: true,
  },
  ALERT: {
    name: 'Alert',
    description: 'Bark at a predator or threat.',
    params: ['target', 'position'],
    energyCost: 0.04,
    requiredSkill: 'alert',
  },
  REST: {
    name: 'Rest',
    description: 'Take a break and recover energy.',
    params: [],
    energyCost: -0.1,
    requiredSkill: null,
  },
};

/**
 * Create a command object from type and params.
 */
export function command(type, params = {}) {
  const schema = HERDING_ACTIONS[type];
  if (!schema) throw new Error(`Unknown herding action: ${type}`);
  return { type, params, schema };
}

/**
 * Get all action types available to a dog based on their skills.
 */
export function getAvailableActions(dogSkills, trustLevel = 0) {
  return Object.entries(HERDING_ACTIONS)
    .filter(([, schema]) => {
      if (!schema.requiredSkill) return true;
      if (!dogSkills.includes(schema.requiredSkill)) return false;
      if (schema.advanced && trustLevel < 40) return false;
      return true;
    })
    .map(([type]) => type);
}

/**
 * Interpret a natural language command into a herding action.
 * Simple keyword matching — in production, use NLP.
 */
export function interpretCommand(text) {
  const lower = text.toLowerCase();

  if (lower.includes('herd') || lower.includes('move') || lower.includes('pen')) {
    return command('HERD', { strategy: 'basic' });
  }
  if (lower.includes('flank left') || lower.includes('go left') || lower.includes('around left')) {
    return command('FLANK_LEFT', { radius: 12 });
  }
  if (lower.includes('flank right') || lower.includes('go right') || lower.includes('around right') || lower.includes('from the right')) {
    return command('FLANK_RIGHT', { radius: 12 });
  }
  if (lower.includes('hold') || lower.includes('stay') || lower.includes('wait')) {
    return command('HOLD', {});
  }
  if (lower.includes('gather') || lower.includes('bring back') || lower.includes('straggler')) {
    return command('GATHER', {});
  }
  if (lower.includes('drive') || lower.includes('push') || lower.includes('forward')) {
    return command('DRIVE', { intensity: 0.7 });
  }
  if (lower.includes('shed') || lower.includes('separate') || lower.includes('split')) {
    return command('SHED', {});
  }
  if (lower.includes('come') || lower.includes('here') || lower.includes('recall') || lower.includes('back')) {
    return command('RECALL', {});
  }
  if (lower.includes('guard') || lower.includes('watch')) {
    return command('GUARD', {});
  }
  if (lower.includes('rest') || lower.includes('kennel') || lower.includes('take a break')) {
    return command('REST', {});
  }

  return null;
}

export default HERDING_ACTIONS;
