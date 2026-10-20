import { describe, expect, it } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { load } from 'cheerio';
import AdminNavigation from '@components/admin/AdminNavigation.astro';
import InquiryAdmin from '@components/admin/InquiryAdmin.astro';
import LeadsAdmin from '@components/admin/LeadsAdmin.astro';
import BookingCalendar from '@components/admin/BookingCalendar.astro';
import CalendarAvailability from '@components/admin/CalendarAvailability.astro';
import IntegrationSettings from '@components/admin/IntegrationSettings.astro';
import ProposalEditor from '@components/proposals/ProposalEditor.astro';
import InvoiceEditor from '@components/invoices/InvoiceEditor.astro';
import AdminLayout from '@layouts/AdminLayout.astro';

describe('shared admin presentation accessibility contracts', () => {
  it.each([false, true])('retains one initially hidden navigation shell for live auth changes (login: %s)', async loginPresentation => {
    const container = await AstroContainer.create();
    const $ = load(await container.renderToString(AdminLayout, { props: { loginPresentation } }));
    expect($('.admin-header')).toHaveLength(1);
    expect($('.admin-header').attr('hidden')).toBeDefined();
    expect($('nav[aria-label="Admin workspace"] a')).toHaveLength(5);
    expect($('nav[aria-label="Mobile admin workspace"] a')).toHaveLength(5);
  });

  it.each([
    ['/admin/', 'Inquiries'],
    ['/admin/login/', 'Inquiries'],
    ['/admin/leads/', 'Leads'],
    ['/admin/calendar/', 'Calendar'],
    ['/admin/calendar/settings/', 'Availability'],
    ['/admin/settings/integrations/', 'Integrations'],
  ])('identifies the current workspace on both navigation surfaces: %s', async (path, label) => {
    const container = await AstroContainer.create();
    const $ = load(await container.renderToString(AdminNavigation, { request: new Request(`https://example.test${path}`) }));
    for (const name of ['Admin workspace', 'Mobile admin workspace']) {
      const nav = $(`nav[aria-label="${name}"]`);
      expect(nav.find('a')).toHaveLength(5);
      expect(nav.find('[aria-current="page"]')).toHaveLength(1);
      expect(nav.find('[aria-current="page"]').text()).toContain(label);
    }
    expect($('details.admin-mobile-nav > summary')).toHaveLength(1);
  });

  it.each([
    ['inquiries', InquiryAdmin], ['leads', LeadsAdmin], ['calendar', BookingCalendar],
    ['availability', CalendarAvailability], ['integrations', IntegrationSettings],
    ['proposals', ProposalEditor], ['invoices', InvoiceEditor],
  ] as const)('keeps unique field IDs, associated labels and one page heading in %s', async (_name, component) => {
    const container = await AstroContainer.create();
    const $ = load(await container.renderToString(component));
    // Inert item templates repeat their field IDs only when cloned by the existing controllers.
    $('template').remove();
    const ids = $('[id]').toArray().map(node => $(node).attr('id'));
    expect(new Set(ids).size).toBe(ids.length);
    expect($('.admin-page-header h1')).toHaveLength(1);
    for (const label of $('label[for]').toArray()) {
      const target = $(label).attr('for');
      expect($('[id]').toArray().some(node => $(node).attr('id') === target), target).toBe(true);
    }
  });

  it.each([InquiryAdmin, LeadsAdmin])('keeps record section links connected to rendered sections', async component => {
    const container = await AstroContainer.create();
    const $ = load(await container.renderToString(component));
    expect($('.admin-record-nav a')).toHaveLength(5);
    for (const link of $('.admin-record-nav a').toArray()) {
      expect($($(link).attr('href')!)).toHaveLength(1);
    }
    expect($('[data-inquiry-proposal]')).toHaveLength(1);
    expect($('[data-inquiry-communication]')).toHaveLength(1);
    expect($('[data-inquiry-booking]')).toHaveLength(1);
    expect($('[data-invoice-context]')).toHaveLength(1);
    expect($('[data-admin-activity-list]')).toHaveLength(1);
  });
});
