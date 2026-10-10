import { z } from "zod";
export const integrationActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("connect") }).strict(),
  z
    .object({ action: z.literal("disconnect"), confirmed: z.literal(true) })
    .strict(),
  z
    .object({
      action: z.literal("select-calendar"),
      calendarId: z.string().min(1).max(1024),
    })
    .strict(),
  z.object({ action: z.literal("test-outlook") }).strict(),
  z.object({ action: z.literal("test-zoom") }).strict(),
  z
    .object({ action: z.literal("retry-sync"), bookingId: z.string().uuid() })
    .strict(),
]);
export interface IntegrationHealth {
  status: string;
  accountEmail: string | null;
  accountName: string | null;
  calendarId: string | null;
  calendarName: string | null;
  lastSuccessAt: string | null;
  error: string | null;
}
export interface IntegrationSettings {
  outlook: IntegrationHealth;
  zoom: IntegrationHealth;
  calendars: { id: string; name: string; primary: boolean }[];
}
