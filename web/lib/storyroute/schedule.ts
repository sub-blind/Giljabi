import type { CourseRoute, Place } from "./types";

export interface ScheduleStop {
  placeId: string;
  arrivalMinutes: number | null;
  departureMinutes: number | null;
  driveFromPreviousMinutes: number | null;
}

export interface DayScheduleResult {
  stops: ScheduleStop[];
  finishMinutes: number | null;
  totalStayMinutes: number;
  totalDriveMinutes: number | null;
}

export function parseClock(value: string): number | null {
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

export function formatClock(minutes: number): string {
  const day = Math.floor(minutes / 1440);
  const clock = minutes % 1440;
  const hour = String(Math.floor(clock / 60)).padStart(2, "0");
  const minute = String(clock % 60).padStart(2, "0");
  return `${hour}:${minute}${day ? ` (+${day}일)` : ""}`;
}

export function buildDaySchedule(
  places: Place[], firstArrivalMinutes: number, stayMinutes: Record<string, number>, route: CourseRoute | null,
): DayScheduleResult {
  const orderedRoute = route?.orderedPlaceIds.length === places.length &&
    route.orderedPlaceIds.every((id, index) => id === places[index].id) ? route : null;
  const stops: ScheduleStop[] = [];
  let nextArrival: number | null = firstArrivalMinutes;
  let totalDriveMinutes = 0;
  let routeIncomplete = false;

  for (let index = 0; index < places.length; index += 1) {
    const place = places[index];
    let driveFromPreviousMinutes: number | null = null;
    if (index > 0) {
      const leg = orderedRoute?.segments[index - 1];
      if (nextArrival !== null && leg?.originId === places[index - 1].id && leg.destinationId === place.id &&
        leg.status === "ready" && leg.durationSeconds !== null && Number.isFinite(leg.durationSeconds) && leg.durationSeconds >= 0) {
        driveFromPreviousMinutes = Math.ceil(leg.durationSeconds / 60);
        totalDriveMinutes += driveFromPreviousMinutes;
        nextArrival += driveFromPreviousMinutes;
      } else {
        routeIncomplete = true;
        nextArrival = null;
      }
    }
    const stay = stayMinutes[place.id] ?? 60;
    const departureMinutes: number | null = nextArrival === null ? null : nextArrival + stay;
    stops.push({ placeId: place.id, arrivalMinutes: nextArrival, departureMinutes, driveFromPreviousMinutes });
    nextArrival = departureMinutes;
  }

  return {
    stops,
    finishMinutes: stops.at(-1)?.departureMinutes ?? null,
    totalStayMinutes: places.reduce((sum, place) => sum + (stayMinutes[place.id] ?? 60), 0),
    totalDriveMinutes: routeIncomplete ? null : totalDriveMinutes,
  };
}
