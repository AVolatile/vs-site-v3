import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';

const consentSource = readFileSync('public/js/cookie-consent.js', 'utf8');
const analyticsSource = readFileSync('public/js/analytics.js', 'utf8');
const key = 'cookie-consent-status';

// A minimal DOM harness exercises persisted state and event/lifecycle behavior.
function visit(storage = new Map<string, string>(), unavailable = false) {
  const events: string[] = [];
  const window = new EventTarget() as EventTarget & Record<string, any>;
  const document = new EventTarget() as EventTarget & Record<string, any>;
  class Element {
    hidden = true;
    isConnected = true;
    textContent = '';
    attrs = new Map<string, string>();
    constructor(public id: string) {}
    setAttribute(name: string, value: string) { this.attrs.set(name, value); }
    getAttribute(name: string) { return this.attrs.get(name) ?? null; }
    removeAttribute(name: string) { this.attrs.delete(name); }
    focus() { document.activeElement = this; }
    scrollIntoView() {}
    contains(element: Element) { return element === this || (this.id === 'cookie-consent' && ['accept-cookies', 'decline-cookies'].includes(element?.id)); }
    closest(selector: string) { return selector === '#' + this.id || (selector === '[data-cookie-preferences]' && this.id === 'preferences') ? this : null; }
  }
  let elements: Record<string, Element>;
  const newPage = () => {
    elements = Object.fromEntries(['cookie-consent', 'cookie-consent-announcement', 'accept-cookies', 'decline-cookies', 'preferences', 'main'].map(id => [id, new Element(id)]));
    document.activeElement = elements.main;
  };
  newPage();
  document.getElementById = (id: string) => elements[id] ?? null;
  document.querySelector = (selector: string) => selector === 'main' ? elements.main : null;
  document.querySelectorAll = (selector: string) => selector === '[data-cookie-preferences]' ? [elements.preferences] : [];
  window.localStorage = {
    getItem(name: string) { if (unavailable) throw new Error('Storage unavailable'); return storage.get(name) ?? null; },
    setItem(name: string, value: string) { if (unavailable) throw new Error('Storage unavailable'); storage.set(name, value); },
  };
  ['cookie-consent-accepted', 'cookie-consent-revoked', 'cookie-consent-changed'].forEach(name => window.addEventListener(name, () => events.push(name)));
  const context = createContext({ window, document, Element, HTMLElement: Element, CustomEvent });
  const boot = () => runInContext(consentSource, context);
  const click = (id: string) => {
    const event = new Event('click');
    Object.defineProperty(event, 'target', { value: elements[id] });
    elements[id].focus();
    document.dispatchEvent(event);
  };
  boot();
  return { window, document, storage, events, boot, click, context, element: (id: string) => elements[id], navigate: () => { newPage(); document.dispatchEvent(new Event('astro:page-load')); } };
}

describe('public cookie preferences', () => {
  it('shows a first-visit panel without stealing focus or creating storage', () => {
    const page = visit();
    expect(page.element('cookie-consent').hidden).toBe(false);
    expect(page.document.activeElement.id).toBe('main');
    expect(page.storage.size).toBe(0);
  });
  it.each(['accepted', 'declined'])('persists %s across refreshes and public navigation', status => {
    const page = visit();
    page.click(status === 'accepted' ? 'accept-cookies' : 'decline-cookies');
    expect(page.storage.get(key)).toBe(status);
    expect(page.element('cookie-consent').hidden).toBe(true);
    expect(page.document.activeElement.id).toBe('main');
    page.navigate();
    expect(page.element('cookie-consent').hidden).toBe(true);
    expect(visit(page.storage).element('cookie-consent').hidden).toBe(true);
  });
  it('reopens without changing the choice and returns focus to its footer trigger', () => {
    const page = visit(new Map([[key, 'accepted']]));
    page.click('preferences');
    expect(page.element('cookie-consent').hidden).toBe(false);
    expect(page.storage.get(key)).toBe('accepted');
    expect(page.document.activeElement.id).toBe('accept-cookies');
    page.boot();
    page.document.dispatchEvent(new Event('astro:page-load'));
    expect(page.element('cookie-consent').hidden).toBe(false);
    page.click('decline-cookies');
    expect(page.document.activeElement.id).toBe('preferences');
    expect(page.element('preferences').getAttribute('aria-expanded')).toBe('false');
    expect(page.events).toContain('cookie-consent-revoked');
  });
  it('keeps an unavailable-storage choice for Astro navigation without blocking the site', () => {
    const page = visit(new Map(), true);
    page.click('decline-cookies');
    page.navigate();
    expect(page.window.WebScaleCookies.getStatus()).toBe('declined');
    expect(page.element('cookie-consent').hidden).toBe(true);
    expect(visit(new Map(), true).element('cookie-consent').hidden).toBe(false);
    expect(() => runInContext(analyticsSource, page.context)).not.toThrow();
  });
  it('treats invalid storage as unknown and preserves unrelated essential data', () => {
    const page = visit(new Map([[key, 'yes'], ['auth-fixture', 'untouched']]));
    expect(page.element('cookie-consent').hidden).toBe(false);
    page.click('accept-cookies');
    expect(page.storage.get('auth-fixture')).toBe('untouched');
  });
  it('does not add duplicate handlers after script reruns', () => {
    const page = visit();
    page.boot(); page.boot();
    page.click('accept-cookies');
    expect(page.events.filter(name => name === 'cookie-consent-accepted')).toHaveLength(1);
  });
  it('reflects changes from another tab and revokes previously accepted consent', () => {
    const page = visit(new Map([[key, 'accepted']]));
    page.storage.set(key, 'declined');
    const event = new Event('storage');
    Object.defineProperty(event, 'key', { value: key });
    page.window.dispatchEvent(event);
    expect(page.window.WebScaleCookies.getStatus()).toBe('declined');
    expect(page.events).toContain('cookie-consent-revoked');
    expect(page.element('cookie-consent').hidden).toBe(true);
  });
});
