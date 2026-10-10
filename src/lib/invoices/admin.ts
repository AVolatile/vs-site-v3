import { setupBookingAdmin } from "@/lib/bookings/admin-session";
import { confirmBookingAction } from "@/lib/bookings/confirmation";
import {
  draftSchema,
  calculateTotals,
  decimalUnits,
  decimalValue,
  money,
  safeInquiryBack,
  type AdminInvoice,
  type DraftInput,
} from "./contract";
import { renderInvoiceDocument } from "./document";
export async function setupInvoiceEditor() {
  const root = document.querySelector<HTMLElement>("[data-invoice-admin]");
  if (!root) return;
  const el = <T extends HTMLElement = HTMLElement>(s: string) =>
    root.querySelector<T>(s)!;
  const form = el<HTMLFormElement>("[data-invoice-form]"),
    items = el("[data-editor-items]"),
    message = el("[data-editor-message]");
  const value = (name: string) =>
    el<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`);
  const template = el<HTMLTemplateElement>("[data-editor-item-template]");
  let invoice: AdminInvoice | undefined,
    busy = false,
    savedPayload = "",
    epoch = 0;
  const id = new URL(location.href).searchParams.get("invoice");
  const names: Record<string, string> = {
    title: "invoiceTitle",
    issueDate: "invoiceIssueDate",
    dueDate: "invoiceDueDate",
    clientName: "invoiceClientName",
    clientCompany: "invoiceClientCompany",
    clientEmail: "invoiceClientEmail",
    discountCents: "invoiceDiscount",
    taxRateBasisPoints: "invoiceTax",
    notes: "invoiceNotes",
    terms: "invoiceTerms",
    ...Object.fromEntries(
      ["line1", "line2", "city", "region", "postalCode", "country"].map((k) => [
        "billing." + k,
        "invoiceBilling" + k,
      ]),
    ),
  };
  function announce(text: string, error = false) {
    message.textContent = text;
    message.setAttribute("role", error ? "alert" : "status");
  }
  function clear() {
    epoch++;
    invoice = undefined;
    savedPayload = "";
    form.reset();
    items.replaceChildren();
    root!
      .querySelectorAll<HTMLElement>(
        "[data-editor-meta],[data-editor-link],[data-editor-preview],[data-invoice-form],[data-invoice-status-actions]",
      )
      .forEach((e) => (e.hidden = true));
    el("[data-invoice-document]").hidden = true;
    root!
      .querySelectorAll<HTMLElement>(
        "[data-invoice-value],[data-invoice-sender],[data-invoice-billing],[data-editor-number],[data-editor-status]",
      )
      .forEach((e) => (e.textContent = ""));
    el("[data-invoice-items]").replaceChildren();
    value("invoiceClientUrl").value = "";
    el<HTMLAnchorElement>("[data-editor-open]").href = "/admin/";
  }
  const session = await setupBookingAdmin(clear);
  if (!session) return;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    announce("Invalid invoice reference.", true);
    return;
  }
  async function request(body?: unknown) {
    const result = await session!.request<{ invoice: AdminInvoice }>(
      "/api/admin/invoices?id=" + encodeURIComponent(id!),
      body
        ? {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        : {},
    );
    return result.invoice;
  }
  class FieldError extends Error {
    constructor(
      public fields: Record<string, string>,
      message: string,
    ) {
      super(message);
    }
  }
  function amount(text: string, key: string) {
    try {
      return decimalUnits(text);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Enter a valid amount.";
      throw new FieldError({ [key]: message }, message);
    }
  }
  function validation(errors: Record<string, string>) {
    form.querySelectorAll<HTMLElement>("[data-field-error]").forEach((e) => {
      const name = e.dataset.fieldError!,
        row = e.closest<HTMLElement>(".editor-item"),
        itemKeys: Record<string, string> = {
          itemDescription: "description",
          itemQuantity: "quantity",
          itemRate: "unitPriceCents",
        },
        key =
          row && itemKeys[name]
            ? "items." + [...items.children].indexOf(row) + "." + itemKeys[name]
            : Object.keys(names).find((k) => names[k] === name) || name,
        text = errors[key] || "";
      e.textContent = text;
      e.hidden = !text;
      const input = e
        .closest(".inquiry-field")
        ?.querySelector<
          HTMLInputElement | HTMLTextAreaElement
        >("input,textarea");
      if (input) {
        if (text) input.setAttribute("aria-invalid", "true");
        else input.removeAttribute("aria-invalid");
      }
    });
    const itemMessage =
      errors.items ||
      (Object.keys(errors).some((k) => k.startsWith("items."))
        ? "Check the highlighted line item fields."
        : "");
    el("[data-editor-items-error]").textContent = itemMessage;
    el("[data-editor-items-error]").hidden = !itemMessage;
    form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }
  function addItem(item = { description: "", quantity: 1, unitPriceCents: 0 }) {
    const fragment = template.content.cloneNode(true) as DocumentFragment,
      row = fragment.querySelector<HTMLElement>(".editor-item")!,
      key = crypto.randomUUID();
    row.dataset.itemKey = key;
    row.querySelectorAll<HTMLInputElement>("input").forEach((input) => {
      const label = row.querySelector<HTMLLabelElement>(
          `label[for="${input.id}"]`,
        )!,
        error = row.querySelector<HTMLElement>(
          `[data-field-error="${input.name}"]`,
        )!;
      input.id += "-" + key;
      label.htmlFor = input.id;
      error.id += "-" + key;
      input.setAttribute("aria-describedby", error.id);
    });
    row.querySelector<HTMLInputElement>('[name="itemDescription"]')!.value =
      item.description;
    row.querySelector<HTMLInputElement>('[name="itemQuantity"]')!.value =
      String(item.quantity);
    row.querySelector<HTMLInputElement>('[name="itemRate"]')!.value =
      decimalValue(item.unitPriceCents);
    items.append(fragment);
    refreshItems();
  }
  function read(): DraftInput {
    for (const name of ["invoiceIssueDate", "invoiceDueDate"])
      if (value(name).validity.badInput)
        throw new FieldError(
          {
            [name === "invoiceIssueDate" ? "issueDate" : "dueDate"]:
              "Choose a valid date.",
          },
          "Choose valid invoice dates.",
        );
    const lines = [...items.children].map((row, index) => {
      const quantity = row.querySelector<HTMLInputElement>(
        '[name="itemQuantity"]',
      )!.value;
      if (!/^\d+$/.test(quantity))
        throw new FieldError(
          {
            ["items." + index + ".quantity"]:
              "Use positive whole-number quantities.",
          },
          "Check the line item quantity.",
        );
      return {
        description: row.querySelector<HTMLInputElement>(
          '[name="itemDescription"]',
        )!.value,
        quantity: Number(quantity),
        unitPriceCents: amount(
          row.querySelector<HTMLInputElement>('[name="itemRate"]')!.value,
          "items." + index + ".unitPriceCents",
        ),
      };
    });
    return {
      action: "save",
      title: value("invoiceTitle").value,
      issueDate: value("invoiceIssueDate").value,
      dueDate: value("invoiceDueDate").value || null,
      clientName: value("invoiceClientName").value,
      clientCompany: value("invoiceClientCompany").value,
      clientEmail: value("invoiceClientEmail").value,
      billing: Object.fromEntries(
        ["line1", "line2", "city", "region", "postalCode", "country"].map(
          (k) => [k, value("invoiceBilling" + k).value || null],
        ),
      ) as DraftInput["billing"],
      items: lines,
      discountCents: amount(
        value("invoiceDiscount").value || "0",
        "discountCents",
      ),
      taxRateBasisPoints: amount(
        value("invoiceTax").value || "0",
        "taxRateBasisPoints",
      ),
      notes: value("invoiceNotes").value,
      terms: value("invoiceTerms").value,
      updatedAt: invoice!.updatedAt,
    };
  }
  function refreshItems() {
    const rows = [...items.children] as HTMLElement[];
    rows.forEach((row, index) => {
      const heading = row.querySelector<HTMLElement>(
        "[data-editor-item-heading]",
      )!;
      heading.textContent = "Item " + (index + 1);
      heading.id = "invoice-item-" + row.dataset.itemKey;
      row.setAttribute("role", "group");
      row.setAttribute("aria-labelledby", heading.id);
      row.querySelector<HTMLButtonElement>("[data-item-up]")!.disabled =
        busy || index === 0;
      row.querySelector<HTMLButtonElement>("[data-item-down]")!.disabled =
        busy || index === rows.length - 1;
      try {
        const n = Number(
          row.querySelector<HTMLInputElement>('[name="itemQuantity"]')!.value,
        );
        if (!Number.isInteger(n) || n < 1) throw Error();
        row.querySelector<HTMLElement>("[data-item-amount]")!.textContent =
          money(
            n *
              decimalUnits(
                row.querySelector<HTMLInputElement>('[name="itemRate"]')!.value,
              ),
          );
      } catch {
        row.querySelector<HTMLElement>("[data-item-amount]")!.textContent = "—";
      }
    });
    el<HTMLButtonElement>("[data-editor-add]").disabled =
      busy || rows.length >= 25;
    try {
      const input = draftSchema.parse(read()),
        totals = calculateTotals(
          input.items,
          input.discountCents,
          input.taxRateBasisPoints,
        ),
        fragment = document.createDocumentFragment();
      for (const [label, amount] of [
        ["Subtotal", totals.subtotalCents],
        ["Discount", totals.discountCents],
        ["Tax", totals.taxCents],
        ["Total", totals.totalCents],
      ] as const) {
        const row = document.createElement("div"),
          dt = document.createElement("dt"),
          dd = document.createElement("dd");
        dt.textContent = label;
        dd.textContent = money(amount);
        row.append(dt, dd);
        fragment.append(row);
      }
      el("[data-editor-totals]").replaceChildren(fragment);
    } catch {
      el("[data-editor-totals]").textContent =
        "Complete valid pricing values to preview totals.";
    }
  }
  function render(saved: AdminInvoice) {
    invoice = saved;
    el("[data-editor-timezone]").textContent =
      "Invoice dates use " + saved.businessTimezone + ".";
    el("[data-editor-meta]").hidden = false;
    el("[data-editor-number]").textContent = saved.number;
    el("[data-editor-status]").textContent =
      saved.status[0].toUpperCase() + saved.status.slice(1);
    el<HTMLAnchorElement>("[data-invoice-back]").href = safeInquiryBack(
      new URL(location.href).searchParams.get("back"),
      saved.inquiryId,
    );
    form.hidden = saved.persistedStatus !== "draft";
    for (const [key, name] of Object.entries(names)) {
      const v = key.startsWith("billing.")
        ? saved.billing[key.slice(8) as keyof typeof saved.billing]
        : saved[key as keyof AdminInvoice];
      value(name).value =
        key === "discountCents" || key === "taxRateBasisPoints"
          ? decimalValue(Number(v))
          : String(v ?? "");
    }
    items.replaceChildren();
    saved.items.forEach(addItem);
    refreshItems();
    savedPayload = JSON.stringify(read());
    validation({});
    renderInvoiceDocument(el("[data-invoice-document]"), saved);
    el("[data-editor-preview]").hidden = false;
    el("[data-editor-link]").hidden = !saved.publicUrl;
    if (saved.publicUrl) {
      value("invoiceClientUrl").value = saved.publicUrl;
      value("invoiceClientUrl").readOnly = true;
      el<HTMLAnchorElement>("[data-editor-open]").href = saved.publicUrl;
    }
    el("[data-invoice-status-actions]").hidden =
      saved.persistedStatus !== "sent";
  }
  async function load() {
    const version = ++epoch;
    announce("Loading invoice…");
    try {
      const saved = await request();
      if (version !== epoch || !session!.active()) return;
      render(saved);
      announce(
        saved.persistedStatus === "draft"
          ? "Draft loaded. Choose a due date and save before sending."
          : "Published invoice — content is read-only." +
              (saved.publicUrl
                ? ""
                : " Restore the invoice sharing key to copy its client link."),
      );
    } catch (e) {
      if (version === epoch && session!.active())
        announce(
          e instanceof Error
            ? e.message
            : "This invoice could not be loaded. Use Reload invoice.",
          true,
        );
    }
  }
  function controls(disabled: boolean) {
    busy = disabled;
    root!.setAttribute("aria-busy", String(disabled));
    root!
      .querySelectorAll<
        HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement
      >("input,textarea,button")
      .forEach((e) => (e.disabled = disabled));
    if (!disabled) refreshItems();
  }
  async function mutate(action: "save" | "send" | "mark-paid" | "void") {
    if (busy || !invoice || !session!.active()) return;
    validation({});
    let body: unknown;
    if (action === "save" || action === "send") {
      try {
        const result = draftSchema.safeParse(read());
        if (!result.success) {
          validation(
            Object.fromEntries(
              result.error.issues.map((i) => [i.path.join("."), i.message]),
            ),
          );
          announce("Check invoice fields.", true);
          return;
        }
        calculateTotals(
          result.data.items,
          result.data.discountCents,
          result.data.taxRateBasisPoints,
        );
        if (action === "send") {
          if (JSON.stringify(read()) !== savedPayload) {
            announce("Save draft changes before sending.", true);
            return;
          }
          const errors: Record<string, string> = {};
          if (!result.data.dueDate)
            errors.dueDate = "Choose a due date before sending.";
          if (
            !result.data.items.length ||
            result.data.items.some((i) => !i.description.trim())
          )
            errors.items = "Add at least one item and describe every line.";
          result.data.items.forEach((item, index) => {
            if (!item.description.trim())
              errors["items." + index + ".description"] =
                "Describe this line item before sending.";
          });
          if (Object.keys(errors).length) {
            validation(errors);
            announce("Complete and save the invoice before sending.", true);
            return;
          }
        }
        body =
          action === "save"
            ? result.data
            : { action, updatedAt: invoice.updatedAt, confirmed: true };
      } catch (e) {
        if (e instanceof FieldError) validation(e.fields);
        else if (e instanceof Error && e.message.includes("Discount"))
          validation({ discountCents: e.message });
        else if (e instanceof Error) validation({ items: e.message });
        announce(
          e instanceof Error ? e.message : "Check pricing values.",
          true,
        );
        return;
      }
    } else body = { action, updatedAt: invoice.updatedAt, confirmed: true };
    if (
      action !== "save" &&
      !(await confirmBookingAction({
        title:
          action === "send"
            ? "Send invoice?"
            : action === "mark-paid"
              ? "Mark this invoice as paid?"
              : "Void this invoice?",
        message:
          action === "send"
            ? "Publish the saved invoice and freeze its content. No email is sent."
            : action === "mark-paid"
              ? "Confirm you received payment. This records a manual payment status; no processor verification is performed."
              : "This invoice will remain in history and its client page will show Void. Paid invoices cannot be voided here.",
        action:
          action === "send"
            ? "Send invoice"
            : action === "mark-paid"
              ? "Mark as paid"
              : "Void invoice",
      }))
    )
      return;
    if (busy || !invoice || !session!.active()) return;
    const version = epoch;
    controls(true);
    announce("Saving invoice…");
    let confirmed = false;
    try {
      const saved = await request(body);
      if (version !== epoch || !session!.active()) return;
      render(saved);
      confirmed = true;
      announce(
        action === "save"
          ? "Draft saved."
          : action === "send"
            ? "Invoice sent. Copy the client link or include it in an explicitly composed email."
            : action === "mark-paid"
              ? "Invoice marked paid manually."
              : "Invoice voided.",
      );
    } catch (e) {
      if (version === epoch && session!.active())
        announce(
          e instanceof Error
            ? e.message
            : "The change could not be confirmed. Your edits remain; reload before retrying.",
          true,
        );
    } finally {
      if (version === epoch && session!.active()) {
        controls(false);
        if (confirmed) {
          const focus =
            action === "save"
              ? el("[data-editor-save]")
              : el("[data-editor-reload]");
          focus.focus();
        }
      }
    }
  }
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    void mutate("save");
  });
  form.addEventListener("input", refreshItems);
  items.addEventListener("click", (e) => {
    if (busy) return;
    const button = (e.target as HTMLElement).closest<HTMLButtonElement>(
      "button",
    );
    if (!button) return;
    const row = button.closest<HTMLElement>(".editor-item")!;
    if (button.hasAttribute("data-item-remove")) {
      const next = row.nextElementSibling || row.previousElementSibling;
      row.remove();
      refreshItems();
      (
        next?.querySelector<HTMLElement>("input") || el("[data-editor-add]")
      ).focus();
      return;
    }
    if (button.hasAttribute("data-item-up") && row.previousElementSibling)
      items.insertBefore(row, row.previousElementSibling);
    else if (button.hasAttribute("data-item-down") && row.nextElementSibling)
      items.insertBefore(row.nextElementSibling, row);
    refreshItems();
    button.focus();
  });
  el("[data-editor-add]").addEventListener("click", () => {
    if (!busy && items.children.length < 25) {
      addItem();
      items.lastElementChild?.querySelector<HTMLInputElement>("input")?.focus();
    }
  });
  el("[data-editor-send]").addEventListener("click", () => void mutate("send"));
  root
    .querySelectorAll<HTMLButtonElement>("[data-invoice-action]")
    .forEach((b) =>
      b.addEventListener(
        "click",
        () => void mutate(b.dataset.invoiceAction as "mark-paid" | "void"),
      ),
    );
  el("[data-editor-reload]").addEventListener("click", () => {
    if (!busy) void load();
  });
  el("[data-editor-copy]").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(value("invoiceClientUrl").value);
      announce("Invoice link copied.");
    } catch {
      value("invoiceClientUrl").select();
      announce("Copy the selected invoice link.");
    }
  });
  await load();
}
