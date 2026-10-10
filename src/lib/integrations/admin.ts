import { setupBookingAdmin } from "@/lib/bookings/admin-session";
import { confirmBookingAction } from "@/lib/bookings/confirmation";
import type { IntegrationSettings } from "./contract";
export async function setupIntegrations() {
  const found = document.querySelector<HTMLElement>(
    "[data-integration-settings]",
  );
  if (!found) return;
  const root: HTMLElement = found;
  const el = <T extends HTMLElement = HTMLElement>(s: string) =>
    root.querySelector<T>(s)!;
  const message = el("[data-integration-feedback]");
  let busy = false,
    epoch = 0;
  const announce = (value: string, error = false) => {
    message.textContent = value;
    message.setAttribute("role", error ? "alert" : "status");
  };
  const clear = () => {
    epoch++;
    el("[data-integration-private]").hidden = true;
    for (const e of root.querySelectorAll<HTMLElement>(
      "[data-outlook-health],[data-outlook-account],[data-outlook-calendar],[data-outlook-success],[data-outlook-error],[data-zoom-health],[data-zoom-account],[data-zoom-success],[data-zoom-error]",
    ))
      e.textContent = "";
    el<HTMLSelectElement>('[name="calendarId"]').replaceChildren();
    announce("");
  };
  const session = await setupBookingAdmin(clear);
  if (!session) return;
  const last = (value: string | null) =>
    value
      ? "Last successful connection or sync: " +
        new Intl.DateTimeFormat("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(value))
      : "No successful sync recorded yet.";
  function render(data: IntegrationSettings) {
    el("[data-integration-private]").hidden = false;
    const outlook = data.outlook,
      zoom = data.zoom;
    el("[data-outlook-health]").textContent =
      {
        connected: "Connected",
        disconnected: "Not connected",
        reconnect_required: "Reconnect required",
      }[outlook.status] || "Not connected";
    el("[data-outlook-account]").textContent = outlook.accountEmail || "";
    el("[data-outlook-calendar]").textContent = outlook.calendarName
      ? "Selected calendar: " + outlook.calendarName
      : "";
    el("[data-outlook-success]").textContent = last(outlook.lastSuccessAt);
    el("[data-outlook-error]").textContent = outlook.error || "";
    const connect = el('[data-integration-action="connect"]');
    connect
      .querySelectorAll<HTMLElement>(
        ".ui-button-text-default,.ui-button-text-hover",
      )
      .forEach(
        (e) =>
          (e.textContent =
            outlook.status === "disconnected"
              ? "Connect Outlook Calendar"
              : "Reconnect Outlook Calendar"),
      );
    el('[data-integration-action="disconnect"]').hidden =
      outlook.status === "disconnected";
    el('[data-integration-action="test-outlook"]').hidden =
      outlook.status !== "connected";
    el("[data-calendar-select]").hidden = !data.calendars.length;
    const select = el<HTMLSelectElement>('[name="calendarId"]');
    select.replaceChildren(
      ...data.calendars.map(
        (c) => new Option(c.name + (c.primary ? " (Primary)" : ""), c.id),
      ),
    );
    select.value = outlook.calendarId || "";
    el("[data-zoom-health]").textContent =
      zoom.status === "configured" ? "Configured" : "Not configured";
    el("[data-zoom-account]").textContent = zoom.accountName
      ? "Host: " + zoom.accountName
      : "";
    el("[data-zoom-success]").textContent = last(zoom.lastSuccessAt);
    el("[data-zoom-error]").textContent = zoom.error || "";
    el('[data-integration-action="test-zoom"]').hidden =
      zoom.status !== "configured";
  }
  async function action(body: Record<string, unknown>) {
    if (busy || !session!.active()) return;
    if (
      body.action === "disconnect" &&
      !(await confirmBookingAction({
        title: "Disconnect Outlook Calendar?",
        message:
          "CRM bookings stay intact. Calendar busy blocking stops, and existing Outlook events are retained.",
        action: "Disconnect",
      }))
    )
      return;
    if (busy || !session!.active()) return;
    busy = true;
    const version = epoch;
    root.setAttribute("aria-busy", "true");
    root
      .querySelectorAll<HTMLButtonElement>("button")
      .forEach((b) => (b.disabled = true));
    announce("Updating integration…");
    try {
      if (body.action === "connect") {
        const result = await session!.request<{ url: string }>(
          "/api/admin/integrations",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          },
        );
        if (version === epoch && session!.active()) location.assign(result.url);
        return;
      }
      const data = await session!.request<IntegrationSettings>(
        "/api/admin/integrations",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (version !== epoch || !session!.active()) return;
      render(data);
      announce(
        body.action === "disconnect"
          ? "Outlook Calendar disconnected. CRM bookings are unchanged."
          : body.action === "select-calendar"
            ? "Booking calendar saved."
            : "Connection verified.",
      );
    } catch (e) {
      if (version === epoch && session!.active())
        announce(
          e instanceof Error ? e.message : "Integration could not be updated.",
          true,
        );
    } finally {
      busy = false;
      root.removeAttribute("aria-busy");
      root
        .querySelectorAll<HTMLButtonElement>("button")
        .forEach((b) => (b.disabled = false));
    }
  }
  root
    .querySelectorAll<HTMLElement>("[data-integration-action]")
    .forEach((b) =>
      b.addEventListener(
        "click",
        () =>
          void action({
            action: b.dataset.integrationAction,
            ...(b.dataset.integrationAction === "disconnect"
              ? { confirmed: true }
              : {}),
          }),
      ),
    );
  el<HTMLFormElement>("[data-calendar-select]").addEventListener(
    "submit",
    (e) => {
      e.preventDefault();
      const select = el<HTMLSelectElement>('[name="calendarId"]');
      if (!select.value) {
        announce("Choose a booking calendar.", true);
        select.focus();
        return;
      }
      void action({ action: "select-calendar", calendarId: select.value });
    },
  );
  try {
    const data = await session.request<IntegrationSettings>(
      "/api/admin/integrations",
    );
    if (!session.active()) return;
    render(data);
    const result = new URL(location.href).searchParams.get("outlook");
    announce(
      result === "connected"
        ? "Outlook Calendar connected."
        : result === "failed"
          ? "Outlook connection was not completed. Try connecting again."
          : "Manage calendar and meeting connections.",
      result === "failed",
    );
  } catch (e) {
    if (session.active())
      announce(
        e instanceof Error ? e.message : "Integrations could not be loaded.",
        true,
      );
  }
}
