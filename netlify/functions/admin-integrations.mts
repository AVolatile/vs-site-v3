import type { Context } from "@netlify/functions";
import { requireAdmin } from "../lib/authorize";
import { HttpError, json, readJson, sameOrigin, failure } from "../lib/http";
import { integrationActionSchema } from "../../src/lib/integrations/contract";
import {
  integrationSettings,
  selectCalendar,
  disconnectOutlook,
  testIntegration,
} from "../lib/integrations/settings";
import { beginMicrosoftOAuth } from "../lib/integrations/microsoft-auth";
import { syncBooking } from "../lib/integrations/sync";
import { getAdminBooking } from "../lib/booking-store";
import { ProviderError, safeMessage } from "../lib/integrations/provider";
export default async (
  request: Request,
  _context: Context,
): Promise<Response> => {
  try {
    await requireAdmin();
    if (request.method === "GET") return json(await integrationSettings());
    if (request.method !== "POST")
      return new Response(null, {
        status: 405,
        headers: { Allow: "GET, POST", "Cache-Control": "no-store" },
      });
    sameOrigin(request);
    const result = integrationActionSchema.safeParse(await readJson(request));
    if (!result.success)
      throw new HttpError(422, "Choose a valid integration action.");
    const action = result.data;
    if (action.action === "connect") {
      const auth = await beginMicrosoftOAuth(),
        r = json({ url: auth.url });
      r.headers.set("Set-Cookie", auth.cookie);
      return r;
    }
    if (action.action === "disconnect") await disconnectOutlook();
    else if (action.action === "select-calendar")
      await selectCalendar(action.calendarId);
    else if (action.action === "test-outlook")
      await testIntegration("outlook_calendar");
    else if (action.action === "test-zoom") await testIntegration("zoom");
    else if (action.action === "retry-sync") {
      await getAdminBooking(action.bookingId);
      await syncBooking(action.bookingId);
      return json({ booking: await getAdminBooking(action.bookingId) });
    }
    return json(await integrationSettings());
  } catch (e) {
    if (e instanceof ProviderError)
      return json({ error: safeMessage(e.code) }, 503);
    return failure(e, "booking");
  }
};
