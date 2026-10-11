// Shared public-page preference; essential site/auth storage is never disabled.
(function () {
  if (window.WebScaleCookies && window.WebScaleCookies.initialized) {
    window.WebScaleCookies.refresh();
    return;
  }

  var storageKey = 'cookie-consent-status';
  var returnFocus = null;
  var settingsPanel = null;
  var status = readStoredStatus();
  var observer;

  function validStatus(value) {
    return value === 'accepted' || value === 'declined' ? value : null;
  }

  function readStoredStatus() {
    try {
      return validStatus(window.localStorage.getItem(storageKey));
    } catch (_error) {
      return null;
    }
  }

  function panel() {
    return document.getElementById('cookie-consent');
  }

  function setExpanded(expanded) {
    document.querySelectorAll('[data-cookie-preferences]').forEach(function (button) {
      button.setAttribute('aria-expanded', String(expanded));
    });
  }

  function announce(message) {
    var region = document.getElementById('cookie-consent-announcement');
    if (region) region.textContent = message;
  }

  function syncSpacer() {
    var consent = panel();
    var spacer = document.getElementById('cookie-consent-spacer');
    if (!consent || !spacer) return;
    spacer.hidden = consent.hidden;
    if (!consent.hidden) {
      // Keep footer actions reachable above the fixed panel at the page end.
      spacer.style.height = (consent.getBoundingClientRect().height + parseFloat(window.getComputedStyle(consent).bottom) + 16) + 'px';
    }
  }

  function showConsent(trigger) {
    var consent = panel();
    if (!consent) return;
    consent.hidden = false;
    syncSpacer();
    setExpanded(true);
    announce('Cookie preferences: choose Accept or Decline. Essential functionality stays available.');
    // Only an explicit settings action moves focus. First visits remain undisturbed.
    if (trigger instanceof HTMLElement) {
      settingsPanel = consent;
      returnFocus = trigger;
      trigger.scrollIntoView({ block: 'center', behavior: 'instant' });
      document.getElementById('accept-cookies').focus({ preventScroll: true });
    }
  }

  function hideConsent() {
    var consent = panel();
    if (!consent) return;
    var focusWasInside = consent.contains(document.activeElement);
    consent.hidden = true;
    settingsPanel = null;
    syncSpacer();
    setExpanded(false);
    if (focusWasInside) {
      if (returnFocus && returnFocus.isConnected) {
        returnFocus.focus({ preventScroll: true });
      } else {
        // A hidden control must not retain keyboard focus after the first choice.
        var main = document.querySelector('main');
        if (main) {
          var oldTabIndex = main.getAttribute('tabindex');
          main.setAttribute('tabindex', '-1');
          main.focus({ preventScroll: true });
          if (oldTabIndex === null) main.removeAttribute('tabindex');
          else main.setAttribute('tabindex', oldTabIndex);
        }
      }
    }
    returnFocus = null;
  }

  function saveChoice(choice) {
    var previous = status;
    status = choice;
    try {
      window.localStorage.setItem(storageKey, choice);
    } catch (_error) {
      // Retain the decision in memory for this visit, including Astro navigation.
    }
    hideConsent();
    announce(choice === 'accepted' ? 'Cookie preference saved: accepted.' : 'Cookie preference saved: declined.');
    window.dispatchEvent(new CustomEvent('cookie-consent-changed', { detail: { status: choice } }));
    if (choice === 'accepted') window.dispatchEvent(new CustomEvent('cookie-consent-accepted'));
    else if (previous === 'accepted') window.dispatchEvent(new CustomEvent('cookie-consent-revoked'));
  }

  function refresh() {
    var consent = panel();
    // Late/repeated Astro lifecycle events must not close explicitly opened settings.
    if (consent && consent === settingsPanel && !consent.hidden) {
      syncSpacer();
      return;
    }
    returnFocus = null;
    document.querySelectorAll('[data-cookie-preferences]').forEach(function (button) {
      button.hidden = !consent;
    });
    if (!consent) return;
    if (typeof ResizeObserver !== 'undefined') {
      if (observer) observer.disconnect();
      observer = new ResizeObserver(syncSpacer);
      observer.observe(consent);
    }
    if (status) hideConsent();
    else showConsent();
  }

  // Preserve the existing template API used by optional embedded components.
  window.WebScaleCookies = {
    initialized: true,
    getStatus: function () { return status; },
    openSettings: showConsent,
    refresh: refresh
  };

  document.addEventListener('click', function (event) {
    var target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    var trigger = target.closest('[data-cookie-preferences]');
    if (trigger) showConsent(trigger);
    else if (target.closest('#accept-cookies')) saveChoice('accepted');
    else if (target.closest('#decline-cookies')) saveChoice('declined');
  });
  document.addEventListener('astro:page-load', refresh);
  window.addEventListener('resize', syncSpacer);
  window.addEventListener('storage', function (event) {
    if (event.key !== storageKey && event.key !== null) return;
    var previous = status;
    status = readStoredStatus();
    settingsPanel = null;
    refresh();
    window.dispatchEvent(new CustomEvent('cookie-consent-changed', { detail: { status: status } }));
    if (status === 'accepted') window.dispatchEvent(new CustomEvent('cookie-consent-accepted'));
    else if (previous === 'accepted') window.dispatchEvent(new CustomEvent('cookie-consent-revoked'));
  });
  refresh();
})();
