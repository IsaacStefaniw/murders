/**
 * Morning intention proposer — INTENT does the cognitive work.
 *
 * The check-in should be approvals, not authorship: from behaviour
 * intentions, recent triggers and today's plan, propose one specific
 * intention the user can Keep or Change. Deterministic and transparent.
 */

import type {
  BehaviourEvent,
  BehaviourIntention,
  BehaviourKey,
  DailyPlan,
  Goal,
} from '@/types/domain';

export interface ProposedIntention {
  text: string;
  protect?: BehaviourKey;
}

/** The behaviour with the most logged events in the last 7 days wins. */
function busiestIntention(
  intentions: BehaviourIntention[],
  events: BehaviourEvent[],
): BehaviourIntention | undefined {
  const active = intentions.filter((b) => b.active);
  if (active.length === 0) return undefined;
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const counts = new Map(active.map((b) => [b.id, 0]));
  for (const e of events) {
    if (e.occurredAt >= weekAgo && counts.has(e.intentionId)) {
      counts.set(e.intentionId, (counts.get(e.intentionId) ?? 0) + 1);
    }
  }
  return [...active].sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0))[0];
}

/** A concrete anchor from today's plan: the first meaningful flexible item. */
function anchorTitle(plan: DailyPlan): string | undefined {
  const anchor = plan.items.find((i) => !i.fixed && i.status === 'planned');
  return anchor?.title.toLowerCase();
}

export function proposeIntention(input: {
  plan: DailyPlan;
  behaviourIntentions: BehaviourIntention[];
  behaviourEvents: BehaviourEvent[];
  goals: Goal[];
}): ProposedIntention {
  const target = busiestIntention(input.behaviourIntentions, input.behaviourEvents);
  const anchor = anchorTitle(input.plan);

  if (target) {
    const until = anchor ? `until after ${anchor}` : 'until lunch';
    const templates: Partial<Record<BehaviourKey, string>> = {
      doomscrolling: `Phone stays away ${until}.`,
      social_media: `No feeds ${until}.`,
      vaping: `Vape stays out of reach ${until}.`,
      alcohol: 'Nothing to drink tonight — protect tomorrow.',
      junk_food: 'Real food first today.',
      late_nights: 'Screens off before wind-down tonight.',
      shopping: 'Nothing in the basket today.',
    };
    const text = templates[target.behaviour];
    if (text) return { text, protect: target.behaviour };
  }

  // No behaviour signal: protect the day's most consequential block.
  const growthItem = input.plan.items.find((i) => {
    const goal = i.goalId ? input.goals.find((g) => g.id === i.goalId) : undefined;
    return goal?.domain === 'business' || goal?.domain === 'career';
  });
  if (growthItem) return { text: `Guard the ${growthItem.title.toLowerCase()} — nothing creeps into it.` };

  return { text: 'One thing at a time today.' };
}
