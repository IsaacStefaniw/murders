/**
 * Nutrition round — candidate protocols. NOT wired into the app.
 *
 * Written 2026-09-08 under the restructured pipeline. Gate 1 mined
 * nutrition and training together from the shared corpus index; Gate 2
 * opened every paper at registry level and, for the load-bearing ones,
 * read the full text rather than the abstract. Ledgers in ledgers/, a row
 * per card in sources.md, the rest in findings.md, episodes.md, ladder.md.
 *
 * SEVEN cards. The brief notes this pillar already has the most A grades
 * in the library, which it says is right because some nutrition findings
 * are genuinely well replicated. Four of those five A grades were tested
 * this round and held. One regrade goes down. Nothing goes up.
 *
 * THE ROUND'S CENTRAL FINDING IS A NUMBER THAT SHOULD NOT BE WRITTEN.
 * Four of the roster's Tier 1 voices state 1.6 g/kg of protein as
 * settled. Every route leads to one paper. Reading that paper's full text
 * rather than its abstract: the break point is 1.62 at p = 0.079, not
 * significant; its confidence interval spans roughly four-fifths of the
 * analysed range; it rests on 42 study arms and 723 people rather than
 * the headline figures; and the paper's own discussion argues for a
 * considerably higher intake than the number everyone quotes from its
 * closing sentence. Later and larger work finds the curve bending rather
 * than stopping. So the direction survives and the number does not, and
 * no card here contains it. See findings.md.
 *
 * A SECOND CLAIM WAS WITHDRAWN AT THIS GATE. Discovery reported that
 * inconsistent time-restricted eating leaves people hungrier than not
 * doing it at all. That traces to a conference-proceedings abstract
 * authored by the company's own chief executive, with no control group
 * and no peer-reviewed publication anywhere. It is not citeable and no
 * card rests on it.
 *
 * Grade spread: A 0 · B 1 · C 6 · D 0 · E 0 (7 candidates).
 * Every supplement claim was routed to the carve-out, not written here.
 *
 * Nothing here reaches a phone until a human has read it.
 */

import type { Protocol } from '@/features/knowledge/protocols';

export const NUTRITION_CANDIDATES: Protocol[] = [
  {
    id: 'less-processed-same-food',
    evidenceLevel: 'B',
    title: 'The same food, less processed',
    pillar: 'nutrition',
    area: 'health',
    goalDomains: ['health', 'fitness'],
    summary:
      'One swap at a time, toward the version of a food you already eat that has had less done to it. Not a different diet. The same shopping list, a step back along it.',
    why: 'This is one of the few nutrition questions with a proper controlled feeding trial behind it. When people were given diets matched for calories, sugar, fat, fibre and salt, and allowed to eat as much as they wanted, they ate around five hundred more calories a day on the heavily processed one and gained weight over a fortnight. They were not choosing worse, and the food was not less filling on paper. Something about the form of it changed how much went in. Large population studies point the same way. The practical version is not a new diet, it is the same thing you were going to buy, one step less processed.',
    attribution: [],
    days: [6],
    durationMin: 10,
    anchor: { kind: 'fixed', start: '10:00', windowMin: 360 },
    energy: 'any',
    tier: 'should',
    safety: 'Less-processed food often costs more and takes longer, and if that is the binding constraint then this card is not the one for you and there is nothing wrong with that. Eating enough matters more than eating ideally. If food is genuinely hard to afford, that is worth raising with a GP or a financial counsellor rather than absorbing.',
  },
  {
    id: 'eat-in-the-daylight',
    evidenceLevel: 'C',
    title: 'Eat in the daylight, not at three in the morning',
    pillar: 'nutrition',
    area: 'health',
    goalDomains: ['health', 'behaviour'],
    summary:
      'On night shift: eat your real meal before the shift or after it, in daylight, and keep what you have during the night small.',
    why: 'The body handles food differently at night, and not by a little. Studies that fed people identical meals at different clock times found the overnight ones produced substantially worse glucose responses, because the machinery for dealing with food is on a schedule of its own and does not care that you are awake. The practical version for a night worker is not fasting, which is neither realistic nor kind on a twelve-hour shift. It is to move the substantial eating into daylight at either end and keep the middle of the night light. Small studies, mostly laboratory, so it is worth trying rather than settled.',
    attribution: [],
    days: [0, 1, 2, 3, 4, 5, 6],
    durationMin: 10,
    anchor: { kind: 'fixed', start: '16:00', windowMin: 420, timeAnchored: true },
    energy: 'any',
    tier: 'could',
    neverNag: true,
    safety: 'Do not skip eating to follow this. A hungry shift worker makes worse decisions and, in safety-critical work, that matters more than any glucose curve. This is about moving food, never removing it. If you have diabetes or take medication that affects blood sugar, changing when you eat can change what your medication does, so talk to your doctor or a diabetes educator before you shift anything. Educational structure, not medical advice.',
  },
  {
    id: 'what-you-eat-changes-the-night',
    evidenceLevel: 'C',
    title: 'What you eat by day shows up at night',
    pillar: 'nutrition',
    area: 'health',
    goalDomains: ['health'],
    summary:
      'If sleep has been poor, look at the fibre and the very sweet things in the day before you look at anything else in the evening.',
    why: 'The relationship between food and sleep runs both directions, and the daytime half is the less obvious one. In controlled feeding work, days higher in fibre were followed by more deep sleep, while days higher in sugar and saturated fat were followed by lighter, more broken nights. That is a small literature and it does not make dinner a sleep intervention. It does mean that when someone has tried every evening ritual and is still waking at three, the day before is a reasonable place to look next, and it is a cheaper thing to change than the bedroom.',
    attribution: [],
    days: [0],
    durationMin: 10,
    anchor: { kind: 'fixed', start: '11:00', windowMin: 360 },
    energy: 'any',
    tier: 'could',
    safety: 'Ordinary food and no amounts. This is not a plan for insomnia; weeks of bad sleep is a conversation for a doctor. If counting or restricting what you eat has been difficult for you in the past, skip this card rather than working around it.',
  },
  {
    id: 'plan-food-after-a-short-night',
    evidenceLevel: 'C',
    title: 'Decide the food before the tiredness decides it',
    pillar: 'nutrition',
    area: 'health',
    goalDomains: ['health', 'behaviour'],
    summary:
      'The morning after a short night: spend two minutes deciding what lunch is. Not because you lack discipline. Because a tired brain wants different things.',
    why: 'Short sleep reliably changes appetite, and it changes it in a specific direction: more hunger, more interest in energy-dense food, more eaten across the day. This is measured in controlled sleep-restriction studies rather than inferred from how people feel, so it is not a willpower story and there is no point treating it as one. What follows is small and practical. On the morning after a bad night, the decision made while tired is a worse decision than the same one made in advance, so make it in advance. Deciding is the whole card; nothing here is about eating less.',
    attribution: [],
    days: [0, 1, 2, 3, 4, 5, 6],
    durationMin: 5,
    anchor: { kind: 'wake', offsetMin: 60, windowMin: 240 },
    energy: 'morning',
    tier: 'could',
    neverNag: true,
    safety: 'Being hungrier after bad sleep is physiology, not a failure of yours, and this card is not a licence to eat less when you are tired. If restricting food has been a difficulty for you, this is one to skip.',
  },
  {
    id: 'protein-before-bed-on-lifting-days',
    evidenceLevel: 'C',
    title: 'A protein-containing snack before bed on lifting days',
    pillar: 'nutrition',
    area: 'health',
    goalDomains: ['fitness', 'health'],
    summary:
      'On days you lifted, have something with protein in it in the last hour before bed. Dairy, eggs, whatever you actually like.',
    why: 'Muscle keeps rebuilding overnight and the raw material has to be there. Trials that gave people protein before sleep found more overnight muscle protein synthesis and, over training programmes, somewhat better gains, with no evidence that eating before bed harms sleep or does anything unwanted to body composition. Two honest caveats. The studies mostly used amounts at the top of what a normal snack contains, and this is a small addition to a training effect rather than a substitute for one. Take it as a pleasant reason to have supper on the days you trained.',
    attribution: [],
    days: [1, 4],
    durationMin: 5,
    anchor: { kind: 'sleep', offsetMin: 60, windowMin: 60 },
    energy: 'evening',
    tier: 'could',
    safety: 'Ordinary food, and the card names no amount deliberately, because the number most often quoted for daily protein comes from a paper whose own analysis does not support it. If you have kidney disease or have been told to limit protein, this and every protein card is a question for your doctor or a dietitian first. Educational structure, not medical advice.',
  },
  {
    id: 'the-cholesterol-plate',
    evidenceLevel: 'C',
    title: 'Four things on the plate, not one',
    pillar: 'nutrition',
    area: 'health',
    goalDomains: ['health'],
    summary:
      'If cholesterol is the thing you are working on: oats and barley, legumes, nuts, and plant sterols, together rather than one at a time.',
    why: 'Individually each of these does very little, which is why single-food advice disappoints. Combined in one eating pattern and tested in randomised trials, the effect on cholesterol is considerably larger than the sum of the parts suggests, and it is one of the better-evidenced eating patterns for a specific measurable outcome. Nobody talks about it, probably because it is four unglamorous things rather than one sellable one. This is food, not treatment, and it replaces nothing your doctor has given you.',
    attribution: [],
    days: [6],
    durationMin: 15,
    anchor: { kind: 'fixed', start: '10:00', windowMin: 360 },
    energy: 'any',
    tier: 'could',
    safety: 'Cholesterol is a medical matter and this card is food. Never stop or change a medicine on the strength of an eating change, and take any decision about lipid-lowering treatment to your doctor. If you have familial hypercholesterolaemia or existing heart disease, what you eat is one part of a plan your doctor owns. Educational structure, not medical advice.',
  },
  {
    id: 'the-version-that-takes-chewing',
    evidenceLevel: 'C',
    title: 'Pick the version that takes chewing',
    pillar: 'nutrition',
    area: 'health',
    goalDomains: ['health', 'behaviour'],
    summary:
      'Whole fruit rather than juice, the meal rather than the shake, the thing that needs a knife. Same food, more work to eat.',
    why: 'How full a food leaves you depends on more than what is in it. Foods that take longer to eat, that need chewing and cannot be poured, produce more fullness for the same energy, and the effect shows up in controlled meal studies rather than only in how people describe it. This is a more useful lever than most of what gets sold as filling, because it does not require buying anything or removing anything. It is the same food in a form that takes longer. It is also small, so it belongs alongside the other cards rather than as a plan of its own.',
    attribution: [],
    days: [0, 1, 2, 3, 4, 5, 6],
    durationMin: 5,
    anchor: { kind: 'fixed', start: '12:00', windowMin: 300 },
    energy: 'any',
    tier: 'could',
    safety: 'Not for anyone with a chewing, swallowing or dental difficulty, or anyone who has been advised toward softer or liquid food. In those situations easier-to-eat food is the correct food. If eating has been a source of difficulty for you, skip this one.',
  },
];
