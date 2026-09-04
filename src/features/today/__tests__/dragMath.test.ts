import { isDrag, targetStartFor } from '../dragMath';

const bounds = { dayStart: '06:30', dayEnd: '22:30' };

describe('drag arithmetic', () => {
  it('a pixel is a minute, snapped to the quarter hour', () => {
    expect(targetStartFor('09:00', 30, 40, bounds)).toBe('09:45');
    expect(targetStartFor('09:00', 30, -100, bounds)).toBe('07:15');
    expect(targetStartFor('09:00', 30, 7, bounds)).toBe('09:00');
  });

  it('never leaves the waking day or runs past its end', () => {
    expect(targetStartFor('07:00', 30, -600, bounds)).toBe('06:30');
    expect(targetStartFor('21:00', 60, 600, bounds)).toBe('21:30');
  });

  it('never crosses midnight even for a late sleeper', () => {
    expect(targetStartFor('22:00', 60, 900, { dayStart: '07:00', dayEnd: '01:30' })).toBe('23:00');
  });

  it('a small wobble is a hold, not a drag', () => {
    expect(isDrag(4)).toBe(false);
    expect(isDrag(-12)).toBe(true);
  });
});
