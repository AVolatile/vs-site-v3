interface Confirmation {
  title: string;
  message: string;
  action: string;
}

const preparedDialogs = new WeakSet<HTMLDialogElement>();
export function prepareBookingDialog(dialog: HTMLDialogElement) {
  if (preparedDialogs.has(dialog)) return;
  preparedDialogs.add(dialog);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog && dialog.open) dialog.close();
  });
  dialog.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const controls = [
      ...dialog.querySelectorAll<HTMLElement>(
        'button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]',
      ),
    ].filter(
      (node) => node.getClientRects().length > 0 && !node.closest("[hidden]"),
    );
    const first = controls[0],
      last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  });
}

// Presentation-only replacement for window.confirm. The caller still owns the action.
export function confirmBookingAction(content: Confirmation): Promise<boolean> {
  const dialog = document.querySelector<HTMLDialogElement>(
    "[data-booking-action-dialog]",
  );
  if (!dialog || dialog.open) return Promise.resolve(false);
  dialog.querySelector<HTMLElement>(
    "[data-booking-action-heading]",
  )!.textContent = content.title;
  dialog.querySelector<HTMLElement>("[data-booking-action-copy]")!.textContent =
    content.message;
  const accept = dialog.querySelector<HTMLButtonElement>(
    "[data-booking-action-accept]",
  )!;
  accept
    .querySelectorAll<HTMLElement>(
      ".ui-button-text-default,.ui-button-text-hover",
    )
    .forEach((node) => (node.textContent = content.action));
  const back = dialog.querySelector<HTMLButtonElement>(
    "[data-booking-action-back]",
  )!;
  prepareBookingDialog(dialog);
  const previous = document.activeElement;
  return new Promise((resolve) => {
    let accepted = false;
    const yes = () => {
      accepted = true;
      dialog.close();
    };
    const no = () => dialog.close();
    const finish = () => {
      accept.removeEventListener("click", yes);
      back.removeEventListener("click", no);
      dialog.querySelector<HTMLElement>(
        "[data-booking-action-heading]",
      )!.textContent = "";
      dialog.querySelector<HTMLElement>(
        "[data-booking-action-copy]",
      )!.textContent = "";
      if (
        previous instanceof HTMLElement &&
        previous.isConnected &&
        !previous.closest("[hidden]")
      )
        previous.focus();
      resolve(accepted);
    };
    accept.addEventListener("click", yes);
    back.addEventListener("click", no);
    dialog.addEventListener("close", finish, { once: true });
    dialog.showModal();
  });
}
