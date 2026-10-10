import { getUser, logout, onAuthChange } from '@netlify/identity';
import {
  draftSchema,
  calculateTotals,
  decimalUnits,
  decimalValue,
  money,
  proposalAdminUrl,
  safeInquiryBack,
  type AdminProposal,
  type DraftInput,
} from './contract';
import {setupInvoicePanel} from '@/lib/invoices/proposal-panel';
import { renderProposalDocument } from './document';
import { fieldErrors } from '../inquiries/contract';
export async function setupProposalEditor(): Promise<void> {
  const root = document.querySelector<HTMLElement>('[data-proposal-admin]');
  if (!root) return;
  const element = <T extends HTMLElement = HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const form = element<HTMLFormElement>('[data-proposal-form]'),
    message = element('[data-editor-message]'),
    items = element('[data-editor-items]');
  const template = element<HTMLTemplateElement>('[data-editor-item-template]');
  let proposal: AdminProposal | undefined,
    busy = false,
    savedPayload = '';
  const id = new URL(location.href).searchParams.get('proposal');
  const status = (text: string, error = false) => {
    message.textContent = text;
    message.setAttribute('role', error ? 'alert' : 'status');
  };
  const value = (name: string) => element<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`);
  function clear() {
    invoicePanel.clear();
    proposal = undefined;
    form.reset();
    items.replaceChildren();
    root!
      .querySelectorAll<HTMLElement>(
        '[data-editor-meta],[data-editor-link],[data-editor-private-notes],[data-editor-preview],[data-proposal-form]',
      )
      .forEach((node) => {
        node.hidden = true;
      });
    element('[data-editor-private-copy]').textContent = '';
    element('[data-proposal-document]').hidden = true;
    value('proposalClientUrl').value = '';
    root!
      .querySelectorAll<HTMLElement>(
        '[data-proposal-value],[data-proposal-client],[data-editor-number],[data-editor-status]',
      )
      .forEach((node) => {
        node.textContent = '';
      });
    element('[data-proposal-items]').replaceChildren();
  }
  function login() {
    clear();
    location.replace(
      '/admin/login/?proposal=' +
        encodeURIComponent(id ?? '') +
        '&back=' +
        encodeURIComponent(new URL(location.href).searchParams.get('back') ?? ''),
    );
  }
  class RequestError extends Error {
    constructor(
      public fields: Record<string, string>,
      text: string,
    ) {
      super(text);
    }
  }
  async function request(options: RequestInit = {}): Promise<AdminProposal> {
    const response = await fetch('/api/admin/proposals?id=' + encodeURIComponent(id!), {
      ...options,
      credentials: 'same-origin',
      cache: 'no-store',
      signal: AbortSignal.timeout(20000),
    });
    const body = await response.json();
    if (response.status === 401 || response.status === 403) {
      clear();
      throw new RequestError({}, 'Your session could not be verified. Sign out and sign in again.');
    }
    if (!response.ok)
      throw new RequestError(body.fields ?? {}, body.error ?? 'The proposal request could not be completed.');
    return body.proposal;
  }
  const invoicePanel=setupInvoicePanel(element('[data-invoice-context]'),{
    active:()=>!!proposal,
    back:()=>safeInquiryBack(new URL(location.href).searchParams.get('back'),proposal!.inquiryId),
    request:async<T>(url:string,options:RequestInit={}):Promise<T>=>{
      const response=await fetch(url,{...options,credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(20000)}),body=await response.json();
      if(response.status===401 || response.status===403)clear();
      if(!response.ok)throw Error(body.error||'The invoice request could not be completed.');return body as T;
    },
  });
  function validation(errors: Record<string, string>) {
    form.querySelectorAll<HTMLElement>('[data-field-error]').forEach((node) => {
      const key = node.dataset.fieldError!;
      const map: Record<string, string> = {
        proposalTitle: 'title',
        proposalSummary: 'summary',
        proposalValidUntil: 'validUntil',
        proposalDiscount: 'discountCents',
        proposalTax: 'taxRateBasisPoints',
        proposalInternalNotes: 'internalNotes',
        proposalClientNotes: 'clientNotes',
      };
      node.textContent = errors[map[key] ?? key] ?? '';
      node.hidden = !node.textContent;
      const input = element<HTMLInputElement>(`[name="${key}"]`);
      if (input) {
        if (node.textContent) input.setAttribute('aria-invalid', 'true');
        else input.removeAttribute('aria-invalid');
      }
    });
    const itemError = element('[data-editor-items-error]');
    itemError.textContent = errors.items ?? '';
    itemError.hidden = !itemError.textContent;
    form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }
  function addItem(item = { description: '', quantity: 1, unitPriceCents: 0 }) {
    const fragment = template.content.cloneNode(true) as DocumentFragment;
    const row = fragment.querySelector<HTMLElement>('.editor-item')!;
    const key = crypto.randomUUID();
    row.dataset.itemKey = key;
    row.querySelectorAll<HTMLInputElement>('input').forEach((input) => {
      const label = row.querySelector<HTMLLabelElement>(`label[for="${input.id}"]`)!;
      const error = row.querySelector<HTMLElement>(`[data-field-error="${input.name}"]`)!;
      input.id += '-' + key;
      label.htmlFor = input.id;
      error.id += '-' + key;
      input.setAttribute('aria-describedby', error.id);
    });
    row.querySelector<HTMLInputElement>('[name="itemDescription"]')!.value = item.description;
    row.querySelector<HTMLInputElement>('[name="itemQuantity"]')!.value = String(item.quantity);
    row.querySelector<HTMLInputElement>('[name="itemRate"]')!.value = decimalValue(item.unitPriceCents);
    items.append(fragment);
    refreshItems();
  }
  function read(): DraftInput {
    if (value('proposalValidUntil').validity.badInput)
      throw new RequestError({ validUntil: 'Choose a valid date.' }, 'Check the valid-until date.');
    const lineItems = [...items.children].map((row) => {
      const quantity = row.querySelector<HTMLInputElement>('[name="itemQuantity"]')!.value.trim();
      if (!/^\d+$/.test(quantity))
        throw new RequestError({ items: 'Use positive whole-number quantities.' }, 'Check the line items.');
      return {
        description: row.querySelector<HTMLInputElement>('[name="itemDescription"]')!.value,
        quantity: Number(quantity),
        unitPriceCents: decimalUnits(row.querySelector<HTMLInputElement>('[name="itemRate"]')!.value),
      };
    });
    return {
      action: 'save',
      title: value('proposalTitle').value,
      summary: value('proposalSummary').value,
      validUntil: value('proposalValidUntil').value || null,
      items: lineItems,
      discountCents: decimalUnits(value('proposalDiscount').value || '0'),
      taxRateBasisPoints: decimalUnits(value('proposalTax').value || '0'),
      internalNotes: value('proposalInternalNotes').value,
      clientNotes: value('proposalClientNotes').value,
      updatedAt: proposal!.updatedAt,
    };
  }
  function previewTotals() {
    try {
      const result = draftSchema.safeParse(read());
      if (!result.success) throw new Error();
      const totals = calculateTotals(
        result.data.items,
        result.data.discountCents,
        result.data.taxRateBasisPoints,
      );
      const fragment = document.createDocumentFragment();
      for (const [label, amount] of [
        ['Subtotal', totals.subtotalCents],
        ['Discount', totals.discountCents],
        ['Tax', totals.taxCents],
        ['Total', totals.totalCents],
      ] as const) {
        const row = document.createElement('div'),
          term = document.createElement('dt'),
          detail = document.createElement('dd');
        term.textContent = label;
        detail.textContent = money(amount);
        row.append(term, detail);
        fragment.append(row);
      }
      element('[data-editor-totals]').replaceChildren(fragment);
    } catch {
      element('[data-editor-totals]').textContent = 'Complete valid pricing values to preview totals.';
    }
  }
  function refreshItems() {
    const rows = [...items.children] as HTMLElement[];
    rows.forEach((row, index) => {
      const heading = row.querySelector<HTMLElement>('[data-editor-item-heading]')!;
      heading.textContent = 'Item ' + (index + 1);
      heading.id = 'item-heading-' + row.dataset.itemKey;
      row.setAttribute('role', 'group');
      row.setAttribute('aria-labelledby', heading.id);
      row.querySelector<HTMLButtonElement>('[data-item-up]')!.disabled = index === 0;
      row.querySelector<HTMLButtonElement>('[data-item-down]')!.disabled = index === rows.length - 1;
      try {
        const quantity = Number(row.querySelector<HTMLInputElement>('[name="itemQuantity"]')!.value);
        if (!Number.isInteger(quantity) || quantity < 1) throw new Error();
        row.querySelector<HTMLElement>('[data-item-amount]')!.textContent = money(
          decimalUnits(row.querySelector<HTMLInputElement>('[name="itemRate"]')!.value) *
            Number(row.querySelector<HTMLInputElement>('[name="itemQuantity"]')!.value),
        );
      } catch {
        row.querySelector<HTMLElement>('[data-item-amount]')!.textContent = '—';
      }
    });
    element<HTMLButtonElement>('[data-editor-add]').disabled = rows.length >= 25;
    previewTotals();
  }
  function render(saved: AdminProposal) {
    proposal = saved;
    void invoicePanel.load(saved);
    element('[data-editor-meta]').hidden = false;
    element('[data-editor-number]').textContent = saved.number;
    element('[data-editor-status]').textContent = saved.status[0].toUpperCase() + saved.status.slice(1);
    element<HTMLAnchorElement>('[data-proposal-back]').href = safeInquiryBack(
      new URL(location.href).searchParams.get('back'),
      saved.inquiryId,
    );
    form.hidden = saved.status !== 'draft';
    value('proposalTitle').value = saved.title;
    value('proposalSummary').value = saved.summary;
    value('proposalValidUntil').value = saved.validUntil ?? '';
    value('proposalDiscount').value = decimalValue(saved.discountCents);
    value('proposalTax').value = decimalValue(saved.taxRateBasisPoints);
    value('proposalInternalNotes').value = saved.internalNotes;
    value('proposalClientNotes').value = saved.clientNotes;
    items.replaceChildren();
    saved.items.forEach(addItem);
    refreshItems();
    savedPayload = JSON.stringify(read());
    validation({});
    element('[data-editor-preview]').hidden = false;
    renderProposalDocument(element('[data-proposal-document]'), saved);
    const link = element('[data-editor-link]');
    link.hidden = !saved.clientUrl;
    if (saved.clientUrl) {
      value('proposalClientUrl').value = saved.publicUrl ?? new URL(saved.clientUrl, location.origin).href;
      value('proposalClientUrl').readOnly = true;
      element<HTMLAnchorElement>('[data-editor-open]').href = saved.publicUrl ?? saved.clientUrl;
    }
    element('[data-editor-private-notes]').hidden = saved.status === 'draft' || !saved.internalNotes;
    element('[data-editor-private-copy]').textContent = saved.internalNotes;
  }
  async function load() {
    status('Loading proposal…');
    try {
      render(await request());
      status(
        proposal!.status === 'draft'
          ? 'Draft loaded. Save before sending.'
          : 'Published proposal — read-only.',
      );
    } catch (error) {
      status(
        error instanceof RequestError
          ? error.message
          : 'This proposal could not be loaded. Please try Reload proposal.',
        true,
      );
    }
  }
  onAuthChange((event) => {
    if (event === 'logout') {
      clear();
      location.replace('/admin/login/');
    }
  });
  try {
    const user = await getUser();
    if (!user?.roles?.includes('admin')) {
      login();
      return;
    }
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      status('Invalid proposal reference.', true);
      return;
    }
    await load();
  } catch {
    login();
    return;
  }
  form.addEventListener('input', refreshItems);
  items.addEventListener('click', (event) => {
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
    if (!target || busy) return;
    const row = target.closest<HTMLElement>('.editor-item')!;
    if (target.hasAttribute('data-item-remove')) {
      const focus = row.nextElementSibling ?? row.previousElementSibling;
      row.remove();
      refreshItems();
      (focus?.querySelector('input') ?? element('[data-editor-add]'))?.focus();
      return;
    }
    if (target.hasAttribute('data-item-up') && row.previousElementSibling)
      items.insertBefore(row, row.previousElementSibling);
    else if (target.hasAttribute('data-item-down') && row.nextElementSibling)
      items.insertBefore(row.nextElementSibling, row);
    refreshItems();
    target.focus();
  });
  element('[data-editor-add]').addEventListener('click', () => {
    if (busy || items.children.length >= 25) return;
    addItem();
    items.lastElementChild?.querySelector<HTMLInputElement>('input')?.focus();
  });
  function controls(disabled: boolean) {
    root!
      .querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement>('input,textarea,button')
      .forEach((control) => {
        control.disabled = disabled;
      });
  }
  async function mutate(action: 'save' | 'send') {
    if (busy || !proposal || proposal.status !== 'draft') return;
    validation({});
    let body: DraftInput | { action: 'send'; updatedAt: string };
    try {
      const result = draftSchema.safeParse(read());
      if (!result.success) {
        validation(fieldErrors(result.error));
        status('Check the proposal fields.', true);
        return;
      }
      calculateTotals(result.data.items, result.data.discountCents, result.data.taxRateBasisPoints);
      if (action === 'send' && JSON.stringify(read()) !== savedPayload) {
        status('Save draft changes before sending.', true);
        return;
      }
      body = action === 'save' ? result.data : { action: 'send', updatedAt: proposal.updatedAt };
    } catch (error) {
      if (error instanceof RequestError) validation(error.fields);
      status(error instanceof Error ? error.message : 'Check pricing values.', true);
      return;
    }
    let confirmed = false;
    busy = true;
    controls(true);
    form.setAttribute('aria-busy', 'true');
    status(action === 'save' ? 'Saving draft…' : 'Publishing proposal…');
    try {
      render(
        await request({
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }),
      );
      confirmed = true;
      status(
        action === 'save' ? 'Draft saved.' : 'Proposal sent. Copy the client link to share it manually.',
      );
    } catch (error) {
      if (error instanceof RequestError) validation(error.fields);
      status(
        error instanceof RequestError
          ? error.message
          : 'The save could not be confirmed. Your edits are still here; reload before retrying.',
        true,
      );
    } finally {
      busy = false;
      controls(false);
      refreshItems();
      form.removeAttribute('aria-busy');
      if (confirmed)
        element<HTMLButtonElement>(action === 'send' ? '[data-editor-copy]' : '[data-editor-save]').focus();
      else form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    }
  }
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    void mutate('save');
  });
  element('[data-editor-send]').addEventListener('click', () => void mutate('send'));
  element('[data-editor-reload]').addEventListener('click', () => {
    if (!busy) void load();
  });
  element('[data-editor-copy]').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(value('proposalClientUrl').value);
      status('Client link copied.');
    } catch {
      value('proposalClientUrl').select();
      status('Copy the selected client link.');
    }
  });
  element('[data-proposal-logout]').addEventListener('click', async () => {
    clear();
    try {
      await logout();
    } finally {
      location.replace('/admin/login/');
    }
  });
}
