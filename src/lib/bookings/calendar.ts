import { renderBookingSync, clearBookingSync } from "./sync-presentation";
import {
  timezoneLabel,
  displayPhone,
  meetingLabel,
  statusLabel,
  renderBookingSummary,
  clearBookingSummary,
} from "./presentation";
import { confirmBookingAction } from "./confirmation";
import { calendarDate, bookingTime, type AdminBooking } from "./contract";
import { setupBookingAdmin } from "./admin-session";
export async function setupCalendar() {
  const root = document.querySelector<HTMLElement>("[data-booking-calendar]");
  if (!root) return;
  const el = <T extends HTMLElement = HTMLElement>(s: string) =>
      root.querySelector<T>(s)!,
    message = el("[data-calendar-feedback]"),
    grid = el("[data-calendar-grid]"),
    agenda = el("[data-calendar-agenda]");
  let timezone = "America/New_York",
    items: AdminBooking[] = [],
    selected: AdminBooking | null = null,
    epoch = 0,
    busy = false;
  const announce = (value: string, error = false) => {
    message.textContent = value;
    message.setAttribute("role", error ? "alert" : "status");
  };
  const clear = () => {
    epoch++;
    message.textContent = "";
    items = [];
    selected = null;
    grid.replaceChildren();
    agenda.replaceChildren();
    el("[data-calendar-private]").hidden = true;
    el("[data-calendar-detail]").hidden = true;
    clearBookingSummary(el("[data-calendar-detail-copy]"));
    clearBookingSync(el("[data-booking-sync]"));
    el("[data-calendar-detail-contact]").textContent = "";
    el("[data-calendar-detail-notes]").textContent = "";
    el<HTMLAnchorElement>("[data-calendar-email]").href = "mailto:";
    el<HTMLAnchorElement>("[data-calendar-inquiry]").href = "/admin/";
  };
  const session = await setupBookingAdmin(clear);
  if (!session) return;
  function state() {
    const url = new URL(location.href),
      given = url.searchParams.get("month"),
      month =
        given && /^\d{4}-(0[1-9]|1[0-2])$/.test(given)
          ? given
          : calendarDate(new Date().toISOString(), timezone).slice(0, 7);
    return {
      month,
      view: url.searchParams.get("view") === "agenda" ? "agenda" : "month",
      booking: url.searchParams.get("booking"),
    };
  }
  function navigate(
    month: string,
    view = state().view,
    booking: string | null = null,
  ) {
    const params = new URLSearchParams({ month, view });
    if (booking) params.set("booking", booking);
    history.pushState(null, "", "/admin/calendar/?" + params);
    void load();
  }
  function eventButton(booking: AdminBooking, compact = false) {
    const fragment = el<HTMLTemplateElement>(
        "[data-calendar-event-template]",
      ).content.cloneNode(true) as DocumentFragment,
      button = fragment.querySelector<HTMLButtonElement>("button")!;
    const text =
      bookingTime(booking.startAt, timezone) +
      " · " +
      booking.clientName +
      (booking.company ? " / " + booking.company : "") +
      " · " +
      booking.meetingType +
      " · " +
      booking.status;
    const values = {
      time: bookingTime(booking.startAt, timezone),
      client: booking.clientName,
      company: booking.company,
      meeting: compact
        ? booking.meetingType === "phone"
          ? "Phone"
          : "Zoom"
        : meetingLabel(booking.meetingType),
      status: statusLabel(booking.status),
    };
    for (const [name, value] of Object.entries(values))
      button
        .querySelectorAll<HTMLElement>("[data-calendar-event-" + name + "]")
        .forEach((node) => {
          node.textContent = value;
          if (name === "company") node.hidden = !value;
        });
    button.dataset.compact = String(compact);
    button.dataset.status = booking.status;
    button.setAttribute("aria-label", text);
    button.dataset.bookingId = booking.id;
    button.addEventListener("click", () =>
      navigate(state().month, state().view, booking.id),
    );
    return fragment;
  }
  function render() {
    if (!session!.active()) return;
    const { month, view } = state();
    el("[data-calendar-month]").textContent = new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      month: "long",
      year: "numeric",
    }).format(new Date(month + "-01T12:00:00Z"));
    el("[data-calendar-timezone]").textContent =
      "Calendar times: " + timezoneLabel(timezone);
    el("[data-calendar-private]").hidden = false;
    el("[data-calendar-empty]").hidden = items.length > 0;
    root!
      .querySelectorAll("[data-calendar-view]")
      .forEach((b) =>
        b.setAttribute(
          "aria-pressed",
          String((b as HTMLElement).dataset.calendarView === view),
        ),
      );
    grid.replaceChildren();
    agenda.replaceChildren();
    grid.hidden = view !== "month";
    agenda.hidden = view === "month" && matchMedia("(min-width:64rem)").matches;
    const first = new Date(month + "-01T12:00:00Z"),
      days = new Date(
        first.getUTCFullYear(),
        first.getUTCMonth() + 1,
        0,
      ).getDate();
    for (let n = 0; n < first.getUTCDay(); n++) {
      const spacer = document.createElement("div");
      spacer.setAttribute("aria-hidden", "true");
      grid.append(spacer);
    }
    for (let n = 1; n <= days; n++) {
      const date = month + "-" + String(n).padStart(2, "0"),
        fragment = el<HTMLTemplateElement>(
          "[data-calendar-day-template]",
        ).content.cloneNode(true) as DocumentFragment;
      fragment.querySelector<HTMLElement>(
        "[data-calendar-day-label]",
      )!.textContent = new Intl.DateTimeFormat("en-US", {
        timeZone: "UTC",
        weekday: "short",
        day: "numeric",
      }).format(new Date(date + "T12:00:00Z"));
      const dayElement = fragment.querySelector<HTMLElement>(".calendar-day")!;
      const isToday = date === calendarDate(new Date().toISOString(), timezone);
      dayElement.dataset.today = String(isToday);
      if (isToday) {
        const label = fragment.querySelector<HTMLElement>(
          "[data-calendar-day-label]",
        )!;
        label.setAttribute("aria-current", "date");
        label.textContent += " / Today";
      }
      const rows = items.filter(
        (b) => calendarDate(b.startAt, timezone) === date,
      );
      for (const b of rows)
        fragment
          .querySelector("[data-calendar-day-bookings]")!
          .append(eventButton(b, true));
      grid.append(fragment);
      if (rows.length) {
        const agendaFragment = el<HTMLTemplateElement>(
          "[data-calendar-agenda-template]",
        ).content.cloneNode(true) as DocumentFragment;
        agendaFragment.querySelector<HTMLElement>(
          "[data-calendar-agenda-date]",
        )!.textContent = new Intl.DateTimeFormat("en-US", {
          timeZone: "UTC",
          weekday: "long",
          month: "short",
          day: "numeric",
        }).format(new Date(date + "T12:00:00Z"));
        for (const booking of rows)
          agendaFragment
            .querySelector("[data-calendar-agenda-events]")!
            .append(eventButton(booking));
        agenda.append(agendaFragment);
      }
    }
  }
  async function detail(id: string) {
    const v = epoch;
    const data = await session!.request<{ booking: AdminBooking }>(
      "/api/admin/bookings?id=" + encodeURIComponent(id),
    );
    if (v !== epoch || !session!.active()) return;
    selected = data.booking;
    const b = selected;
    el<HTMLInputElement>('[name="rescheduleDate"]').value = "";
    el<HTMLSelectElement>('[name="rescheduleStart"]').replaceChildren(
      new Option("Choose an available time", ""),
    );
    el("[data-calendar-detail]").hidden = false;
    renderBookingSummary(el("[data-calendar-detail-copy]"), b, timezone);
    renderBookingSync(el("[data-booking-sync]"), b);
    el("[data-calendar-detail-contact]").textContent =
      (b.company ? b.company + "\n" : "") +
      b.clientEmail +
      (b.clientPhone ? "\n" + displayPhone(b.clientPhone) : "");
    el("[data-calendar-detail-notes]").textContent = b.clientNotes;
    el<HTMLAnchorElement>("[data-calendar-inquiry]").href =
      "/admin/?inquiry=" + b.inquiryId;
    el<HTMLAnchorElement>("[data-calendar-email]").href =
      "mailto:" + encodeURIComponent(b.clientEmail);
    el("[data-calendar-cancel]").hidden = b.status !== "scheduled";
    el("[data-calendar-complete]").hidden = b.status !== "scheduled";
    el<HTMLButtonElement>("[data-calendar-complete]").disabled =
      Date.parse(b.endAt) > Date.now();
    el("[data-calendar-reschedule-form]").hidden = b.status !== "scheduled";
    el("[data-calendar-complete-hint]").hidden =
      b.status !== "scheduled" || Date.parse(b.endAt) <= Date.now();
    el('[id="calendar-detail-heading"]').focus();
  }
  async function load() {
    if (!session!.active()) return;
    const v = ++epoch;
    el("[data-calendar-detail]").hidden = true;
    selected = null;
    items = [];
    grid.replaceChildren();
    agenda.replaceChildren();
    el("[data-calendar-empty]").hidden = true;
    announce("Loading calendar…");
    try {
      const data = await session!.request<{
        timezone: string;
        items: AdminBooking[];
      }>("/api/admin/bookings?month=" + state().month);
      if (v !== epoch || !session!.active()) return;
      timezone = data.timezone;
      items = data.items;
      render();
      announce(items.length + " bookings in this month.");
      const id = state().booking;
      if (id) await detail(id);
    } catch (error) {
      if (v === epoch && session!.active())
        announce(
          error instanceof Error
            ? error.message
            : "Calendar could not be loaded.",
          true,
        );
    }
  }
  for (const [selector, delta] of [
    ["[data-calendar-previous]", -1],
    ["[data-calendar-next]", 1],
  ] as const)
    el(selector).addEventListener("click", () => {
      const date = new Date(state().month + "-01T12:00:00Z");
      date.setUTCMonth(date.getUTCMonth() + delta);
      navigate(date.toISOString().slice(0, 7));
    });
  el("[data-calendar-today]").addEventListener("click", () =>
    navigate(calendarDate(new Date().toISOString(), timezone).slice(0, 7)),
  );
  root
    .querySelectorAll<HTMLElement>("[data-calendar-view]")
    .forEach((b) =>
      b.addEventListener("click", () =>
        navigate(state().month, b.dataset.calendarView!),
      ),
    );
  el("[data-calendar-close]").addEventListener("click", () =>
    navigate(state().month, state().view),
  );
  window.addEventListener("popstate", () => {
    void load();
  });
  matchMedia("(min-width:64rem)").addEventListener("change", render);
  async function change(
    action: "cancel" | "complete" | "reschedule",
    startAt?: string,
  ) {
    if (busy || !selected) return;
    const confirmationBooking = selected;
    if (
      !(await confirmBookingAction({
        title:
          action === "cancel"
            ? "Cancel booking?"
            : action === "complete"
              ? "Mark call completed?"
              : "Confirm new time",
        message:
          action === "cancel"
            ? "This time will become available again."
            : action === "complete"
              ? "Mark this call completed?"
              : "Move this call to the selected available time?",
        action:
          action === "cancel"
            ? "Cancel booking"
            : action === "complete"
              ? "Mark completed"
              : "Confirm new time",
      }))
    )
      return;
    if (busy || selected !== confirmationBooking || !session!.active()) return;
    busy = true;
    const v = epoch;
    const b = selected;
    el("[data-calendar-detail]").setAttribute("aria-busy", "true");
    announce("Saving booking change…");
    try {
      await session!.request("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          id: b.id,
          updatedAt: b.updatedAt,
          ...(startAt ? { startAt } : {}),
          confirmed: true,
        }),
      });
      if (v === epoch && session!.active()) {
        await load();
        announce(
          "Booking " +
            (action === "cancel"
              ? "cancelled"
              : action === "complete"
                ? "completed"
                : "rescheduled") +
            ".",
        );
      }
    } catch (error) {
      if (v === epoch && session!.active())
        announce(
          error instanceof Error
            ? error.message
            : "Booking change could not be confirmed.",
          true,
        );
    } finally {
      busy = false;
      el("[data-calendar-detail]").removeAttribute("aria-busy");
      message.tabIndex = -1;
      message.focus();
    }
  }
  el("[data-sync-retry]").addEventListener("click", async () => {
    if (busy || !selected || !session!.active()) return;
    busy = true;
    const id = selected.id,
      v = epoch;
    const button = el<HTMLButtonElement>("[data-sync-retry]");
    button.disabled = true;
    announce("Reconciling external sync…");
    try {
      await session!.request("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "retry-sync", bookingId: id }),
      });
      if (v === epoch && session!.active()) {
        await detail(id);
        announce("Sync status refreshed. Check the booking details.");
      }
    } catch (e) {
      if (v === epoch && session!.active())
        announce(
          e instanceof Error ? e.message : "Sync could not be refreshed.",
          true,
        );
    } finally {
      busy = false;
      button.disabled = false;
    }
  });
  el("[data-calendar-cancel]").addEventListener("click", () => {
    void change("cancel");
  });
  el("[data-calendar-complete]").addEventListener("click", () => {
    void change("complete");
  });
  el<HTMLInputElement>('[name="rescheduleDate"]').addEventListener(
    "change",
    async () => {
      if (!selected || busy || !session!.active()) return;
      const v = epoch,
        bookingId = selected.id;
      const date = el<HTMLInputElement>('[name="rescheduleDate"]').value,
        select = el<HTMLSelectElement>('[name="rescheduleStart"]');
      select.replaceChildren(new Option("Choose an available time", ""));
      try {
        const data = await session!.request<{
          slots: { startAt: string; label: string }[];
        }>("/api/admin/bookings?date=" + date + "&exclude=" + bookingId);
        if (
          v !== epoch ||
          !session!.active() ||
          selected?.id !== bookingId ||
          el<HTMLInputElement>('[name="rescheduleDate"]').value !== date
        )
          return;
        for (const s of data.slots) select.add(new Option(s.label, s.startAt));
      } catch (error) {
        if (v !== epoch || !session!.active()) return;
        announce(
          error instanceof Error ? error.message : "Times unavailable.",
          true,
        );
      }
    },
  );
  el<HTMLFormElement>("[data-calendar-reschedule-form]").addEventListener(
    "submit",
    (event) => {
      event.preventDefault();
      const start = el<HTMLSelectElement>('[name="rescheduleStart"]').value;
      if (!start) {
        announce("Choose an available new time.", true);
        return;
      }
      void change("reschedule", start);
    },
  );
  try {
    const data = await session.request<{ settings: { timezone: string } }>(
      "/api/admin/bookings?settings=true",
    );
    if (!session.active()) return;
    timezone = data.settings.timezone;
    await load();
  } catch (error) {
    if (session.active())
      announce(
        error instanceof Error
          ? error.message
          : "Calendar could not be loaded.",
        true,
      );
  }
}
