import { settingsSchema, type AvailabilitySettings } from "./contract";
import { setupBookingAdmin } from "./admin-session";
export async function setupAvailabilityAdmin() {
  const root = document.querySelector<HTMLElement>("[data-availability-admin]");
  if (!root) return;
  const form = root.querySelector<HTMLFormElement>("[data-availability-form]")!,
    message = root.querySelector<HTMLElement>("[data-calendar-feedback]")!,
    list = root.querySelector<HTMLElement>("[data-availability-exceptions]")!;
  let saved: AvailabilitySettings,
    busy = false,
    rowNumber = 0;
  const field = (name: string) =>
    form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement;
  const numberValue = (name: string) =>
    field(name).value.trim() ? Number(field(name).value) : NaN;
  const announce = (value: string, error = false) => {
    message.textContent = value;
    message.setAttribute("role", error ? "alert" : "status");
  };
  const session = await setupBookingAdmin(() => {
    form.hidden = true;
    form.reset();
    list.replaceChildren();
    message.textContent = "";
  });
  if (!session) return;
  function controls(value: boolean) {
    busy = value;
    if (value) form.setAttribute("aria-busy", "true");
    else form.removeAttribute("aria-busy");
    form
      .querySelectorAll<
        HTMLInputElement | HTMLSelectElement | HTMLButtonElement
      >("input,select,button")
      .forEach((e) => (e.disabled = value));
    if (!value)
      form.querySelectorAll<HTMLElement>("[data-weekday]").forEach((row) => {
        const enabled = (
          row.querySelector('input[type="checkbox"]') as HTMLInputElement
        ).checked;
        row
          .querySelectorAll<HTMLInputElement>('input[type="time"]')
          .forEach((e) => (e.disabled = !enabled));
      });
    if (!value)
      list.querySelectorAll<HTMLElement>(".exception-row").forEach((row) => {
        const unavailable =
          (row.querySelector("[data-exception-type]") as HTMLSelectElement)
            .value === "unavailable";
        row
          .querySelectorAll<HTMLInputElement>(
            "[data-exception-start],[data-exception-end]",
          )
          .forEach((input) => (input.disabled = unavailable));
      });
  }
  function exception(value?: AvailabilitySettings["exceptions"][number]) {
    const frag = root!
        .querySelector<HTMLTemplateElement>("[data-exception-template]")!
        .content.cloneNode(true) as DocumentFragment,
      row = frag.querySelector<HTMLElement>(".exception-row")!,
      number = ++rowNumber;
    const error = row.querySelector<HTMLElement>("[data-exception-error]")!;
    error.id = "exception-" + number + "-error";
    for (const name of ["date", "type", "start", "end"]) {
      const input = row.querySelector<HTMLInputElement | HTMLSelectElement>(
        "[data-exception-" + name + "]",
      )!;
      input.id = "exception-" + number + "-" + name;
      input.setAttribute("aria-describedby", error.id);
      row.querySelector<HTMLLabelElement>(
        '[data-exception-label="' + name + '"]',
      )!.htmlFor = input.id;
    }
    const date = row.querySelector<HTMLInputElement>("[data-exception-date]")!,
      type = row.querySelector<HTMLSelectElement>("[data-exception-type]")!,
      start = row.querySelector<HTMLInputElement>("[data-exception-start]")!,
      end = row.querySelector<HTMLInputElement>("[data-exception-end]")!;
    date.value = value?.date ?? "";
    type.value = value?.type ?? "unavailable";
    start.value = value?.startTime ?? "";
    end.value = value?.endTime ?? "";
    const sync = () => {
      start.disabled = end.disabled = type.value === "unavailable";
      if (type.value === "unavailable") {
        start.value = "";
        end.value = "";
      }
    };
    type.addEventListener("change", sync);
    sync();
    row
      .querySelector("[data-exception-remove]")!
      .addEventListener("click", () => row.remove());
    list.append(frag);
    if (!value) date.focus();
  }
  function render(data: AvailabilitySettings) {
    saved = data;
    field("businessTimezone").value = data.timezone;
    for (const key of [
      "slotDurationMinutes",
      "bufferMinutes",
      "minimumNoticeHours",
      "horizonDays",
    ] as const)
      field(key).value = String(data[key]);
    for (const d of data.weekdays) {
      (field("enabled-" + d.weekday) as HTMLInputElement).checked = d.enabled;
      field("start-" + d.weekday).value = d.startTime;
      field("end-" + d.weekday).value = d.endTime;
    }
    list.replaceChildren();
    for (const e of data.exceptions) exception(e);
    form.hidden = false;
    controls(false);
  }
  async function load() {
    announce("Loading availability…");
    const data = await session!.request<{ settings: AvailabilitySettings }>(
      "/api/admin/bookings?settings=true",
    );
    if (session!.active()) {
      render(data.settings);
      announce("Availability loaded.");
    }
  }
  root.querySelector("[data-exception-add]")!.addEventListener("click", () => {
    if (!busy) exception();
  });
  root
    .querySelector("[data-availability-reload]")!
    .addEventListener("click", () => {
      if (
        !busy &&
        confirm(
          "Reload saved settings? Unsaved availability edits will be replaced.",
        )
      )
        void load().catch((error) => announce(error.message, true));
    });
  form
    .querySelectorAll('[data-weekday] input[type="checkbox"]')
    .forEach((e) => e.addEventListener("change", () => controls(false)));
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (busy) return;
    const input = {
      action: "settings",
      timezone: field("businessTimezone").value,
      slotDurationMinutes: field("slotDurationMinutes").value,
      bufferMinutes: numberValue("bufferMinutes"),
      minimumNoticeHours: numberValue("minimumNoticeHours"),
      horizonDays: numberValue("horizonDays"),
      updatedAt: saved.updatedAt,
      weekdays: saved.weekdays.map((d) => ({
        weekday: d.weekday,
        enabled: (field("enabled-" + d.weekday) as HTMLInputElement).checked,
        startTime: field("start-" + d.weekday).value,
        endTime: field("end-" + d.weekday).value,
      })),
      exceptions: [...list.querySelectorAll<HTMLElement>(".exception-row")].map(
        (row) => ({
          date: (row.querySelector("[data-exception-date]") as HTMLInputElement)
            .value,
          type: (
            row.querySelector("[data-exception-type]") as HTMLSelectElement
          ).value,
          startTime:
            (row.querySelector("[data-exception-start]") as HTMLInputElement)
              .value || null,
          endTime:
            (row.querySelector("[data-exception-end]") as HTMLInputElement)
              .value || null,
        }),
      ),
    };
    const result = settingsSchema.safeParse(input);
    form
      .querySelectorAll<HTMLElement>(
        "[data-field-error],[data-exception-error]",
      )
      .forEach((e) => {
        e.hidden = true;
        e.textContent = "";
      });
    form
      .querySelectorAll("[aria-invalid]")
      .forEach((e) => e.removeAttribute("aria-invalid"));
    if (!result.success) {
      const names: Record<string, string> = {
        timezone: "businessTimezone",
        slotDurationMinutes: "slotDurationMinutes",
        bufferMinutes: "bufferMinutes",
        minimumNoticeHours: "minimumNoticeHours",
        horizonDays: "horizonDays",
      };
      for (const issue of result.error.issues) {
        let name = names[String(issue.path[0])];
        if (issue.path[0] === "weekdays" && typeof issue.path[1] === "number") {
          name =
            (issue.path[2] === "startTime" ? "start-" : "end-") +
            saved.weekdays[issue.path[1]].weekday;
        }
        if (
          issue.path[0] === "exceptions" &&
          typeof issue.path[1] === "number"
        ) {
          const row =
            list.querySelectorAll<HTMLElement>(".exception-row")[issue.path[1]];
          const error = row?.querySelector<HTMLElement>(
            "[data-exception-error]",
          );
          if (error) {
            error.hidden = false;
            error.textContent = issue.message;
            const keys: Record<string, string> = {
              date: "date",
              type: "type",
              startTime: "start",
              endTime: "end",
            };
            const key = keys[String(issue.path[2])] ?? "date";
            row
              .querySelector("[data-exception-" + key + "]")
              ?.setAttribute("aria-invalid", "true");
          }
        }
        if (name) {
          field(name).setAttribute("aria-invalid", "true");
          const error = form.querySelector<HTMLElement>(
            '[data-field-error="' + name + '"]',
          )!;
          error.textContent = issue.message;
          error.hidden = false;
        }
      }
      announce(result.error.issues[0].message, true);
      const invalid = form.querySelector<HTMLElement>('[aria-invalid="true"]');
      if (invalid) invalid.focus();
      else {
        message.tabIndex = -1;
        message.focus();
      }
      return;
    }
    controls(true);
    announce("Saving availability…");
    try {
      const response = await session!.request<{
        settings: AvailabilitySettings;
      }>("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (session!.active()) {
        render(response.settings);
        announce("Availability saved.");
      }
    } catch (error) {
      if (session!.active())
        announce(
          error instanceof Error
            ? error.message
            : "Availability could not be saved. Your edits are preserved.",
          true,
        );
    } finally {
      if (session!.active()) {
        controls(false);
        message.tabIndex = -1;
        message.focus();
      }
    }
  });
  try {
    await load();
  } catch (error) {
    announce(
      error instanceof Error
        ? error.message
        : "Availability could not be loaded.",
      true,
    );
  }
}
