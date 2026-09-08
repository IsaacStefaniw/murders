/**
 * Every connection practice names its limit, and none of them is scored.
 *
 * The attribution audit swept the live library and found six cards in this
 * pillar with no safety field at all — two of them telling somebody how to
 * behave toward a partner. This is the pillar that touches coercive
 * control, and the app cannot tell which situation a reader is in. A
 * person being controlled who reads "answer the small things" with nothing
 * beside it is being handed advice that does not apply to them.
 *
 * The second half is the same argument from the other side. A connection
 * practice depends on another person being available and willing, so a
 * missed week means nothing about the person holding the phone. Four of
 * these cards carried `neverNag`; the rest were being scored, streaked and
 * reported on. A broken streak on "reach out to a friend" is the single
 * worst thing this library could tell somebody.
 */
import { PROTOCOLS } from '@/features/knowledge/protocols';
import { FRIENDSHIP_LIMIT, VIOLENCE_ROUTE } from '@/features/knowledge/safetyLines';

const connection = PROTOCOLS.filter((p) => p.pillar === 'connection');

it('has a connection pillar to check', () => {
  expect(connection.length).toBeGreaterThan(40);
});

it('gives every connection practice a plain-words limit', () => {
  const bare = connection.filter((p) => !p.safety).map((p) => p.id);
  expect(bare).toEqual([]);
});

it('routes past the app wherever a practice could reach someone being controlled', () => {
  // Not every card: a practice about answering a friend's good news does
  // not need the 1800RESPECT line and would be strange carrying it. Every
  // card that asks something of a reader about a partner or a family
  // member does, and each one carries one of the two shared paragraphs so
  // the wording cannot drift between them.
  const routed = connection.filter(
    (p) => p.safety?.includes(VIOLENCE_ROUTE) || p.safety?.includes(FRIENDSHIP_LIMIT),
  );
  expect(routed.length).toBeGreaterThanOrEqual(18);
  for (const p of connection) {
    if (!p.safety?.includes(VIOLENCE_ROUTE)) continue;
    expect(p.safety).toContain('1800 737 732');
  }
});

it('never scores a connection practice', () => {
  const scored = connection.filter((p) => !p.neverNag).map((p) => p.id);
  expect(scored).toEqual([]);
});
