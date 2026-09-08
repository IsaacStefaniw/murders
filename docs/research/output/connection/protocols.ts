/**
 * Connection & Family round — candidate protocols. NOT wired into the app.
 *
 * Written 2026-09-08 under the restructured pipeline. Gate 1 read 53
 * transcripts across 50 conversations and traced 136 claims; Gate 2
 * opened 59 papers at registry level, every one retraction-checked.
 * Ledgers in ledgers/, a row per card in sources.md, the rest in
 * findings.md, episodes.md and ladder.md.
 *
 * THE CEILING IS B AND IT WAS NOT APPROACHED. An integrity test forbids
 * an A grade in this pillar and it stays. Nothing about couple or family
 * behaviour has support at the level of morning light or strength
 * training, and this round proposes no A and no B. Twelve cards at C, D
 * and E is the honest shape of this field, not a weak round.
 *
 * TWELVE cards, where the brief asked for fifteen to twenty. Three of the
 * areas it names — teenagers, blended families, adult siblings — produced
 * nothing this round could verify. Padding them would be worse than the
 * shortfall, and findings.md says so plainly.
 *
 * THE SAFETY WORK IS HALF THE POINT. Six live cards in this pillar carry
 * no safety field at all, including two about couple behaviour, in a
 * pillar that touches coercive control. Every card below that could be
 * read as advice to a person being controlled carries the carve-out and
 * the route. Ten of twelve set neverNag: this pillar is full of things
 * that cannot be scheduled and must never be scored.
 *
 * Grade spread: A 0 · B 0 · C 7 · D 4 · E 1 (12 candidates).
 * Areas: relationship 7 · family 3 · growth 1 · enjoyment 1.
 *
 * Ten of twelve carry an empty attribution. The two that do not were
 * checked against the author-list rule: Greene and Ablon are both on the
 * author list of the trial `their-concern-first` rests on, and one of
 * them is the person the corpus traced teaching it, so that credit is
 * both kinds at once. Killam is a teaching credit only, traced to a
 * specific conversation, which the rule permits without an author list.
 *
 * Nothing here reaches a phone until a human has read it.
 */

import type { Protocol } from '@/features/knowledge/protocols';

const VIOLENCE_ROUTE =
  'None of this applies where you are afraid of the person, where you are being controlled, or where money, contact or freedom is being used against you. That is not a communication problem and nothing on this card will help with it. 1800RESPECT is 1800 737 732, free and confidential, twenty-four hours.';

export const CONNECTION_CANDIDATES: Protocol[] = [
  // ── LONELINESS ────────────────────────────────────────────────────────
  // The round's headline, and it splits the block rather than inverting it.
  {
    id: 'what-do-you-expect-them-to-think',
    evidenceLevel: 'C',
    title: 'Write what you expect them to think',
    pillar: 'connection',
    area: 'growth',
    goalDomains: ['friends', 'personal', 'behaviour'],
    summary:
      'Before a social thing you are dreading, two minutes on what you expect people to think of you. One minute afterwards on what actually happened.',
    why: 'Loneliness research has an unexpected split in it, and it is genuinely useful. Getting more contact into your week is the best way to raise how much contact you have. It is not the best way to change how connected you feel. For that, the interventions that work address what you expect from people before you walk in — because if you go in braced for a poor reception you behave accordingly, and it becomes a reasonably reliable prophecy. Nobody has tested this two-minute written version, so treat it as worth trying. The comparison afterwards is the whole exercise, not the prediction.',
    attribution: [],
    days: [6],
    durationMin: 5,
    anchor: { kind: 'fixed', start: '17:00', windowMin: 300 },
    energy: 'any',
    tier: 'could',
    neverNag: true,
    sessionType: 'journal',
    safety: 'This is not a card that says your loneliness is a thinking error. It is not, and being lonely is not something you are doing to yourself. If dread of social situations is shrinking your life rather than making a party uncomfortable, that is social anxiety and it responds well to proper treatment. Worth a GP conversation.',
  },
  {
    id: 'the-friend-who-wants-to-hear',
    evidenceLevel: 'C',
    title: 'They want to hear from you more than you think',
    pillar: 'connection',
    area: 'relationship',
    goalDomains: ['friends', 'behaviour'],
    summary:
      'Once a fortnight, message the person you assume has moved on. Not to arrange anything. Just to say you thought of them.',
    why: 'People consistently underestimate how pleased an old friend will be to hear from them, and they underestimate it by a lot. The gap is largest exactly where it matters: the more out of touch you are, the more you underestimate the welcome, and so the less likely you are to reach out. That is a self-sealing loop and this is how you open it. The message does not need a purpose and asking to catch up sometime is not required. Being thought of is the entire content.',
    attribution: ['Kasley Killam'],
    days: [3],
    durationMin: 5,
    anchor: { kind: 'fixed', start: '12:00', windowMin: 420 },
    energy: 'any',
    tier: 'could',
    neverNag: true,
  },
  {
    id: 'solitude-counts',
    evidenceLevel: 'E',
    title: 'Some of the week alone is fine',
    pillar: 'connection',
    area: 'enjoyment',
    goalDomains: ['personal', 'behaviour'],
    summary:
      'Time by yourself that you chose is not a gap in your social life. Count it as the week working, not the week failing.',
    why: 'Everything else in this pillar points one way, and a coach that only ever points that way starts to feel like an accusation. Chosen solitude and imposed isolation are not the same thing, and there is no evidence that a person who likes their own company is doing anything wrong. This is unproven as a practice because it is not really a practice, and we are saying so rather than dressing it up. It is here so that the app has a way of not nagging somebody who is genuinely fine.',
    attribution: [],
    days: [0],
    durationMin: 5,
    anchor: { kind: 'fixed', start: '10:00', windowMin: 480 },
    energy: 'any',
    tier: 'could',
    neverNag: true,
    safety: 'The distinction that matters is whether you chose it. Solitude you picked is restorative; isolation that has closed in on you is not, and it is worth naming honestly if that is what has happened. Lifeline is 13 11 14.',
  },

  // ── LISTENING AND REPAIR ──────────────────────────────────────────────
  {
    id: 'one-turn-just-listening',
    evidenceLevel: 'C',
    title: 'Take one turn where you only listen',
    pillar: 'connection',
    area: 'relationship',
    goalDomains: ['relationship', 'family', 'friends', 'behaviour'],
    summary:
      'Next disagreement that matters: take one turn where your only job is to understand. Nothing prepared while they talk.',
    why: 'Being listened to properly changes what the speaker thinks, not only how they feel. In experiments where listening quality was manipulated with real people in real conversations, good listening produced a large shift in how much insight the speaker had into their own position, and a smaller but real softening of the attitude they came in with. The mechanism is not agreement and it is not technique. It is that a person who is not being argued with can hear themselves. This is one research programme in laboratory settings, which is why it is worth trying rather than settled.',
    attribution: [],
    days: [1, 2, 3, 4, 5, 6, 0],
    durationMin: 15,
    anchor: { kind: 'fixed', start: '19:00', windowMin: 180 },
    energy: 'any',
    tier: 'could',
    neverNag: true,
    safety: VIOLENCE_ROUTE,
  },
  {
    id: 'ask-which-one-they-want',
    evidenceLevel: 'D',
    title: 'Ask which one they want',
    pillar: 'connection',
    area: 'relationship',
    goalDomains: ['relationship', 'family', 'friends', 'behaviour'],
    summary:
      'When someone brings you a problem, ask first: do you want help with this, or do you want me to hear it?',
    why: 'Most unhelpful responses are the right response to a different question. Somebody wanting to be heard gets a solution; somebody wanting a solution gets sympathy; both leave slightly worse off, and neither person has done anything wrong. Asking takes four words and removes the guess. There is no trial of this and there probably never will be one, so it is graded early days honestly. It is what experienced people do, and the cost of being wrong is nil.',
    attribution: [],
    days: [1, 2, 3, 4, 5, 6, 0],
    durationMin: 5,
    anchor: { kind: 'fixed', start: '18:00', windowMin: 240 },
    energy: 'any',
    tier: 'could',
    neverNag: true,
  },
  {
    id: 'say-the-feeling-not-just-the-fact',
    evidenceLevel: 'C',
    title: 'Say the feeling, not just the fact',
    pillar: 'connection',
    area: 'relationship',
    goalDomains: ['relationship', 'behaviour'],
    summary:
      'A couple of evenings a week, when you report on the day, add the part about how it felt. That is the half that gets left out.',
    why: 'The best-supported mechanism under this whole pillar is not communication skill, it is whether the other person feels understood, cared for and taken seriously. Diary studies following couples day by day find that closeness on a given evening tracks self-disclosure and, more strongly, the sense that the disclosure landed. Most people report the facts of the day accurately and leave out the part that would actually let someone respond. Adding it takes a sentence.',
    attribution: [],
    days: [1, 3, 5],
    durationMin: 5,
    anchor: { kind: 'sleep', offsetMin: 120, windowMin: 180 },
    energy: 'evening',
    tier: 'could',
  },
  {
    id: 'name-the-fear-under-it',
    evidenceLevel: 'D',
    title: 'Name the thing underneath',
    pillar: 'connection',
    area: 'relationship',
    goalDomains: ['relationship', 'behaviour'],
    summary:
      'Write it first, then say it once: the worry underneath the complaint. Not the dishes. What you are afraid the dishes mean.',
    why: 'Couples therapy that works spends most of its time doing this one move, getting past the surface complaint to the thing the person is actually frightened of. The therapy has decent trial evidence; the move on its own, done at home without a therapist, has none, which is why this is graded early days. It is here because it is the single most transferable idea in that literature and because writing it down first makes saying it survivable.',
    attribution: [],
    days: [6],
    durationMin: 10,
    anchor: { kind: 'fixed', start: '11:00', windowMin: 300 },
    energy: 'any',
    tier: 'could',
    neverNag: true,
    sessionType: 'journal',
    safety: VIOLENCE_ROUTE,
  },
  {
    id: 'the-recurring-one-agreed',
    evidenceLevel: 'D',
    title: 'The one you have had nine times',
    pillar: 'connection',
    area: 'relationship',
    goalDomains: ['relationship', 'behaviour'],
    summary:
      'Monthly, out of the moment: take the argument that keeps coming back and agree out loud that it is a standing difference rather than a problem to be solved this time.',
    why: 'A good share of what long-term couples argue about does not get resolved, and the observational work suggests that is normal rather than a sign of failure. What separates couples who manage it is not solving those arguments, it is being able to have them without contempt and to get back afterwards. Naming one as a standing difference sounds like giving up and functions like the opposite: it takes the argument off the list of things that must be settled tonight. This is a description of what stable couples do, not a tested intervention.',
    attribution: [],
    days: [6],
    durationMin: 25,
    anchor: { kind: 'fixed', start: '10:30', windowMin: 300 },
    energy: 'any',
    tier: 'could',
    neverNag: true,
    safety: `A standing difference is not the same as something you are being made to accept. If one of you keeps conceding because of what happens otherwise, that is a different situation and a couples therapist is the right next step. ${VIOLENCE_ROUTE}`,
  },

  // ── FAMILY ────────────────────────────────────────────────────────────
  {
    id: 'their-concern-first',
    evidenceLevel: 'C',
    title: 'Their side of it first, all of it',
    pillar: 'connection',
    area: 'family',
    goalDomains: ['family', 'behaviour'],
    summary:
      'Weekly, when nothing is on fire: pick one recurring friction with a child and ask what makes it hard for them. Say nothing of your own until you can repeat theirs back.',
    why: 'This is one component of an approach that beat a waitlist in a proper randomised trial with a hundred and thirty-four children, and matched a well-established parenting programme. The order is the active part, and it is the part everyone skips: their concern, fully understood and repeated back, before yours goes on the table, before any solution. It is graded some-evidence rather than tested because the trial tested the whole treatment in a clinical population, and this is one move from it used at the kitchen table.',
    attribution: ['Ross Greene', 'Stuart Ablon'],
    days: [0],
    durationMin: 20,
    anchor: { kind: 'fixed', start: '16:00', windowMin: 240 },
    energy: 'any',
    tier: 'could',
    neverNag: true,
  },
  {
    id: 'keep-it-between-the-two-of-you',
    evidenceLevel: 'C',
    title: 'Keep it between the two of you',
    pillar: 'connection',
    area: 'family',
    goalDomains: ['family', 'relationship', 'behaviour'],
    summary:
      'A standing rule, checked weekly in a couple of minutes: no child carries a message, hears the complaint, or is asked to take a side.',
    why: 'Across more than a hundred samples and tens of thousands of children, what predicts how children do is not whether their parents are together. It is how much conflict they are exposed to and whether they are pulled into it. That is a genuinely freeing finding for separated parents and a demanding one for parents who are still together, and it points at the same practice either way. The rule is not about hiding disagreement, which children detect anyway. It is about not making them the channel for it.',
    attribution: [],
    days: [0],
    durationMin: 5,
    anchor: { kind: 'fixed', start: '19:00', windowMin: 240 },
    energy: 'any',
    tier: 'could',
    neverNag: true,
    safety: `This is not "keep the peace at any cost", and children are not safer in a household where one adult is frightened. Where there is violence or control, protecting children means getting help rather than getting quieter. ${VIOLENCE_ROUTE}`,
  },

  // ── CARERS ────────────────────────────────────────────────────────────
  {
    id: 'what-the-break-is-for',
    evidenceLevel: 'D',
    title: 'What the break is actually for',
    pillar: 'connection',
    area: 'family',
    goalDomains: ['family', 'health', 'behaviour'],
    summary:
      'Two hours a week that are yours, and no expectation that they fix anything. They are two hours. That is the whole claim.',
    why: 'Respite has been studied properly and the honest summary is uncomfortable: pooled trials found no significant effect on the things people hoped it would change, like carer burden or wellbeing. That is not a reason to skip it. It is a reason to stop measuring two hours off against a standard it was never going to meet, and to stop feeling that needing them means you are failing. The hours are worth having because they are hours. Anything more than that would be us telling you something the evidence does not support.',
    attribution: [],
    days: [6],
    durationMin: 120,
    anchor: { kind: 'fixed', start: '10:00', windowMin: 420 },
    energy: 'any',
    tier: 'should',
    neverNag: true,
    safety: 'Caring at this intensity is associated with real harm to the carer, and that is a systems problem rather than a personal one. In Australia, Carer Gateway on 1800 422 737 arranges practical support including emergency respite. If you are not coping, that is information rather than a verdict, and Lifeline is 13 11 14.',
  },

  // ── WHEN THE APP IS NOT THE RIGHT TOOL ────────────────────────────────
  {
    id: 'add-a-person',
    evidenceLevel: 'C',
    title: 'Add a person',
    pillar: 'connection',
    area: 'relationship',
    goalDomains: ['relationship', 'family'],
    summary:
      'If you have been working on this on your own for months and it is not shifting, the next step is not another exercise. It is a third person in the room.',
    why: 'This is the card that tells you the cards have a ceiling, and the number behind it is the reason. When relationship education is delivered self-directed, on your own, the measured effect on relationship quality is approximately nothing. The same material delivered with a facilitator involved reaches a moderate effect. That gap is not about effort or motivation and it is not a comment on you. Some things need somebody else in the room, and knowing which is more useful than another fortnight of trying harder alone.',
    attribution: [],
    days: [6],
    durationMin: 20,
    anchor: { kind: 'fixed', start: '11:00', windowMin: 300 },
    energy: 'any',
    tier: 'could',
    neverNag: true,
    safety: `Reaching this point is not failure, and nothing above was wasted. In Australia, Relationships Australia is 1300 364 277 and offers low-cost counselling; a GP can refer you and there may be a rebate. ${VIOLENCE_ROUTE}`,
  },
];
