/**
 * AI agents — logical capabilities over one provider.
 *
 * Each agent: minimised input → structured schema → deterministic fallback.
 * Inputs are built from structured data (titles, areas, counts, times) with
 * a data-minimisation step; raw journal text goes only to the reflection
 * analyst, which exists to analyse it. Nothing here writes to storage —
 * results flow back through explicit user-approved actions.
 */

import { getAiProvider } from './provider';
import { runStructured } from './run';
import {
  PlannerAdviceSchema,
  ReflectionSignalsSchema,
  WeeklyNarrativeSchema,
  type PlannerAdvice,
  type ReflectionSignals,
  type WeeklyNarrative,
} from './schemas';
import type { DailyPlan, Reflection, WeeklyReview } from '@/types/domain';

const TONE =
  'You are INTENT, a calm personal operating system. Be specific, concise and practical. ' +
  'Never use motivational clichés. Never moralise about behaviour. Never give medical advice.';

/** Minimised plan representation — titles, tiers and times only. */
function minifyPlan(plan: DailyPlan): string {
  return plan.items
    .map((i) => `${i.start}-${i.end} [${i.tier}] ${i.title} (${i.area}, ${i.status})`)
    .join('\n');
}

export async function plannerAdvice(plan: DailyPlan): Promise<PlannerAdvice> {
  return (
    await runStructured({
      provider: getAiProvider(),
      system: `${TONE} Review today's plan. Identify at most 3 real priorities, at most 3 useful suggestions and at most 2 warnings (overload, missing recovery, neglected areas). Schema: {"summary": string, "priorities": string[], "suggestions": string[], "warnings": string[], "confidence": number}`,
      input: `Today's plan:\n${minifyPlan(plan)}`,
      schema: PlannerAdviceSchema,
      fallback: (): PlannerAdvice => ({
        summary: plan.summary ?? 'Your day is planned.',
        priorities: plan.items
          .filter((i) => i.tier === 'must' && !i.fixed)
          .slice(0, 3)
          .map((i) => i.title),
        suggestions: [],
        warnings: [],
        confidence: 1,
      }),
    })
  ).result;
}

export async function analyseReflection(reflection: Reflection): Promise<ReflectionSignals> {
  const text = [
    reflection.wentWell && `Went well: ${reflection.wentWell}`,
    reflection.gotInTheWay && `Got in the way: ${reflection.gotInTheWay}`,
    reflection.adjustTomorrow && `Wants to adjust: ${reflection.adjustTomorrow}`,
  ]
    .filter(Boolean)
    .join('\n');

  return (
    await runStructured({
      provider: getAiProvider(),
      system: `${TONE} Extract structured signals from an evening reflection. Schema: {"sentiment": "positive"|"neutral"|"mixed"|"negative", "themes": string[], "tomorrowAdjustment": string|null, "behaviourMentions": [{"behaviour": string, "direction": "struggled"|"resisted"|"neutral"}], "confidence": number}`,
      input: `Mood (1-5): ${reflection.mood ?? 'not given'}\n${text || 'No text provided.'}`,
      schema: ReflectionSignalsSchema,
      fallback: (): ReflectionSignals => ({
        sentiment:
          reflection.mood == null
            ? 'neutral'
            : reflection.mood >= 4
              ? 'positive'
              : reflection.mood <= 2
                ? 'negative'
                : 'neutral',
        themes: [],
        tomorrowAdjustment: reflection.adjustTomorrow ?? null,
        behaviourMentions: [],
        confidence: 0.5,
      }),
    })
  ).result;
}

export async function weeklyNarrative(
  stats: WeeklyReview['stats'],
  highlights: string[],
): Promise<WeeklyNarrative> {
  return (
    await runStructured({
      provider: getAiProvider(),
      system: `${TONE} Write a short, useful weekly review. No scores, no grades. Identify what repeatedly worked, what repeatedly failed, and propose at most 3 specific changes to next week. Schema: {"narrative": string, "wentWell": string[], "struggled": string[], "proposedChanges": string[], "confidence": number}`,
      input: `Completion rate: ${Math.round(stats.completionRate * 100)}%\nBy area: ${JSON.stringify(stats.completionByArea)}\nBehaviour events: ${JSON.stringify(stats.behaviourEventCounts)}\nCheck-ins completed: ${stats.checkInsCompleted}\nNotable: ${highlights.join('; ') || 'none'}`,
      schema: WeeklyNarrativeSchema,
      maxTokens: 1200,
      fallback: (): WeeklyNarrative => ({
        narrative:
          stats.completionRate >= 0.7
            ? `A consistent week — ${Math.round(stats.completionRate * 100)}% of planned activities happened. Keep the same structure next week.`
            : `A scattered week — ${Math.round(stats.completionRate * 100)}% of planned activities happened. Consider planning fewer things and protecting the ones that matter.`,
        wentWell: highlights.slice(0, 3),
        struggled: [],
        proposedChanges:
          stats.completionRate < 0.5 ? ['Plan fewer activities next week and protect the top three.'] : [],
        confidence: 1,
      }),
    })
  ).result;
}
