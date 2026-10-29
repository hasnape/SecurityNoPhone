(function (root) {
  'use strict';

  // Prepare a contact link only. No order status is inferred from a reference.
  function buildTrackingContact(reference, subjectLabel) {
    const clean = value => String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
    const value = clean(reference);
    return 'mailto:snophone.info@gmail.com?subject=' +
      encodeURIComponent(clean(subjectLabel || 'SecurityNoPhone') + ' — ' + value);
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { buildTrackingContact };
  }
  if (!root.document) return;

  root.document.addEventListener('DOMContentLoaded', () => {
    const form = root.document.getElementById('trackingForm');
    const input = root.document.getElementById('orderId');
    const result = root.document.getElementById('statusResult');
    if (!form || !input || !result) return;
    let requestedReference = '';

    function render() {
      if (!requestedReference) return;
      const lang = root.document.documentElement.lang;
      const t = root.translations?.[lang] || root.translations?.fr || {};
      const message = root.document.createElement('p');
      message.textContent = t.tracking_contact_result;
      const reference = root.document.createElement('p');
      reference.textContent = requestedReference;
      reference.dir = 'auto';
      const link = root.document.createElement('a');
      link.className = 'btn btn-outline-primary';
      link.href = buildTrackingContact(requestedReference, t.order_tracking_title);
      link.textContent = t.contact_cta_email;
      result.replaceChildren(message, reference, link);
    }

    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      requestedReference = input.value.trim();
      render();
    });
    root.document.addEventListener('language:changed', render);
  });
})(typeof window !== 'undefined' ? window : globalThis);
