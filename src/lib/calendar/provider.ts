/**
 * Calendar provider — the seam the first native milestone fills in.
 *
 * Per external review, the loop that turns IntentNorth from sophisticated
 * prototype into product is:
 *
 *   calendar → planner → Today → Move → calendar update
 *
 * The critical test: a meeting lands at 12:00 → the workout no longer
 * fits → IntentNorth notices → proposes 4:30 → the user accepts → both plan
 * and calendar reflect it.
 *
 * The web build has no calendar access, so the Null provider returns
 * nothing and `workBlocks` keeps modelling work hours from the profile.
 * The native build swaps in an expo-calendar (EventKit) implementation
 * behind this exact interface; `generateDailyPlan` already accepts the
 * events, and modelled work hours are used only when the provider has
 * nothing for a work day.
 */

import type { FixedCommitment } from '@/lib/scheduling/engine';

export interface CalendarEvent extends FixedCommitment {
  /** Provider-native event id, for write-back on Move. */
  externalId: string;
  calendarName?: string;
}

export interface CalendarProvider {
  available(): boolean;
  requestAccess(): Promise<boolean>;
  getEvents(date: string): Promise<CalendarEvent[]>;
  /** Write-back for user-approved moves of IntentNorth-owned events. */
  updateEvent(externalId: string, start: string, end: string): Promise<boolean>;
}

export class NullCalendarProvider implements CalendarProvider {
  available(): boolean {
    return false;
  }
  async requestAccess(): Promise<boolean> {
    return false;
  }
  async getEvents(): Promise<CalendarEvent[]> {
    return [];
  }
  async updateEvent(): Promise<boolean> {
    return false;
  }
}

export function getCalendarProvider(): CalendarProvider {
  // The native build returns an EventKit-backed implementation here.
  return new NullCalendarProvider();
}
