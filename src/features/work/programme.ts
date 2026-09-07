/**
 * Work & leadership — the four-week focus block on the Personal
 * Performance Model (docs/PERFORMANCE_MODEL.md).
 *
 * Same shape as Training v2: assess (work style, meeting load,
 * bottleneck, pressure) → a four-week block — each week one theme, ONE
 * practice, and a focus-hours target the calendar can actually honour →
 * measure (weekly focus hours) → adapt. A coach would never give a maker
 * and a back-to-back manager the same week; neither does this. Nor a
 * nurse whose week does not repeat.
 *
 * On screen this is "your focus block". The function names below kept
 * their original words because the store imports them.
 */

import { latest, trend, type MetricObservation, type Trend } from '@/features/model/metrics';

export type WorkStyle = 'maker' | 'manager' | 'mixed' | 'physical' | 'varies';

export interface WorkInputs {
  style: WorkStyle;
  /** 'none' is the shift worker's and the tradesperson's honest answer. */
  meetingLoad?: 'none' | 'light' | 'half' | 'heavy';
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

/**
 * Hours of protected thinking a week that a style can honestly hold.
 *
 * `varies` is the shift worker and the carer: no repeating week, no
 * meetings to speak of, and before this entry existed the arithmetic had
 * nothing for it and produced NaN — the hub read "the target for your
 * week is ~NaN h". Four hours is a modest, believable number for a week
 * that does not repeat; anything unrecognised is treated as mixed.
 */
const BASE_HOURS: Record<WorkStyle, number> = {
  maker: 12,
  mixed: 9,
  manager: 5,
  physical: 3,
  varies: 4,
};

export function styleOf(inputs: WorkInputs): WorkStyle {
  return inputs.style in BASE_HOURS ? inputs.style : 'mixed';
}

/** Honest focus capacity: style sets the base, meetings tax it. */
export function deepHoursTarget(inputs: WorkInputs): number {
  const base = BASE_HOURS[styleOf(inputs)];
  const meetingTax = { none: 1, light: 1, half: 0.75, heavy: 0.55 }[inputs.meetingLoad ?? 'half'] ?? 0.75;
  const pressureTax = inputs.pressure === 'redline' ? 0.75 : 1;
  return Math.max(2, Math.round(base * meetingTax * pressureTax));
}

const BOTTLENECK_FOCUS: Record<string, string> = {
  sales:
    'The lever is sales this block — the focus blocks open with pipeline work before anything else gets them.',
  delivery:
    'Delivery is the bottleneck — fix capacity before chasing volume; growth on a broken engine just breaks it faster.',
  focus:
    '“No time to think” is a calendar problem — this block treats the focus blocks as meetings with your most important stakeholder.',
  admin:
    'Admin and messages are eating the real work — this block puts them in batches so the focus block stops leaking.',
  people:
    'Too much sits with you — this block hands one recurring thing over for good, with an owner and a date.',
  direction:
    'Busy, but not sure it is the right busy — this block names the one outcome the quarter is for and builds the week backwards from it.',
  visibility:
    'Good work nobody senior sees — this block ends each week with a short written note to the people your work affects.',
};

/**
 * Which set of weekly practices a style needs.
 *
 * A manager's week is other people's; a maker's is a calendar to defend;
 * someone on their feet or on a roster has neither problem and needs the
 * close and the next shift's first move instead of a meeting rule.
 */
export type WorkVariant = 'manager' | 'maker' | 'hands';

export function variantOf(inputs: WorkInputs): WorkVariant {
  const style = styleOf(inputs);
  if (style === 'manager' || style === 'mixed') return 'manager';
  if (style === 'maker') return 'maker';
  return 'hands';
}

const PRACTICES: Record<WorkVariant, WorkPractice[]> = {
  manager: [
    {
      title: 'Every meeting ends with an owner and a date',
      detail:
        'One sentence before anyone leaves. Meetings without owners are conversations, and conversations don’t ship.',
    },
    {
      title: 'One real one-on-one',
      detail:
        'Not a status update — their agenda, your full attention, one question: “what’s in your way?”',
    },
    {
      title: 'Hand one recurring thing over for good',
      detail:
        'Delegated with an owner and a date, or killed. People add before they subtract, so subtraction needs a slot.',
    },
    {
      title: 'Write the Friday note to the team',
      detail:
        'Half a page: what moved, what stalled, the one lever for next block. Thinking in writing is the leadership act.',
    },
  ],
  maker: [
    {
      title: 'Book the focus block like a client',
      detail:
        'On the calendar, before the first call, with a name. The making time that isn’t booked goes to whoever asks first.',
    },
    {
      title: 'One meeting-free morning, defended',
      detail:
        'Move what can move to after lunch. A meeting in the middle of a morning leaves two halves too short for anything hard.',
    },
    {
      title: 'Say no once, in writing',
      detail:
        'One request declined or deferred this week, kindly and clearly. Every yes is a no to something you said matters.',
    },
    {
      title: 'Write the Friday memo',
      detail:
        'Half a page: what moved, what stalled, the one lever for next block. Thinking in writing works for a team of one.',
    },
  ],
  hands: [
    {
      title: 'End every shift knowing the next one’s first move',
      detail:
        'Ten minutes before you leave: loose ends written down, the first thing next time named. Unfinished work stops nagging once it has a plan.',
    },
    {
      title: 'One hour of paperwork, booked',
      detail:
        'Quotes, invoices, the roster, the forms — one booked hour instead of the edges of every evening.',
    },
    {
      title: 'Say no once, out loud',
      detail:
        'One extra shift or one job declined this week. A week that does not repeat still has a limit.',
    },
    {
      title: 'The week in five lines',
      detail:
        'What got done, what did not, what next week needs. Five lines on a Sunday beats a plan nobody reads.',
    },
  ],
};

function practiceFor(week: number, inputs: WorkInputs): WorkPractice {
  const list = PRACTICES[variantOf(inputs)];
  return list[Math.min(Math.max(week, 1), list.length) - 1];
}

function weeksFor(inputs: WorkInputs): WorkWeek[] {
  const target = deepHoursTarget(inputs);
  const variant = variantOf(inputs);
  const focus =
    BOTTLENECK_FOCUS[inputs.bottleneck?.split(',')[0] ?? ''] ??
    (variant === 'hands'
      ? 'This block protects the small amount of thinking time a week on your feet has, and closes each shift properly.'
      : 'This block protects the work only you can do, and makes the rest visible.');

  return [
    {
      week: 1,
      theme: 'Audit & protect',
      focus:
        variant === 'hands'
          ? 'Where does the week actually go? This week is about the close at the end of each shift, not adding anything.'
          : 'Where does the week actually go? Focus blocks land on the calendar first — this week is about defending them, not adding more.',
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
}

export function buildExecutiveBlock(inputs: WorkInputs): WorkBlock {
  return { inputs, startedAt: new Date().toISOString(), weeks: weeksFor(inputs) };
}

/**
 * The same block, re-aimed at what is true now.
 *
 * A meeting-load or pressure answer that arrives after the block was
 * built used to leave the stored weekly targets stale, and rebuilding
 * would have thrown the person back to week one. This keeps the start
 * date and the week, and recomputes the targets and practices from the
 * live inputs. Returns the same object when nothing changed.
 */
export function retargetBlock(block: WorkBlock, inputs: WorkInputs): WorkBlock {
  const same =
    styleOf(block.inputs) === styleOf(inputs) &&
    (block.inputs.meetingLoad ?? 'half') === (inputs.meetingLoad ?? 'half') &&
    (block.inputs.bottleneck ?? '') === (inputs.bottleneck ?? '') &&
    (block.inputs.pressure ?? 'full') === (inputs.pressure ?? 'full');
  if (same) return block;
  return { inputs, startedAt: block.startedAt, weeks: weeksFor(inputs) };
}

/** Current 1-based week of the block, or null when it's finished. */
export function weekOfBlock(block: WorkBlock, now = new Date()): number | null {
  const start = new Date(block.startedAt).getTime();
  const week = Math.floor((now.getTime() - start) / (7 * 86400e3)) + 1;
  return week >= 1 && week <= block.weeks.length ? week : null;
}

// ── Measure & adapt: weekly focus hours vs the honest target ────────────

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
      message: `Log your focus hours once a week — the target for your week is ~${target} h. What gets measured gets defended.`,
      trend: t,
    };
  }
  if (last.value >= target || t?.direction === 'up') {
    return {
      verdict: 'on-track',
      message:
        last.value >= target
          ? `${last.value} h of focused work against a ${target} h target — the calendar is telling the truth. Hold the line.`
          : `Focus hours are climbing (${t!.from} → ${t!.to}). Keep protecting the same blocks — consistency beats bursts.`,
      trend: t,
    };
  }
  return {
    verdict: 'protect',
    message: `${last.value} h against a ${target} h target — that gap is a calendar problem, not a discipline problem. Move the focus block to before the first meeting and defend it in writing.`,
    trend: t,
  };
}
