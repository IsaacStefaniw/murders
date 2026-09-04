/**
 * Breathwork protocols — deterministic, evidence-informed, 1–2 minutes.
 * Non-clinical framing throughout: these are steadying tools, not treatment.
 */

export interface BreathPhase {
  label: string;
  seconds: number;
  /** Target scale of the breathing circle at the end of this phase. */
  scale: number;
}

export interface BreathProtocol {
  key: string;
  name: string;
  /** When it helps — shown on the chooser. */
  useFor: string;
  rounds: number;
  phases: BreathPhase[];
}

export const BREATH_PROTOCOLS: BreathProtocol[] = [
  {
    key: 'sigh',
    name: 'Double-inhale sigh',
    useFor: 'Fastest reset — urges, spikes of stress',
    rounds: 6,
    phases: [
      { label: 'Breathe in', seconds: 2, scale: 1.25 },
      { label: 'Top up', seconds: 1, scale: 1.4 },
      { label: 'Long breath out', seconds: 6, scale: 0.7 },
    ],
  },
  {
    key: 'box',
    name: 'Box breathing',
    useFor: 'Steadying before something hard',
    rounds: 4,
    phases: [
      { label: 'Breathe in', seconds: 4, scale: 1.35 },
      { label: 'Hold', seconds: 4, scale: 1.35 },
      { label: 'Breathe out', seconds: 4, scale: 0.7 },
      { label: 'Hold', seconds: 4, scale: 0.7 },
    ],
  },
  {
    key: '478',
    name: '4-7-8',
    useFor: 'Winding down toward sleep',
    rounds: 4,
    phases: [
      { label: 'Breathe in', seconds: 4, scale: 1.35 },
      { label: 'Hold', seconds: 7, scale: 1.35 },
      { label: 'Slow breath out', seconds: 8, scale: 0.7 },
    ],
  },
];

export function protocolDurationSec(p: BreathProtocol): number {
  return p.rounds * p.phases.reduce((sum, phase) => sum + phase.seconds, 0);
}
