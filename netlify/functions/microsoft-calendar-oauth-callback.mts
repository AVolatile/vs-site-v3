import type { Context } from "@netlify/functions";
import {
  MICROSOFT_COOKIE,
  consumeMicrosoftState,
  exchangeMicrosoftCode,
} from "../lib/integrations/microsoft-auth";
import { publicUrl } from "../lib/public-url";
export default async (
  request: Request,
  _context: Context,
): Promise<Response> => {
  if (request.method !== "GET")
    return new Response(null, {
      status: 405,
      headers: { Allow: "GET", "Cache-Control": "no-store" },
    });
  let result = "failed";
  try {
    const url = new URL(request.url),
      state = url.searchParams.get("state") ?? "",
      cookie =
        (request.headers.get("cookie") ?? "")
          .split(";")
          .map((s) => s.trim())
          .find((s) => s.startsWith(MICROSOFT_COOKIE + "="))
          ?.slice(MICROSOFT_COOKIE.length + 1) ?? "";
    const consumed = await consumeMicrosoftState(state, cookie);
    const code = url.searchParams.get("code");
    if (!url.searchParams.has("error") && code && code.length <= 4096) {
      await exchangeMicrosoftCode(code, consumed);
      result = "connected";
    }
  } catch {
    /* Never echo OAuth query values or provider errors. State is one-time and browser-bound. */
  }
  return new Response(null, {
    status: 303,
    headers: {
      Location: publicUrl("/admin/settings/integrations/?outlook=" + result),
      "Set-Cookie": `${MICROSOFT_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    },
  });
};
