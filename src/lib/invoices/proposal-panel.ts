import { invoiceAdminUrl, money, type AdminInvoice } from "./contract";
import type { AdminProposal } from "@/lib/proposals/contract";
interface Options {
  active: () => boolean;
  back: () => string;
  request: <T>(url: string, options?: RequestInit) => Promise<T>;
}
export function setupInvoicePanel(panel: HTMLElement, options: Options) {
  const el = <T extends HTMLElement = HTMLElement>(s: string) =>
    panel.querySelector<T>(s)!;
  let epoch = 0,
    proposalId: string | null = null,
    busy = false;
  function clear() {
    epoch++;
    proposalId = null;
    el("[data-invoice-context-message]").setAttribute("role", "status");
    panel.hidden = true;
    el("[data-invoice-create]").hidden = true;
    el("[data-invoice-context-summary]").hidden = true;
    panel
      .querySelectorAll<HTMLElement>(
        "[data-invoice-number],[data-invoice-status],[data-invoice-total],[data-invoice-dates],[data-invoice-context-message]",
      )
      .forEach((e) => (e.textContent = ""));
    panel
      .querySelectorAll<HTMLAnchorElement>("[data-invoice-open]")
      .forEach((e) => (e.href = "/admin/"));
  }
  function render(invoice: AdminInvoice | null) {
    el("[data-invoice-create]").hidden = !!invoice;
    el("[data-invoice-context-summary]").hidden = !invoice;
    el("[data-invoice-context-message]").textContent = invoice
      ? ""
      : "No invoice yet. Create a draft from this accepted proposal.";
    if (!invoice) return;
    el("[data-invoice-number]").textContent = invoice.number;
    el("[data-invoice-status]").textContent =
      invoice.status[0].toUpperCase() + invoice.status.slice(1);
    el("[data-invoice-total]").textContent = money(invoice.totalCents);
    el("[data-invoice-dates]").textContent =
      "Issued " +
      invoice.issueDate +
      " · " +
      (invoice.dueDate ? "Due " + invoice.dueDate : "Due date not selected");
    panel
      .querySelectorAll<HTMLAnchorElement>("[data-invoice-open]")
      .forEach((link) => {
        link.href = invoiceAdminUrl(invoice.id, options.back());
        link.hidden =
          link.dataset.invoiceOpen === "edit" &&
          invoice.persistedStatus !== "draft";
      });
  }
  async function load(proposal: AdminProposal | null) {
    clear();
    if (!proposal || proposal.status !== "accepted" || !options.active())
      return;
    proposalId = proposal.id;
    const version = epoch;
    panel.hidden = false;
    el("[data-invoice-context-message]").textContent = "Loading invoice…";
    try {
      const data = await options.request<{ invoice: AdminInvoice | null }>(
        "/api/admin/invoices?proposal=" + encodeURIComponent(proposal.id),
      );
      if (version === epoch && options.active()) render(data.invoice);
    } catch {
      if (version === epoch && options.active()) {
        el("[data-invoice-context-message]").textContent =
          "Invoice could not be loaded. Reload this view to try again.";
        el("[data-invoice-context-message]").setAttribute("role", "alert");
      }
    }
  }
  el<HTMLButtonElement>("[data-invoice-create]").addEventListener(
    "click",
    async () => {
      if (busy || !proposalId || !options.active()) return;
      busy = true;
      const version = epoch;
      el<HTMLButtonElement>("[data-invoice-create]").disabled = true;
      el("[data-invoice-context-message]").textContent = "Creating invoice…";
      try {
        const data = await options.request<{ invoice: AdminInvoice }>(
          "/api/admin/invoices",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ proposalId }),
          },
        );
        if (version === epoch && options.active())
          location.assign(invoiceAdminUrl(data.invoice.id, options.back()));
      } catch (e) {
        if (version === epoch && options.active()) {
          el("[data-invoice-context-message]").textContent =
            e instanceof Error
              ? e.message
              : "Creation could not be confirmed. Reload before retrying.";
          el("[data-invoice-context-message]").setAttribute("role", "alert");
        }
      } finally {
        busy = false;
        el<HTMLButtonElement>("[data-invoice-create]").disabled = false;
      }
    },
  );
  return { load, clear };
}
