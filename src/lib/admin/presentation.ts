/** DOM-only enhancements: no requests, CRM state or mutation handlers live here. */
export function setupAdminPresentation() {
  const root = document.querySelector<HTMLElement>('body.admin-ui');
  if (!root) return;
  let frame = 0;
  function refresh() {
    frame = 0;
    // CSS stacked rows retain explicit labels/roles on narrow screens.
    root!.querySelectorAll<HTMLTableElement>('.admin-table-wrap table').forEach(table => {
      const headings = [...table.querySelectorAll('thead th')].map(cell => cell.textContent?.trim() ?? '');
      table.querySelectorAll<HTMLTableRowElement>('tbody tr').forEach(row => {
        row.setAttribute('role', 'row');
        [...row.cells].forEach((cell, index) => { cell.dataset.label = headings[index] ?? ''; cell.setAttribute('role', 'cell'); });
      });
    });
    root!.querySelectorAll<HTMLFormElement>('[data-admin-filter-form], [data-lead-filters]').forEach(form => {
      let count = 0;
      form.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select').forEach(input => {
        const value = input.value.trim();
        const active = !!value && value !== 'all' && !(input.name === 'sortOrder' && value === 'newest');
        if (active) count++;
        const field = input.closest<HTMLElement>('.inquiry-field');
        if (field) field.dataset.filterActive = String(active);
      });
      const summary = form.querySelector<HTMLElement>('[data-admin-filter-summary]');
      const text = count ? `${count} ${count === 1 ? 'filter' : 'filters'} selected` : 'Showing all records';
      if (summary && summary.textContent !== text) summary.textContent = text;
    });
    const name = root!.querySelector<HTMLElement>('[data-admin-detail="name"]')?.textContent?.trim();
    const company = root!.querySelector<HTMLElement>('[data-admin-detail="company"]')?.textContent?.trim();
    const heading = root!.querySelector<HTMLElement>('[data-admin-detail-heading]');
    const title = company && company !== 'Not provided' ? company : name || 'Inquiry details';
    if (heading && heading.textContent !== title) heading.textContent = title;
  }
  const schedule = () => { if (!frame) frame = requestAnimationFrame(refresh); };
  const observer = new MutationObserver(schedule);
  observer.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['hidden'] });
  root.addEventListener('change', schedule);
  root.addEventListener('input', schedule);
  document.addEventListener('astro:before-swap', () => { observer.disconnect(); cancelAnimationFrame(frame); root.removeEventListener('change', schedule); root.removeEventListener('input', schedule); }, { once: true });
  refresh();
}
