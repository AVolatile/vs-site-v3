import { submissionSchema, inquirySchema, fieldErrors, STEP_FIELDS, inquiryContent, optionLabel, type InquiryInput } from './contract';

let activeRoot: HTMLElement | null = null;
let dispose: (() => void) | undefined;
export function setupInquiryWizard(): void {
  const root = document.querySelector<HTMLElement>('[data-inquiry-wizard]');
  if (root === activeRoot) return;
  dispose?.(); activeRoot = root;
  if (!root) return;
  const form = root.querySelector<HTMLFormElement>('[data-inquiry-form]')!;
  const panels = [...root.querySelectorAll<HTMLElement>('[data-inquiry-step]')];
  const back = root.querySelector<HTMLButtonElement>('[data-inquiry-back]')!;
  const next = root.querySelector<HTMLButtonElement>('[data-inquiry-next]')!;
  const submit = root.querySelector<HTMLButtonElement>('[data-inquiry-submit]')!;
  const feedback = root.querySelector<HTMLElement>('[data-inquiry-error]')!;
  const progress = root.querySelector<HTMLElement>('[data-inquiry-progress]')!;
  const success = root.querySelector<HTMLElement>('[data-inquiry-success]')!;
  const abort = new AbortController(); const { signal } = abort;
  let step = 0; let busy = false; let dirty = false;
  let submissionKey = crypto.randomUUID(); const startedAt = Date.now();
  dispose = () => { abort.abort(); activeRoot = null; };
  form.hidden = false; progress.hidden = false;

  function values(): Record<string, unknown> {
    const entries = Object.fromEntries(new FormData(form));
    return { ...entries, consent: form.querySelector<HTMLInputElement>('[name="consent"]')!.checked, submissionKey, startedAt };
  }
  function errors(fields: Record<string, string>): void {
    root!.querySelectorAll<HTMLElement>('[data-field-error]').forEach(element => {
      const name = element.dataset.fieldError!; element.textContent = fields[name] ?? ''; element.hidden = !fields[name];
    });
    [...form.elements].forEach(element => {
      if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) {
        if (fields[element.name]) element.setAttribute('aria-invalid', 'true'); else element.removeAttribute('aria-invalid');
      }
    });
    form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }
  function review(): void {
    const input = values();
    const options = { projectType: inquiryContent.projectTypes, projectStage: inquiryContent.projectStages, budgetRange: inquiryContent.budgets, timeline: inquiryContent.timelines };
    root!.querySelectorAll<HTMLElement>('[data-review-value]').forEach(element => {
      const name = element.dataset.reviewValue!;
      const value = String(input[name] ?? '').trim();
      element.textContent = name in options ? optionLabel(options[name as keyof typeof options], value) : value || 'Not provided';
    });
  }
  function show(target: number, focus = true): void {
    step = target;
    panels.forEach((panel, index) => { panel.hidden = index !== step; });
    back.hidden = step === 0; next.hidden = step === 4; submit.hidden = step !== 4;
    root!.querySelector<HTMLElement>('[data-step-status]')!.textContent = `Step ${step + 1} of 5 — ${inquiryContent.steps[step]}`;
    root!.querySelectorAll('[data-progress-step]').forEach((element, index) => {
      if (index === step) element.setAttribute('aria-current', 'step'); else element.removeAttribute('aria-current');
    });
    feedback.hidden = true;
    if (step === 4) review();
    if (focus) panels[step].querySelector<HTMLElement>('h2')?.focus();
  }
  function advance(): void {
    if (busy || step === 4) return;
    const keys = STEP_FIELDS[step];
    const picked = inquirySchema.pick(Object.fromEntries(keys.map(key => [key, true])) as Record<keyof InquiryInput, true>);
    const result = picked.safeParse(values());
    if (!result.success) { errors(fieldErrors(result.error)); return; }
    errors({}); show(step + 1);
  }
  back.addEventListener('click', () => { if (!busy) { errors({}); show(step - 1); } }, { signal });
  next.addEventListener('click', advance, { signal });
  root.querySelectorAll<HTMLButtonElement>('[data-inquiry-edit]').forEach(button => {
    button.addEventListener('click', () => { if (!busy) show(Number(button.dataset.inquiryEdit)); }, { signal });
  });
  form.addEventListener('input', () => { dirty = true; submissionKey = crypto.randomUUID(); feedback.hidden = true; }, { signal });
  window.addEventListener('beforeunload', event => { if (dirty && !success.hidden) return; if (dirty) { event.preventDefault(); event.returnValue = ''; } }, { signal });
  form.addEventListener('submit', async event => {
    event.preventDefault(); if (busy) return;
    if (step !== 4) { advance(); return; }
    const result = submissionSchema.safeParse(values());
    if (!result.success) {
      const fields = fieldErrors(result.error);
      const invalidStep = STEP_FIELDS.findIndex(keys => keys.some(key => fields[key]));
      if (invalidStep >= 0) show(invalidStep);
      errors(fields); return;
    }
    errors({}); busy = true; feedback.hidden = true; form.setAttribute('aria-busy', 'true');
    const controls = [...form.querySelectorAll<HTMLInputElement | HTMLButtonElement | HTMLSelectElement | HTMLTextAreaElement>('input,button,select,textarea')];
    controls.forEach(control => { control.disabled = true; });
    const text = submit.querySelector<HTMLElement>('.ui-button-text-default');
    if (text) text.textContent = 'Sending…';
    try {
      const response = await fetch('/api/inquiries', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data), signal: AbortSignal.any([signal, AbortSignal.timeout(20_000)]) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.received !== true) {
        if (response.status === 422 && payload.fields) {
          const fields = payload.fields as Record<string, string>;
          const invalidStep = STEP_FIELDS.findIndex(keys => keys.some(key => fields[key]));
          if (invalidStep >= 0) show(invalidStep);
          // Enable fields before moving keyboard focus to the invalid control.
          controls.forEach(control => { control.disabled = false; }); errors(fields);
        }
        if (response.status === 409) submissionKey = crypto.randomUUID();
        throw new Error(response.status === 429 ? 'Too many attempts. Please wait a minute and try again.' : inquiryContent.failure);
      }
      dirty = false; form.reset(); form.hidden = true; progress.hidden = true; success.hidden = false; success.focus();
    } catch (error) {
      if (!root!.isConnected || signal.aborted) return;
      feedback.textContent = error instanceof Error && error.message.startsWith('Too many attempts') ? error.message : inquiryContent.failure;
      feedback.hidden = false;
    } finally {
      busy = false; form.removeAttribute('aria-busy'); controls.forEach(control => { control.disabled = false; });
      if (text) text.textContent = 'Submit Inquiry';
    }
  }, { signal });
  show(0, false);
}
