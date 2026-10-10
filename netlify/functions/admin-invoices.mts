import type { Context } from "@netlify/functions";
import { z } from "zod";
import { requireAdmin } from "../lib/authorize";
import { HttpError, json, readJson, sameOrigin } from "../lib/http";
import {
  createInvoiceSchema,
  draftSchema,
  actionSchema,
} from "../../src/lib/invoices/contract";
import { fieldErrors } from "../../src/lib/inquiries/contract";
import {
  createInvoice,
  getAdminInvoice,
  getProposalInvoice,
  getInquiryInvoices,
  saveInvoice,
  sendInvoice,
  changeInvoice,
} from "../lib/invoice-store";
export default async (request: Request, _context: Context) => {
  try {
    await requireAdmin();
    const url = new URL(request.url),
      id = url.searchParams.get("id"),
      proposal = url.searchParams.get("proposal"),
      inquiry = url.searchParams.get("inquiry");
    for (const v of [id, proposal, inquiry])
      if (v !== null && !z.string().uuid().safeParse(v).success)
        throw new HttpError(400, "Invalid invoice reference.");
    if (request.method === "GET") {
      if (id) return json({ invoice: await getAdminInvoice(id) });
      if (proposal)
        return json({ invoice: await getProposalInvoice(proposal) });
      if (inquiry) return json({ invoices: await getInquiryInvoices(inquiry) });
      throw new HttpError(400, "Choose an invoice, inquiry or proposal.");
    }
    if (request.method === "POST") {
      sameOrigin(request);
      const parsed = createInvoiceSchema.safeParse(await readJson(request));
      if (!parsed.success)
        throw new HttpError(422, "Choose an accepted proposal.");
      return json(
        { invoice: await createInvoice(parsed.data.proposalId) },
        201,
      );
    }
    if (request.method === "PATCH" && id) {
      sameOrigin(request);
      const input = await readJson(request, 128000);
      const save =
        typeof input === "object" &&
        input !== null &&
        "action" in input &&
        input.action === "save";
      if (save) {
        const parsed = draftSchema.safeParse(input);
        if (!parsed.success)
          throw new HttpError(
            422,
            "Check invoice fields.",
            fieldErrors(parsed.error),
          );
        return json({ invoice: await saveInvoice(id, parsed.data) });
      }
      const parsed = actionSchema.safeParse(input);
      if (!parsed.success)
        throw new HttpError(
          422,
          "Confirm this invoice action using its current saved version.",
        );
      return json({
        invoice:
          parsed.data.action === "send"
            ? await sendInvoice(id, parsed.data.updatedAt)
            : await changeInvoice(
                id,
                parsed.data.updatedAt,
                parsed.data.action,
              ),
      });
    }
    return new Response(null, {
      status: 405,
      headers: { Allow: "GET, POST, PATCH", "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof HttpError)
      return json(
        {
          error: error.message,
          ...(error.fields ? { fields: error.fields } : {}),
        },
        error.status,
      );
    console.error("Invoice service request failed.");
    return json(
      {
        error:
          "The invoice service is temporarily unavailable. Refresh before retrying.",
      },
      503,
    );
  }
};
