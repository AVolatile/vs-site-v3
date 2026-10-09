import type { Config, Context } from "@netlify/functions";
import { z } from "zod";
import { requireAdmin } from "../lib/authorize";
import { failure, HttpError, json, readJson, sameOrigin } from "../lib/http";
import {
  sendEmailSchema,
  previewEmailSchema,
  retryEmailSchema,
} from "../../src/lib/communications/contract";
import { fieldErrors } from "../../src/lib/inquiries/contract";
import {
  getMessage,
  listMessages,
  previewEmail,
  retryMessage,
  sendMessage,
} from "../lib/message-store";
export default async (
  request: Request,
  _context: Context,
): Promise<Response> => {
  try {
    await requireAdmin();
    const url = new URL(request.url),
      inquiry = url.searchParams.get("inquiry");
    if (!z.string().uuid().safeParse(inquiry).success)
      throw new HttpError(400, "Choose a valid inquiry.");
    const id = inquiry!;
    if (request.method === "GET") {
      const message = url.searchParams.get("message");
      if (message) {
        if (!z.string().uuid().safeParse(message).success)
          throw new HttpError(400, "Choose a valid message.");
        return json({ message: await getMessage(id, message) });
      }
      const page = z.coerce
        .number()
        .int()
        .min(1)
        .max(10000)
        .safeParse(url.searchParams.get("page") ?? 1);
      if (!page.success)
        throw new HttpError(400, "Choose a valid history page.");
      return json(await listMessages(id, page.data));
    }
    if (request.method === "POST") {
      sameOrigin(request);
      const body = await readJson(request, 128000);
      const action =
        typeof body === "object" && body !== null && "action" in body
          ? body.action
          : null;
      if (action === "retry") {
        const result = retryEmailSchema.safeParse(body);
        if (!result.success)
          throw new HttpError(422, "Choose a saved message to retry.");
        return json({ message: await retryMessage(id, result.data.messageId) });
      }
      if (action === "preview") {
        const result = previewEmailSchema.safeParse(body);
        if (!result.success)
          throw new HttpError(
            422,
            "Check the highlighted fields.",
            fieldErrors(result.error),
          );
        return json({ preview: await previewEmail(id, result.data) });
      }
      const result = sendEmailSchema.safeParse(body);
      if (!result.success)
        throw new HttpError(
          422,
          "Check the highlighted fields.",
          fieldErrors(result.error),
        );
      return json({ message: await sendMessage(id, result.data) });
    }
    return new Response(null, {
      status: 405,
      headers: { Allow: "GET, POST", "Cache-Control": "no-store" },
    });
  } catch (error) {
    return failure(error, "email");
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
