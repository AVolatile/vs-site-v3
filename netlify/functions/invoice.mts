import type { Config, Context } from "@netlify/functions";
import { tokenSchema } from "../../src/lib/invoices/contract";
import { getPublicInvoice, recordInvoiceView } from "../lib/invoice-store";
import { HttpError, json, readJson, sameOrigin } from "../lib/http";
import { z } from "zod";
export default async (request: Request, _context: Context) => {
  try {
    const token = tokenSchema.safeParse(
      new URL(request.url).searchParams.get("token"),
    );
    if (!token.success)
      throw new HttpError(404, "This invoice is unavailable.");
    if (request.method === "GET")
      return json({ invoice: await getPublicInvoice(token.data) });
    if (request.method === "POST") {
      sameOrigin(request);
      if (
        !z
          .object({ action: z.literal("view") })
          .strict()
          .safeParse(await readJson(request)).success
      )
        throw new HttpError(422, "Invalid invoice action.");
      return json({ invoice: await recordInvoiceView(token.data) });
    }
    return new Response(null, {
      status: 405,
      headers: { Allow: "GET, POST", "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof HttpError)
      return json({ error: error.message }, error.status);
    console.error("Public invoice request failed.");
    return json(
      { error: "This invoice could not be loaded. Please try again." },
      503,
    );
  }
};
export const config: Config = {
  rateLimit: {
    action: "rate_limit",
    aggregateBy: ["ip", "domain"],
    windowSize: 60,
    windowLimit: 120,
  },
};
