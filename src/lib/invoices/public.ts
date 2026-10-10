import { tokenSchema, type PublicInvoice } from "./contract";
import { renderInvoiceDocument } from "./document";
export async function setupPublicInvoice() {
  const root = document.querySelector<HTMLElement>("[data-public-invoice]");
  if (!root) return;
  const message = root.querySelector<HTMLElement>("[data-public-message]")!,
    view = root.querySelector<HTMLElement>("[data-invoice-document]")!;
  const token = tokenSchema.safeParse(
    location.pathname.split("/").filter(Boolean)[1],
  );
  if (!token.success) {
    message.textContent = "This invoice is unavailable.";
    message.setAttribute("role", "alert");
    return;
  }
  const url = "/api/invoice?token=" + encodeURIComponent(token.data);
  async function request(init: RequestInit = {}) {
    const response = await fetch(url, {
      ...init,
      credentials: "omit",
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
    const body = await response.json();
    if (!response.ok)
      throw Error(body.error || "This invoice could not be loaded.");
    return body.invoice as PublicInvoice;
  }
  try {
    const invoice = await request();
    renderInvoiceDocument(view, invoice);
    message.textContent = "Review your invoice below.";
    root.querySelector<HTMLElement>("[data-public-print]")!.hidden = false;
    let acknowledged = false;
    const acknowledge = async () => {
      if (acknowledged || document.visibilityState !== "visible") return;
      acknowledged = true;
      document.removeEventListener("visibilitychange", acknowledge);
      try {
        renderInvoiceDocument(
          view,
          await request({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "view" }),
          }),
        );
      } catch {
        /* Viewing must remain usable if acknowledgment fails. */
      }
    };
    if (
      invoice.status === "sent" ||
      invoice.status === "viewed" ||
      invoice.status === "overdue"
    ) {
      document.addEventListener("visibilitychange", acknowledge);
      void acknowledge();
    }
  } catch (error) {
    message.textContent =
      error instanceof Error
        ? error.message
        : "This invoice could not be loaded. Refresh to try again.";
    message.setAttribute("role", "alert");
  }
  root
    .querySelector("[data-invoice-print]")!
    .addEventListener("click", () => window.print());
}
