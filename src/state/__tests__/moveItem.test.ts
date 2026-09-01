import { useAppStore } from '@/state/store';
import type { LifeProfile, PlanItem } from '@/types/domain';

const at = (start: string, end: string, title: string, patch: Partial<PlanItem> = {}): PlanItem => ({
  id: title, date: '2026-09-01', start, end, title,
  area: 'health', tier: 'should', status: 'planned', fixed: false, ...patch,
});

const profile = {
  firstName: 'Sam', priorities: [], people: [], workDays: [1, 2, 3, 4, 5],
  workStart: '09:00', workEnd: '17:00', wakeTime: '06:30', sleepTime: '22:30',
  energyProfile: 'morning', trainingDaysPerWeek: 3, trainingDurationMin: 45,
  trainingPreference: 'gym', moreOf: [], lessOf: [],
  createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
} as unknown as LifeProfile;

const seed = (items: PlanItem[]) =>
  useAppStore.setState({ profile, plans: { '2026-09-01': { date: '2026-09-01', items } } });

const itemsNow = () => useAppStore.getState().plans['2026-09-01'].items;
const find = (id: string) => itemsNow().find((i) => i.id === id)!;

describe('moving something through the store', () => {
  it('grants the chosen time and shifts what was there', () => {
    seed([
      at('18:00', '18:30', 'Walk', { id: 'walk' }),
      at('12:00', '13:00', 'Training', { id: 'training' }),
    ]);
    const displaced = useAppStore.getState().moveItem('2026-09-01', 'training', '18:00');

    expect(find('training').start).toBe('18:00');
    expect(displaced.map((d) => d.id)).toEqual(['walk']);
    expect(find('walk').start).not.toBe('18:00');
  });

  it('loses nothing — every item is still on the day afterwards', () => {
    seed([
      at('07:00', '07:30', 'Shower', { id: 'shower' }),
      at('18:00', '18:30', 'Walk', { id: 'walk' }),
      at('19:00', '19:30', 'Reading', { id: 'reading', tier: 'could' }),
      at('12:00', '13:00', 'Training', { id: 'training' }),
    ]);
    useAppStore.getState().moveItem('2026-09-01', 'training', '18:00');
    expect(itemsNow().map((i) => i.id).sort()).toEqual(
      ['reading', 'shower', 'training', 'walk'],
    );
  });

  it('leaves the day in start order, so the list still reads top to bottom', () => {
    seed([
      at('18:00', '18:30', 'Walk', { id: 'walk' }),
      at('07:00', '07:30', 'Shower', { id: 'shower' }),
      at('12:00', '13:00', 'Training', { id: 'training' }),
    ]);
    useAppStore.getState().moveItem('2026-09-01', 'training', '20:00');
    const starts = itemsNow().map((i) => i.start);
    expect([...starts].sort()).toEqual(starts);
  });

  /**
   * A bump is INTENT rearranging its own plan, not the person choosing that
   * time. The adaptation layer reads these events to learn preferences, and
   * must not conclude someone likes 6:40pm walks because a training session
   * pushed one there.
   */
  it('records a bump as INTENT-initiated, not as the user choosing it', () => {
    seed([
      at('18:00', '18:30', 'Walk', { id: 'walk' }),
      at('12:00', '13:00', 'Training', { id: 'training' }),
    ]);
    useAppStore.getState().moveItem('2026-09-01', 'training', '18:00');

    const events = useAppStore.getState().planEvents.filter((e) => e.kind === 'rescheduled');
    const chosen = events.find((e) => e.itemId === 'training');
    const bumped = events.find((e) => e.itemId === 'walk');
    expect(chosen?.initiatedBy).toBe('user');
    expect(bumped?.initiatedBy).toBe('intent');
  });

  it('refuses to move a fixed commitment', () => {
    seed([at('09:00', '17:00', 'Work', { id: 'work', fixed: true })]);
    expect(useAppStore.getState().moveItem('2026-09-01', 'work', '10:00')).toEqual([]);
    expect(find('work').start).toBe('09:00');
  });
});
