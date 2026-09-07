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

/**
 * The intake offers a fourth answer — "Not sure — just eat better than I
 * do now" — and the hub used to hand it straight to the ladder lookup,
 * which has no such key. Choosing the most honest option on the intake
 * crashed the coach. Not sure means the gentle default: steadier energy,
 * protein first, the walk, the fibre. Anything unrecognised lands there.
 */
export function normaliseAim(raw: string | undefined): NutritionAim {
  return raw === 'weight' || raw === 'muscle' || raw === 'energy' ? raw : 'energy';
}

/**
 * The fibre number, in grams a day. The best-supported dietary figure in
 * the literature — 185 prospective studies and 58 trials pooled in the
 * Lancet in 2019 put the greatest risk reduction at 25 to 29 g a day,
 * with more still helping — and until now the coach never showed it.
 * "About 30" is the library's own rounding.
 */
export const FIBRE_TARGET_G = 30;

export interface NutritionInputs {
  /** An intake value; `normaliseAim` decides which ladder it means. */
  aim: NutritionAim | 'unsure' | string;
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
  /** Set when the intake answer was "not sure" — the hub says what that means. */
  aimNote?: string;
  proteinTarget: ProteinTarget | null;
  /** Grams of fibre a day, the same for every aim. */
  fibreTargetG: number;
  /** The plate, in one sentence — the whole "diet". */
  plate: string;
  levers: NutritionLever[];
  leverLevel: number;
}

const UNSURE_NOTE =
  'Not sure is a fine answer. It means the gentle default: protein first, a walk after the biggest meal, fibre from real food — and the scale is not the judge.';

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
    // The old line said the window "does the work no willpower has to".
    // A year-long trial found an eating window adds nothing beyond eating
    // less; a closed kitchen is simply the easy way to eat less at night.
    detail:
      'A consistent last bite stops the late grazing. The window itself is not magic — it works because a closed kitchen is the easy way to eat less at night.',
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
    title: 'Water is the default drink',
    detail:
      'Water or something unsweetened as the automatic answer to thirst — sugary drinks never register as food, so a sweet one becomes a choice rather than the thing in your hand.',
    protocolId: 'default-drink-water',
  },
  'fibre-30': {
    id: 'fibre-30',
    title: 'Build the day toward 30 g of fibre',
    detail:
      'Beans, lentils, oats, fruit, nuts, skins. The best-supported dietary number there is — and fullness without counting anything.',
    protocolId: 'fibre-30',
  },
  'drink-free-days': {
    id: 'drink-free-days',
    title: 'Name three drink-free days',
    detail:
      'The Australian guideline is no more than ten standard drinks a week and four on any day, and less is lower risk. Naming the dry days before the week starts is how people stay under it.',
    protocolId: 'drink-free-days',
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
    detail:
      'Growing costs food — Greek yoghurt, eggs, or a scoop of protein powder, which counts as food here rather than a supplement.',
    protocolId: 'protein-powder-is-food',
  },
  'plate-half-veg': {
    id: 'plate-half-veg',
    title: 'Half of dinner is vegetables',
    detail: 'Volume without the calories — fullness is a skill you can engineer.',
  },
};

/**
 * Ladder per aim; the trouble answer promotes its counter-lever to the
 * front. Fibre is on every ladder because it is the one number with
 * mortality evidence behind it and it costs nothing to count toward; the
 * weight ladder carries the drink-free days because alcohol is the
 * calorie source people least often name.
 */
const LADDER: Record<NutritionAim, string[]> = {
  weight: ['kitchen-closed', 'post-meal-walk', 'liquid-calories', 'fibre-30', 'drink-free-days', 'plate-half-veg'],
  energy: ['protein-breakfast', 'post-meal-walk', 'fibre-30', 'caffeine-cutoff'],
  muscle: ['fourth-feed', 'post-meal-walk', 'protein-breakfast', 'fibre-30'],
};

const TROUBLE_LEVER: Record<NonNullable<NutritionInputs['trouble']>, string | null> = {
  evenings: 'kitchen-closed',
  snacking: 'protein-breakfast',
  drinks: 'liquid-calories',
  skipping: 'protein-breakfast',
  nowhere: null,
};

/**
 * A second lever the trouble answer pulls forward, behind the first.
 * "Drinks carry it" is sugar for some people and alcohol for others, and
 * the answer does not say which — so both levers come to the front, water
 * first because it applies to everyone.
 */
const TROUBLE_FOLLOW: Partial<Record<NonNullable<NutritionInputs['trouble']>, string>> = {
  drinks: 'drink-free-days',
};

export function proteinTarget(aim: NutritionAim | string, weightKg?: number): ProteinTarget | null {
  if (!weightKg || weightKg <= 0) return null;
  const [lo, hi] = PROTEIN_PER_KG[normaliseAim(aim)];
  const meals = normaliseAim(aim) === 'muscle' ? 4 : 3;
  const minG = Math.round(weightKg * lo);
  return {
    minG,
    maxG: Math.round(weightKg * hi),
    perMealG: Math.round(minG / meals / 5) * 5,
    meals,
  };
}

export function buildNutritionPlan(inputs: NutritionInputs): NutritionPlan {
  const aim = normaliseAim(inputs.aim);
  const level = Math.max(0, inputs.leverLevel ?? 0);
  let order = [...LADDER[aim]];
  const promoted = inputs.trouble ? TROUBLE_LEVER[inputs.trouble] : null;
  const follow = inputs.trouble ? TROUBLE_FOLLOW[inputs.trouble] : undefined;
  if (promoted) {
    const front = follow ? [promoted, follow] : [promoted];
    order = [...front, ...order.filter((id) => !front.includes(id))];
  }

  const levers: NutritionLever[] = order.map((id, i) => ({
    ...LEVERS[id],
    state: i < level ? 'live' : i === level ? 'next' : 'later',
  }));

  return {
    aim,
    aimNote: aim !== inputs.aim ? UNSURE_NOTE : undefined,
    proteinTarget: proteinTarget(aim, inputs.weightKg),
    fibreTargetG: FIBRE_TARGET_G,
    plate: PLATE[aim],
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
  const aim = normaliseAim(inputs.aim);
  const cutoff = new Date(Date.now() - WINDOW_DAYS * 86400e3).toISOString();
  const observations = metrics.filter((o) => o.key === 'body.weight' && o.at >= cutoff).length;
  const t = trend(metrics, 'body.weight', WINDOW_DAYS);

  if (aim === 'energy') {
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

  if (aim === 'weight') {
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
