/**
 * Location context layer — interface only for the web MVP; the native app
 * provides a geofencing implementation (expo-location) behind this contract.
 *
 * Privacy stance (see docs/PRIVACY.md): event-based geofencing on a handful
 * of user-labelled places, processed on-device, minimum necessary retention.
 * No continuous location history, ever. Presence is evidence, not proof:
 * arriving at the gym surfaces the workout and can later generate
 * "Looks like you trained — confirm?" — it never silently completes anything.
 */

export type PlaceKind = 'home' | 'work' | 'gym' | 'other';

export interface Place {
  id: string;
  kind: PlaceKind;
  /** User's own name for it ("Home", "F45", "Office"). */
  label: string;
}

export type PlaceEventKind = 'arrived' | 'left' | 'dwell';

export interface PlaceEvent {
  placeId: string;
  kind: PlaceEventKind;
  at: string;
  /** For 'dwell': minutes spent so far. */
  dwellMin?: number;
}

export interface LocationProvider {
  /** Whether the platform can provide geofence events at all. */
  available(): boolean;
  /** Register the user's labelled places for event-based monitoring. */
  setPlaces(places: Place[]): Promise<void>;
  /** Subscribe to arrive/leave/dwell events. Returns an unsubscribe fn. */
  onPlaceEvent(listener: (event: PlaceEvent) => void): () => void;
}

/** Web / permission-denied fallback: no places, no events, no surprises. */
export class NullLocationProvider implements LocationProvider {
  available(): boolean {
    return false;
  }
  async setPlaces(): Promise<void> {}
  onPlaceEvent(): () => void {
    return () => {};
  }
}

export function getLocationProvider(): LocationProvider {
  // The native build swaps in a geofencing implementation here.
  return new NullLocationProvider();
}
