import { calendarDate, type InquiryBooking } from "./contract";
import { renderBookingSummary, clearBookingSummary } from "./presentation";
import { confirmBookingAction } from "./confirmation";
interface Options {
  panel: HTMLElement;
  current: () => { id: string } | null;
  active: () => boolean;
  request: <T>(url: string, options?: RequestInit) => Promise<T>;
  changed: () => Promise<unknown>;
}
export function setupInquiryBooking(options: Options) {
  const { panel } = options;
  const el = <T extends HTMLElement = HTMLElement>(s: string) =>
    panel.querySelector<T>(s)!;
  let version = 0,
    busy = false,
    url: string | null = null;
  let abort: AbortController | undefined;
  const message = el("[data-booking-message]");
  const announce = (text: string, error = false) => {
    message.textContent = text;
    message.setAttribute("role", error ? "alert" : "status");
  };
  function render(data: InquiryBooking) {
    url = data.url;
    el("[data-booking-create]").hidden = !!url;
    for (const s of ["copy", "open", "regenerate"])
      el("[data-booking-" + s + "]").hidden = !url;
    el<HTMLAnchorElement>("[data-booking-open]").href = url ?? "/";
    el("[data-booking-summary]").hidden = !data.booking;
    el("[data-booking-view]").hidden = !data.booking;
    if (data.booking) {
      const b = data.booking;
      renderBookingSummary(el("[data-booking-summary]"), b);
      el<HTMLAnchorElement>("[data-booking-view]").href =
        "/admin/calendar/?booking=" +
        encodeURIComponent(b.id) +
        "&month=" +
        calendarDate(b.startAt, b.timezone).slice(0, 7);
    }
    announce(url ? "Booking link ready." : "No booking link yet.");
  }
  async function load() {
    clear();
    if (!options.current() || !options.active()) return;
    const v = version;
    abort = new AbortController();
    panel.hidden = false;
    announce("Loading booking…");
    try {
      const data = await options.request<InquiryBooking>(
        "/api/admin/bookings?inquiry=" + options.current()!.id,
        { signal: abort.signal },
      );
      if (v === version && options.active()) render(data);
    } catch {
      if (v === version && options.active())
        announce(
          "Booking could not be loaded. Use Reload inquiry to try again.",
          true,
        );
    }
  }
  async function create(regenerate: boolean) {
    if (busy || !options.current() || !options.active()) return;
    const confirmationVersion = version;
    if (
      regenerate &&
      !(await confirmBookingAction({
        title: "Regenerate booking link?",
        message:
          "The previous link will stop working. Existing bookings remain.",
        action: "Regenerate link",
      }))
    )
      return;
    if (confirmationVersion !== version || !options.active() || busy) return;
    busy = true;
    const v = version;
    panel
      .querySelectorAll<HTMLButtonElement>("button")
      .forEach((b) => (b.disabled = true));
    announce(
      regenerate ? "Regenerating booking link…" : "Creating booking link…",
    );
    try {
      await options.request("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: regenerate ? "regenerate-link" : "create-link",
          inquiryId: options.current()!.id,
          ...(regenerate ? { confirmed: true } : {}),
        }),
      });
      if (v === version && options.active()) {
        await load();
        await options.changed();
      }
    } catch (error) {
      if (v === version && options.active())
        announce(
          error instanceof Error
            ? error.message
            : "Booking link could not be created.",
          true,
        );
    } finally {
      busy = false;
      panel
        .querySelectorAll<HTMLButtonElement>("button")
        .forEach((b) => (b.disabled = false));
    }
  }
  el("[data-booking-create]").addEventListener("click", () => {
    void create(false);
  });
  el("[data-booking-regenerate]").addEventListener("click", () => {
    void create(true);
  });
  el("[data-booking-copy]").addEventListener("click", async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      announce("Booking link copied.");
    } catch {
      announce(
        "Copy was unavailable. Open the booking page and copy its address.",
        true,
      );
    }
  });
  function clear() {
    version++;
    abort?.abort();
    url = null;
    panel.hidden = true;
    announce("");
    clearBookingSummary(el("[data-booking-summary]"));
    el<HTMLAnchorElement>("[data-booking-open]").href = "/";
    el<HTMLAnchorElement>("[data-booking-view]").href = "/admin/calendar/";
    for (const key of [
      "create",
      "copy",
      "open",
      "regenerate",
      "view",
      "summary",
    ])
      el("[data-booking-" + key + "]").hidden = true;
  }
  return { load, clear };
}
