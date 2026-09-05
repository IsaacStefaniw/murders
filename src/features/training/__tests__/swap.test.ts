import {
  buildProgramme,
  sessionsPerWeekFloor,
  type PrescribedExercise,
} from "@/features/training/programme";
import {
  alternativesFor,
  applyExerciseSwaps,
  patternOf,
  swapKey,
} from "@/features/training/swap";
import { PATHS } from "@/features/paths/definitions";

describe("swapping a movement keeps the pattern", () => {
  it("offers same-pattern movements on the same equipment, never itself", () => {
    const alts = alternativesFor("Bench press", "gym");
    expect(alts).not.toContain("Bench press");
    expect(alts).toContain("Dumbbell bench press");
    for (const a of alts) expect(patternOf(a)).toBe("horizontal press");
    // No barbell for a bodyweight trainee.
    expect(alternativesFor("Push-ups", "bodyweight")).not.toContain(
      "Bench press",
    );
  });

  it("every movement a programme can prescribe has a pattern", () => {
    const equipment = ["gym", "home", "dumbbells", "bodyweight"] as const;
    for (const eq of equipment) {
      const p = buildProgramme({
        goal: "general",
        experience: "consistent",
        daysAvailable: 4,
        sessionMin: 60,
        equipment: eq,
      });
      for (const wk of p.weeks)
        for (const s of wk.sessions)
          for (const e of s.exercises) {
            if (/^Finisher/.test(e.name)) continue;
            expect(patternOf(e.name)).not.toBeNull();
          }
    }
  });

  it("drops the programmed load on a swap and goes by effort", () => {
    const exercises: PrescribedExercise[] = [
      { name: "Squat", sets: 4, reps: "5", loadKg: 100, restSec: 150 },
      {
        name: "Romanian deadlift",
        sets: 3,
        reps: "8–10",
        rpe: 7,
        restSec: 90,
        accessory: true,
      },
    ];
    const swaps = { [swapKey("p1", "Lower A", "Squat")]: "Front squat" };
    const out = applyExerciseSwaps(exercises, swaps, "p1", "Lower A");
    expect(out[0]).toEqual(
      expect.objectContaining({
        name: "Front squat",
        sets: 4,
        reps: "5",
        rpe: 7,
        swappedFrom: "Squat",
      }),
    );
    expect(out[0].loadKg).toBeUndefined();
    // Untouched, and a swap for another session does not leak.
    expect(out[1]).toBe(exercises[1]);
    expect(applyExerciseSwaps(exercises, swaps, "p1", "Lower B")[0]).toBe(
      exercises[0],
    );
  });
});

describe("the intake hears someone who is already training", () => {
  it("never hands a five-day lifter a three-day block", () => {
    expect(sessionsPerWeekFloor("5+")).toBe(5);
    expect(sessionsPerWeekFloor("3-4")).toBe(3);
    expect(sessionsPerWeekFloor("1-2")).toBe(0);
    expect(sessionsPerWeekFloor(undefined)).toBe(0);
  });

  it("has something true to tap when it is going well, and says so back", () => {
    const q = PATHS.training.questions;
    expect(q.find((x) => x.key === "frequency")).toBeDefined();
    const limiter = q.find((x) => x.key === "limiter")!;
    expect(limiter.options.some((o) => o.value === "nothing")).toBe(true);
    const lines = PATHS.training.insights(
      { experience: "consistent", frequency: "3-4", limiter: "nothing" },
      null,
    );
    expect(lines.join(" ")).toMatch(/three or four days a week/);
    expect(lines.join(" ")).toMatch(/Nothing to fix/);
  });
});
