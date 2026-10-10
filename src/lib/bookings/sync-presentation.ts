import type { AdminBooking } from "./contract";
export function renderBookingSync(root: HTMLElement, booking: AdminBooking) {
  root.hidden = false;
  const label = (status: string, calendar = false) =>
    status === "not_required"
      ? calendar
        ? "Not connected"
        : "Not required"
      : { pending: "Pending", synced: "Synced", failed: "Failed" }[status] ||
        "Pending";
  root.querySelector<HTMLElement>("[data-calendar-sync]")!.textContent =
    "Outlook Calendar / " + label(booking.calendarSync.status, true);
  root.querySelector<HTMLElement>("[data-zoom-sync]")!.textContent =
    "Zoom / " + label(booking.zoomSync.status);
  root.querySelector<HTMLElement>("[data-sync-error]")!.textContent = [
    booking.calendarSync.error,
    booking.zoomSync.error,
  ]
    .filter(Boolean)
    .join(" ");
  const retry = root.querySelector<HTMLButtonElement>("[data-sync-retry]")!;
  const needsRetry = [
    booking.calendarSync.status,
    booking.zoomSync.status,
  ].some((s) => s === "failed" || s === "pending");
  retry.hidden = false;
  retry
    .querySelectorAll<HTMLElement>(
      ".ui-button-text-default,.ui-button-text-hover",
    )
    .forEach((e) => (e.textContent = needsRetry ? "Retry sync" : "Check sync"));
}
export function clearBookingSync(root: HTMLElement) {
  root.hidden = true;
  for (const e of root.querySelectorAll<HTMLElement>(
    "[data-calendar-sync],[data-zoom-sync],[data-sync-error]",
  ))
    e.textContent = "";
}
