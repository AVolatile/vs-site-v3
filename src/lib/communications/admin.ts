import {
  compositionSchema,
  messageFailureText,
  messageHasFailure,
  messageStatusText,
  type Composition,
  type EmailPreview,
  type MessageDetail,
  type MessageList,
} from "./contract";
import { EMAIL_TEMPLATES, personalize } from "./templates";
import {
  inquiryContent,
  optionLabel,
  type Inquiry,
} from "@/lib/inquiries/contract";
interface Options {
  panel: HTMLElement;
  ownerType?: "inquiry" | "lead";
  current: () => Pick<
    Inquiry,
    "id" | "name" | "company" | "email" | "projectType"
  > | null;
  active: () => boolean;
  version: () => number;
  request: <T>(url: string, options?: RequestInit) => Promise<T>;
  validate: (form: HTMLFormElement, errors: Record<string, string>) => void;
  refreshActivity: (id: string, version: number) => Promise<boolean>;
  error: (error: unknown, fallback: string) => string;
}
export function setupInquiryCommunication(options: Options) {
  const { panel } = options;
  const el = <T extends HTMLElement = HTMLElement>(selector: string) =>
    panel.querySelector<T>(selector)!;
  const form = el<HTMLFormElement>("[data-email-form]"),
    history = el<HTMLOListElement>("[data-email-history]"),
    feedback = el("[data-email-feedback]");
  const field = <
    T extends HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement =
      HTMLInputElement,
  >(
    name: string,
  ) => form.elements.namedItem(name) as T;
  let epoch = 0,
    busy = false,
    page = 1,
    total = 0,
    proposal: MessageList["proposal"] = null,
    booking: MessageList["booking"] = null,
    invoice: MessageList["invoice"] = null,
    requestKey = crypto.randomUUID(),
    attempted = false,
    recordId: string | null = null,
    selectedTemplate = "personal",
    suppressed = false,
    replyToMessageId: string | undefined;
  let abort: AbortController | undefined;
  field("emailTo").readOnly = true;
  function announce(value: string, error = false) {
    feedback.textContent = value;
    feedback.setAttribute("role", error ? "alert" : "status");
  }
  const current = (version: number) =>
    epoch === version && options.active() && !!options.current();
  function endpoint() {
    return (
      "/api/admin/messages?" +
      (options.ownerType ?? "inquiry") +
      "=" +
      encodeURIComponent(options.current()!.id)
    );
  }
  async function post<T>(body: unknown) {
    return options.request<T>(endpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }
  function controls(value: boolean) {
    busy = value;
    if (value) form.setAttribute("aria-busy", "true");
    else form.removeAttribute("aria-busy");
    panel
      .querySelectorAll<
        | HTMLButtonElement
        | HTMLInputElement
        | HTMLTextAreaElement
        | HTMLSelectElement
      >("button,input,textarea,select")
      .forEach((control) => {
        control.disabled = value;
      });
    el<HTMLButtonElement>("[data-email-previous]").disabled =
      value || page <= 1;
    el<HTMLButtonElement>("[data-email-next]").disabled =
      value || page * 10 >= total;
    el<HTMLButtonElement>("[data-email-send]").disabled =
      value || !!recordId || suppressed;
    if (options.ownerType === "lead") {
      el<HTMLButtonElement>("[data-email-compose]").disabled =
        value || !options.current()?.email || suppressed;
      panel
        .querySelectorAll<HTMLButtonElement>("[data-email-reply]")
        .forEach((button) => {
          button.disabled =
            value ||
            suppressed ||
            !options.current()?.email ||
            button.dataset.unavailable === "true";
        });
    }
  }
  function syncFormat() {
    if (options.ownerType !== "lead") return;
    const quick = field("emailFormat").value === "quick";
    el("[data-email-template-field]").hidden = quick;
    el("[data-email-cta-field]").hidden =
      quick || (!proposal && !booking && !invoice);
    if (quick) field("emailCta").value = "none";
  }
  function closePreview() {
    el("[data-email-preview-panel]").hidden = true;
    el<HTMLIFrameElement>("[data-email-preview-frame]").srcdoc = "";
    for (const key of ["to", "from", "subject"])
      el("[data-email-preview-" + key + "]").textContent = "";
  }
  function composeInput(): Composition | null {
    const result = compositionSchema.safeParse({
      to: field("emailTo").value,
      subject: field("emailSubject").value,
      message: field("emailMessage").value,
      templateKey: field("emailTemplate").value,
      includeProposal: field("emailCta").value === "proposal",
      includeBooking: field("emailCta").value === "booking",
      includeInvoice: field("emailCta").value === "invoice",
      ...(options.ownerType === "lead"
        ? {
            format: field("emailFormat").value,
            ...(replyToMessageId ? { replyToMessageId } : {}),
          }
        : {}),
    });
    const names = {
      to: "emailTo",
      subject: "emailSubject",
      message: "emailMessage",
      templateKey: "emailTemplate",
      includeProposal: "emailCta",
    };
    if (!result.success) {
      options.validate(
        form,
        Object.fromEntries(
          result.error.issues.map((issue) => [
            names[issue.path[0] as keyof typeof names] ?? "emailMessage",
            issue.message,
          ]),
        ),
      );
      return null;
    }
    options.validate(form, {});
    return result.data;
  }
  function populateTemplate() {
    const inquiry = options.current();
    if (!inquiry) return;
    const template = EMAIL_TEMPLATES.find(
      (item) => item.key === field("emailTemplate").value,
    )!;
    const variables = {
      firstName: inquiry.name.trim().split(/\s+/)[0] || "there",
      company: inquiry.company || "your business",
      projectType: optionLabel(
        inquiryContent.projectTypes,
        inquiry.projectType,
      ),
      proposalNumber: proposal?.number || "",
      proposalUrl: proposal?.url || "",
      bookingUrl: booking?.url || "",
    };
    try {
      if (!replyToMessageId)
        field("emailSubject").value = personalize(template.subject, variables);
      field("emailMessage").value = personalize(
        template.bookingMessage && booking
          ? template.bookingMessage
          : template.message,
        variables,
      );
      field("emailCta").value =
        template.key === "proposal"
          ? "proposal"
          : template.key === "discovery" && booking
            ? "booking"
            : "none";
      closePreview();
    } catch {
      announce("A current sent proposal is needed for this template.", true);
    }
  }
  function newComposition() {
    requestKey = crypto.randomUUID();
    attempted = false;
    recordId = null;
    selectedTemplate = "personal";
    form.reset();
    field("emailTo").value = options.current()?.email ?? "";
    field("emailTemplate").value = "personal";
    field("emailCta").value = "none";
    replyToMessageId = undefined;
    if (options.ownerType === "lead") {
      field("emailFormat").value = "quick";
      el("[data-email-reply-context]").textContent =
        "New conversation · Quick Email adds no automatic greeting or signature.";
      syncFormat();
    } else populateTemplate();
    options.validate(form, {});
    closePreview();
    controls(busy);
  }
  function preview(mail: EmailPreview) {
    el("[data-email-preview-panel]").hidden = false;
    for (const key of ["to", "from", "subject"] as const)
      el("[data-email-preview-" + key + "]").textContent = mail[key];
    const frame = el<HTMLIFrameElement>("[data-email-preview-frame]");
    frame.srcdoc = mail.bodyHtml.replace(
      "<head>",
      "<head><meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; img-src https:; style-src 'unsafe-inline'; form-action 'none'; base-uri 'none'\">",
    );
    el('[id="email-preview-heading"]').focus();
  }
  async function refresh(version = epoch) {
    const result = await options.request<MessageList>(
      endpoint() + "&page=" + page,
      { signal: abort!.signal },
    );
    if (!current(version)) return;
    total = result.total;
    if (options.ownerType === "lead") {
      suppressed = !!result.emailSuppressed;
      el("[data-email-mailbox]").textContent =
        result.mailbox?.message || "Outbound only. Replies are not synced.";
      el("[data-email-sync]").hidden = result.mailbox?.status !== "connected";
      el("[data-email-suppress]").setAttribute(
        "aria-pressed",
        String(suppressed),
      );
      el("[data-email-suppress]").textContent = suppressed
        ? "Review / allow email"
        : "Do not email";
      el("[data-email-permission]").textContent = suppressed
        ? "Email is blocked by a contact suppression or a recorded bounce/complaint. Sending and retries are unavailable."
        : "Sends use the saved contact address and existing Volatile Solutions sender. Sent means provider acceptance; delivery appears only when known.";
    }
    proposal = result.proposal;
    booking = result.booking;
    invoice = result.invoice;
    el("[data-email-cta-field]").hidden = !proposal && !booking && !invoice;
    field<HTMLSelectElement>("emailCta").querySelector<HTMLOptionElement>(
      'option[value="proposal"]',
    )!.disabled = !proposal;
    field<HTMLSelectElement>("emailCta").querySelector<HTMLOptionElement>(
      'option[value="booking"]',
    )!.disabled = !booking;
    field("emailCta").querySelector<HTMLOptionElement>(
      'option[value="booking"]',
    )!.hidden = !booking;
    const invoiceOption = field<HTMLSelectElement>(
      "emailCta",
    ).querySelector<HTMLOptionElement>('option[value="invoice"]')!;
    invoiceOption.hidden = !invoice;
    invoiceOption.disabled = !invoice;
    const proposalOption = field<HTMLSelectElement>(
      "emailTemplate",
    ).querySelector<HTMLOptionElement>('option[value="proposal"]')!;
    proposalOption.disabled = !proposal;
    if (
      !attempted &&
      ((field("emailCta").value === "proposal" && !proposal) ||
        (field("emailCta").value === "booking" && !booking) ||
        (field("emailCta").value === "invoice" && !invoice))
    )
      field("emailCta").value = "none";
    history.replaceChildren();
    el("[data-email-empty]").hidden = result.items.length > 0;
    el("[data-email-pagination]").hidden = total <= 10;
    el("[data-email-page]").textContent =
      `Page ${page} of ${Math.max(1, Math.ceil(total / 10))}`;
    const threads = new Map<string, HTMLOListElement>();
    const items =
      options.ownerType === "lead" ? [...result.items].reverse() : result.items;
    for (const item of items) {
      const fragment = el<HTMLTemplateElement>(
        "[data-email-history-template]",
      ).content.cloneNode(true) as DocumentFragment;
      const details = fragment.querySelector<HTMLDetailsElement>("details")!,
        summary = details.querySelector<HTMLElement>("summary")!;
      details.querySelector<HTMLElement>(
        "[data-email-history-subject]",
      )!.textContent = item.subject;
      details.querySelector<HTMLElement>(
        "[data-email-history-meta]",
      )!.textContent =
        new Date(
          item.receivedAt ?? item.sentAt ?? item.createdAt,
        ).toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        }) +
        " · " +
        (item.direction === "inbound" ? "Inbound · " : "Outbound · ") +
        item.from +
        " → " +
        item.to +
        " · " +
        (item.format === "quick"
          ? "Quick Email"
          : (EMAIL_TEMPLATES.find((t) => t.key === item.templateKey)?.label ??
            item.templateKey));
      const status = details.querySelector<HTMLElement>(
        "[data-email-history-status]",
      )!;
      status.textContent = messageStatusText(item);
      status.dataset.status = messageHasFailure(item) ? "failed" : item.status;
      const retry =
          details.querySelector<HTMLButtonElement>("[data-email-retry]")!,
        body = details.querySelector<HTMLElement>("[data-email-history-body]")!;
      retry.hidden = !item.canRetry || suppressed;
      retry.disabled = busy;
      details.querySelector<HTMLElement>("[data-email-retry-help]")!.hidden =
        item.status === "sent" || item.direction === "inbound";
      let loaded = false;
      details.addEventListener("toggle", async () => {
        if (!details.open || loaded) return;
        loaded = true;
        body.textContent = "Loading message…";
        try {
          const result = await options.request<{ message: MessageDetail }>(
            endpoint() + "&message=" + encodeURIComponent(item.id),
            { signal: abort!.signal },
          );
          if (current(version)) body.textContent = result.message.bodyText;
        } catch {
          if (current(version)) {
            body.textContent =
              "Message could not be loaded. Close and reopen to try again.";
            loaded = false;
          }
        }
      });
      retry.addEventListener("click", () => {
        void performRetry(item.id, summary);
      });
      if (options.ownerType === "lead") {
        const reply =
          details.querySelector<HTMLButtonElement>("[data-email-reply]")!;
        reply.dataset.unavailable = String(item.status !== "sent");
        reply.disabled =
          busy ||
          suppressed ||
          !options.current()?.email ||
          item.status !== "sent";
        reply.addEventListener("click", () => {
          if (busy || suppressed) return;
          if (
            (attempted || field("emailMessage").value) &&
            !confirm(
              "Replace the current composition? Check any previous send outcome first.",
            )
          )
            return;
          newComposition();
          replyToMessageId = item.id;
          field("emailSubject").value = /^re:/i.test(item.subject)
            ? item.subject
            : ("Re: " + item.subject).slice(0, 200);
          el("[data-email-reply-context]").textContent =
            "Reply in conversation " +
            item.threadId.slice(0, 8) +
            " · " +
            item.subject;
          form.hidden = false;
          el("[data-email-compose]").setAttribute("aria-expanded", "true");
          field("emailMessage").focus();
        });
        let messages = threads.get(item.threadId);
        if (!messages) {
          const group = el<HTMLTemplateElement>(
            "[data-email-thread-template]",
          ).content.cloneNode(true) as DocumentFragment;
          group.querySelector<HTMLElement>(
            "[data-email-thread-heading]",
          )!.textContent = "Conversation · " + item.subject;
          messages = group.querySelector<HTMLOListElement>(
            "[data-email-thread-messages]",
          )!;
          threads.set(item.threadId, messages);
          history.append(group);
        }
        messages.append(fragment);
        if (item.id === result.items[0]?.id) details.open = true;
      } else history.append(fragment);
    }
    syncFormat();
    controls(busy);
  }
  async function afterOutcome(message: MessageDetail, version: number) {
    if (!current(version)) return;
    recordId = message.status === "sent" ? null : message.id;
    announce(messageFailureText(message), messageHasFailure(message));
    page = 1;
    if (message.status === "sent") {
      form.hidden = true;
      el("[data-email-compose]").setAttribute("aria-expanded", "false");
      newComposition();
    }
    try {
      await refresh(version);
    } catch {
      if (current(version))
        announce(
          messageFailureText(message) +
            " History could not refresh; use Refresh history.",
          message.status !== "sent",
        );
    }
    const inquiry = options.current();
    if (inquiry && current(version))
      if (
        !(await options.refreshActivity(inquiry.id, options.version())) &&
        current(version)
      )
        feedback.textContent +=
          " Activity could not refresh; use Reload inquiry to try again.";
  }
  async function performRetry(id: string, focus: HTMLElement) {
    if (busy || !options.active()) return;
    const version = epoch;
    controls(true);
    announce("Retrying the saved email with its original key…");
    try {
      const result = await post<{ message: MessageDetail }>({
        action: "retry",
        messageId: id,
      });
      await afterOutcome(result.message, version);
    } catch (error) {
      if (current(version))
        announce(
          options.error(
            error,
            "Retry could not be confirmed. Refresh history before trying again.",
          ),
          true,
        );
    } finally {
      if (current(version)) {
        controls(false);
        feedback.tabIndex = -1;
        feedback.focus();
      } else focus.blur();
    }
  }
  el("[data-email-compose]").addEventListener("click", () => {
    if (busy) return;
    const startNew = attempted || !!replyToMessageId;
    if (
      startNew &&
      !confirm(
        "Start a new response? Check the saved message’s outcome before sending another copy.",
      )
    )
      return;
    if (startNew || !field("emailTo").value) newComposition();
    form.hidden = false;
    el("[data-email-compose]").setAttribute("aria-expanded", "true");
    field(
      options.ownerType === "lead" ? "emailSubject" : "emailTemplate",
    ).focus();
  });
  field<HTMLSelectElement>("emailTemplate").addEventListener("change", () => {
    if (
      field("emailMessage").value &&
      !confirm("Replace the current subject and message with this template?")
    ) {
      field("emailTemplate").value = selectedTemplate;
      return;
    }
    selectedTemplate = field("emailTemplate").value;
    populateTemplate();
  });
  if (options.ownerType === "lead") {
    field("emailFormat").addEventListener("change", () => {
      syncFormat();
      closePreview();
      announce(
        field("emailFormat").value === "quick"
          ? "Quick Email sends exactly your text."
          : "Branded email uses the existing greeting, signature and design. Choose a template or write your own message.",
      );
    });
    for (const [selector, action] of [
      ["[data-email-sync]", "sync"],
      ["[data-email-receipts]", "receipts"],
      ["[data-email-suppress]", "suppression"],
    ] as const) {
      el(selector).addEventListener("click", async () => {
        if (busy || !options.active()) return;
        if (
          action === "suppression" &&
          !confirm(
            suppressed
              ? "Allow email after reviewing this contact? Bounce/complaint protection remains active."
              : "Mark this lead Do not email? Sending and retries will be blocked.",
          )
        )
          return;
        const version = epoch;
        controls(true);
        announce(
          action === "sync"
            ? "Syncing Outlook replies…"
            : "Updating email status…",
        );
        try {
          const result = await post<{
            imported?: number;
            more?: boolean;
            refreshed?: number;
            total?: number;
          }>({
            action,
            ...(action === "suppression" ? { suppressed: !suppressed } : {}),
          });
          await refresh(version);
          if (current(version)) {
            announce(
              action === "sync"
                ? `${result.imported || 0} replies imported.${result.more ? " More Inbox messages remain. Use Sync replies again to continue." : " Inbox sync is up to date."}`
                : action === "receipts"
                  ? result.refreshed
                    ? `Provider status checked for ${result.refreshed} emails.`
                    : "Provider status is unavailable or there are no sent emails. Saved send outcomes are preserved."
                  : "Email permission reviewed. Any remaining address suppression or bounce/complaint still blocks sending.",
            );
            await options.refreshActivity(
              options.current()!.id,
              options.version(),
            );
          }
        } catch (error) {
          if (current(version))
            announce(
              options.error(error, "Email status could not update. Try again."),
              true,
            );
        } finally {
          if (current(version)) controls(false);
        }
      });
    }
  }
  form.addEventListener("input", (event) => {
    closePreview();
    const input = event.target;
    if (
      !(
        input instanceof HTMLInputElement ||
        input instanceof HTMLTextAreaElement
      )
    )
      return;
    const schema =
      input.name === "emailSubject"
        ? compositionSchema.shape.subject
        : input.name === "emailMessage"
          ? compositionSchema.shape.message
          : null;
    if (!schema?.safeParse(input.value).success) return;
    input.setAttribute("aria-invalid", "false");
    const error = form.querySelector<HTMLElement>(
      `[data-field-error="${input.name}"]`,
    );
    if (error) {
      error.textContent = "";
      error.hidden = true;
    }
  });
  field("emailCta").addEventListener("change", closePreview);
  el("[data-email-close]").addEventListener("click", () => {
    form.hidden = true;
    closePreview();
    el("[data-email-compose]").setAttribute("aria-expanded", "false");
    el("[data-email-compose]").focus();
  });
  el("[data-email-preview-close]").addEventListener("click", () => {
    closePreview();
    el("[data-email-preview]").focus();
  });
  el("[data-email-preview]").addEventListener("click", async () => {
    if (busy) return;
    const input = composeInput();
    if (!input) return;
    const version = epoch;
    controls(true);
    announce("Preparing preview…");
    try {
      const result = await post<{ preview: EmailPreview }>({
        action: "preview",
        ...input,
      });
      if (current(version)) {
        preview(result.preview);
        announce("Preview only — no email has been sent.");
      }
    } catch (error) {
      if (current(version))
        announce(
          options.error(
            error,
            "Preview could not be loaded. Your composition is preserved.",
          ),
          true,
        );
    } finally {
      if (current(version)) controls(false);
    }
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (busy || recordId || !options.active()) return;
    const input = composeInput();
    if (!input) return;
    const version = epoch;
    attempted = true;
    controls(true);
    announce("Sending email…");
    try {
      const result = await post<{ message: MessageDetail }>({
        action: "send",
        requestKey,
        ...input,
      });
      await afterOutcome(result.message, version);
    } catch (error) {
      if (current(version))
        announce(
          options.error(
            error,
            "Send could not be confirmed. Your composition and send key are preserved. Refresh history before retrying.",
          ),
          true,
        );
    } finally {
      if (current(version)) {
        controls(false);
        feedback.tabIndex = -1;
        feedback.focus();
      }
    }
  });
  el("[data-email-refresh]").addEventListener("click", async () => {
    if (busy) return;
    const version = epoch;
    controls(true);
    try {
      await refresh(version);
      if (current(version)) announce("Communication history refreshed.");
    } catch (error) {
      if (current(version))
        announce(
          options.error(
            error,
            "History could not be loaded. Try Refresh history.",
          ),
          true,
        );
    } finally {
      if (current(version)) controls(false);
    }
  });
  for (const [selector, delta] of [
    ["[data-email-previous]", -1],
    ["[data-email-next]", 1],
  ] as const)
    el(selector).addEventListener("click", async () => {
      if (busy) return;
      const version = epoch;
      page += delta;
      controls(true);
      try {
        await refresh(version);
        if (current(version)) announce(`History page ${page}.`);
      } catch {
        if (current(version)) {
          page -= delta;
          announce("History page could not be loaded. Try again.", true);
        }
      } finally {
        if (current(version)) {
          controls(false);
          feedback.tabIndex = -1;
          feedback.focus();
        }
      }
    });
  async function load() {
    clear();
    if (!options.current() || !options.active()) return;
    const version = epoch;
    abort = new AbortController();
    panel.hidden = false;
    announce("Loading communication history…");
    controls(true);
    try {
      await refresh(version);
      if (current(version)) announce("");
    } catch (error) {
      if (current(version))
        announce(
          options.error(
            error,
            "Communication could not be loaded. Use Refresh history to try again.",
          ),
          true,
        );
    } finally {
      if (current(version)) controls(false);
    }
  }
  function clear() {
    epoch++;
    abort?.abort();
    busy = false;
    page = 1;
    total = 0;
    proposal = null;
    booking = null;
    invoice = null;
    panel.hidden = true;
    form.hidden = true;
    controls(false);
    form.reset();
    history.replaceChildren();
    el("[data-email-empty]").hidden = true;
    announce("");
    closePreview();
    options.validate(form, {});
    requestKey = crypto.randomUUID();
    attempted = false;
    recordId = null;
    selectedTemplate = "personal";
    suppressed = false;
    replyToMessageId = undefined;
    el("[data-email-compose]").setAttribute("aria-expanded", "false");
  }
  return {
    load,
    clear,
    refreshLinks: () => refresh(epoch),
    syncDisabled: () => controls(busy),
  };
}
