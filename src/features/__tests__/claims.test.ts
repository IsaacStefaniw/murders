import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(__dirname, '..', '..', '..');
const read = (p: string) => readFileSync(join(root, p), 'utf8');

/**
 * Copy drifts ahead of code. It did here: PRODUCT.md opened with
 * "AI-powered" and the paywall sold an "AI coach" while the shipped build
 * performed zero inference — `getAiProvider()` returns null without a
 * configured backend, and no build has ever shipped with one.
 *
 * These tests fail when a claim runs ahead of the code again. If a model
 * genuinely starts running, delete them in the same commit that turns it on.
 */
describe('claims match the code', () => {
  it('the AI provider really is off without configuration', () => {
    const provider = read('src/lib/ai/provider.ts');
    expect(provider).toMatch(/isSupabaseConfigured/);
    expect(provider).toMatch(/null/);
  });

  it('no user-facing copy sells an AI coach the build does not run', () => {
    for (const file of ['src/app/upgrade.tsx', 'README.md', 'docs/PRODUCT.md']) {
      const text = read(file).toLowerCase();
      // Asserting it, not mentioning it: PRODUCT.md documents the rule and
      // so necessarily contains the phrase it forbids.
      for (const claim of [
        'is an ai-powered',
        'an ai-powered personal',
        'the ai coach',
        'ai-powered coach',
      ]) {
        expect(text).not.toContain(claim);
      }
    }
  });

  it('PRODUCT.md states plainly that nothing infers today', () => {
    const product = read('docs/PRODUCT.md').toLowerCase();
    expect(product).toContain('deterministic');
    expect(product).toContain('switched off');
  });

  /**
   * The paywall previously listed partner sync and calendar integration
   * beside features that exist. Selling three things the build cannot do is
   * a promise the first week breaks.
   */
  it('the paywall separates what runs from what does not', () => {
    const upgrade = read('src/app/upgrade.tsx');
    expect(upgrade).toContain('Not built yet');
    expect(upgrade).toContain('Partner sync');
    expect(upgrade).toContain('Calendar');
  });
});
