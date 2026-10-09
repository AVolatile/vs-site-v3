import type { Context } from "@netlify/functions";
import { z } from "zod";
import { requireAdmin } from "../lib/authorize";
import { HttpError, json, readJson, sameOrigin, failure } from "../lib/http";
import {
  dateSchema,
  settingsSchema,
  linkActionSchema,
  adminBookingActionSchema,
} from "../../src/lib/bookings/contract";
import { fieldErrors } from "../../src/lib/inquiries/contract";
import {
  getBookingSettings,
  saveBookingSettings,
} from "../lib/booking-settings";
import { createInquiryBookingLink } from "../lib/booking-links";
import {
  getInquiryBooking,
  getAdminBooking,
  listBookings,
  adminSlots,
  changeAdminBooking,
} from "../lib/booking-store";
export default async (
  request: Request,
  _context: Context,
): Promise<Response> => {
  try {
    await requireAdmin();
    const url = new URL(request.url);
    if (request.method === "GET") {
      if (url.searchParams.get("settings") === "true")
        return json({ settings: await getBookingSettings() });
      const inquiry = url.searchParams.get("inquiry"),
        id = url.searchParams.get("id"),
        date = url.searchParams.get("date"),
        exclude = url.searchParams.get("exclude");
      if (
        [inquiry, id, exclude].some(
          (v) => v && !z.string().uuid().safeParse(v).success,
        )
      )
        throw new HttpError(400, "Choose a valid booking or inquiry.");
      if (inquiry) return json(await getInquiryBooking(inquiry));
      if (id) return json({ booking: await getAdminBooking(id) });
      if (date) {
        if (!dateSchema.safeParse(date).success)
          throw new HttpError(400, "Choose a valid date.");
        return json(await adminSlots(date, exclude ?? undefined));
      }
      const month = url.searchParams.get("month");
      if (!month || !dateSchema.safeParse(month + "-01").success)
        throw new HttpError(400, "Choose a valid calendar month.");
      return json(await listBookings(month));
    }
    if (request.method === "POST") {
      sameOrigin(request);
      const body = await readJson(request, 128000),
        action =
          typeof body === "object" && body !== null && "action" in body
            ? body.action
            : null;
      if (action === "settings") {
        const r = settingsSchema.safeParse(body);
        if (!r.success)
          throw new HttpError(
            422,
            "Check timezone, hours and scheduling limits.",
            fieldErrors(r.error),
          );
        const { action: _action, ...input } = r.data;
        return json({ settings: await saveBookingSettings(input) });
      }
      if (action === "create-link" || action === "regenerate-link") {
        const r = linkActionSchema.safeParse(body);
        if (!r.success)
          throw new HttpError(422, "Confirm the booking link action.");
        return json(
          await createInquiryBookingLink(
            r.data.inquiryId,
            action === "regenerate-link",
          ),
        );
      }
      const r = adminBookingActionSchema.safeParse(body);
      if (!r.success)
        throw new HttpError(422, "Confirm a valid booking action.");
      return json({ booking: await changeAdminBooking(r.data) });
    }
    return new Response(null, {
      status: 405,
      headers: { Allow: "GET, POST", "Cache-Control": "no-store" },
    });
  } catch (error) {
    return failure(error, "booking");
  }
};
