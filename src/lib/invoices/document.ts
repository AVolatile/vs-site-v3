import { money, decimalValue, type PublicInvoice } from "./contract";
export function renderInvoiceDocument(
  root: HTMLElement,
  invoice: PublicInvoice,
) {
  const format = (v: string | null) =>
    v
      ? new Date(v + "T00:00:00Z").toLocaleDateString("en-US", {
          dateStyle: "long",
          timeZone: "UTC",
        })
      : "Not selected";
  const values: Record<string, string> = {
    ...Object.fromEntries(
      [
        "title",
        "number",
        "clientName",
        "clientCompany",
        "clientEmail",
        "notes",
        "terms",
        "paymentStatus",
      ].map((k) => [k, String(invoice[k as keyof PublicInvoice])]),
    ),
    status: invoice.status[0].toUpperCase() + invoice.status.slice(1),
    issueDate: format(invoice.issueDate),
    dueDate: format(invoice.dueDate),
    subtotalCents: money(invoice.subtotalCents),
    discountCents:
      (invoice.discountCents ? "−" : "") + money(invoice.discountCents),
    taxCents: money(invoice.taxCents),
    totalCents: money(invoice.totalCents),
  };
  for (const [key, value] of Object.entries(values)) {
    const e = root.querySelector<HTMLElement>(`[data-invoice-value="${key}"]`)!;
    e.textContent = value;
    e.hidden = !value;
  }
  root.querySelector<HTMLElement>(
    '[data-invoice-value="status"]',
  )!.dataset.status = invoice.status;
  for (const [key, value] of Object.entries(invoice.sender))
    root.querySelector<HTMLElement>(
      `[data-invoice-sender="${key}"]`,
    )!.textContent = value;
  for (const [key, value] of Object.entries(invoice.billing)) {
    const e = root.querySelector<HTMLElement>(
      `[data-invoice-billing="${key}"]`,
    )!;
    e.textContent = value || "";
    e.hidden = !value;
  }
  root.querySelector<HTMLElement>("[data-invoice-notes]")!.hidden =
    !invoice.notes;
  root.querySelector<HTMLElement>("[data-invoice-terms]")!.hidden =
    !invoice.terms;
  root
    .querySelectorAll<HTMLElement>("[data-invoice-tax-rate]")
    .forEach((e, i) => {
      e.hidden = i !== 2;
      e.textContent = " (" + decimalValue(invoice.taxRateBasisPoints) + "%)";
    });
  const fragment = document.createDocumentFragment();
  for (const item of invoice.items) {
    const row = document.createElement("tr");
    [
      item.description || "Untitled draft item",
      String(item.quantity),
      money(item.unitPriceCents),
      money(item.lineTotalCents),
    ].forEach((value, i) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      cell.dataset.label = ["Description", "Quantity", "Rate", "Amount"][i];
      row.append(cell);
    });
    fragment.append(row);
  }
  root.querySelector("[data-invoice-items]")!.replaceChildren(fragment);
  root.hidden = false;
}
