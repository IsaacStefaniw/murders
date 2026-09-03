import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  FUNNEL_EVENTS,
  _resetInstallId,
  buildPayload,
  installId,
  isTelemetryEnabled,
  randomInstallId,
  track,
} from '../telemetry';

beforeEach(async () => {
  _resetInstallId();
  await AsyncStorage.clear();
});

describe('the contract with the privacy page', () => {
  it('is off in every build that has no endpoint, and sends nothing', async () => {
    const send = jest.fn();
    expect(isTelemetryEnabled(undefined)).toBe(false);
    expect(isTelemetryEnabled('')).toBe(false);
    expect(isTelemetryEnabled('http://insecure.example')).toBe(false);
    expect(await track('interview_started', { url: undefined, send })).toBe(false);
    expect(send).not.toHaveBeenCalled();
    // And no install id is minted for a person nothing is sent about.
    expect(await AsyncStorage.getItem('intent-north-install-id')).toBeNull();
  });

  it('sends exactly four fields and nothing about the person', () => {
    const payload = buildPayload('paywall_shown', 'abc', new Date('2026-09-03T03:00:00Z'));
    expect(Object.keys(payload).sort()).toEqual(['at', 'build', 'event', 'install']);
    expect(payload).toEqual({ event: 'paywall_shown', install: 'abc', build: 'dev', at: '2026-09-03T03:00:00.000Z' });
  });

  it('keeps the event list closed and short', () => {
    expect(FUNNEL_EVENTS).toEqual([
      'interview_started',
      'interview_finished',
      'first_insight_seen',
      'week_ended',
      'paywall_shown',
      'product_chosen',
      'purchase_completed',
      'coach_opened',
    ]);
  });
});

describe('the install id', () => {
  it('is random, well-formed, and stable across calls', async () => {
    const a = await installId();
    _resetInstallId();
    const b = await installId();
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(randomInstallId()).not.toBe(randomInstallId());
  });
});

describe('when an endpoint exists', () => {
  it('posts the payload and reports that it tried', async () => {
    const send = jest.fn().mockResolvedValue(undefined);
    const ok = await track('purchase_completed', { url: 'https://intentnorth.app/api/events', send });
    expect(ok).toBe(true);
    expect(send).toHaveBeenCalledTimes(1);
    const [url, body] = send.mock.calls[0];
    expect(url).toBe('https://intentnorth.app/api/events');
    const parsed = JSON.parse(body);
    expect(parsed.event).toBe('purchase_completed');
    expect(parsed.install).toBe(await installId());
  });

  it('never throws when the network does', async () => {
    const send = jest.fn().mockRejectedValue(new Error('offline'));
    await expect(track('coach_opened', { url: 'https://x.example/e', send })).resolves.toBe(false);
  });
});
