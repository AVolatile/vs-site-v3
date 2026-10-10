import { query } from "../database";
import {
  microsoftConnection,
  microsoftConfig,
  listMicrosoftCalendars,
} from "./microsoft-auth";
import { zoomConfig, zoomToken, zoomApi } from "./zoom";
import { ProviderError, errorCode, safeMessage, object, iso } from "./provider";
import { calendarProvider } from "./calendar";
const clearBusyCache = calendarProvider.clearCache;
import type {
  IntegrationSettings,
  IntegrationHealth,
} from "../../../src/lib/integrations/contract";
const health = (
  row: Record<string, unknown> | null,
  status: string,
): IntegrationHealth => ({
  status,
  accountEmail: row?.account_email ? String(row.account_email) : null,
  accountName: row?.account_name ? String(row.account_name) : null,
  calendarId: row?.selected_calendar_id
    ? String(row.selected_calendar_id)
    : null,
  calendarName: row?.selected_calendar_name
    ? String(row.selected_calendar_name)
    : null,
  lastSuccessAt: row?.last_success_at ? iso(row.last_success_at) : null,
  error: safeMessage(row?.last_error_code ? String(row.last_error_code) : null),
});
export async function integrationSettings(): Promise<IntegrationSettings> {
  const outlook = await microsoftConnection(),
    zoom =
      (
        await query(
          "SELECT * FROM integration_connections WHERE provider='zoom'",
        )
      )[0] ?? null;
  let calendars: IntegrationSettings["calendars"] = [];
  if (outlook?.status === "connected") {
    try {
      calendars = await listMicrosoftCalendars(outlook);
    } catch (e) {
      outlook.last_error_code = errorCode(e);
      if (e instanceof ProviderError && e.code === "reconnect_required")
        outlook.status = "reconnect_required";
    }
  }
  const g = health(outlook, String(outlook?.status || "disconnected"));
  try {
    microsoftConfig();
  } catch {
    g.error =
      g.error || "Configure Outlook Calendar OAuth and SITE_URL in Netlify.";
  }
  return {
    outlook: g,
    zoom: {
      ...health(zoom, zoomConfig() ? "configured" : "not_configured"),
      accountName: zoomConfig()?.user ?? null,
    },
    calendars,
  };
}
export async function selectCalendar(id: string) {
  const connection = await microsoftConnection();
  if (!connection || connection.status !== "connected")
    throw new ProviderError("reconnect_required");
  const calendar = (await listMicrosoftCalendars(connection)).find(
    (c) => c.id === id,
  );
  if (!calendar) throw new ProviderError("calendar_missing");
  const rows = await query(
    "UPDATE integration_connections SET selected_calendar_id=$1,selected_calendar_name=$2,generation=gen_random_uuid(),updated_at=clock_timestamp(),last_error_code=NULL WHERE id=$3 AND generation=$4 AND status='connected' RETURNING id",
    [calendar.id, calendar.name, connection.id, connection.generation],
  );
  if (!rows.length) throw new ProviderError("reconnect_required");
  clearBusyCache();
}
export async function disconnectOutlook() {
  const c = await microsoftConnection();
  if (!c) return;
  // Clear credentials first; failure to revoke remotely cannot keep local authorization active.
  const removed = await query(
    "UPDATE integration_connections SET status='disconnected',generation=gen_random_uuid(),updated_at=clock_timestamp(),encrypted_access_token=NULL,encrypted_refresh_token=NULL,token_expires_at=NULL,scope=NULL,selected_calendar_id=NULL,selected_calendar_name=NULL,last_error_code=NULL WHERE id=$1 AND generation=$2 RETURNING id",
    [c.id, c.generation],
  );
  if (!removed.length) throw new ProviderError("reconnect_required");
  clearBusyCache();
  // Microsoft has no per-app token revocation endpoint for this delegated grant.
  // Do not revoke all user sessions. Account consent removal remains a manual step.
}
export async function testIntegration(provider: "outlook_calendar" | "zoom") {
  try {
    if (provider === "outlook_calendar") {
      await calendarProvider.testConnection();
    } else {
      const c = zoomConfig();
      if (!c) throw new ProviderError("configuration");
      const r = object(
        await zoomApi(
          await zoomToken(),
          "users/" +
            encodeURIComponent(c.user) +
            "/meetings?page_size=1&type=scheduled",
        ),
      );
      if (!Array.isArray(r.meetings))
        throw new ProviderError("invalid_response");
    }
    await query(
      "INSERT INTO integration_connections(provider,last_success_at) VALUES($1,clock_timestamp()) ON CONFLICT(provider) DO UPDATE SET last_success_at=clock_timestamp(),last_error_code=NULL,last_error_at=NULL",
      [provider],
    );
  } catch (e) {
    await query(
      "INSERT INTO integration_connections(provider,last_error_code,last_error_at) VALUES($1,$2,clock_timestamp()) ON CONFLICT(provider) DO UPDATE SET last_error_code=$2,last_error_at=clock_timestamp()",
      [provider, errorCode(e)],
    );
    throw e;
  }
}
