import { restAlert, type RestAlertInput } from '@/features/notifications/rest';

/**
 * Every rule in the rest alert is a refusal, so every test here is about
 * the app deciding to say nothing.
 */
const NOW = 1_777_000_000_000;

const input = (over: Partial<RestAlertInput> = {}): RestAlertInput => ({
  endsAt: NOW + 90_000,
  now: NOW,
  exercise: 'Back squat',
  settings: { enabled: true },
  permission: 'granted',
  ...over,
});

describe('the rest alert that reaches a locked phone', () => {
  it('is one notification, at the moment the rest ends', () => {
    const alert = restAlert(input());
    expect(alert).toEqual({
      at: NOW + 90_000,
      title: 'Rest is up.',
      body: 'Next set: Back squat.',
    });
  });

  it('names the next set when the screen knows the lift, and does not invent one', () => {
    expect(restAlert(input({ exercise: undefined }))?.body).toBe('Next set when you are ready.');
  });

  it('says nothing when no rest is running', () => {
    expect(restAlert(input({ endsAt: null }))).toBeNull();
    expect(restAlert(input({ endsAt: undefined }))).toBeNull();
  });

  /**
   * A trigger already in the past fires immediately on some platforms,
   * which reads as the app shouting for no reason. The set is over; the
   * screen has already buzzed.
   */
  it('says nothing about a rest that has already run out', () => {
    expect(restAlert(input({ endsAt: NOW }))).toBeNull();
    expect(restAlert(input({ endsAt: NOW - 1 }))).toBeNull();
  });

  it('obeys the master switch — the rest timer is not the exception', () => {
    expect(restAlert(input({ settings: { enabled: false } }))).toBeNull();
  });

  /**
   * iOS offers the permission prompt once. Spending it between two sets is
   * the fastest route to a permanent no, so an ungranted permission simply
   * means a foreground-only timer — never a prompt, never a nag on screen.
   */
  it('never treats a missing permission as a reason to ask', () => {
    for (const permission of ['denied', 'undetermined', 'unavailable'] as const) {
      expect(restAlert(input({ permission }))).toBeNull();
    }
  });
});
