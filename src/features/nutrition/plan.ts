/**
 * Nutrition v2 — the second deep pathway on the Personal Performance
 * Model (docs/PERFORMANCE_MODEL.md).
 *
 * Doctrine: no logging, no counting. The plan is a protein anchor, a
 * plate shape, and a LADDER of levers — one lever live at a time, the
 * next one added only when the evidence says the current set isn't
 * enough. Adaptation reads the body-weight TREND over three weeks and
 * several observations; a single day's weigh-in never changes anything.
 * Educational structure, not dietary or medical advice.
 */

import { trend, type MetricObservation, type Trend } from '@/features/model/metrics';

export type NutritionAim = 'energy' | 'weight' | 'muscle';

export interface NutritionInputs {
  aim: NutritionAim;
  weightKg?: number;
  cooking?: 'quick' | 'normal' | 'enjoy';
  /** Where food usually goes wrong — reorders the lever ladder. */
  trouble?: 'evenings' | 'snacking' | 'drinks' | 'skipping' | 'nowhere';
  /** How many ladder steps are live (0 = just the base). */
  leverLevel?: number;
}

export interface ProteinTarget {
  minG: number;
  maxG: number;
  perMealG: number;
  meals: number;
}

export interface NutritionLever {
  id: string;
  title: string;
  detail: string;
  /** Linked knowledge-base protocol, when one exists. */
  protocolId?: string;
  state: 'live' | 'next' | 'later';
}

export interface NutritionPlan {
  aim: NutritionAim;
  proteinTarget: ProteinTarget | null;
  /** The plate, in one sentence — the whole "diet". */
  plate: string;
  levers: NutritionLever[];
  leverLevel: number;
}

/** g/kg bands per aim. Fat loss keeps protein HIGH — it protects muscle. */
const PROTEIN_PER_KG: Record<NutritionAim, [number, number]> = {
  energy: [1.6, 2.0],
  weight: [1.8, 2.2],
  muscle: [1.8, 2.2],
};

const PLATE: Record<NutritionAim, string> = {
  energy:
    'Half the plate colour, a palm of protein, slower carbs — steadier fuel beats another coffee.',
  weight:
    'Protein and vegetables first, then decide if you still want the rest — order does quiet work.',
  muscle:
    'A palm-and-a-half of protein each meal, carbs around training — the plate feeds the programme.',
};

interface LeverDef {
  id: string;
  title: string;
  detail: string;
  protocolId?: string;
}

const LEVERS: Record<string, LeverDef> = {
  'kitchen-closed': {
    id: 'kitchen-closed',
    title: 'Kitchen closes 3 hours before bed',
    detail: 'The eating window does the work no willpower has to.',
    protocolId: 'kitchen-closed',
  },
  'post-meal-walk': {
    id: 'post-meal-walk',
    title: '10-minute walk after the biggest meal',
    detail: 'Blunts the glucose spike; the cheapest energy lever there is.',
    protocolId: 'post-meal-walk',
  },
  'liquid-calories': {
    id: 'liquid-calories',
    title: 'Drinks carry no calories on weekdays',
    detail: 'Liquid calories never register as food — cutting them is invisible effort.',
  },
  'protein-breakfast': {
    id: 'protein-breakfast',
    title: 'Protein within an hour of waking',
    detail: 'A protein-first morning steadies appetite for the whole day.',
    protocolId: 'protein-breakfast',
  },
  'caffeine-cutoff': {
    id: 'caffeine-cutoff',
    title: 'Last coffee 10 hours before bed',
    detail: 'A quarter of that afternoon coffee is still circulating at bedtime.',
    protocolId: 'caffeine-cutoff',
  },
  'fourth-feed': {
    id: 'fourth-feed',
    title: 'Add a fourth protein feed',
    detail: 'Growing costs food — a shake or Greek yoghurt counts.',
  },
  'plate-half-veg': {
    id: 'plate-half-veg',
    title: 'Half of dinner is vegetables',
    detail: 'Volume without the calories — fullness is a skill you can engineer.',
  },
};

/** Ladder per aim; the trouble answer promotes its counter-lever to the front. */
const LADDER: Record<NutritionAim, string[]> = {
  weight: ['kitchen-closed', 'post-meal-walk', 'liquid-calories', 'plate-half-veg'],
  energy: ['protein-breakfast', 'post-meal-walk', 'caffeine-cutoff'],
  muscle: ['fourth-feed', 'post-meal-walk', 'protein-breakfast'],
};

const TROUBLE_LEVER: Record<NonNullable<NutritionInputs['trouble']>, string | null> = {
  evenings: 'kitchen-closed',
  snacking: 'protein-breakfast',
  drinks: 'liquid-calories',
  skipping: 'protein-breakfast',
  nowhere: null,
};

export function proteinTarget(aim: NutritionAim, weightKg?: number): ProteinTarget | null {
  if (!weightKg || weightKg <= 0) return null;
  const [lo, hi] = PROTEIN_PER_KG[aim];
  const meals = aim === 'muscle' ? 4 : 3;
  const minG = Math.round(weightKg * lo);
  return {
    minG,
    maxG: Math.round(weightKg * hi),
    perMealG: Math.round(minG / meals / 5) * 5,
    meals,
  };
}

export function buildNutritionPlan(inputs: NutritionInputs): NutritionPlan {
  const level = Math.max(0, inputs.leverLevel ?? 0);
  let order = [...LADDER[inputs.aim]];
  const promoted = inputs.trouble ? TROUBLE_LEVER[inputs.trouble] : null;
  if (promoted) order = [promoted, ...order.filter((id) => id !== promoted)];

  const levers: NutritionLever[] = order.map((id, i) => ({
    ...LEVERS[id],
    state: i < level ? 'live' : i === level ? 'next' : 'later',
  }));

  return {
    aim: inputs.aim,
    proteinTarget: proteinTarget(inputs.aim, inputs.weightKg),
    plate: PLATE[inputs.aim],
    levers,
    leverLevel: Math.min(level, order.length),
  };
}

// ── Adaptation: the weight TREND decides, never one day ─────────────────

export type NutritionVerdict = 'on-track' | 'tighten' | 'ease' | 'need-data' | 'steady';

export interface NutritionAssessment {
  verdict: NutritionVerdict;
  message: string;
  /** True when the honest move is switching on the next lever. */
  advanceLever: boolean;
  trend: Trend | null;
  observations: number;
}

const WINDOW_DAYS = 21;
/** Losing faster than ~1% of body weight a week costs muscle and mood. */
const MAX_LOSS_PER_WEEK_PCT = 0.01;

export function assessNutrition(
  inputs: NutritionInputs,
  metrics: MetricObservation[],
): NutritionAssessment {
  const cutoff = new Date(Date.now() - WINDOW_DAYS * 86400e3).toISOString();
  const observations = metrics.filter((o) => o.key === 'body.weight' && o.at >= cutoff).length;
  const t = trend(metrics, 'body.weight', WINDOW_DAYS);

  if (inputs.aim === 'energy') {
    return {
      verdict: 'steady',
      message:
        'For steadier energy the scale isn’t the judge — the protein-first morning and the post-meal walk are. Notice the 3pm dip; it’s the honest metric.',
      advanceLever: false,
      trend: t,
      observations,
    };
  }

  if (observations < 3 || !t) {
    return {
      verdict: 'need-data',
      message:
        'Trends need data before they mean anything — two or three weigh-ins a week, same time of day. One reading is noise; three weeks is a signal.',
      advanceLever: false,
      trend: t,
      observations,
    };
  }

  const weeklyRate = t.delta / (WINDOW_DAYS / 7);
  const weight = inputs.weightKg ?? t.to;

  if (inputs.aim === 'weight') {
    if (t.direction === 'down' && Math.abs(weeklyRate) > weight * MAX_LOSS_PER_WEEK_PCT) {
      return {
        verdict: 'ease',
        message: `Down ${Math.abs(t.delta)} kg in three weeks is faster than sustainable — that pace costs muscle. Eat a little more, keep the protein anchor, keep training.`,
        advanceLever: false,
        trend: t,
        observations,
      };
    }
    if (t.direction === 'down') {
      return {
        verdict: 'on-track',
        message: `Trending down ${Math.abs(t.delta)} kg over three weeks — the honest pace that lasts. Nothing to change.`,
        advanceLever: false,
        trend: t,
        observations,
      };
    }
    return {
      verdict: 'tighten',
      message:
        'Three weeks of readings and the trend hasn’t moved — that’s information, not failure. Time to switch on the next lever.',
      advanceLever: true,
      trend: t,
      observations,
    };
  }

  // muscle
  if (t.direction === 'up' && weeklyRate <= 0.5) {
    return {
      verdict: 'on-track',
      message: `Up ${t.delta} kg over three weeks with the training running — that’s the pace that’s mostly muscle. Keep going.`,
      advanceLever: false,
      trend: t,
      observations,
    };
  }
  if (t.direction === 'up') {
    return {
      verdict: 'ease',
      message:
        'Scale is climbing faster than muscle grows — trim the surplus a little; the lifts, not the scale, are the score.',
      advanceLever: false,
      trend: t,
      observations,
    };
  }
  return {
    verdict: 'tighten',
    message:
      'Three weeks flat-to-down while trying to build — the machine needs more fuel. Switch on the next feed.',
    advanceLever: true,
    trend: t,
    observations,
  };
}
