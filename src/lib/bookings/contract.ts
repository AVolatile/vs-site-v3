import { z } from "zod";
export const bookingTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const d = new Date(value + "T00:00:00Z");
    return (
      Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === value
    );
  }, "Choose a valid date.");
export const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Choose a valid time.");
export const timezoneSchema = z
  .string()
  .max(80)
  .refine((value) => {
    try {
      if (!/[A-Za-z]/.test(value)) return false;
      new Intl.DateTimeFormat("en", { timeZone: value }).format();
      return true;
    } catch {
      return false;
    }
  }, "Choose a valid IANA timezone.");
const bounded = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine(
      (value) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value),
      "Remove unsupported control characters.",
    );
export const settingsSchema = z
  .object({
    action: z.literal("settings"),
    timezone: timezoneSchema,
    slotDurationMinutes: z.enum(["15", "30", "45", "60"]).transform(Number),
    bufferMinutes: z.number().int().min(0).max(120),
    minimumNoticeHours: z.number().int().min(1).max(168),
    horizonDays: z.number().int().min(1).max(90),
    updatedAt: z.string().datetime(),
    weekdays: z
      .array(
        z
          .object({
            weekday: z.number().int().min(0).max(6),
            enabled: z.boolean(),
            startTime: timeSchema,
            endTime: timeSchema,
          })
          .strict()
          .refine((v) => v.endTime > v.startTime, "End must be after start."),
      )
      .length(7)
      .refine(
        (days) => new Set(days.map((d) => d.weekday)).size === 7,
        "Provide each weekday once.",
      ),
    exceptions: z
      .array(
        z
          .object({
            date: dateSchema,
            type: z.enum(["unavailable", "custom_hours"]),
            startTime: timeSchema.nullable(),
            endTime: timeSchema.nullable(),
          })
          .strict()
          .refine(
            (v) =>
              v.type === "unavailable"
                ? v.startTime === null && v.endTime === null
                : !!v.startTime && !!v.endTime && v.endTime > v.startTime,
            "Set valid custom hours, or clear hours for an unavailable day.",
          ),
      )
      .max(366)
      .refine(
        (v) => new Set(v.map((e) => e.date)).size === v.length,
        "Use one exception per date.",
      ),
  })
  .strict();
export type AvailabilitySettings = Omit<
  z.infer<typeof settingsSchema>,
  "action"
>;
export type BookingStatus = "scheduled" | "cancelled" | "completed";
export type MeetingType = "phone" | "zoom";
export interface BookingSlot {
  startAt: string;
  endAt: string;
  label: string;
}
export interface PublicBooking {
  status: BookingStatus;
  meetingType: MeetingType;
  startAt: string;
  endAt: string;
  timezone: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string | null;
  clientNotes: string;
}
export interface AdminBooking extends PublicBooking {
  id: string;
  inquiryId: string;
  company: string;
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
  completedAt: string | null;
}
export interface PublicBookingPage {
  name: string;
  email: string;
  timezone: string;
  durationMinutes: number;
  dates: { date: string; label: string; count: number }[];
  booking: PublicBooking | null;
}
export interface InquiryBooking {
  url: string | null;
  lastFour: string | null;
  booking: AdminBooking | null;
}
export const bookingInputSchema = z
  .object({
    action: z.literal("book"),
    meetingType: z.enum(["phone", "zoom"]),
    startAt: z.string().datetime(),
    clientName: bounded(120).min(1, "Enter your name."),
    clientEmail: z.string().trim().email().max(254),
    clientPhone: bounded(30),
    clientNotes: bounded(1000),
    requestKey: z.string().uuid(),
    confirmed: z.literal(true),
  })
  .strict()
  .refine(
    (v) =>
      v.meetingType !== "phone" ||
      (/^[+\d() .-]+$/.test(v.clientPhone) &&
        v.clientPhone.replace(/\D/g, "").length >= 7 &&
        v.clientPhone.replace(/\D/g, "").length <= 15),
    {
      path: ["clientPhone"],
      message: "Enter a valid phone number for this call.",
    },
  );
export const publicBookingActionSchema = z
  .object({
    action: z.enum(["cancel", "reschedule"]),
    expectedStartAt: z.string().datetime(),
    startAt: z.string().datetime().optional(),
    confirmed: z.literal(true),
  })
  .strict()
  .refine(
    (v) => v.action !== "reschedule" || !!v.startAt,
    "Choose a new slot.",
  );
export const adminBookingActionSchema = z
  .object({
    action: z.enum(["cancel", "complete", "reschedule"]),
    id: z.string().uuid(),
    updatedAt: z.string().datetime(),
    startAt: z.string().datetime().optional(),
    confirmed: z.literal(true),
  })
  .strict()
  .refine(
    (v) => v.action !== "reschedule" || !!v.startAt,
    "Choose a new slot.",
  );
export const linkActionSchema = z
  .object({
    action: z.enum(["create-link", "regenerate-link"]),
    inquiryId: z.string().uuid(),
    confirmed: z.literal(true).optional(),
  })
  .strict()
  .refine(
    (v) => v.action !== "regenerate-link" || v.confirmed === true,
    "Confirm link regeneration.",
  );
export function calendarDate(instant: string, timezone: string): string {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(instant));
  const field = (name: string) => p.find((v) => v.type === name)!.value;
  return `${field("year")}-${field("month")}-${field("day")}`;
}
export function bookingTime(value: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(value));
}
export function bookingDateTime(value: string, timezone: string): string {
  return (
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value)) +
    " (" +
    timezone +
    ")"
  );
}
