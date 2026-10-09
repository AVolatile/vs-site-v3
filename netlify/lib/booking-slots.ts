import { Temporal } from "@js-temporal/polyfill";
import {
  bookingTime,
  type AvailabilitySettings,
  type BookingSlot,
} from "../../src/lib/bookings/contract";
export const businessToday = (timezone: string, now = new Date()) =>
  Temporal.Instant.from(now.toISOString())
    .toZonedDateTimeISO(timezone)
    .toPlainDate()
    .toString();
export function wallInstants(
  date: string,
  time: string,
  timezone: string,
): number[] {
  const wall = Temporal.PlainDateTime.from(date + "T" + time),
    values = new Set<number>();
  for (const disambiguation of ["earlier", "later"] as const) {
    const zoned = wall.toZonedDateTime(timezone, { disambiguation });
    if (zoned.toPlainDateTime().equals(wall))
      values.add(zoned.epochMilliseconds);
  }
  return [...values].sort((a, b) => a - b);
}
const minute = (time: string) =>
  Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
export function slotsForDate(
  date: string,
  settings: AvailabilitySettings,
  occupied: {
    id?: string;
    startAt: string;
    endAt: string;
    busyUntil: string;
  }[],
  now = new Date(),
): BookingSlot[] {
  const day = Temporal.PlainDate.from(date),
    today = Temporal.PlainDate.from(businessToday(settings.timezone, now));
  if (
    Temporal.PlainDate.compare(day, today) < 0 ||
    Temporal.PlainDate.compare(day, today.add({ days: settings.horizonDays })) >
      0
  )
    return [];
  const exception = settings.exceptions.find((e) => e.date === date);
  if (exception?.type === "unavailable") return [];
  const weekly = settings.weekdays.find((w) => w.weekday === day.dayOfWeek % 7);
  if (!exception && !weekly?.enabled) return [];
  const startTime = exception?.startTime ?? weekly!.startTime,
    endTime = exception?.endTime ?? weekly!.endTime;
  if (!startTime || !endTime) return [];
  const startMinute = minute(startTime),
    endMinute = minute(endTime),
    duration = settings.slotDurationMinutes * 60000,
    buffer = settings.bufferMinutes * 60000,
    minimum = now.getTime() + settings.minimumNoticeHours * 3600000;
  const slots = new Map<string, BookingSlot>();
  for (
    let m = startMinute;
    m + settings.slotDurationMinutes <= endMinute;
    m += settings.slotDurationMinutes
  ) {
    const wallTime =
      String(Math.floor(m / 60)).padStart(2, "0") +
      ":" +
      String(m % 60).padStart(2, "0");
    for (const start of wallInstants(date, wallTime, settings.timezone)) {
      const end = start + duration,
        endZoned = Temporal.Instant.fromEpochMilliseconds(
          end,
        ).toZonedDateTimeISO(settings.timezone);
      if (
        start < minimum ||
        endZoned.toPlainDate().toString() !== date ||
        endZoned.hour * 60 + endZoned.minute > endMinute ||
        endZoned.hour * 60 + endZoned.minute < startMinute
      )
        continue;
      if (
        occupied.some((b) => {
          const busyEnd = Math.max(
            Date.parse(b.busyUntil),
            Date.parse(b.endAt) + buffer,
          );
          return (
            start < busyEnd && start + duration + buffer > Date.parse(b.startAt)
          );
        })
      )
        continue;
      const startAt = new Date(start).toISOString(),
        endAt = new Date(end).toISOString();
      slots.set(startAt, {
        startAt,
        endAt,
        label: bookingTime(startAt, settings.timezone),
      });
    }
  }
  return [...slots.values()].sort((a, b) => a.startAt.localeCompare(b.startAt));
}
export function availableDates(
  settings: AvailabilitySettings,
  occupied: Parameters<typeof slotsForDate>[2],
  now = new Date(),
) {
  const first = Temporal.PlainDate.from(businessToday(settings.timezone, now)),
    dates = [];
  for (let n = 0; n <= settings.horizonDays; n++) {
    const date = first.add({ days: n }).toString(),
      slots = slotsForDate(date, settings, occupied, now);
    if (slots.length)
      dates.push({
        date,
        label: new Intl.DateTimeFormat("en-US", {
          timeZone: "UTC",
          weekday: "short",
          month: "short",
          day: "numeric",
        }).format(new Date(date + "T12:00:00Z")),
        count: slots.length,
      });
  }
  return dates;
}
