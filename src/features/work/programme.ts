/**
 * Work & Leadership v2 — an executive coaching block on the Personal
 * Performance Model (docs/PERFORMANCE_MODEL.md).
 *
 * Same shape as Training v2: assess (work style, meeting load,
 * bottleneck, pressure) → prescribe a four-week block — each week one
 * theme, ONE leadership practice, and a deep-work hours target the
 * calendar can actually honour — → measure (weekly deep hours) → adapt.
 * A coach would never give a maker and a back-to-back manager the same
 * week; neither does this.
 */

import { latest, trend, type MetricObservation, type Trend } from '@/features/model/metrics';

export interface WorkInputs {
  style: 'maker' | 'manager' | 'mixed' | 'physical';
  meetingLoad?: 'light' | 'half' | 'heavy';
  bottleneck?: string; // 'sales' | 'delivery' | 'focus' | free
  pressure?: 'calm' | 'full' | 'redline';
}

export interface WorkPractice {
  title: string;
  detail: string;
}

export interface WorkWeek {
  week: number;
  theme: string;
  focus: string;
  practice: WorkPractice;
  deepHoursTarget: number;
}

export interface WorkBlock {
  inputs: WorkInputs;
  startedAt: string;
  weeks: WorkWeek[];
}

/** Honest deep-work capacity: style sets the base, meetings tax it. */
export function deepHoursTarget(inputs: WorkInputs): number {
  const base = { maker: 12, mixed: 9, manager: 5, physical: 3 }[inputs.style];
  const meetingTax = { light: 1, half: 0.75, heavy: 0.55 }[inputs.meetingLoad ?? 'half'];
  const pressureTax = inputs.pressure === 'redline' ? 0.75 : 1;
  return Math.max(2, Math.round(base * meetingTax * pressureTax));
}

const BOTTLENECK_FOCUS: Record<string, string> = {
  sales:
    'The lever is sales this block — the deep blocks open with pipeline work before anything else gets them.',
  delivery:
    'Delivery is the bottleneck — fix capacity before chasing volume; growth on a broken engine just breaks it faster.',
  focus:
    '“No time to think” is a calendar problem — this block treats the deep blocks as meetings with your most important stakeholder.',
};

function practiceFor(week: number, inputs: WorkInputs): WorkPractice {
  const managerish = inputs.style === 'manager' || inputs.style === 'mixed';
  switch (week) {
    case 1:
      return {
        title: 'Every meeting ends with an owner and a date',
        detail:
          'One sentence before anyone leaves. Meetings without owners are conversations, and conversations don’t ship.',
      };
    case 2:
      return managerish
        ? {
            title: 'One real one-on-one',
            detail:
              'Not a status update — their agenda, your full attention, one question: “what’s in your way?”',
          }
        : {
            title: 'One meeting-free morning, defended',
            detail:
              'Book it like a client. The making time that isn’t on the calendar goes to whoever asks first.',
          };
    case 3:
      return {
        title: 'Say no once, in writing',
        detail:
          'One request declined or delegated this week, kindly and clearly. Every yes is a no to something you said matters.',
      };
    default:
      return {
        title: 'Write the Friday memo',
        detail:
          'Half a page: what moved, what stalled, the one lever for next block. Thinking in writing is the leadership act.',
      };
  }
}

export function buildExecutiveBlock(inputs: WorkInputs): WorkBlock {
  const target = deepHoursTarget(inputs);
  const focus =
    BOTTLENECK_FOCUS[inputs.bottleneck ?? ''] ??
    'This block protects the work only you can do, and makes the rest visible.';

  const weeks: WorkWeek[] = [
    {
      week: 1,
      theme: 'Audit & protect',
      focus:
        'Where does the week actually go? Deep blocks land on the calendar first — this week is about defending them, not adding more.',
      practice: practiceFor(1, inputs),
      deepHoursTarget: target,
    },
    {
      week: 2,
      theme: 'The one lever',
      focus,
      practice: practiceFor(2, inputs),
      deepHoursTarget: target,
    },
    {
      week: 3,
      theme: 'Subtract',
      focus:
        'Stop-doing week: one recurring task delegated or killed. Capacity is created by subtraction, not effort.',
      practice: practiceFor(3, inputs),
      deepHoursTarget: Math.round(target * 1.1),
    },
    {
      week: 4,
      theme: 'Review & reset',
      focus:
        'Close the loop: what did the numbers say? The next block is built from four weeks of evidence, not intentions.',
      practice: practiceFor(4, inputs),
      deepHoursTarget: target,
    },
  ];

  return { inputs, startedAt: new Date().toISOString(), weeks };
}

/** Current 1-based week of the block, or null when it's finished. */
export function weekOfBlock(block: WorkBlock, now = new Date()): number | null {
  const start = new Date(block.startedAt).getTime();
  const week = Math.floor((now.getTime() - start) / (7 * 86400e3)) + 1;
  return week >= 1 && week <= block.weeks.length ? week : null;
}

// ── Measure & adapt: weekly deep hours vs the honest target ─────────────

export interface WorkAssessment {
  verdict: 'on-track' | 'protect' | 'need-data';
  message: string;
  trend: Trend | null;
}

export function assessWork(inputs: WorkInputs, metrics: MetricObservation[]): WorkAssessment {
  const target = deepHoursTarget(inputs);
  const t = trend(metrics, 'work.deepHours', 28);
  const last = latest(metrics, 'work.deepHours');

  if (!last) {
    return {
      verdict: 'need-data',
      message: `Log your deep hours once a week — the target for your week is ~${target} h. What gets measured gets defended.`,
      trend: t,
    };
  }
  if (last.value >= target || t?.direction === 'up') {
    return {
      verdict: 'on-track',
      message:
        last.value >= target
          ? `${last.value} h of deep work against a ${target} h target — the calendar is telling the truth. Hold the line.`
          : `Deep hours are climbing (${t!.from} → ${t!.to}). Keep protecting the same blocks — consistency beats bursts.`,
      trend: t,
    };
  }
  return {
    verdict: 'protect',
    message: `${last.value} h against a ${target} h target — that gap is a calendar problem, not a discipline problem. Move the deep block to before the first meeting and defend it in writing.`,
    trend: t,
  };
}
