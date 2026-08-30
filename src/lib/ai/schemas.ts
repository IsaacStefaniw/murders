/**
 * Zod schemas for every structured AI output.
 *
 * Core app functionality never depends on arbitrary natural-language
 * parsing: agents must return JSON matching these schemas, responses are
 * validated, invalid responses are retried once and then abandoned in
 * favour of a deterministic fallback. AI never mutates the database
 * directly — accepted outputs flow through explicit store actions.
 */

import { z } from 'zod';

export const PlannerAdviceSchema = z.object({
  summary: z.string().max(140),
  priorities: z.array(z.string().max(120)).max(3),
  suggestions: z.array(z.string().max(200)).max(3),
  warnings: z.array(z.string().max(200)).max(2),
  confidence: z.number().min(0).max(1),
});
export type PlannerAdvice = z.infer<typeof PlannerAdviceSchema>;

export const ReflectionSignalsSchema = z.object({
  sentiment: z.enum(['positive', 'neutral', 'mixed', 'negative']),
  themes: z.array(z.string().max(60)).max(4),
  /** Concrete, actionable observation for tomorrow — or null. */
  tomorrowAdjustment: z.string().max(200).nullable(),
  behaviourMentions: z
    .array(
      z.object({
        behaviour: z.string().max(40),
        direction: z.enum(['struggled', 'resisted', 'neutral']),
      }),
    )
    .max(4),
  confidence: z.number().min(0).max(1),
});
export type ReflectionSignals = z.infer<typeof ReflectionSignalsSchema>;

export const WeeklyNarrativeSchema = z.object({
  narrative: z.string().max(900),
  wentWell: z.array(z.string().max(160)).max(4),
  struggled: z.array(z.string().max(160)).max(4),
  proposedChanges: z.array(z.string().max(200)).max(3),
  confidence: z.number().min(0).max(1),
});
export type WeeklyNarrative = z.infer<typeof WeeklyNarrativeSchema>;
