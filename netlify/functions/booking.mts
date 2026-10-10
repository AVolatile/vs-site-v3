import { attemptBookingSync } from "../lib/integrations/sync";
import type { Config, Context } from "@netlify/functions";
import {
  bookingTokenSchema,
  dateSchema,
  bookingInputSchema,
  publicBookingActionSchema,
} from "../../src/lib/bookings/contract";
import {
  publicBookingPage,
  publicSlots,
  book,
  changePublicBooking,
} from "../lib/booking-store";
import { HttpError, json, readJson, sameOrigin, failure } from "../lib/http";
import { fieldErrors } from "../../src/lib/inquiries/contract";
export default async (
  request: Request,
  _context: Context,
): Promise<Response> => {
  const defer =
    typeof _context.waitUntil === "function"
      ? (id: string) => _context.waitUntil(attemptBookingSync(id))
      : undefined;
  try {
    const url = new URL(request.url),
      token = bookingTokenSchema.safeParse(url.searchParams.get("token"));
    if (!token.success)
      throw new HttpError(404, "This booking link is unavailable.");
    if (request.method === "GET") {
      const date = url.searchParams.get("date");
      if (date) {
        if (!dateSchema.safeParse(date).success)
          throw new HttpError(400, "Choose a valid date.");
        return json(await publicSlots(token.data, date));
      }
      return json(await publicBookingPage(token.data));
    }
    if (request.method === "POST") {
      sameOrigin(request);
      const body = await readJson(request),
        action =
          typeof body === "object" && body !== null && "action" in body
            ? body.action
            : null;
      if (action === "book") {
        const r = bookingInputSchema.safeParse(body);
        if (!r.success)
          throw new HttpError(
            422,
            "Check the booking details and confirm.",
            fieldErrors(r.error),
          );
        return json({ booking: await book(token.data, r.data, defer) });
      }
      const r = publicBookingActionSchema.safeParse(body);
      if (!r.success)
        throw new HttpError(422, "Confirm a valid booking change.");
      return json({
        booking: await changePublicBooking(token.data, r.data, defer),
      });
    }
    return new Response(null, {
      status: 405,
      headers: { Allow: "GET, POST", "Cache-Control": "no-store" },
    });
  } catch (error) {
    return failure(error, "booking");
  }
};
export const config: Config = {
  rateLimit: {
    action: "rate_limit",
    aggregateBy: ["ip", "domain"],
    windowSize: 60,
    windowLimit: 60,
  },
};
