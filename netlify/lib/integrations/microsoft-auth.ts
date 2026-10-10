import { createHash } from "node:crypto";
import { query } from "../database";
import { runtimeValue } from "../runtime-env";
import { publicUrl } from "../public-url";
import { HttpError } from "../http";
import { encrypt, decrypt, digest, randomToken } from "./crypto";
import {
  providerRequest,
  ProviderError,
  object,
  text,
  errorCode,
  iso,
} from "./provider";
export const MICROSOFT_SCOPES = [
  "offline_access",
  "Calendars.ReadWrite",
  "User.Read",
];
function hasCalendarScopes(scope: string) {
  return ["User.Read", "Calendars.ReadWrite"].every((s) =>
    scope
      .split(" ")
      .some(
        (v) =>
          v.toLowerCase() === s.toLowerCase() ||
          v.toLowerCase() === "https://graph.microsoft.com/" + s.toLowerCase(),
      ),
  );
}
export const MICROSOFT_COOKIE = "__Host-vs-microsoft-oauth";
export async function microsoftConnection() {
  return (
    (
      await query(
        "SELECT * FROM integration_connections WHERE provider='outlook_calendar'",
      )
    )[0] ?? null
  );
}
export function microsoftConfig() {
  const clientId = runtimeValue("MICROSOFT_CLIENT_ID"),
    clientSecret = runtimeValue("MICROSOFT_CLIENT_SECRET");
  const fallback = publicUrl(
    "/.netlify/functions/microsoft-calendar-oauth-callback",
  );
  const redirectUri = runtimeValue("MICROSOFT_REDIRECT_URI") || fallback;
  try {
    const u = new URL(redirectUri);
    if (
      u.origin !== new URL(fallback).origin ||
      u.pathname !== "/.netlify/functions/microsoft-calendar-oauth-callback" ||
      u.search ||
      u.hash ||
      u.username ||
      u.password
    )
      throw Error();
  } catch {
    throw new HttpError(
      503,
      "Set MICROSOFT_REDIRECT_URI to the callback on the SITE_URL origin.",
    );
  }
  if (!clientId || !clientSecret)
    throw new HttpError(503, "Configure Microsoft Calendar OAuth in Netlify.");
  const tenant = runtimeValue("MICROSOFT_TENANT_ID") || "common";
  if (
    !/^(common|consumers|organizations|[a-f0-9-]{36}|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/.test(
      tenant,
    )
  )
    throw new HttpError(503, "Configure a valid Microsoft tenant authority.");
  return { clientId, clientSecret, redirectUri, tenant };
}
export async function beginMicrosoftOAuth() {
  const config = microsoftConfig(),
    state = randomToken(),
    browser = randomToken(),
    verifier = randomToken();
  await query(
    "DELETE FROM integration_oauth_states WHERE expires_at<clock_timestamp()",
  );
  await query(
    "INSERT INTO integration_oauth_states(state_hash,browser_hash,encrypted_verifier,redirect_uri,expires_at) VALUES($1,$2,$3,$4,clock_timestamp()+interval '10 minutes')",
    [
      digest(state),
      digest(browser),
      encrypt(
        JSON.stringify({ verifier, tenant: config.tenant }),
        "microsoft-pkce",
      ),
      config.redirectUri,
    ],
  );
  const url = new URL(
    `https://login.microsoftonline.com/${config.tenant}/oauth2/v2.0/authorize`,
  );
  url.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: MICROSOFT_SCOPES.join(" "),
    response_mode: "query",
    prompt: "select_account",
    state,
    code_challenge: createHash("sha256").update(verifier).digest("base64url"),
    code_challenge_method: "S256",
  }).toString();
  return {
    url: url.href,
    cookie: `${MICROSOFT_COOKIE}=${browser}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
  };
}
export async function consumeMicrosoftState(state: string, browser: string) {
  if (
    !/^[A-Za-z0-9_-]{43}$/.test(state) ||
    !/^[A-Za-z0-9_-]{43}$/.test(browser)
  )
    throw new HttpError(
      400,
      "The Microsoft connection request expired. Start again.",
    );
  const row = (
    await query(
      "DELETE FROM integration_oauth_states WHERE state_hash=$1 AND browser_hash=$2 AND expires_at>clock_timestamp() RETURNING *",
      [digest(state), digest(browser)],
    )
  )[0];
  if (!row)
    throw new HttpError(
      400,
      "The Microsoft connection request expired. Start again.",
    );
  const decoded = JSON.parse(
    decrypt(String(row.encrypted_verifier), "microsoft-pkce"),
  );
  if (decoded.tenant !== microsoftConfig().tenant)
    throw new HttpError(
      400,
      "Restart Microsoft connection after a configuration change.",
    );
  return {
    verifier: text(decoded.verifier),
    redirectUri: String(row.redirect_uri),
  };
}
async function tokenRequest(
  parameters: Record<string, string>,
  deadline?: AbortSignal,
) {
  const config = microsoftConfig();
  const data = object(
    await providerRequest(
      `https://login.microsoftonline.com/${config.tenant}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          ...parameters,
          client_id: config.clientId,
          client_secret: config.clientSecret,
          scope: MICROSOFT_SCOPES.join(" "),
        }),
      },
      false,
      deadline,
    ),
  );
  if (data.token_type && String(data.token_type).toLowerCase() !== "bearer")
    throw new ProviderError("invalid_response");
  const expires = Number(data.expires_in);
  if (!Number.isInteger(expires) || expires <= 0 || expires > 86400)
    throw new ProviderError("invalid_response");
  return {
    access: text(data.access_token, 8192),
    refresh: data.refresh_token ? text(data.refresh_token, 8192) : null,
    expires: new Date(Date.now() + expires * 1000).toISOString(),
    scope: data.scope ? text(data.scope, 4096) : "",
  };
}
export async function exchangeMicrosoftCode(
  code: string,
  state: { verifier: string; redirectUri: string },
) {
  if (state.redirectUri !== microsoftConfig().redirectUri)
    throw new HttpError(
      400,
      "Restart Microsoft connection after a configuration change.",
    );
  const deadline = AbortSignal.timeout(14000);
  const token = await tokenRequest(
    {
      grant_type: "authorization_code",
      code,
      redirect_uri: state.redirectUri,
      code_verifier: state.verifier,
    },
    deadline,
  );
  if (!token.refresh || !hasCalendarScopes(token.scope))
    throw new ProviderError("reconnect_required");
  const metadata = object(
    await graphRequest(
      token.access,
      "me?$select=id,displayName,mail,userPrincipalName",
      {},
      deadline,
    ),
  );
  const accountId = text(metadata.id, 254);
  const account = text(metadata.mail || metadata.userPrincipalName, 254);
  const calendars = await calendarsWithAccess(token.access, deadline);
  const previous = await microsoftConnection();
  const preferred =
    (previous?.account_id === accountId
      ? calendars.find((c) => c.id === previous.selected_calendar_id)
      : null) ||
    calendars.find((c) => c.primary) ||
    calendars[0];
  if (!preferred) throw new ProviderError("calendar_missing");
  await query(
    `INSERT INTO integration_connections(provider,status,account_id,account_email,account_name,encrypted_access_token,encrypted_refresh_token,token_expires_at,scope,selected_calendar_id,selected_calendar_name,last_success_at)
     VALUES('outlook_calendar','connected',$1,$2,$3,$4,$5,$6,$7,$8,$9,clock_timestamp())
     ON CONFLICT(provider) DO UPDATE SET status='connected',generation=gen_random_uuid(),updated_at=clock_timestamp(),account_id=EXCLUDED.account_id,account_email=EXCLUDED.account_email,account_name=EXCLUDED.account_name,encrypted_access_token=EXCLUDED.encrypted_access_token,encrypted_refresh_token=EXCLUDED.encrypted_refresh_token,token_expires_at=EXCLUDED.token_expires_at,scope=EXCLUDED.scope,
     selected_calendar_id=EXCLUDED.selected_calendar_id,selected_calendar_name=EXCLUDED.selected_calendar_name,
     last_success_at=clock_timestamp(),last_error_at=NULL,last_error_code=NULL`,
    [
      accountId,
      account,
      text(metadata.displayName || account, 200),
      encrypt(token.access, "microsoft-access"),
      encrypt(token.refresh, "microsoft-refresh"),
      token.expires,
      token.scope,
      preferred.id,
      preferred.name,
    ],
  );
}

export async function microsoftAccess(
  connection: Record<string, unknown>,
  deadline?: AbortSignal,
) {
  if (
    connection.status !== "connected" ||
    !connection.encrypted_refresh_token
  ) {
    await query(
      "UPDATE integration_connections SET status='reconnect_required',last_error_code='reconnect_required',last_error_at=clock_timestamp() WHERE id=$1 AND generation=$2 AND status='connected'",
      [connection.id, connection.generation],
    );
    throw new ProviderError("reconnect_required");
  }
  if (
    connection.encrypted_access_token &&
    connection.token_expires_at &&
    Date.parse(iso(connection.token_expires_at)) > Date.now() + 60000
  )
    return decrypt(
      String(connection.encrypted_access_token),
      "microsoft-access",
    );
  try {
    const token = await tokenRequest(
      {
        grant_type: "refresh_token",
        refresh_token: decrypt(
          String(connection.encrypted_refresh_token),
          "microsoft-refresh",
        ),
      },
      deadline,
    );
    if (token.scope && !hasCalendarScopes(token.scope))
      throw new ProviderError("reconnect_required", 400);
    const access = encrypt(token.access, "microsoft-access"),
      refresh = token.refresh
        ? encrypt(token.refresh, "microsoft-refresh")
        : null;
    const rows = await query(
      "UPDATE integration_connections SET encrypted_access_token=$1,encrypted_refresh_token=COALESCE($2,encrypted_refresh_token),token_expires_at=$3 WHERE id=$4 AND generation=$5 AND status='connected' AND encrypted_refresh_token=$6 RETURNING *",
      [
        access,
        refresh,
        token.expires,
        connection.id,
        connection.generation,
        connection.encrypted_refresh_token,
      ],
    );
    if (!rows.length) {
      const latest = await microsoftConnection();
      if (
        latest?.generation === connection.generation &&
        latest.status === "connected" &&
        latest.encrypted_access_token &&
        latest.token_expires_at &&
        Date.parse(iso(latest.token_expires_at)) > Date.now() + 60000
      ) {
        Object.assign(connection, latest);
        return decrypt(
          String(latest.encrypted_access_token),
          "microsoft-access",
        );
      }
      throw new ProviderError("reconnect_required");
    }
    Object.assign(connection, rows[0]);
    return token.access;
  } catch (error) {
    // invalid_grant is a definite 400 from the token endpoint; transient failures stay connected.
    if (error instanceof ProviderError && [400, 401].includes(error.status))
      await query(
        "UPDATE integration_connections SET status='reconnect_required',last_error_code='reconnect_required',last_error_at=clock_timestamp() WHERE id=$1 AND generation=$2",
        [connection.id, connection.generation],
      );
    throw error instanceof ProviderError && [400, 401].includes(error.status)
      ? new ProviderError("reconnect_required")
      : error;
  }
}
// nextLink URLs are accepted only on the fixed Graph origin and v1.0 path.
export function graphPath(value: string) {
  const url = new URL(value, "https://graph.microsoft.com/v1.0/");
  if (
    url.origin !== "https://graph.microsoft.com" ||
    !url.pathname.startsWith("/v1.0/") ||
    url.username ||
    url.password ||
    url.hash
  )
    throw new ProviderError("invalid_response");
  return url.href;
}
async function graphRequest(
  access: string,
  path: string,
  init: RequestInit = {},
  deadline?: AbortSignal,
) {
  return providerRequest(
    graphPath(path),
    {
      ...init,
      headers: {
        ...init.headers,
        "Content-Type": "application/json",
        Authorization: "Bearer " + access,
        Prefer: 'outlook.timezone="UTC", IdType="ImmutableId"',
      },
    },
    (init.method || "GET") !== "POST",
    deadline,
  );
}
export async function microsoftApi(
  connection: Record<string, unknown>,
  path: string,
  init: RequestInit = {},
  deadline?: AbortSignal,
) {
  try {
    try {
      return await graphRequest(
        await microsoftAccess(connection, deadline),
        path,
        init,
        deadline,
      );
    } catch (e) {
      if (!(e instanceof ProviderError && e.status === 401)) throw e;
      connection.encrypted_access_token = null;
      return await graphRequest(
        await microsoftAccess(connection, deadline),
        path,
        init,
        deadline,
      );
    }
  } catch (error) {
    const code = errorCode(error);
    if (!["not_found", "gone", "conflict"].includes(code))
      await query(
        "UPDATE integration_connections SET last_error_code=$1::text,last_error_at=clock_timestamp(),status=CASE WHEN $1::text='reconnect_required' THEN 'reconnect_required' ELSE status END WHERE id=$2 AND generation=$3",
        [code, connection.id, connection.generation],
      );
    throw error;
  }
}
async function calendarsWithAccess(access: string, deadline?: AbortSignal) {
  return collectCalendars((path) => graphRequest(access, path, {}, deadline));
}
async function collectCalendars(request: (path: string) => Promise<unknown>) {
  const items: { id: string; name: string; primary: boolean }[] = [];
  let path = "me/calendars?$select=id,name,canEdit,isDefaultCalendar&$top=100";
  for (let n = 0; n < 20; n++) {
    const data = object(await request(path));
    if (!Array.isArray(data.value)) throw new ProviderError("invalid_response");
    for (const value of data.value) {
      const c = object(value);
      if (c.canEdit === true)
        items.push({
          id: text(c.id, 1024),
          name: text(c.name, 300),
          primary: c.isDefaultCalendar === true,
        });
    }
    if (!data["@odata.nextLink"]) return items;
    path = graphPath(text(data["@odata.nextLink"], 8192));
  }
  throw new ProviderError("invalid_response");
}
export async function listMicrosoftCalendars(
  connection: Record<string, unknown>,
) {
  const deadline = AbortSignal.timeout(10000);
  return collectCalendars((path) =>
    microsoftApi(connection, path, {}, deadline),
  );
}
