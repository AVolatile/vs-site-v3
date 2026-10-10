import { runtimeValue } from "../runtime-env";
import { providerRequest, ProviderError, object, text, iso } from "./provider";
export function zoomConfig() {
  const account = runtimeValue("ZOOM_ACCOUNT_ID"),
    client = runtimeValue("ZOOM_CLIENT_ID"),
    secret = runtimeValue("ZOOM_CLIENT_SECRET"),
    user = runtimeValue("ZOOM_USER_ID");
  return account && client && secret && user
    ? { account, client, secret, user }
    : null;
}
export async function zoomToken(deadline?: AbortSignal) {
  const c = zoomConfig();
  if (!c) throw new ProviderError("configuration");
  const data = object(
    await providerRequest(
      "https://zoom.us/oauth/token",
      {
        method: "POST",
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(c.client + ":" + c.secret).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "account_credentials",
          account_id: c.account,
        }),
      },
      true,
      deadline,
    ),
  );
  return text(data.access_token, 8192);
}
export async function zoomApi(
  token: string,
  path: string,
  init: RequestInit = {},
  retry = true,
  deadline?: AbortSignal,
) {
  return providerRequest(
    "https://api.zoom.us/v2/" + path,
    {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
        ...init.headers,
      },
    },
    retry,
    deadline,
  );
}
export const zoomMarker = (row: Record<string, unknown>) =>
  "Volatile booking " + String(row.id);
export function zoomBody(row: Record<string, unknown>) {
  return {
    topic: `Volatile Solutions — Discovery Call — ${row.client_name}`,
    type: 2,
    start_time: iso(row.start_at),
    duration: Math.ceil(
      (Date.parse(iso(row.end_at)) - Date.parse(iso(row.start_at))) / 60000,
    ),
    timezone: row.timezone,
    agenda: zoomMarker(row),
    settings: {
      waiting_room: true,
      join_before_host: false,
      auto_recording: "none",
      approval_type: 2,
    },
  };
}
export function joinUrl(value: unknown) {
  const s = text(value, 2048);
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    throw new ProviderError("invalid_response");
  }
  if (
    u.protocol !== "https:" ||
    u.username ||
    u.password ||
    u.hash ||
    !/(^|\.)zoom\.(us|com)$/.test(u.hostname) ||
    !/^\/j\/\d+/.test(u.pathname)
  )
    throw new ProviderError("invalid_response");
  return u.href;
}
export function meetingData(value: unknown) {
  const data = object(value),
    id = String(data.id);
  if (!/^\d{9,15}$/.test(id)) throw new ProviderError("invalid_response");
  return { id, url: joinUrl(data.join_url), raw: data };
}
export async function getZoomMeeting(
  token: string,
  id: string,
  deadline?: AbortSignal,
) {
  try {
    return object(
      await zoomApi(
        token,
        "meetings/" + encodeURIComponent(id),
        {},
        true,
        deadline,
      ),
    );
  } catch (e) {
    if (e instanceof ProviderError && e.code === "not_found") return null;
    throw e;
  }
}
export async function findZoomMeeting(
  token: string,
  row: Record<string, unknown>,
  deadline?: AbortSignal,
) {
  const c = zoomConfig()!;
  let page = "";
  let found: Record<string, unknown> | null = null;
  for (let n = 0; n < 20; n++) {
    const data = object(
      await zoomApi(
        token,
        "users/" +
          encodeURIComponent(c.user) +
          "/meetings?" +
          new URLSearchParams({
            type: "scheduled",
            page_size: "100",
            ...(page ? { next_page_token: page } : {}),
          }),
        {},
        true,
        deadline,
      ),
    );
    if (!Array.isArray(data.meetings))
      throw new ProviderError("invalid_response");
    for (const value of data.meetings) {
      let candidate = object(value);
      if (
        candidate.agenda !== zoomMarker(row) &&
        candidate.topic !== zoomBody(row).topic
      )
        continue;
      if (candidate.agenda !== zoomMarker(row))
        candidate =
          (await getZoomMeeting(token, text(String(candidate.id)), deadline)) ??
          {};
      if (candidate.agenda === zoomMarker(row)) {
        if (found) throw new ProviderError("conflict");
        found = candidate;
      }
    }
    if (!data.next_page_token) return found;
    page = text(data.next_page_token);
  }
  throw new ProviderError("invalid_response");
}
