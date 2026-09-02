/**
 * The render pass — what a screen would actually say.
 *
 * ── The third harness, and why there had to be one ──────────────────────
 *
 * The pathway audit read what `build()` returns. The journey harness drove
 * the store through real actions. Between them they found real defects and
 * still missed the two most embarrassing ones reported from a phone: a
 * meditation that told you to close your eyes and to glance at the screen,
 * and a pelvic floor practice given the most prominent editorial slot on a
 * man's Today screen.
 *
 * Neither is a state bug. Both are things the app SAID. So this harness
 * asks, for many people and many days, what each screen would put in front
 * of them, and checks the text against rules that hold for everybody.
 *
 * It does not mount React. Rendering React Native in a test buys pixel
 * layout and costs an order of magnitude in speed and flakiness, and every
 * defect in this class lives in the DATA a screen is handed rather than in
 * how it is laid out. What it checks is the copy and the composition: is
 * this relevant, does it contradict itself, is it empty, does it explain
 * where it came from.
 */

import { coachNote } from '@/features/today/coach';
import { PATHS, type PathId } from '@/features/paths/definitions';
import { DOMAIN_QUESTIONS, type DomainQuestion } from '@/features/knowledge/questionBank';
import { PROTOCOLS, audiencesFor } from '@/features/knowledge/protocols';
import { useAppStore } from '@/state/store';
import { toMinutes } from '@/lib/dates';

export interface Finding {
  screen: string;
  rule: string;
  detail: string;
}

/** Words that mean nothing to somebody who has not read a training forum. */
const JARGON = [
  'RPE', 'e1RM', 'AMRAP', 'periodis', 'macrocycle', 'mesocycle',
  'NSDR', 'HRV', 'VO2', 'circadian', 'autoregulat',
];

/**
 * Copy rules that hold on every screen.
 *
 * Each is a promise the product already makes to itself in
 * `web/CLAUDE.md`, `docs/PRODUCT.md` or the no-manual-required pass, so a
 * failure is the app contradicting itself.
 */
export function checkCopy(screen: string, text: string, out: Finding[]): void {
  if (text.trim().length === 0) return;

  // "Avoid the public word prescription."
  if (/\bprescription\b/i.test(text)) {
    out.push({ screen, rule: 'no "prescription"', detail: text.slice(0, 90) });
  }
  // Medical and financial content is education, never advice.
  if (/\b(you should take|we recommend you take|cure|diagnos)/i.test(text)) {
    out.push({ screen, rule: 'education, never advice', detail: text.slice(0, 90) });
  }
  // A screen that tells you to close your eyes and to look at it is asking
  // for two incompatible things, which is exactly the meditation defect.
  if (/close your eyes/i.test(text) && /(glance|look) at (it|the screen)/i.test(text)) {
    out.push({ screen, rule: 'no contradictory instruction', detail: text.slice(0, 120) });
  }
  for (const word of JARGON) {
    if (new RegExp(`\\b${word}`, 'i').test(text)) {
      out.push({ screen, rule: `no manual required: "${word}"`, detail: text.slice(0, 90) });
      break;
    }
  }
}

/**
 * The Today screen's coach note.
 *
 * The note is the single largest block of editorial the app shows, and it
 * was picking a protocol from anywhere in the day with nothing tying it to
 * a block the reader could see.
 */
export function checkCoachNote(date: string, out: Finding[]): void {
  const { plans, routines } = useAppStore.getState();
  const plan = plans[date];
  if (!plan) return;
  const note = coachNote(date, plan.items, routines, toMinutes('09:00'));
  if (!note) return;

  const item = plan.items.find((i) => i.title === note.itemTitle);
  if (!item) {
    out.push({
      screen: 'today/coach',
      rule: 'the note explains something on this screen',
      detail: `note is about "${note.itemTitle}", which is not in the day`,
    });
  }
  if (!note.attribution || note.attribution.trim().length === 0) {
    out.push({
      screen: 'today/coach',
      rule: 'guidance names its source',
      detail: note.protocolTitle,
    });
  }
  checkCopy('today/coach', `${note.why} ${note.itemTitle}`, out);
}

/**
 * Practices that apply to some bodies must never arrive unasked.
 *
 * The app now asks, but asking is not the protection — the protection is
 * structural. Nothing carrying `appliesTo` may reach the plan except for
 * someone the answer says it applies to, and never at all before the
 * question has been answered.
 */
/**
 * Copy that opens on what the person does NOT have.
 *
 * "Nothing to look forward to this week. Saturday morning is open — dinner
 * somewhere new?" managed to be wrong twice in one sentence: it announced
 * an absence and then immediately named the thing it said was absent, and
 * it led with the deficit. An open morning is good news. The rule is about
 * where a sentence STARTS — plenty of honest copy mentions an absence, but
 * opening on it sets the tone for everything after it.
 */
const DEFICIT_OPENERS = [
  /^nothing\b/i,
  /^no one\b/i,
  /^you have n(o|othing)\b/i,
  /^you haven't\b/i,
  /^you still haven't\b/i,
  /^you failed\b/i,
  /^you missed\b/i,
];

export function checkTone(text: string, screen: string, out: Finding[]): void {
  const opener = text.trim();
  for (const pattern of DEFICIT_OPENERS) {
    if (pattern.test(opener)) {
      out.push({
        screen,
        rule: 'copy does not open on what is missing',
        detail: opener.slice(0, 120),
      });
      return;
    }
  }
  // The same sentence asserting an absence and then naming an instance of
  // it. This is the contradiction, not merely the tone.
  if (/^nothing\b/i.test(opener) && /—|-\s/.test(opener)) {
    out.push({
      screen,
      rule: 'copy does not contradict itself',
      detail: opener.slice(0, 120),
    });
  }
}

export function checkAudienceGating(out: Finding[]): void {
  const { routines, profile } = useAppStore.getState();
  const allowed = new Set(audiencesFor(profile?.sexAtBirth));
  const gated = new Map(
    PROTOCOLS.filter((p) => p.appliesTo).map((p) => [p.id, p.appliesTo!] as const),
  );
  for (const r of routines) {
    const audience = r.protocolId ? gated.get(r.protocolId) : undefined;
    if (audience && !allowed.has(audience)) {
      out.push({
        screen: 'plan',
        rule: 'a body-specific practice is never scheduled unasked',
        detail: `${r.title} was in the plan without being chosen`,
      });
    }
  }
}

/**
 * Intake questions, judged as questions.
 *
 * A question with two options is a coin toss dressed as a choice, and a
 * single-choice question about things that co-occur throws away half of
 * what the person just said.
 */
/**
 * Questions whose options name things rather than describe situations.
 * "Alcohol" is the clearest possible label for alcohol, and somebody
 * picking which habit to work on is not unsure which one it is.
 */
const TAXONOMY_KEYS = ['behaviour', 'ages', 'household'];

export function checkQuestions(out: Finding[]): void {
  const seen = new Map<string, DomainQuestion>();
  const all: { path: string; q: DomainQuestion }[] = [];
  for (const [domain, qs] of Object.entries(DOMAIN_QUESTIONS)) {
    for (const q of qs ?? []) all.push({ path: `questions/${domain}`, q });
  }
  for (const id of Object.keys(PATHS) as PathId[]) {
    for (const q of PATHS[id].questions) all.push({ path: `path/${id}`, q });
  }

  for (const { path, q } of all) {
    if (q.options.length < 3) {
      out.push({
        screen: path,
        rule: 'a real question offers at least three answers',
        detail: `${q.key} has ${q.options.length}`,
      });
    }
    // A question the person cannot honestly answer is one they abandon.
    // The escape hatch is judged on the VALUE as much as the label: an
    // option can read "Honestly, it comes and goes" and still be the
    // unsure branch every builder switches on.
    const hasEscape = q.options.some(
      (o) =>
        /not sure|no idea|none|not yet|nothing|help me|unsure|other|comes and goes|depends|no two weeks/i.test(
          o.label,
        ) || /^(unsure|none|notyet|unknown|other|no|varies)$/i.test(o.value),
    );
    // A taxonomy needs no escape hatch: somebody choosing which habit to
    // work on knows which habit it is.
    if (!hasEscape && !q.multi && !TAXONOMY_KEYS.includes(q.key)) {
      out.push({
        screen: path,
        rule: 'every question has an honest way out',
        detail: `${q.key} forces a choice with no "not sure"`,
      });
    }
    for (const o of q.options) {
      if (!TAXONOMY_KEYS.includes(q.key) && o.label.split(' ').length < 2) {
        out.push({
          screen: path,
          rule: 'answers are phrases, not labels',
          detail: `${q.key}: "${o.label}"`,
        });
      }
      checkCopy(path, o.label, out);
    }
    checkCopy(path, q.question, out);
    const prev = seen.get(q.key);
    if (prev && prev.question !== q.question) {
      out.push({
        screen: path,
        rule: 'one key, one question',
        detail: `${q.key} is asked two different ways`,
      });
    }
    seen.set(q.key, q);
  }
}

/** Every protocol carries what a reader needs to judge it. */
export function checkLibrary(out: Finding[]): void {
  for (const p of PROTOCOLS) {
    if (p.attribution.length === 0) {
      out.push({ screen: 'library', rule: 'guidance names its source', detail: p.id });
    }
    if (p.area === 'health' && !p.safety) {
      out.push({ screen: 'library', rule: 'health practices state their limits', detail: p.id });
    }
    if (p.summary.length < 20) {
      out.push({ screen: 'library', rule: 'a practice explains itself', detail: p.id });
    }
    checkCopy('library', `${p.title} ${p.summary}`, out);
  }
}
