/**
 * What to actually do, written for somebody who has never done it.
 *
 * The library tells you what a practice is and what the evidence behind it
 * says, and then leaves you at the hardest moment: the first attempt.
 * "Thirty grams of fibre" is a target with no method — nobody knows what
 * thirty grams looks like on a plate. "Finish lifting with slow, loaded
 * work at the very end of your range" is a sentence that means something
 * to a coach and nothing to a person holding a dumbbell.
 *
 * So each entry here is the missing half: numbered steps somebody can
 * follow on the first day, and where it helps, a worked example with real
 * amounts. Assume no prior exposure. Assume they are reading it in the
 * kitchen or at the rack, not on the sofa.
 *
 * THREE RULES.
 *
 * No new claims. The steps operationalise what the protocol's `why`
 * already establishes; they never add a benefit, a mechanism, or a number
 * the evidence does not carry. Where an amount appears it is either
 * arithmetic (a tin of beans really does contain about that much fibre) or
 * it is the figure the protocol already states.
 *
 * No medical instruction. These are how to perform a practice, not how to
 * treat anything, and the protocol's own safety line still governs.
 *
 * Plain words. Not "hip hinge at end range" — "stand with your feet under
 * your hips and let the weight travel down the front of your shins".
 */

export interface HowTo {
  /** Followable on the first attempt, in order. */
  steps: string[];
  /** A worked example, where a target needs one to mean anything. */
  example?: string;
}

export const HOW_TO: Record<string, HowTo> = {
  /* ── The two Isaac named ───────────────────────────────────────────── */

  'fibre-30': {
    steps: [
      'Anchor breakfast. Rolled oats, wholegrain toast, or beans on toast — that is 5–8 g before the day starts.',
      'Put a tin of something in one meal. A drained tin of chickpeas, lentils, kidney or baked beans is roughly 10–13 g on its own, and it goes into a curry, a salad, a bolognese or a soup without changing the recipe.',
      'Leave skins on. Potato, apple, pear, cucumber. Peeling costs you a couple of grams each time and buys nothing.',
      'Swap one white for one brown. Bread, rice or pasta — one of them, not all three.',
      'Make the snack count. A handful of almonds is about 3 g, two kiwifruit about 5 g, a pear about 5 g.',
      'Add water as you add fibre, and build over two to three weeks rather than in a day.',
    ],
    example:
      'A day that gets there: porridge with a sliced pear (8 g) · a sandwich on wholegrain with salad (6 g) · a handful of almonds (3 g) · a chickpea curry with brown rice (12 g). That is about 29 g without a single thing bought specially.',
  },

  'end-range-strength': {
    steps: [
      'Pick two positions where you want range: most people want the bottom of a squat, and overhead.',
      'Choose a version you can hold in control for thirty seconds. A goblet squat with one dumbbell held at your chest. A light dumbbell held straight overhead while you stand tall.',
      'Go to the deepest position you can reach WITHOUT the shape breaking down — heels flat, back not rounding, ribs not flaring.',
      'Hold there for twenty to thirty seconds, breathing normally. Not bouncing, not straining. It should feel like hard work in the muscle, not a sharp pull.',
      'Come out, rest a minute, repeat twice more. That is one position done.',
      'Do the same for the second position. Three holds each, twice a week, at the end of a session when you are already warm.',
      'Add range before you add weight. When thirty seconds at your deepest point feels easy, go deeper before you pick up anything heavier.',
    ],
    example:
      'A first fortnight: goblet squat at the bottom, 3 × 20 seconds with a 10 kg dumbbell, and a standing overhead hold, 3 × 20 seconds with 5 kg. Roughly eight minutes, after lifting, Monday and Friday.',
  },

  /* ── First rungs: what everybody meets first ───────────────────────── */

  'strength-minimum-weekly': {
    steps: [
      'Pick two days that are genuinely likely, not two days that would be ideal.',
      'Each session, do one push, one pull, and one leg movement. That is the whole template.',
      'Push: press-ups against a wall, a bench or the floor, or a dumbbell press. Pull: a row with a dumbbell, a resistance band, or your body under a table. Legs: a squat to a chair, or a split squat holding something.',
      'Two to three sets of each, stopping a couple of reps before you could not do another.',
      'Thirty minutes covers it. If you only have fifteen, do one set of each and count the session.',
    ],
    example:
      'A complete session: 3 × 10 press-ups · 3 × 10 dumbbell rows each side · 3 × 10 sit-to-stand from a chair. Twenty-five minutes including rest.',
  },

  'steady-on-your-feet': {
    steps: [
      'Balance first, while you are fresh. Stand on one leg near a bench or worktop you can touch if you need to.',
      'Build it up: both hands on the surface, then one finger, then nothing, then eyes closed. Thirty seconds each leg, whichever stage you are at.',
      'Then walk heel-to-toe in a straight line, ten steps, as though along a rope.',
      'Then the strength half: sit-to-stand from a chair without using your hands, 2–3 sets of 8–10. Heel raises holding the worktop, 2 sets of 12.',
      'Two or three times a week. The trials ran at least three months, so it is the keeping-on that does it rather than any single session.',
      'Adding more exercises did not make it work better in the research, so resist the urge to build a programme.',
    ],
  },

  'exercise-snacks': {
    steps: [
      'Pick a minute you already stop: the kettle boiling, the end of a call, before you get in the shower.',
      'Do one hard minute. Stairs two at a time, sit-to-stands from a chair as fast as is safe, or march on the spot lifting your knees high.',
      'Hard means you would struggle to hold a conversation by the end of it. If you could chat comfortably, go faster.',
      'Three to five of these across the day, not together.',
      'No kit, no change of clothes, and no decision to become someone who trains.',
    ],
  },

  'one-small-act': {
    steps: [
      'The night before, write down one small thing that matters to you. Small: make a coffee properly, step outside, send one message, put one thing away.',
      'Write when and where, not just what. "After I wake, in the kitchen" beats "sometime tomorrow".',
      'Do it whether or not you feel like it. The feeling is not the entry fee — acting first is the whole mechanism.',
      'If you could not face it, make the next one smaller rather than talking yourself into the same one.',
    ],
  },

  'one-behaviour-one-cue': {
    steps: [
      'Choose one behaviour. One. A second one halves the chance of the first.',
      'Choose a cue you genuinely meet every day at the same point: the kettle going on, sitting down at your desk, the front door closing behind you.',
      'Write the sentence: "After [cue], I will [behaviour]." Keep the behaviour small enough that a bad day cannot stop it.',
      'Do it at that cue and nowhere else for the first fortnight. The cue is what is being trained, not the willpower.',
      'Expect two to four months before it feels automatic. Missing one day does not set you back — that is measured, not encouragement.',
    ],
  },

  'less-processed-same-food': {
    steps: [
      'Do not change what you eat. Change which version of it you buy.',
      'Pick ONE item from your normal shop this week. Bread, yoghurt, cereal, or the sauce you use most.',
      'In the aisle, compare two versions and take the one with the shorter ingredients list. That is the whole test — you do not need to understand the ingredients.',
      'Keep that swap for a fortnight before changing a second item.',
      'You are not choosing worse on the other one. The food is doing the work, not your discipline.',
    ],
    example:
      'Swaps that change nothing about your week: shop-bought sandwich → the same filling on bread you toast · flavoured yoghurt → plain yoghurt with the same fruit · jarred sauce → tinned tomatoes, garlic and herbs.',
  },

  'good-news-response': {
    steps: [
      'Think of something good a friend or partner told you in the last week or two.',
      'Go back to it. A message, a call, or in person: "I have been thinking about what you said about ___."',
      'Ask them to tell you more about it. Not "that is great" — an actual question about the best part of it.',
      'Stay on it for a few exchanges before moving on. The turning-towards is the active part.',
      'This is for ordinary good days, not for conflict. That is exactly why it works: it is practised when nothing is wrong.',
    ],
  },

  'the-friend-who-wants-to-hear': {
    steps: [
      'Think of the person you assume has moved on, or would find it odd to hear from you. That assumption is the thing being tested.',
      'Send something with no ask in it. Not "we should catch up" — "this reminded me of you", or "I was thinking about that time we ___".',
      'Do not wait for the right moment or the long message. Two lines is the format.',
      'Once a fortnight. Whether they reply is not the part you control, and a message that goes nowhere says nothing about you.',
    ],
  },

  'keep-it-between-the-two-of-you': {
    steps: [
      'Agree the rule out loud with the other adult, once: disagreements happen away from the children, and neither of you asks a child to carry a message.',
      'Agree a signal for "not now" that either of you can use without explaining — a word, a look.',
      'When it gets used, the conversation moves. Not cancelled, moved: name when you will finish it.',
      'Two minutes at the end of the week: did anything land in front of them this week? No score, no blame. Just the check.',
      'Repair in front of them when something does land. Children seeing a disagreement end well is protective, not harmful — it is the unresolved exposure that carries the risk.',
    ],
  },

  'blank-page-recall': {
    steps: [
      'Study or read as you normally would, for as long as you normally would.',
      'Close everything. Book shut, tabs closed, notes away. This is the part that gets skipped.',
      'Blank page. Write everything you can remember, in any order, for five minutes. It will feel uncomfortable and sparse. That discomfort is the mechanism working.',
      'Now open the material and check what you missed. Mark only the gaps.',
      'Next session, start by recalling the gaps before you read anything new.',
    ],
  },

  'shutdown-ritual': {
    steps: [
      'Set an alarm ten minutes before you intend to stop, every working day.',
      'List every loose end. Everything still open, in one list — not organised, just out of your head.',
      'For each one write where and when you will pick it up. "Tuesday, first thing, in the brief." Not "tomorrow".',
      'Look at tomorrow and name the one thing that matters most.',
      'Say a phrase that means it is finished, out loud or under your breath. The same one each day. It sounds silly and it is what makes the ending a real boundary rather than a pause.',
    ],
  },

  'detachment-window': {
    steps: [
      'Pick one weekday evening to start with, not all of them.',
      'Decide the window in clock terms: from when you sit down to eat, until you go to bed.',
      'Move the phone out of the room, or at least out of your pocket. Willpower is not the intervention — distance is.',
      'Tell whoever needs to know that you are not on it, so you are not paying attention to whether anyone has noticed.',
      'Fill it with something you chose. An evening you chose beats an evening anyone designed for you, and the control is where the benefit came from in the research.',
    ],
  },

  /* ── Shift work: the first rungs for people who do not set their hours ─ */

  'night-anchor-sleep': {
    steps: [
      'Pick a four-hour window that you can sleep in on EVERY day of the run, nights and days off alike. For most people on nights that is somewhere between about 4am and 10am.',
      'Defend that block absolutely. Phone off, room dark, everyone in the house told.',
      'Sleep more than four hours whenever you can — this is a floor, not a target.',
      'The point is that one stretch stays in the same place all week, so your body clock has one fixed thing to hold on to while everything else moves.',
      'On days off, still take the anchor. Shifting it to be sociable is what makes the next run harder.',
    ],
  },

  'pre-nights-nap': {
    steps: [
      'On the day before your first night, sleep normally.',
      'In the early evening — roughly two to three hours before you leave — lie down for sixty to ninety minutes.',
      'Dark room, alarm set. Ninety minutes gets you through a full cycle; sixty is fine if that is what there is.',
      'Expect to feel groggy for ten to fifteen minutes after. That passes and is not a sign it did not work.',
      'Do the same before the second night if the first one went badly.',
    ],
  },

  'on-shift-nap': {
    steps: [
      'Aim for around three or four in the morning, when the dip is deepest.',
      'Ten to twenty minutes if you need to be sharp straight after — short enough that you wake before deep sleep.',
      'If you have a proper break and can afford twenty minutes of grogginess, take a full ninety instead. It is the in-between, thirty to sixty, that leaves you worst.',
      'Set an alarm. Dark and flat if you can get it; a chair and an eye mask if you cannot.',
      'Coffee immediately before a short nap works with it rather than against it — the caffeine lands as you wake.',
    ],
  },

  'night-shift-light': {
    steps: [
      'For the first half of the shift, get yourself as bright as the building allows. A light box on the desk, or the brightest room you can legitimately work in.',
      'Bright means bright: normal office lighting is far dimmer than it feels. Close to the source, in your field of view, not behind you.',
      'Twenty to thirty minutes at a time is enough; several bouts beat one long one.',
      'Then go the other way for the last couple of hours — drop the light where you can, so you are not telling your body to wake up as you head home.',
    ],
  },

  'dark-glasses-home': {
    steps: [
      'Put them on BEFORE you step outside, not in the car park. Morning daylight is the strongest signal there is and a minute of it undoes the effort.',
      'Very dark sunglasses, or orange-tinted ones. Keep them on the whole way home, including at the wheel if it is safe and legal where you are.',
      'Keep them on until you are in the bedroom with the curtains shut.',
      'Then take them off and sleep in the dark. They are for the journey, not for bed.',
    ],
  },

  'caffeine-on-nights': {
    steps: [
      'Have the real coffee in the first hour or two of the shift, while you still need to get going.',
      'From about seven hours before you plan to sleep, stop. On a night finishing at 7am and sleeping at 8am, that means nothing after about 1am.',
      'Switch to decaf or something warm after the cutoff if the ritual is half of what you want.',
      'Caffeine is still in you long after you stop noticing it — the cutoff is about the sleep you are protecting, not about how awake you feel.',
    ],
  },

  'count-the-quick-returns': {
    steps: [
      'When next week’s roster lands, put it in front of you and go gap by gap.',
      'Mark every gap between the end of one shift and the start of the next that is shorter than eleven hours.',
      'Write the number down. That is the number, not a feeling about the week.',
      'Plan around the ones you cannot change: the anchor sleep, the pre-shift nap, nothing else stacked on that day.',
      'If the number is high most weeks, that is a rostering conversation with evidence attached rather than a personal failing.',
    ],
  },

  'the-weekday-shape': {
    steps: [
      'Pick a start time and a finish time and keep them, exactly as if somebody else set them.',
      'Name one reason to leave the house each day before noon. A walk, the shops, a library, a coffee — the destination matters less than the leaving.',
      'Keep the weekend different from the weekdays. Without that contrast, every day becomes the same day and the week stops existing.',
      'The shape is the point, not the productivity. A held shape is what the search sits inside rather than something to feel guilty about on top of it.',
    ],
  },
};

/** The steps for a practice, where they have been written. */
export const howToFor = (protocolId: string): HowTo | undefined => HOW_TO[protocolId];

/** Practices with steps written. Used by the coverage gate. */
export const WITH_HOW_TO = Object.keys(HOW_TO);
