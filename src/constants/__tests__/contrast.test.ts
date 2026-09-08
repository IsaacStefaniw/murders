/**
 * Every colour the app puts text in, measured rather than asserted.
 *
 * The accessibility pass claimed a contrast floor and never checked it.
 * That is the shape of accessibility work that fails: the sweep happens,
 * the sweep is believed, and nobody computes a ratio. So this computes
 * them — WCAG 2.1 relative luminance, every text token against every
 * ground it is actually painted on, in both themes.
 *
 * The floor is 4.5:1 for body text and 3:1 for the supporting roles WCAG
 * allows to sit lower. A failure names the pair and the measured number,
 * so the fix is a colour change rather than an investigation.
 */
import { Colors } from '@/constants/theme';

/** WCAG 2.1 relative luminance of an sRGB hex colour. */
function luminance(hex: string): number {
  const v = hex.replace('#', '');
  const channel = (i: number) => {
    const c = parseInt(v.slice(i * 2, i * 2 + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
}

function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return Number(((hi + 0.05) / (lo + 0.05)).toFixed(2));
}

const GROUNDS = ['background', 'surface', 'surfacePressed'] as const;

/**
 * Roles WCAG lets sit at 3:1, and why each qualifies.
 *
 * `textSecondary` and `textTertiary` are captions and supporting lines,
 * never the only carrier of an instruction. `must`/`should`/`could` are
 * tier labels that always sit beside the item they describe. `accent`,
 * `success` and `danger` are used at heading weight. Anything that
 * becomes the sole carrier of meaning belongs at 4.5 instead.
 */
const SUPPORTING = [
  'textSecondary', 'textTertiary', 'accent', 'success', 'must', 'should', 'could', 'danger',
] as const;

describe.each(['light', 'dark'] as const)('%s theme', (mode) => {
  const c = Colors[mode];

  it('paints body text at 4.5:1 or better on every ground', () => {
    const below = GROUNDS
      .map((g) => ({ pair: `text on ${g}`, ratio: ratio(c.text, c[g]) }))
      .filter((r) => r.ratio < 4.5);
    expect(below).toEqual([]);
  });

  it('paints every supporting role at 3:1 or better on every ground', () => {
    const below = SUPPORTING.flatMap((t) =>
      GROUNDS
        .map((g) => ({ pair: `${t} on ${g}`, ratio: ratio(c[t], c[g]) }))
        .filter((r) => r.ratio < 3),
    );
    expect(below).toEqual([]);
  });

  it('keeps a primary button label readable on the accent fill', () => {
    // The one inverted pair: the label sits on the accent, not a ground.
    expect({ pair: 'onAccent on accent', ratio: ratio(c.onAccent, c.accent) }).toEqual({
      pair: 'onAccent on accent',
      ratio: expect.any(Number),
    });
    expect(ratio(c.onAccent, c.accent)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps body text readable on the soft fills', () => {
    // Soft fills back the arbitration, placement and level cards, which
    // carry ordinary body copy rather than labels.
    const below = (['accentSoft', 'mustSoft', 'shouldSoft', 'couldSoft', 'dangerSoft'] as const)
      .map((s) => ({ pair: `text on ${s}`, ratio: ratio(c.text, c[s]) }))
      .filter((r) => r.ratio < 4.5);
    expect(below).toEqual([]);
  });

  it('keeps a hairline border visible against what it separates', () => {
    // Not a WCAG text rule. A 1.15:1 floor so a divider is a divider
    // rather than a rumour — what the largest-text pass relies on to keep
    // cards apart when everything else has grown.
    expect(ratio(c.border, c.surface)).toBeGreaterThanOrEqual(1.15);
  });
});
