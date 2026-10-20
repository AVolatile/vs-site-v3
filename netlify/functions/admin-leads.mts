import type { Context } from "@netlify/functions";
import { z } from "zod";
import { requireAdmin } from "../lib/authorize";
import { HttpError, json, readJson, sameOrigin } from "../lib/http";
import {
  leadSchema,
  leadUpdateSchema,
  leadVersionSchema,
  convertLeadSchema,
  leadBrowseSchema,
} from "../../src/lib/leads/contract";
import { fieldErrors } from "../../src/lib/inquiries/contract";
import {
  createLead,
  getLead,
  listLeads,
  updateLead,
  deleteLead,
  convertLead,
  listLeadActivity,
} from "../lib/lead-store";

export default async (
  request: Request,
  _context: Context,
): Promise<Response> => {
  try {
    await requireAdmin();
    const params = new URL(request.url).searchParams,
      id = params.get("id");
    if (id !== null && !z.string().uuid().safeParse(id).success)
      throw new HttpError(400, "Choose a valid lead.");
    if (request.method === "GET") {
      if (id)
        return json({
          lead: await getLead(id),
          activity: await listLeadActivity(id),
        });
      const parsed = leadBrowseSchema.safeParse(Object.fromEntries(params));
      if (!parsed.success)
        throw new HttpError(
          422,
          "Check the lead filters.",
          fieldErrors(parsed.error),
        );
      return json(await listLeads(parsed.data));
    }
    if (["POST", "PATCH", "DELETE"].includes(request.method)) {
      sameOrigin(request);
      const body = await readJson(request, 128000);
      if (request.method === "POST" && !id) {
        const parsed = leadSchema.safeParse(body);
        if (!parsed.success)
          throw new HttpError(
            422,
            "Check the highlighted fields.",
            fieldErrors(parsed.error),
          );
        return json({ lead: await createLead(parsed.data) }, 201);
      }
      if (!id) throw new HttpError(400, "Choose a lead first.");
      if (request.method === "POST") {
        const parsed = convertLeadSchema.safeParse(body);
        if (!parsed.success) {
          const fields = Object.fromEntries(
            parsed.error.issues.map((issue) => [
              String(issue.path.at(-1) ?? "form"),
              issue.message,
            ]),
          );
          throw new HttpError(
            422,
            "Supply the actual contact and project details required for an inquiry.",
            fields,
          );
        }
        return json({
          lead: await convertLead(
            id,
            parsed.data.updatedAt,
            parsed.data.inquiry,
          ),
        });
      }
      if (request.method === "PATCH") {
        const parsed = leadUpdateSchema.safeParse(body);
        if (!parsed.success)
          throw new HttpError(
            422,
            "Check the highlighted fields.",
            fieldErrors(parsed.error),
          );
        const { updatedAt, ...input } = parsed.data;
        return json({ lead: await updateLead(id, input, updatedAt) });
      }
      const parsed = leadVersionSchema.safeParse(body);
      if (!parsed.success)
        throw new HttpError(422, "Reload the lead before deleting.");
      await deleteLead(id, parsed.data.updatedAt);
      return json({ deleted: true });
    }
    return new Response(null, {
      status: 405,
      headers: {
        Allow: "GET, POST, PATCH, DELETE",
        "Cache-Control": "no-store",
      },
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
    console.error("Lead service request failed.");
    return json(
      {
        error:
          "The lead request could not be confirmed. Reload before retrying.",
      },
      503,
    );
  }
};
