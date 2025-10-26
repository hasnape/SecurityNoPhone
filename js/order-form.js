// Ne pas exposer de clés secrètes dans le front. Les chaînes type AVGPt… ou EKV-… appartiennent au serveur.
// Regénérez les clés si elles ont été publiées.
(function () {
  const OFFER_CONFIG = {
    location_sans: { type: 'rental', dailyRate: 150 },
    location_avec: { type: 'rental', dailyRate: 390, staffDailyRate: 100 },
    abonnement: { type: 'subscription', pricePerPack: 19, packSize: 50 },
    achat: { type: 'purchase', unitPrice: 3.5, minQuantity: 50 },
    special_event: { type: 'custom' }
  };

  function formatCurrency(locale, value, currency) {
    try {
      return new Intl.NumberFormat(locale || 'fr-FR', { style: 'currency', currency: currency || 'EUR' }).format(value);
    } catch (error) {
      return `${value.toFixed(2)} ${currency || 'EUR'}`;
    }
  }

  function computeInclusiveDays(startValue, endValue) {
    if (!startValue || !endValue) {
      return null;
    }
    const start = new Date(startValue);
    const end = new Date(endValue);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return null;
    }
    const diff = end.getTime() - start.getTime();
    if (diff < 0) {
      return -1;
    }
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const rawDays = Math.ceil(diff / MS_PER_DAY);
    return Math.max(rawDays + 1, 1);
  }

  function computeCaution(offerKey, quantity) {
    const offer = OFFER_CONFIG[offerKey];
    if (!offer) {
      return 0;
    }
    if (offer.type === 'rental' || offer.type === 'subscription') {
      const qty = Math.max(Number(quantity) || 0, 1);
      const blocks = Math.ceil(qty / 700);
      return blocks * 300;
    }
    return 0;
  }

  function updateSummaryVisibility(summaryEl, show, locale, days, total, currency) {
    if (!summaryEl) {
      return;
    }
    summaryEl.classList.toggle('d-none', !show);
    if (!show) {
      return;
    }
    const daysLabel = summaryEl.querySelector('[data-summary-days-count]');
    const totalLabel = summaryEl.querySelector('[data-summary-total-amount]');
    if (daysLabel) {
      daysLabel.textContent = days != null ? String(days) : '—';
    }
    if (totalLabel) {
      totalLabel.textContent = total != null ? formatCurrency(locale, total, currency) : '—';
    }
  }

  function initOrderForm(form) {
    const locale = form.dataset.locale || document.documentElement.getAttribute('lang') || 'fr-FR';
    const currency = (form.dataset.currency || 'EUR').toUpperCase();

    const offerSelect = form.querySelector('#offerType, [name="offre"]');
    const quantityInput = form.querySelector('#quantity, [name="quantite"]');
    const startInput = form.querySelector('[data-start-date]');
    const endInput = form.querySelector('[data-end-date]');
    const staffInput = form.querySelector('#staffQuantity, [data-staff-quantity]');
    const rentalFields = form.querySelector('[data-rental-fields]');
    const staffFields = form.querySelector('[data-staff-fields]');
    const summary = form.querySelector('[data-summary]');
    const priceDisplay = form.querySelector('[data-total-display]');
    const priceTemplate = priceDisplay ? (priceDisplay.dataset.template || priceDisplay.textContent || 'Total: {price}') : 'Total: {price}';
    const customMessage = form.dataset.customMessage || '';
    const quantityError = form.querySelector('#quantityError, [data-quantity-error]');
    const dateError = form.querySelector('#dateError, [data-date-error]');
    const cautionBlock = form.querySelector('[data-caution-block]');
    const cautionDisplay = form.querySelector('[data-caution-display]');
    const totalHidden = form.querySelector('[data-total-value]');
    const cautionHidden = form.querySelector('[data-caution-value]');

    function showElement(element, show) {
      if (!element) {
        return;
      }
      element.classList.toggle('d-none', !show);
      element.querySelectorAll('input, select, textarea').forEach(input => {
        if (show) {
          input.removeAttribute('disabled');
        } else {
          input.setAttribute('disabled', 'disabled');
        }
      });
    }

    function setQuantityValidity(message) {
      if (!quantityInput) {
        return;
      }
      quantityInput.setCustomValidity(message ? String(message) : '');
      if (quantityError) {
        quantityError.textContent = message || '';
        quantityError.style.display = message ? 'block' : 'none';
      }
    }

    function setDateValidity(message) {
      if (!endInput) {
        return;
      }
      endInput.setCustomValidity(message ? String(message) : '');
      if (dateError) {
        dateError.textContent = message || '';
        dateError.style.display = message ? 'block' : 'none';
      }
    }

    function getQuantity() {
      const raw = Number.parseInt(quantityInput && quantityInput.value, 10);
      return Number.isNaN(raw) ? 0 : raw;
    }

    function validateQuantity(offerKey) {
      const offer = OFFER_CONFIG[offerKey];
      if (!offer || !quantityInput) {
        setQuantityValidity('');
        return true;
      }
      const qty = getQuantity();
      let message = '';
      if (offer.type === 'rental' && qty < 1) {
        message = quantityInput.dataset.msgMinRental || 'Indiquez au moins une pochette.';
      }
      if (offer.type === 'purchase' && qty < (offer.minQuantity || 0)) {
        message = quantityInput.dataset.msgMinCustom || `Minimum ${offer.minQuantity}`;
      }
      if (offer.type === 'subscription') {
        if (qty < 1) {
          message = quantityInput.dataset.msgMinSubscription || 'Indiquez au moins une pochette.';
        } else if (offer.maxQuantity && qty > offer.maxQuantity) {
          message = quantityInput.dataset.msgMaxSubscription || '';
        }
      }
      setQuantityValidity(message);
      return message === '';
    }

    function validateDates(offerKey) {
      if (!startInput || !endInput) {
        return { valid: true, days: null };
      }
      const offer = OFFER_CONFIG[offerKey];
      if (!offer || offer.type !== 'rental') {
        setDateValidity('');
        return { valid: true, days: null };
      }
      if (!startInput.value && !endInput.value) {
        setDateValidity('');
        return { valid: true, days: null };
      }
      if (!startInput.value || !endInput.value) {
        setDateValidity(endInput.dataset.msgMissing || 'Veuillez indiquer les dates de début et de fin.');
        return { valid: false, days: null };
      }
      const days = computeInclusiveDays(startInput.value, endInput.value);
      if (days === -1) {
        setDateValidity(endInput.dataset.msgRange || 'La date de fin doit être postérieure ou égale à la date de début.');
        return { valid: false, days: null };
      }
      setDateValidity('');
      return { valid: true, days };
    }

    function computeTotals() {
      const offerKey = offerSelect ? offerSelect.value : '';
      const offer = OFFER_CONFIG[offerKey];
      if (!offer) {
        updateSummaryVisibility(summary, false);
        if (priceDisplay) {
          priceDisplay.textContent = formatCurrency(locale, 0, currency);
        }
        if (cautionBlock) {
          cautionBlock.classList.add('d-none');
        }
        if (totalHidden) totalHidden.value = '0';
        if (cautionHidden) cautionHidden.value = '0';
        return;
      }

      const quantityValid = validateQuantity(offerKey);
      const quantity = getQuantity();
      const caution = computeCaution(offerKey, quantity);

      let total = 0;
      let daysInfo = { valid: true, days: null };

      switch (offer.type) {
        case 'rental': {
          daysInfo = validateDates(offerKey);
          const days = daysInfo.days || 1;
          const base = offer.dailyRate * days;
          let staffTotal = 0;
          if (staffInput) {
            const staffCount = Math.max(Number.parseInt(staffInput.value, 10) || 0, 0);
            staffTotal = (offer.staffDailyRate || 0) * staffCount * days;
          }
          total = base + staffTotal;
          break;
        }
        case 'subscription': {
          const qty = Math.max(quantity, 0);
          const packs = Math.max(Math.ceil(qty / (offer.packSize || 1)), 0);
          total = packs * (offer.pricePerPack || 0);
          break;
        }
        case 'purchase': {
          total = Math.max(quantity, 0) * (offer.unitPrice || 0);
          break;
        }
        case 'custom':
          total = 0;
          break;
        default:
          total = 0;
      }

      const grandTotal = total + caution;

      if (priceDisplay) {
        if (offer.type === 'custom' && customMessage) {
          priceDisplay.textContent = customMessage;
        } else {
          priceDisplay.textContent = priceTemplate.replace('{price}', formatCurrency(locale, grandTotal, currency));
        }
      }

      updateSummaryVisibility(summary, offer.type === 'rental', locale, daysInfo.days || 1, total, currency);

      if (cautionBlock) {
        const shouldShow = caution > 0;
        cautionBlock.classList.toggle('d-none', !shouldShow);
        if (cautionDisplay) {
          cautionDisplay.value = formatCurrency(locale, caution, currency);
        }
      }

      if (totalHidden) {
        totalHidden.value = grandTotal.toFixed(2);
      }
      if (cautionHidden) {
        cautionHidden.value = caution.toFixed(2);
      }

      const summaryFieldsActive = offer.type === 'rental';
      showElement(rentalFields, summaryFieldsActive);
      showElement(staffFields, offer.type === 'rental' && offer.staffDailyRate);

      return quantityValid && daysInfo.valid;
    }

    function refresh() {
      computeTotals();
    }

    if (offerSelect) {
      offerSelect.addEventListener('change', refresh);
    }
    if (quantityInput) {
      quantityInput.addEventListener('input', refresh);
    }
    if (startInput) {
      startInput.addEventListener('change', refresh);
    }
    if (endInput) {
      endInput.addEventListener('change', refresh);
    }
    if (staffInput) {
      staffInput.addEventListener('input', refresh);
    }

    form.addEventListener('submit', event => {
      const valid = computeTotals();
      if (!valid || !form.checkValidity()) {
        event.preventDefault();
        form.reportValidity();
      }
    });

    refresh();
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-order-form]').forEach(initOrderForm);
  });
})();
