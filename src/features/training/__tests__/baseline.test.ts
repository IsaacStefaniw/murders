import { observe, type MetricObservation } from "@/features/model/metrics";
import { strengthBaseline } from "@/features/training/baseline";
import { baselinesFrom } from "@/features/training/programme";

const KEY = "strength.bench.e1rm";
const NOW = new Date("2026-09-05T12:00:00");
const daysAgo = (n: number) =>
  new Date(NOW.getTime() - n * 86400e3).toISOString();
const session = (
  value: number,
  days: number,
  id = `w${days}`,
): MetricObservation => ({
  ...observe(KEY, value, "user", `workout:${id}`),
  at: daysAgo(days),
});
const retest = (value: number, days: number): MetricObservation => ({
  ...observe(KEY, value, "user", `${value} kg × 1`),
  at: daysAgo(days),
});

describe("the strength baseline is weighted, not the last thing logged", () => {
  it("an off day does not lower it", () => {
    const read = strengthBaseline([session(110, 7), session(92, 0)], KEY, NOW)!;
    expect(read.value).toBeCloseTo(110 * (1 - 0.0125), 1);
    expect(read.peak).toBe(110);
  });

  it("a session cut short after the warm-ups does not become the number", () => {
    const metrics = [
      session(110, 14),
      session(108, 7),
      session(60, 0, "short"),
    ];
    expect(strengthBaseline(metrics, KEY, NOW)!.value).toBeGreaterThan(105);
    expect(baselinesFrom(metrics, NOW).bench).toBeGreaterThan(105);
  });

  it("a real lift raises it at once", () => {
    const read = strengthBaseline(
      [session(100, 7), session(112, 0)],
      KEY,
      NOW,
    )!;
    expect(read.value).toBe(112);
    expect(read.observations).toBe(2);
  });

  it("a number nobody has matched drifts down slowly, never in one step", () => {
    const only = strengthBaseline([session(120, 56)], KEY, NOW)!;
    expect(only.value).toBeCloseTo(120 * (1 - 0.0125 * 8), 1);
    const old = strengthBaseline([session(120, 200)], KEY, NOW)!;
    expect(old.value).toBe(120 * 0.85);
    expect(old.observations).toBe(1);
  });

  it("a deliberate retest is believed, even when it is lower", () => {
    const read = strengthBaseline(
      [session(120, 21), retest(105, 0)],
      KEY,
      NOW,
    )!;
    expect(read.value).toBe(105);
    expect(read.fromRetest).toBe(true);
    // And sessions after the retest can raise it again.
    expect(
      strengthBaseline(
        [session(120, 21), retest(105, 7), session(109, 0)],
        KEY,
        NOW,
      )!.value,
    ).toBe(109);
  });

  it("is nothing when nothing was logged", () => {
    expect(strengthBaseline([], KEY, NOW)).toBeNull();
    expect(baselinesFrom([], NOW)).toEqual({});
  });
});
