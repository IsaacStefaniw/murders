import { EVIDENCE_ORDER, protocolById, type EvidenceLevel } from '@/features/knowledge/protocols';
import { addDays } from '@/lib/dates';

export interface Experiment {
  protocolId: string;
  /** Date it started. */
  startedOn: string;
  /** Date to come back and decide. */
  reviewOn: string;
  /** Set when the person answers. Undecided until they do. */
  outcome?: 'keeping' | 'dropping';
}

/** Two weeks is long enough to tell and short enough to agree to. */
export const EXPERIMENT_DAYS = 14;

/**
 * Which practices are worth running as an experiment rather than adopted.
 *
 * The review wanted D and E practices to require an explicit opt-in, a
 * stated reason for testing, and a review date. Two of those three were
 * rejected: a low-grade but harmless practice somebody finds meaningful
 * has real value, expectancy is a genuine mechanism, and asking a person
 * to justify their own choice to software is the harsh framing the
 * research contract was rewritten to remove.
 *
 * The review date survived, because it is the useful half and it is a
 * kindness rather than a hurdle. Thin evidence is exactly the case where
 * "does this actually do anything for me" is the only way to find out,
 * and a practice nobody ever revisits is how a week silently fills up
 * with things that stopped mattering.
 */
export function worthTesting(protocolId: string): boolean {
  const level = protocolById(protocolId)?.evidenceLevel;
  return !!level && EVIDENCE_ORDER.indexOf(level) >= EVIDENCE_ORDER.indexOf('D' as EvidenceLevel);
}

export const startExperiment = (protocolId: string, today: string): Experiment => ({
  protocolId,
  startedOn: today,
  reviewOn: addDays(today, EXPERIMENT_DAYS),
});

/** The ones whose date has come, oldest first. */
export const dueExperiments = (experiments: Experiment[], today: string): Experiment[] =>
  experiments
    .filter((e) => !e.outcome && e.reviewOn <= today)
    .sort((a, b) => a.reviewOn.localeCompare(b.reviewOn));

/**
 * The question at the end, which has to be answerable without a study.
 *
 * Never "did it work" — nobody can tell that from a fortnight of one
 * person. What somebody can answer is whether they noticed anything and
 * whether they want to keep it, and those are the two things that decide
 * whether it stays on the week.
 */
export function experimentQuestion(protocolId: string): string {
  const title = protocolById(protocolId)?.title ?? 'this practice';
  return `Two weeks of ${title}. Did you notice anything worth keeping it for?`;
}
