import { protocolById } from '@/features/knowledge/protocols';
import {
  parseSupplements,
  SUPPLEMENT_CHOICES,
  supplementById,
  toggleSupplement,
} from '@/features/nutrition/supplements';

describe('what you take already', () => {
  it('every choice points at a library entry that carries the evidence and the safety line', () => {
    for (const c of SUPPLEMENT_CHOICES) {
      const p = protocolById(c.protocolId);
      expect(p).toBeDefined();
      expect(p!.safety).toMatch(/doctor or pharmacist/);
      expect(p!.neverNag).toBe(true);
    }
  });

  it('the clinical calls carry their "test first" condition beside the switch', () => {
    expect(supplementById('vitamin-d')?.condition).toMatch(/blood test/);
    expect(supplementById('iron')?.condition).toMatch(/ferritin/);
    expect(supplementById('magnesium')?.condition).toMatch(/thin/);
  });

  it('round-trips through the comma-joined answer the way every multi answer does', () => {
    expect(parseSupplements(undefined)).toEqual([]);
    expect(parseSupplements('')).toEqual([]);
    let raw = toggleSupplement(undefined, 'creatine');
    expect(raw).toBe('creatine');
    raw = toggleSupplement(raw, 'vitamin-d');
    expect(parseSupplements(raw)).toEqual(['creatine', 'vitamin-d']);
    raw = toggleSupplement(raw, 'creatine');
    expect(parseSupplements(raw)).toEqual(['vitamin-d']);
  });

  it('ignores an id it does not know rather than putting it on a list', () => {
    expect(parseSupplements('creatine,rapamycin, ,')).toEqual(['creatine']);
  });
});
