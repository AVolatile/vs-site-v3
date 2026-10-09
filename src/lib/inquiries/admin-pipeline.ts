import { inquiryContent, optionLabel, PIPELINE_STATUS_OPTIONS, STATUS_OPTIONS, type InquiryPipeline, type Inquiry, type InquiryStatus, type PipelineInquiry } from './contract';
import { presentFollowUp } from './follow-up';
import { browseApiQuery, hasBrowseFilters, type AdminBrowse } from './admin-browse';
import { adminInquiryUrl, inquiryDetailApiUrl } from './admin-routes';

interface PipelineOptions {
  panel: HTMLElement;
  request: <T>(url: string, options?: RequestInit) => Promise<T>;
  authenticated: () => boolean;
  announce: (message: string, error?: boolean) => void;
  errorMessage: (error: unknown, fallback: string) => string;
  metrics: (metrics: InquiryPipeline['metrics']) => void;
  open: (id: string, href: string) => void;
  busy: (moving: boolean) => void;
  browse: () => AdminBrowse;
}

export function setupAdminPipeline(options: PipelineOptions) {
  const { panel, request, authenticated, announce, errorMessage, metrics, open } = options;
  const template = panel.querySelector<HTMLTemplateElement>('[data-pipeline-card-template]')!;
  const refresh = panel.querySelector<HTMLButtonElement>('[data-pipeline-refresh]')!;
  let items = new Map<string, PipelineInquiry>();
  let lastMetrics: InquiryPipeline['metrics'] | undefined;
  let loadVersion = 0; let generation = 0; let moving = false; let draggedId: string | null = null;
  let loadedQuery = '';
  let loadAbort: AbortController | undefined; let moveAbort: AbortController | undefined;

  function controls(): void {
    options.busy(moving);
    refresh.disabled = moving;
    panel.querySelectorAll<HTMLElement>('[data-pipeline-card]').forEach(card => {
      const select = card.querySelector<HTMLSelectElement>('select')!;
      const button = card.querySelector<HTMLButtonElement>('button')!;
      select.disabled = moving;
      button.disabled = moving || select.value === items.get(card.dataset.pipelineCard!)?.status;
      card.draggable = !moving;
    });
  }

  function render(data: InquiryPipeline, lastViewed?: string): void {
    items = new Map(data.items.filter(item => item.status !== 'archived').map(item => [item.id, item]));
    const columns = new Map(PIPELINE_STATUS_OPTIONS.map(status => [status, document.createDocumentFragment()]));
    for (const item of items.values()) {
      const fragment = template.content.cloneNode(true) as DocumentFragment;
      const card = fragment.querySelector<HTMLElement>('[data-pipeline-card]')!;
      card.dataset.pipelineCard = item.id;
      if (item.id === lastViewed) card.dataset.lastViewed = 'true';
      const link = card.querySelector<HTMLAnchorElement>('[data-pipeline-open]')!;
      link.dataset.pipelineOpen = item.id; link.href = adminInquiryUrl(item.id, 'pipeline', options.browse()); link.draggable = false;
      const fields = {
        name: item.name, company: item.company || 'No company provided',
        projectType: optionLabel(inquiryContent.projectTypes, item.projectType),
        budgetRange: optionLabel(inquiryContent.budgets, item.budgetRange), timeline: optionLabel(inquiryContent.timelines, item.timeline),
        createdAt: new Date(item.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' }),
      };
      for (const [field, text] of Object.entries(fields)) card.querySelector<HTMLElement>(`[data-pipeline-field="${field}"]`)!.textContent = text;
      const followUp = card.querySelector<HTMLElement>('[data-pipeline-follow-up]')!;
      followUp.hidden = !item.nextFollowUpAt; if (item.nextFollowUpAt) presentFollowUp(followUp, item.nextFollowUpAt);
      const select = card.querySelector<HTMLSelectElement>('select')!;
      const id = 'pipeline-status-' + item.id;
      select.id = id; select.value = item.status;
      card.querySelector<HTMLLabelElement>('label')!.htmlFor = id;
      const error = card.querySelector<HTMLElement>('[data-field-error]')!;
      error.id = id + '-error'; select.setAttribute('aria-describedby', error.id);
      columns.get(item.status as typeof PIPELINE_STATUS_OPTIONS[number])!.append(fragment);
    }
    for (const status of PIPELINE_STATUS_OPTIONS) {
      panel.querySelector<HTMLElement>(`[data-pipeline-items="${status}"]`)!.replaceChildren(columns.get(status)!);
      const count = data.items.filter(item => item.status === status).length;
      const label = panel.querySelector<HTMLElement>(`[data-pipeline-count="${status}"]`)!;
      label.textContent = String(count); label.setAttribute('aria-label', `${count} inquiries`);
      panel.querySelector<HTMLElement>(`[data-pipeline-empty="${status}"]`)!.hidden = count > 0;
    }
    const empty = panel.querySelector<HTMLElement>('[data-pipeline-no-results]')!;
    empty.hidden = items.size > 0;
    empty.textContent = hasBrowseFilters({ ...options.browse(), status: 'all' }) ? 'No inquiries match these filters. Adjust or clear filters to continue.' : 'No active inquiries yet. New submissions will appear here.';
    controls(); lastMetrics = data.metrics; metrics(data.metrics);
  }

  function clearResults(): void {
    items.clear();
    panel.querySelectorAll<HTMLElement>('[data-pipeline-items]').forEach(element => element.replaceChildren());
    panel.querySelectorAll<HTMLElement>('[data-pipeline-count]').forEach(element => { element.textContent = '—'; element.removeAttribute('aria-label'); });
    panel.querySelectorAll<HTMLElement>('[data-pipeline-empty]').forEach(element => { element.hidden = true; });
    panel.querySelector<HTMLElement>('[data-pipeline-no-results]')!.hidden = true;
    controls();
  }
  async function load(lastViewed?: string): Promise<boolean> {
    if (!authenticated()) return false;
    const version = ++loadVersion; loadAbort?.abort(); loadAbort = new AbortController();
    const query = browseApiQuery(options.browse()).toString();
    if (query !== loadedQuery) clearResults();
    panel.hidden = false; panel.setAttribute('aria-busy', 'true'); announce('Loading pipeline…');
    try {
      const data = await request<InquiryPipeline>('/api/admin/inquiries?view=pipeline&' + query, { signal: loadAbort.signal });
      if (version !== loadVersion || !authenticated() || panel.hidden) return false;
      if (!data.items.every(item => typeof item.updatedAt === 'string')) throw new Error('Missing pipeline version data.');
      const previousFocus = document.activeElement;
      render(data, lastViewed); loadedQuery = query; announce(`${data.items.length} inquiries in the pipeline.`);
      if (previousFocus !== document.body && !previousFocus?.isConnected) refresh.focus();
      return true;
    } catch (error) {
      if (version === loadVersion && !loadAbort.signal.aborted && authenticated()) announce(errorMessage(error, 'The pipeline could not be loaded. Please try Refresh pipeline.'), true);
      return false;
    } finally { if (version === loadVersion) panel.removeAttribute('aria-busy'); }
  }

  async function move(id: string, status: InquiryStatus): Promise<void> {
    const item = items.get(id);
    if (!authenticated() || moving || !item || status === item.status) return;
    const epoch = generation; moving = true; moveAbort = new AbortController(); controls();
    panel.querySelector<HTMLElement>(`[data-pipeline-card="${id}"]`)?.setAttribute('aria-busy', 'true');
    announce(`Moving ${item.name} to ${status[0].toUpperCase() + status.slice(1)}…`);
    try {
      // The server preserves notes under the same locked, timestamp-guarded update.
      const { inquiry: saved } = await request<{ inquiry: Inquiry }>(inquiryDetailApiUrl(id), {
        method: 'PATCH', signal: moveAbort.signal, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'move', status, updatedAt: item.updatedAt }),
      });
      if (epoch !== generation || !authenticated()) return;
      // The card only changes after the protected PATCH confirms persistence.
      items.set(id, { ...item, status: saved.status, updatedAt: saved.updatedAt, nextFollowUpAt: saved.nextFollowUpAt });
      if (lastMetrics) render({ items: [...items.values()], metrics: lastMetrics }, id);
      const refreshed = await load(id);
      if (epoch !== generation || !authenticated()) return;
      announce(`${item.name} moved to ${status[0].toUpperCase() + status.slice(1)}.` + (refreshed ? '' : ' Summary totals could not be refreshed. Please try Refresh pipeline.'), !refreshed);
      (panel.querySelector<HTMLAnchorElement>(`[data-pipeline-open="${id}"]`) ?? refresh).focus();
    } catch (error) {
      if (epoch === generation && authenticated() && !moveAbort.signal.aborted) {
        const conflict = typeof error === 'object' && error !== null && 'status' in error && error.status === 409;
        announce(conflict ? 'This inquiry changed in another session. Refresh the pipeline before moving it.' : errorMessage(error, 'The inquiry could not be moved. Its saved status is unchanged. Please try again.'), true);
        const select = panel.querySelector<HTMLSelectElement>(`[data-pipeline-card="${id}"] select`);
        if (select) { select.value = item.status; select.disabled = false; select.focus(); }
      }
    } finally {
      if (epoch === generation) {
        moving = false; controls(); panel.querySelector<HTMLElement>(`[data-pipeline-card="${id}"]`)?.removeAttribute('aria-busy');
      }
    }
  }

  panel.addEventListener('click', event => {
    const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('[data-pipeline-open]');
    if (!link || event instanceof MouseEvent && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
    event.preventDefault(); if (!moving) open(link.dataset.pipelineOpen!, link.href);
  });
  panel.addEventListener('change', controls);
  panel.addEventListener('submit', event => {
    const form = (event.target as HTMLElement).closest<HTMLFormElement>('[data-pipeline-move-form]'); if (!form) return;
    event.preventDefault();
    const status = form.querySelector<HTMLSelectElement>('select')!.value;
    if (STATUS_OPTIONS.includes(status as InquiryStatus)) void move(form.closest<HTMLElement>('[data-pipeline-card]')!.dataset.pipelineCard!, status as InquiryStatus);
  });
  panel.addEventListener('dragstart', event => {
    const card = (event.target as HTMLElement).closest<HTMLElement>('[data-pipeline-card]');
    if (!card || moving || (event.target as HTMLElement).closest('button,select,input')) { event.preventDefault(); return; }
    draggedId = card.dataset.pipelineCard!; card.dataset.dragging = 'true';
    event.dataTransfer?.setData('text/plain', draggedId);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  });
  const clearDrag = () => {
    draggedId = null;
    panel.querySelectorAll<HTMLElement>('[data-dragging],[data-drop-target]').forEach(element => { delete element.dataset.dragging; delete element.dataset.dropTarget; });
  };
  panel.addEventListener('dragend', clearDrag);
  panel.addEventListener('dragover', event => {
    const column = (event.target as HTMLElement).closest<HTMLElement>('[data-pipeline-status]');
    if (!column || !draggedId || moving) return;
    event.preventDefault();
    panel.querySelectorAll<HTMLElement>('[data-drop-target]').forEach(element => { delete element.dataset.dropTarget; });
    column.dataset.dropTarget = 'true'; if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  });
  panel.addEventListener('dragleave', event => {
    const column = (event.target as HTMLElement).closest<HTMLElement>('[data-pipeline-status]');
    if (column && !column.contains(event.relatedTarget as Node | null)) delete column.dataset.dropTarget;
  });
  panel.addEventListener('drop', event => {
    const column = (event.target as HTMLElement).closest<HTMLElement>('[data-pipeline-status]');
    const id = draggedId; clearDrag(); if (!column || !id || moving) return;
    event.preventDefault(); void move(id, column.dataset.pipelineStatus as InquiryStatus);
  });
  refresh.addEventListener('click', () => { if (!moving) void load(); });

  function hide(): void {
    panel.hidden = true; loadAbort?.abort(); loadVersion++; panel.removeAttribute('aria-busy'); clearDrag();
    if (moving) { generation++; moveAbort?.abort(); moving = false; controls(); }
  }
  function clear(): void {
    hide(); generation++; moveAbort?.abort(); moving = false; items.clear(); lastMetrics = undefined;
    loadedQuery = ''; clearResults();
  }
  return { load, hide, clear, isMoving: () => moving };
}
