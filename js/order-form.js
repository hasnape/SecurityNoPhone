// SecurityNoPhone — offres publiques et validation des dates.
// Client-side validation only: every request is rechecked manually before confirmation.
(function () {
  'use strict';
  const OFFER_CONFIG = Object.freeze({
    event_mini: { type: 'event', quantity: 49, price: 69 },
    event_essentiel: { type: 'event', quantity: 97, price: 109 },
    event_confort: { type: 'event', quantity: 182, price: 189 },
    event_grand: { type: 'event', quantity: 303, price: 299 },
    event_prestige: { type: 'event', quantity: 484, price: 449 },
    pro_education: { type: 'professional', quantity: 92, monthlyPrice: 69, minMonths: 3 },
    pro_starter: { type: 'professional', quantity: 182, monthlyPrice: 119, minMonths: 3 },
    pro_business: { type: 'professional', quantity: 363, monthlyPrice: 229, minMonths: 3 },
    pro_entreprise: { type: 'professional', quantity: 605, monthlyPrice: 349, minMonths: 3 },
    achat: { type: 'purchase', minQuantity: 50 },
    special_event: { type: 'custom' }
  });
  const NOTICE_DAYS = 30;
  const DEPOSIT_PER_POUCH = 1.50;

  function formatCurrency(locale, value, currency) {
    try {
      return new Intl.NumberFormat(locale || 'fr-FR', {
        style: 'currency', currency: currency || 'EUR'
      }).format(value);
    } catch (_) {
      return value.toFixed(2) + ' €';
    }
  }

  // Calendar dates, deliberately processed in UTC to avoid DST issues.
  function addCalendarDays(dateISO, days) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateISO || '');
    if (!match) return null;
    const year = Number(match[1]), month = Number(match[2]) - 1, day = Number(match[3]);
    const initial = new Date(Date.UTC(year, month, day));
    if (initial.getUTCFullYear() !== year ||
        initial.getUTCMonth() !== month || initial.getUTCDate() !== day) return null;
    initial.setUTCDate(initial.getUTCDate() + days);
    return initial.toISOString().slice(0, 10);
  }

  function franceTodayISO() {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date());
    const fields = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return fields.year + '-' + fields.month + '-' + fields.day;
  }

  function earliestRequestDate() {
    return addCalendarDays(franceTodayISO(), NOTICE_DAYS);
  }

  // Three full calendar months, with the return date counted in the rental.
  function minimumRentalEndDate(startValue) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(startValue || '');
    if (!match) return null;
    const year = Number(match[1]), month = Number(match[2]) - 1, day = Number(match[3]);
    const start = new Date(Date.UTC(year, month, day));
    if (start.getUTCFullYear() !== year || start.getUTCMonth() !== month ||
        start.getUTCDate() !== day) return null;
    const nextMonth = month + 3;
    const lastDay = new Date(Date.UTC(year, nextMonth + 1, 0)).getUTCDate();
    const anniversary = new Date(Date.UTC(year, nextMonth, Math.min(day, lastDay)));
    anniversary.setUTCDate(anniversary.getUTCDate() - 1);
    return anniversary.toISOString().slice(0, 10);
  }

  function purchaseUnitPrice(quantity) {
    if (quantity >= 300) return 4.90;
    if (quantity >= 100) return 5.50;
    return 5.90;
  }

  function replacementUnitPrice(quantity) {
    return purchaseUnitPrice(quantity);
  }

  function showElement(element, visible) {
    if (!element) return;
    element.classList.toggle('d-none', !visible);
    element.querySelectorAll('input, select, textarea').forEach(input => {
      input.disabled = !visible;
      if (!visible) input.setCustomValidity('');
    });
  }

  function showError(input, container, message) {
    if (input) {
      input.setCustomValidity(message || '');
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
    }
    if (container) {
      container.textContent = message || '';
      container.style.display = message ? 'block' : 'none';
    }
  }

  function initOrderForm(form) {
    const offerSelect = form.querySelector('#offerType');
    const quantityInput = form.querySelector('#quantity');
    const targetGroup = form.querySelector('[data-event-purchase-date]');
    const targetInput = form.querySelector('[data-requested-date]');
    const targetError = form.querySelector('[data-requested-date-error]');
    const rentalGroup = form.querySelector('[data-rental-fields]');
    const startInput = form.querySelector('[data-start-date]');
    const endInput = form.querySelector('[data-end-date]');
    const dateError = form.querySelector('#dateError');
    const quantityError = form.querySelector('#quantityError');
    const agentGroup = form.querySelector('[data-agent-options]');
    const priceDisplay = form.querySelector('[data-total-display]');
    const cautionGroup = form.querySelector('[data-caution-block]');
    const cautionDisplay = form.querySelector('[data-caution-display]');
    const totalHidden = form.querySelector('[data-total-value]');
    const cautionHidden = form.querySelector('[data-caution-value]');
    const replacementHidden = form.querySelector('[data-replacement-price]');
    const summary = form.querySelector('[data-summary]');
    const currency = form.dataset.currency || 'EUR';
    let currentOffer = null;

    function translate(key, fallback) {
      return window.translations?.[document.documentElement.lang]?.[key] || fallback;
    }

    function format(value) {
      return formatCurrency(document.documentElement.lang || 'fr-FR', value, currency);
    }

    function validateDates(offer) {
      const earliest = earliestRequestDate();
      if (targetInput) targetInput.min = earliest;
      if (startInput) startInput.min = earliest;
      if (endInput) endInput.min = startInput?.value
        ? (minimumRentalEndDate(startInput.value) || earliest) : earliest;
      showError(targetInput, targetError, '');
      showError(endInput, dateError, '');
      if (startInput) startInput.setCustomValidity('');

      if (offer.type === 'professional') {
        const start = startInput?.value || '';
        const end = endInput?.value || '';
        if (!start || !end) {
          showError(endInput, dateError, translate('order_dates_missing',
            'Indiquez les dates de début et de fin.'));
          return false;
        }
        if (!addCalendarDays(start, 0) || start < earliest) {
          const message = translate('booking_too_soon',
            'Date trop proche : prévoir au moins 30 jours calendaires.');
          showError(startInput, dateError, message);
          return false;
        }
        if (!addCalendarDays(end, 0) || end < start) {
          showError(endInput, dateError, translate('order_dates_range',
            'La date de fin doit être après le début.'));
          return false;
        }
        const minEnd = minimumRentalEndDate(start);
        if (!minEnd || end < minEnd) {
          showError(endInput, dateError, translate('order_dates_min_three_months',
            'Location : trois mois calendaires minimum.'));
          return false;
        }
        return true;
      }

      const requested = targetInput?.value || '';
      if (!requested || !addCalendarDays(requested, 0)) {
        showError(targetInput, targetError, translate('booking_date_required',
          'Indiquez votre date d’événement ou de livraison souhaitée.'));
        return false;
      }
      if (requested < earliest) {
        showError(targetInput, targetError, translate('booking_too_soon',
          'Date trop proche : prévoir au moins 30 jours calendaires.'));
        return false;
      }
      return true;
    }

    function validateQuantity(offer, quantity) {
      let message = '';
      if (!Number.isInteger(quantity) || quantity < 1) {
        message = translate('order_quantity_invalid', 'Indiquez un nombre entier de pochettes.');
      } else if (offer.quantity && quantity !== offer.quantity) {
        message = translate('booking_package_fixed', 'Ce forfait comporte une quantité fixe.');
      } else if (offer.type === 'purchase' && quantity < 50) {
        message = translate('booking_purchase_minimum', 'Achat : minimum 50 pochettes.');
      }
      showError(quantityInput, quantityError, message);
      return !message;
    }

    function refresh() {
      const offer = OFFER_CONFIG[offerSelect?.value];
      const professional = offer?.type === 'professional';
      const dated = !!offer && !professional;
      showElement(rentalGroup, professional);
      showElement(targetGroup, dated);
      showElement(agentGroup, offer?.type === 'custom');
      if (startInput) startInput.required = professional;
      if (endInput) endInput.required = professional;
      if (targetInput) targetInput.required = dated;
      if (summary) summary.classList.add('d-none');

      if (offerSelect?.value !== currentOffer) {
        currentOffer = offerSelect?.value || null;
        if (offer?.quantity && quantityInput) quantityInput.value = String(offer.quantity);
        if (quantityInput) quantityInput.readOnly = !!offer?.quantity;
      }

      if (!offer) {
        showError(quantityInput, quantityError, '');
        showError(targetInput, targetError, '');
        showError(endInput, dateError, '');
        if (startInput) startInput.setCustomValidity('');
        if (priceDisplay) priceDisplay.textContent = '';
        if (cautionGroup) cautionGroup.classList.add('d-none');
        if (totalHidden) totalHidden.value = '';
        if (cautionHidden) cautionHidden.value = '';
        if (replacementHidden) replacementHidden.value = '';
        return false;
      }

      const quantity = Number(quantityInput?.value);
      const quantityOk = validateQuantity(offer, quantity);
      const datesOk = validateDates(offer);
      const valid = quantityOk && datesOk;
      const caution = offer.type === 'event' || offer.type === 'professional'
        ? quantity * DEPOSIT_PER_POUCH : 0;
      const replacement = replacementUnitPrice(quantity);
      let total = null;
      let label = '';
      if (offer.type === 'event') {
        total = offer.price;
        label = translate('booking_event_estimate', 'Tarif événement : {price} (caution distincte)')
          .replace('{price}', format(total));
      } else if (offer.type === 'professional') {
        total = offer.monthlyPrice * offer.minMonths;
        label = translate('booking_pro_estimate',
          '{monthly} / mois ; minimum 3 mois : {total}, hors caution')
          .replace('{monthly}', format(offer.monthlyPrice))
          .replace('{total}', format(total));
      } else if (offer.type === 'purchase') {
        total = quantity * purchaseUnitPrice(quantity);
        label = translate('booking_purchase_estimate',
          'Achat : {unit}/unité, total indicatif {total}, sur devis')
          .replace('{unit}', format(purchaseUnitPrice(quantity)))
          .replace('{total}', format(total));
      } else {
        label = translate('offer_quote_only', 'Sur devis, sans réservation immédiate.');
      }

      if (priceDisplay) priceDisplay.textContent = valid ? label : '';
      if (cautionGroup) cautionGroup.classList.toggle('d-none', !valid || caution <= 0);
      if (cautionDisplay && valid) cautionDisplay.value = format(caution);
      if (totalHidden) totalHidden.value = valid && total != null ? total.toFixed(2) : '';
      if (cautionHidden) cautionHidden.value = valid ? caution.toFixed(2) : '';
      if (replacementHidden) replacementHidden.value =
        valid && caution > 0 ? replacement.toFixed(2) : '';
      return valid;
    }

    function applyOfferFromLink() {
      const hash = window.location.hash.slice(1);
      const legacy = {
        rental: 'pro_business', autonomous: 'pro_education',
        abonnement: 'pro_starter', pro: 'pro_business',
        custom: 'achat', special: 'special_event'
      };
      const offerKey = legacy[hash] || (OFFER_CONFIG[hash] ? hash : '');
      if (offerKey && offerSelect) offerSelect.value = offerKey;
      refresh();
    }

    offerSelect?.addEventListener('change', refresh);
    quantityInput?.addEventListener('input', refresh);
    targetInput?.addEventListener('change', refresh);
    startInput?.addEventListener('change', refresh);
    endInput?.addEventListener('change', refresh);
    form.querySelectorAll('[data-agent-options] input').forEach(input =>
      input.addEventListener('change', refresh));
    window.addEventListener('hashchange', applyOfferFromLink);
    document.addEventListener('language:changed', refresh);
    form.addEventListener('submit', event => {
      if (!refresh() || !form.checkValidity()) {
        event.preventDefault();
        form.reportValidity();
      }
    });
    applyOfferFromLink();
  }
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-order-form]').forEach(initOrderForm);
  });
})();
