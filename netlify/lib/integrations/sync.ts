import { digest } from "./crypto";
import { randomUUID } from "node:crypto";
import { query } from "../database";
import { calendarProvider } from "./calendar";
import {
  zoomConfig,
  zoomToken,
  zoomApi,
  zoomBody,
  zoomMarker,
  getZoomMeeting,
  findZoomMeeting,
  meetingData,
} from "./zoom";
import { ProviderError, errorCode, object, text } from "./provider";
type Row = Record<string, unknown>;
async function health(provider: string, code: string | null) {
  await query(
    `INSERT INTO integration_connections(provider,status,last_success_at,last_error_at,last_error_code) VALUES($1,'disconnected',CASE WHEN $2::text IS NULL THEN clock_timestamp() ELSE NULL END,CASE WHEN $2::text IS NOT NULL THEN clock_timestamp() ELSE NULL END,$2)
 ON CONFLICT(provider) DO UPDATE SET last_success_at=CASE WHEN $2::text IS NULL THEN clock_timestamp() ELSE integration_connections.last_success_at END,last_error_at=CASE WHEN $2::text IS NULL THEN NULL ELSE clock_timestamp() END,last_error_code=$2`,
    [provider, code],
  );
}
export async function syncBooking(id: string) {
  const lease = randomUUID(),
    deadline = AbortSignal.timeout(14000);
  const row = (
    await query(
      `UPDATE bookings SET sync_lease=$2,sync_lease_until=clock_timestamp()+interval '90 seconds' WHERE id=$1 AND (sync_lease_until IS NULL OR sync_lease_until<clock_timestamp()) RETURNING *`,
      [id, lease],
    )
  )[0];
  if (!row) return;
  const revision = row.sync_revision;
  const company = (
    await query("SELECT company FROM inquiries WHERE id=$1", [row.inquiry_id])
  )[0];
  row.company = company?.company ?? "";
  const status = async (
    provider: "calendar" | "zoom",
    state: string,
    error: string | null = null,
  ) => {
    await query(
      `UPDATE bookings SET ${provider}_sync_status=CASE WHEN sync_revision=$3 THEN $4 ELSE 'pending' END,${provider}_sync_error=CASE WHEN sync_revision=$3 THEN $5 ELSE NULL END,${provider}_last_synced_at=CASE WHEN $4='synced' AND sync_revision=$3 THEN clock_timestamp() ELSE ${provider}_last_synced_at END WHERE id=$1 AND sync_lease=$2`,
      [id, lease, revision, state, error],
    );
  };
  const identifiers = async (sql: string, values: unknown[]) => {
    const result = await query(
      `UPDATE bookings SET ${sql} WHERE id=$1 AND sync_lease=$2 RETURNING *`,
      [id, lease, ...values],
    );
    if (!result.length) throw new ProviderError("sync_unconfirmed");
    for (const key of [
      "calendar_id",
      "calendar_account_email",
      "calendar_account_id",
      "calendar_event_generation",
      "calendar_create_attempted_at",
      "calendar_event_id",
      "zoom_meeting_id",
      "zoom_join_url",
      "zoom_host_user",
      "zoom_account_fingerprint",
      "zoom_create_attempted_at",
    ])
      row[key] = result[0][key];
  };
  try {
    try {
      if (row.meeting_type !== "zoom") await status("zoom", "not_required");
      else if (!zoomConfig()) {
        await status("zoom", "failed", "configuration");
      } else {
        const config = zoomConfig()!;
        const accountFingerprint = digest(config.account + "|" + config.user);
        if (
          row.zoom_account_fingerprint &&
          row.zoom_account_fingerprint !== accountFingerprint
        )
          throw new ProviderError("account_changed");
        if (row.zoom_host_user && row.zoom_host_user !== config.user)
          throw new ProviderError("account_changed");
        const token = await zoomToken(deadline);
        let meeting = row.zoom_meeting_id
          ? await getZoomMeeting(token, String(row.zoom_meeting_id), deadline)
          : null;
        if (meeting && meeting.agenda !== zoomMarker(row))
          throw new ProviderError("conflict");
        const knownMissing = !!row.zoom_meeting_id && !meeting;
        if (knownMissing && row.status === "scheduled") {
          // A definitive GET 404 allows replacing a deleted meeting. An uncertain POST does not.
          await identifiers(
            "zoom_meeting_id=NULL,zoom_join_url=NULL,zoom_create_attempted_at=NULL",
            [],
          );
        }
        if (!meeting && row.zoom_create_attempted_at && !knownMissing)
          meeting = await findZoomMeeting(token, row, deadline);
        if (row.status === "cancelled") {
          if (!meeting && row.zoom_create_attempted_at && !knownMissing)
            throw new ProviderError("sync_unconfirmed");
          if (meeting) {
            const data = meetingData(meeting);
            await identifiers("zoom_meeting_id=$3,zoom_join_url=NULL", [
              data.id,
            ]);
            try {
              await zoomApi(
                token,
                "meetings/" + data.id,
                { method: "DELETE" },
                true,
                deadline,
              );
            } catch (e) {
              if (!(e instanceof ProviderError && e.code === "not_found"))
                throw e;
            }
          }
          await identifiers("zoom_join_url=NULL", []);
          await status("zoom", "synced");
        } else if (row.status === "completed") {
          // Completion preserves the provider history; no create/update/delete.
          await status("zoom", row.zoom_meeting_id ? "synced" : "not_required");
        } else {
          if (!meeting) {
            if (row.zoom_create_attempted_at)
              throw new ProviderError("sync_unconfirmed");
            await identifiers(
              "zoom_host_user=$3,zoom_account_fingerprint=$4,zoom_create_attempted_at=clock_timestamp()",
              [config.user, accountFingerprint],
            );
            try {
              meeting = object(
                await zoomApi(
                  token,
                  "users/" + encodeURIComponent(config.user) + "/meetings",
                  { method: "POST", body: JSON.stringify(zoomBody(row)) },
                  false,
                  deadline,
                ),
              );
            } catch (e) {
              // A definite 4xx rejection (except timeout) created nothing; allow a later retry.
              if (
                e instanceof ProviderError &&
                e.status >= 400 &&
                e.status < 500 &&
                ![408, 409].includes(e.status)
              )
                await identifiers("zoom_create_attempted_at=NULL", []);
              throw e;
            }
          } else
            await zoomApi(
              token,
              "meetings/" + text(String(meeting.id)),
              { method: "PATCH", body: JSON.stringify(zoomBody(row)) },
              true,
              deadline,
            );
          const data = meetingData(meeting);
          await identifiers(
            "zoom_meeting_id=$3,zoom_join_url=$4,zoom_host_user=$5,zoom_account_fingerprint=$6",
            [data.id, data.url, config.user, accountFingerprint],
          );
          await status("zoom", "synced");
        }
        await health("zoom", null);
      }
    } catch (e) {
      await status(
        "zoom",
        "failed",
        e instanceof ProviderError && e.code === "reconnect_required"
          ? "configuration"
          : errorCode(e),
      );
      await health(
        "zoom",
        e instanceof ProviderError && e.code === "reconnect_required"
          ? "configuration"
          : errorCode(e),
      );
    }
    // Neon is already committed. Resolve Zoom independently first so Outlook receives its URL.
    try {
      const connection = await calendarProvider.getConnection();
      if (!connection || connection.status === "disconnected") {
        await status(
          "calendar",
          row.calendar_event_id || row.calendar_create_attempted_at
            ? "failed"
            : "not_required",
          row.calendar_event_id || row.calendar_create_attempted_at
            ? "reconnect_required"
            : null,
        );
      } else {
        if (connection.status !== "connected")
          throw new ProviderError("reconnect_required");
        if (
          row.calendar_account_id &&
          row.calendar_account_id !== connection.account_id
        )
          throw new ProviderError("account_changed");
        const calendar = String(
          row.calendar_id || connection.selected_calendar_id || "",
        );
        if (!calendar) throw new ProviderError("calendar_missing");
        await identifiers(
          "calendar_id=$3,calendar_account_email=$4,calendar_account_id=$5",
          [calendar, connection.account_email, connection.account_id],
        );
        let event = row.calendar_event_id
          ? await calendarProvider.getEvent(
              connection,
              calendar,
              String(row.calendar_event_id),
              deadline,
            )
          : null;
        const knownMissing =
          !!row.calendar_event_id && (!event || event.isCancelled === true);
        if (event && !calendarProvider.ownsEvent(event, row))
          throw new ProviderError("conflict");
        if (knownMissing && row.status === "scheduled") {
          // Definite absence permits replacement with a new transactionId generation.
          await identifiers(
            "calendar_event_id=NULL,calendar_create_attempted_at=NULL,calendar_event_generation=calendar_event_generation+1",
            [],
          );
          event = null;
        }
        if (!event && row.calendar_create_attempted_at && !knownMissing)
          event = await calendarProvider.findEvent(
            connection,
            calendar,
            row,
            deadline,
          );
        if (event) await identifiers("calendar_event_id=$3", [text(event.id)]);
        if (row.status === "cancelled") {
          if (!event && row.calendar_create_attempted_at && !knownMissing)
            throw new ProviderError("sync_unconfirmed");
          if (event && event.isCancelled !== true)
            await calendarProvider.deleteEvent(
              connection,
              calendar,
              event,
              row,
              deadline,
            );
        } else if (row.status === "completed") {
          // Keep provider history. Do not create a new event for a completed call.
          if (row.calendar_event_id && (!event || event.isCancelled === true))
            throw new ProviderError("not_found");
        } else {
          // Do not publish an outdated Zoom URL after an unsuccessful reschedule/update.
          const current = (
            await query(
              "SELECT zoom_sync_status,sync_revision FROM bookings WHERE id=$1",
              [id],
            )
          )[0];
          const url =
            current?.zoom_sync_status === "synced" &&
            current.sync_revision === revision &&
            row.zoom_join_url
              ? String(row.zoom_join_url)
              : null;
          if (event)
            await calendarProvider.updateEvent(
              connection,
              calendar,
              event,
              row,
              url,
              deadline,
            );
          else {
            if (row.calendar_create_attempted_at)
              throw new ProviderError("sync_unconfirmed");
            await identifiers(
              "calendar_create_attempted_at=clock_timestamp()",
              [],
            );
            try {
              event = await calendarProvider.createEvent(
                connection,
                calendar,
                row,
                url,
                deadline,
              );
              await identifiers("calendar_event_id=$3", [text(event.id)]);
            } catch (e) {
              if (
                e instanceof ProviderError &&
                e.status >= 400 &&
                e.status < 500 &&
                ![408, 409].includes(e.status)
              )
                await identifiers("calendar_create_attempted_at=NULL", []);
              throw e;
            }
          }
        }
        await status(
          "calendar",
          row.status === "completed" && !event ? "not_required" : "synced",
        );
        await health(calendarProvider.name, null);
        calendarProvider.clearCache();
      }
    } catch (e) {
      await status("calendar", "failed", errorCode(e));
      await health(calendarProvider.name, errorCode(e));
      calendarProvider.clearCache();
    }
  } finally {
    await query(
      "UPDATE bookings SET sync_lease=NULL,sync_lease_until=NULL WHERE id=$1 AND sync_lease=$2",
      [id, lease],
    );
  }
}
// Never let provider/metadata persistence failure turn a committed booking into a failed booking.
export async function attemptBookingSync(id: string) {
  try {
    await syncBooking(id);
  } catch {
    /* The transactionally persisted pending status remains retryable. */
  }
}
