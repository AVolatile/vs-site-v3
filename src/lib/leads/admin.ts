import { setupBookingAdmin } from "@/lib/bookings/admin-session";
import { confirmBookingAction } from "@/lib/bookings/confirmation";
import { setupInquiryCommunication } from "@/lib/communications/admin";
import { setupInquiryBooking } from "@/lib/bookings/inquiry-panel";
import { setupInquiryProposal } from "@/lib/proposals/inquiry-panel";
import { setupInvoicePanel } from "@/lib/invoices/proposal-panel";
import { fieldErrors, inquirySchema } from "@/lib/inquiries/contract";
import { focusAdminRecordHeading } from "@/lib/admin/presentation";
import {
  leadSchema,
  leadLabel,
  leadCommunicationLabel,
  type Lead,
  type LeadList,
  type LeadActivity,
} from "./contract";

type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
const localDate = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};
export async function setupLeadsAdmin() {
  const root = document.querySelector<HTMLElement>("[data-leads-admin]");
  if (!root) return;
  const el = <T extends HTMLElement = HTMLElement>(selector: string) =>
    root.querySelector<T>(selector)!;
  const form = el<HTMLFormElement>("[data-lead-form]"),
    conversion = el<HTMLFormElement>("[data-lead-conversion]"),
    filters = el<HTMLFormElement>("[data-lead-filters]");
  const control = (target: HTMLFormElement, name: string) =>
    target.elements.namedItem(name) as Control;
  let lead: Lead | null = null,
    epoch = 0,
    busy = false,
    total = 0;
  let session: Awaited<ReturnType<typeof setupBookingAdmin>> = null;
  const announce = (text: string, error = false) => {
    el("[data-lead-feedback]").textContent = text;
    el("[data-lead-feedback]").setAttribute("role", error ? "alert" : "status");
  };
  function validate(target: HTMLFormElement, errors: Record<string, string>) {
    target
      .querySelectorAll<HTMLElement>("[data-field-error]")
      .forEach((node) => {
        const text = errors[node.dataset.fieldError!] ?? "";
        node.textContent = text;
        node.hidden = !text;
        control(target, node.dataset.fieldError!).setAttribute(
          "aria-invalid",
          String(!!text),
        );
      });
    target.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }
  const request = async <T>(url: string, init?: RequestInit) =>
    session!.request<T>(url, init);
  const api = () => "/api/admin/leads?id=" + encodeURIComponent(lead!.id);
  const active = () => !!session?.active() && !!lead;
  const contact = () =>
    lead
      ? {
          id: lead.id,
          name: lead.name,
          company: lead.company,
          email: lead.email,
          projectType: "",
        }
      : null;
  function renderActivity(activity: LeadActivity[]) {
    const list = el<HTMLOListElement>("[data-admin-activity-list]");
    list.replaceChildren(
      ...activity.map((event) => {
        const item = document.createElement("li"),
          label = document.createElement("span"),
          time = document.createElement("time");
        label.className = "activity-label";
        label.textContent =
          leadLabel(event.type.replaceAll("_", "-")) +
          (event.proposalNumber ? " · " + event.proposalNumber : "") +
          (event.invoiceNumber ? " · " + event.invoiceNumber : "");
        item.append(label);
        if (event.note) {
          const note = document.createElement("span");
          note.textContent = event.note;
          item.append(note);
        }
        if (event.followUpAt) {
          const schedule = document.createElement("span");
          schedule.textContent =
            "Scheduled for " + new Date(event.followUpAt).toLocaleString();
          item.append(schedule);
        }
        time.dateTime = event.createdAt;
        time.textContent =
          new Date(event.createdAt).toLocaleString() +
          " · " +
          leadLabel(event.actor);
        item.append(time);
        return item;
      }),
    );
    el("[data-admin-activity-empty]").hidden = !!activity.length;
  }
  async function refreshActivity(id: string, version: number) {
    const data = await request<{ lead: Lead; activity: LeadActivity[] }>(
      "/api/admin/leads?id=" + encodeURIComponent(id),
    );
    if (epoch !== version || lead?.id !== id) return false;
    renderActivity(data.activity);
    // Refresh derived contact dates without overwriting a manual edit in progress.
    if (control(form, "lastContactAt").value === localDate(lead.lastContactAt))
      control(form, "lastContactAt").value = localDate(data.lead.lastContactAt);
    lead.lastContactAt = data.lead.lastContactAt;
    return true;
  }
  const communication = setupInquiryCommunication({
    panel: el("[data-inquiry-communication]"),
    ownerType: "lead",
    current: contact,
    active,
    version: () => epoch,
    request,
    validate,
    refreshActivity,
    error: (error, fallback) =>
      error instanceof Error ? error.message : fallback,
  });
  const invoice = setupInvoicePanel(el("[data-invoice-context]"), {
    active,
    back: () => location.pathname + location.search,
    request,
  });
  const proposal = setupInquiryProposal({
    panel: el("[data-inquiry-proposal]"),
    ownerType: "lead",
    current: contact,
    active,
    version: () => epoch,
    announce,
    request,
    invoice,
  });
  const booking = setupInquiryBooking({
    panel: el("[data-inquiry-booking]"),
    ownerType: "lead",
    current: contact,
    active,
    request,
    changed: async () => {
      if (lead) {
        await refreshActivity(lead.id, epoch);
        await communication.refreshLinks();
      }
    },
  });
  function clearPanels() {
    communication.clear();
    proposal.clear();
    booking.clear();
  }
  function clear() {
    epoch++;
    lead = null;
    clearPanels();
    form.reset();
    conversion.reset();
    renderActivity([]);
    el("[data-lead-workspace]").hidden = true;
    el("[data-lead-rows]").replaceChildren();
    el("[data-lead-heading]").textContent = "Lead details";
    el("[data-lead-meta]").textContent = "";
    el<HTMLAnchorElement>("[data-lead-inquiry]").href = "/admin/";
    document
      .querySelector<HTMLDialogElement>("[data-booking-action-dialog]")
      ?.close();
  }
  session = await setupBookingAdmin(clear);
  if (!session) return;
  function lock(value: boolean) {
    busy = value;
    el("[data-lead-detail]").inert = value;
    el<HTMLButtonElement>("[data-lead-new]").disabled = value;
    root!.setAttribute("aria-busy", String(value));
  }
  const route = () => new URL(location.href);
  let renderedRoute = location.pathname + location.search;
  async function navigate(url: URL, replace = false) {
    if (busy || !session?.active()) return;
    history[replace ? "replaceState" : "pushState"](
      {},
      "",
      url.pathname + url.search,
    );
    await load();
  }
  async function load() {
    if (!session?.active()) return;
    renderedRoute = location.pathname + location.search;
    const version = ++epoch;
    lead = null;
    clearPanels();
    form.reset();
    el("[data-lead-heading]").textContent = "Lead details";
    el("[data-lead-meta]").textContent = "";
    conversion.hidden = true;
    validate(form, {});
    validate(conversion, {});
    el("[data-lead-workspace]").hidden = false;
    const params = route().searchParams,
      id = params.get("lead"),
      creating = params.get("new") === "true";
    el("[data-lead-browse]").hidden = !!id || creating;
    el("[data-lead-detail]").hidden = !id && !creating;
    el("[data-lead-related]").hidden = true;
    el("[data-lead-delete]").hidden = !id;
    el("[data-lead-reload]").hidden = !id;
    announce("Loading leads…");
    try {
      if (id) {
        form.hidden = true;
        const data = await request<{ lead: Lead; activity: LeadActivity[] }>(
          "/api/admin/leads?id=" + encodeURIComponent(id),
        );
        if (version !== epoch || !session!.active()) return;
        lead = data.lead;
        for (const [key, value] of Object.entries(lead)) {
          const field = form.elements.namedItem(key) as Control | null;
          if (field)
            field.value = key.endsWith("At")
              ? localDate(value as string | null)
              : String(value ?? "");
        }
        control(form, "status").querySelector<HTMLOptionElement>(
          'option[value="converted"]',
        )!.disabled = !lead.convertedAt;
        control(form, "status").disabled = !!lead.convertedAt;
        form.hidden = false;
        el("[data-lead-related]").hidden = false;
        el("[data-lead-heading]").textContent = lead.company;
        el("[data-lead-meta]").textContent =
          "Created " +
          new Date(lead.createdAt).toLocaleString() +
          " · Updated " +
          new Date(lead.updatedAt).toLocaleString();
        el("[data-lead-convert]").hidden = !!lead.convertedAt;
        el("[data-lead-inquiry]").hidden = !lead.convertedInquiryId;
        el<HTMLAnchorElement>("[data-lead-inquiry]").href =
          lead.convertedInquiryId
            ? "/admin/?inquiry=" + lead.convertedInquiryId
            : "/admin/";
        renderActivity(data.activity);
        el("[data-lead-email-needed]").hidden = !!lead.email;
        await Promise.all([
          proposal.load(),
          booking.load(),
          communication.load(),
        ]);
        if (version !== epoch) return;
        announce("Lead loaded.");
        focusAdminRecordHeading(root!, el("[data-lead-heading]"));
      } else if (creating) {
        form.hidden = false;
        control(form, "status").disabled = false;
        control(form, "status").value = "saved";
        control(form, "priority").value = "medium";
        control(form, "status").querySelector<HTMLOptionElement>(
          'option[value="converted"]',
        )!.disabled = true;
        el("[data-lead-heading]").textContent = "Create lead";
        el("[data-lead-meta]").textContent =
          "Only the business / lead name is required.";
        announce("Enter the prospect details you know.");
        control(form, "company").focus();
      } else {
        el("[data-lead-rows]").replaceChildren();
        el("[data-lead-empty]").hidden = true;
        el<HTMLButtonElement>("[data-lead-previous]").disabled = true;
        el<HTMLButtonElement>("[data-lead-next]").disabled = true;
        const query = new URLSearchParams();
        for (const key of [
          "search",
          "status",
          "priority",
          "followUp",
          "communication",
          "page",
        ])
          if (params.has(key)) query.set(key, params.get(key)!);
        for (const [key, name] of [
          ["search", "search"],
          ["status", "filterStatus"],
          ["priority", "filterPriority"],
          ["followUp", "filterFollowUp"],
          ["communication", "filterCommunication"],
        ])
          control(filters, name).value =
            params.get(key) ?? (key === "search" ? "" : "all");
        const result = await request<LeadList>("/api/admin/leads?" + query);
        if (version !== epoch || !session!.active()) return;
        total = result.total;
        el("[data-lead-rows]").replaceChildren(
          ...result.items.map((item) => {
            const row = document.createElement("tr");
            for (const [index, value] of [
              item.company,
              item.name || item.email || item.phone || "—",
              leadLabel(item.status),
              leadLabel(item.priority),
              leadCommunicationLabel(item),
              item.nextFollowUpAt
                ? (Date.parse(item.nextFollowUpAt) < Date.now()
                    ? "Due · "
                    : "") + new Date(item.nextFollowUpAt).toLocaleString()
                : "—",
            ].entries()) {
              const cell = document.createElement("td");
              if (!index) {
                const link = document.createElement("a"),
                  url = route();
                url.searchParams.set("lead", item.id);
                link.href = url.pathname + url.search;
                link.textContent = value;
                link.addEventListener("click", (event) => {
                  if (
                    !event.metaKey &&
                    !event.ctrlKey &&
                    !event.shiftKey &&
                    event.button === 0
                  ) {
                    event.preventDefault();
                    void navigate(url);
                  }
                });
                cell.append(link);
              } else cell.textContent = value;
              row.append(cell);
            }
            return row;
          }),
        );
        el("[data-lead-empty]").hidden = !!result.items.length;
        el("[data-lead-empty]").textContent = query.toString()
          ? "No leads match these filters. Clear the filters or create a lead."
          : "No leads yet. Create your first prospect manually.";
        el("[data-lead-page]").textContent =
          `${result.total} leads · Page ${result.page} of ${Math.max(1, Math.ceil(result.total / result.pageSize))}`;
        el<HTMLButtonElement>("[data-lead-previous]").disabled =
          result.page <= 1;
        el<HTMLButtonElement>("[data-lead-next]").disabled =
          result.page * result.pageSize >= total;
        announce(`${result.total} leads loaded.`);
      }
    } catch (error) {
      if (version === epoch)
        announce(
          error instanceof Error
            ? error.message
            : "Leads could not be loaded. Reload to try again.",
          true,
        );
    }
  }
  el("[data-lead-new]").addEventListener("click", () => {
    const url = route();
    url.searchParams.set("new", "true");
    url.searchParams.delete("lead");
    void navigate(url);
  });
  el("[data-lead-back]").addEventListener("click", () => {
    const url = route();
    url.searchParams.delete("lead");
    url.searchParams.delete("new");
    void navigate(url);
  });
  el("[data-lead-reload]").addEventListener("click", () => {
    if (!busy) void load();
  });
  filters.addEventListener("submit", (event) => {
    event.preventDefault();
    const url = route();
    url.search = "";
    for (const [key, name] of [
      ["search", "search"],
      ["status", "filterStatus"],
      ["priority", "filterPriority"],
      ["followUp", "filterFollowUp"],
      ["communication", "filterCommunication"],
    ]) {
      const value = control(filters, name).value.trim();
      if (value && value !== "all") url.searchParams.set(key, value);
    }
    void navigate(url);
  });
  el("[data-lead-clear-filters]").addEventListener("click", () => {
    const url = route();
    url.search = "";
    void navigate(url);
  });
  for (const [selector, delta] of [
    ["previous", -1],
    ["next", 1],
  ] as const)
    el("[data-lead-" + selector + "]").addEventListener("click", () => {
      const url = route();
      url.searchParams.set(
        "page",
        String(Math.max(1, Number(url.searchParams.get("page") ?? 1) + delta)),
      );
      void navigate(url);
    });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (busy) return;
    const input: Record<string, string | null> = Object.fromEntries(
      leadSchema.keyof().options.map((key) => [key, control(form, key).value]),
    );
    try {
      for (const name of ["lastContactAt", "nextFollowUpAt"])
        input[name] = input[name]
          ? new Date(String(input[name])).toISOString()
          : null;
    } catch {
      announce("Choose a valid date and time.", true);
      return;
    }
    const parsed = leadSchema.safeParse(input);
    if (!parsed.success) {
      validate(form, fieldErrors(parsed.error));
      announce("Check the highlighted fields.", true);
      return;
    }
    validate(form, {});
    lock(true);
    announce(lead ? "Saving lead…" : "Creating lead…");
    let saved: Lead | undefined;
    try {
      saved = (
        await request<{ lead: Lead }>(lead ? api() : "/api/admin/leads", {
          method: lead ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...parsed.data,
            ...(lead ? { updatedAt: lead.updatedAt } : {}),
          }),
        })
      ).lead;
    } catch (error) {
      validate(
        form,
        (error as { fields?: Record<string, string> }).fields ?? {},
      );
      announce(
        error instanceof Error
          ? error.message
          : "Save could not be confirmed. Reload before retrying.",
        true,
      );
    } finally {
      lock(false);
    }
    if (saved) {
      const url = route();
      url.searchParams.delete("new");
      url.searchParams.set("lead", saved.id);
      await navigate(url, true);
      announce("Lead saved.");
    }
  });
  el("[data-lead-delete]").addEventListener("click", async () => {
    if (!lead || busy) return;
    const id = lead.id,
      version = epoch;
    if (
      !(await confirmBookingAction({
        title: "Permanently delete lead?",
        message: `Delete ${lead.company} and its emails, meetings, proposals, invoices and history? Scheduled meetings will be cancelled. A converted inquiry will be preserved.`,
        action: "Delete lead",
        cancelLabel: "Cancel",
      }))
    )
      return;
    if (epoch !== version || lead?.id !== id || busy) return;
    lock(true);
    announce("Deleting lead and its records…");
    let deleted = false;
    try {
      await request(api(), {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updatedAt: lead.updatedAt }),
      });
      deleted = true;
    } catch (error) {
      announce(
        error instanceof Error
          ? error.message
          : "Deletion could not be confirmed. Reload before retrying.",
        true,
      );
    } finally {
      lock(false);
    }
    if (deleted) {
      const url = route();
      url.searchParams.delete("lead");
      await navigate(url, true);
      announce("Lead permanently deleted.");
    }
  });
  el("[data-lead-convert]").addEventListener("click", () => {
    if (!lead || busy) return;
    conversion.reset();
    validate(conversion, {});
    for (const key of ["name", "email", "company", "website"] as const)
      control(conversion, "convert_" + key).value = lead[key];
    conversion.hidden = false;
    control(conversion, "convert_name").focus();
  });
  el("[data-lead-convert-cancel]").addEventListener("click", () => {
    conversion.hidden = true;
  });
  conversion.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!lead || busy) return;
    const input = Object.fromEntries(
      inquirySchema
        .keyof()
        .options.map((key) => [
          key,
          control(conversion, "convert_" + key).value,
        ]),
    );
    const parsed = inquirySchema.safeParse(input);
    const prefix = (errors: Record<string, string>) =>
      Object.fromEntries(
        Object.entries(errors).map(([key, value]) => ["convert_" + key, value]),
      );
    if (!parsed.success) {
      validate(conversion, prefix(fieldErrors(parsed.error)));
      announce("Supply the actual required inquiry details.", true);
      return;
    }
    validate(conversion, {});
    lock(true);
    announce("Converting lead…");
    let converted = false;
    try {
      await request(api(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "convert",
          updatedAt: lead.updatedAt,
          inquiry: parsed.data,
        }),
      });
      converted = true;
    } catch (error) {
      validate(
        conversion,
        prefix((error as { fields?: Record<string, string> }).fields ?? {}),
      );
      announce(
        error instanceof Error
          ? error.message
          : "Conversion could not be confirmed. Reload before retrying.",
        true,
      );
    } finally {
      lock(false);
    }
    if (converted) {
      await load();
      announce(
        "Inquiry created. The original lead and its history are preserved.",
      );
    }
  });
  window.addEventListener("popstate", () => {
    // Section navigation changes only the fragment, not the loaded Lead workspace.
    if (renderedRoute === location.pathname + location.search) return;
    void load();
  });
  await load();
}
