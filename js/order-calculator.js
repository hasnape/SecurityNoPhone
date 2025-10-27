(function () {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  function toNumber(value) {
    if (typeof value !== 'string') {
      return Number(value);
    }
    const normalised = value.replace(/\s+/g, '').replace(',', '.');
    return Number.parseFloat(normalised);
  }

  function clampMin(value, min) {
    return value < min ? min : value;
  }

  function getOfferConfig(form) {
    const config = {};
    form.querySelectorAll('[data-offer-base]').forEach((element) => {
      const key = element.dataset.offerBase;
      if (!key) {
        return;
      }
      const price = toNumber(element.dataset.price || element.textContent || '0');
      if (Number.isNaN(price)) {
        return;
      }
      const type = element.dataset.pricingType || 'flat';
      const packSize = element.dataset.packSize ? Number.parseInt(element.dataset.packSize, 10) : null;
      const maxQuantity = element.dataset.maxQuantity ? Number.parseInt(element.dataset.maxQuantity, 10) : null;
      const includedDays = element.dataset.includedDays ? Number.parseInt(element.dataset.includedDays, 10) : null;
      config[key] = {
        price,
        type,
        packSize,
        maxQuantity,
        includedDays
      };
    });
    return config;
  }

  function computeDays(startValue, endValue) {
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
    const rawDays = Math.ceil(diff / MS_PER_DAY);
    const totalDays = clampMin(rawDays + 1, 1);
    return totalDays;
  }

  function initOrderForm(form) {
    const offerSelect = form.querySelector('[data-offer-select]');
    const quantityInput = form.querySelector('[data-quantity-input]');
    const startInput = form.querySelector('[data-start-date]');
    const endInput = form.querySelector('[data-end-date]');
    const rentalFields = form.querySelector('[data-rental-fields]');
    const quantityError = form.querySelector('[data-quantity-error]');
    const dateError = form.querySelector('[data-date-error]');
    const summary = form.querySelector('[data-summary]');
    const summaryDaysCount = summary ? summary.querySelector('[data-summary-days-count]') : null;
    const summaryDaysLabel = summary ? summary.querySelector('[data-summary-days-label]') : null;
    const summaryTotalAmount = summary ? summary.querySelector('[data-summary-total-amount]') : null;
    const summaryTotalLabel = summary ? summary.querySelector('[data-summary-total-label]') : null;
    const priceDisplay = form.querySelector('[data-price-display]');
    const submitButton = form.querySelector('[type="submit"]');

    const offerConfig = getOfferConfig(form);
    const locale = form.dataset.locale || document.documentElement.lang || 'fr-FR';
    const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' });
    const formStateEventName = 'order:state-change';

    function dispatchState(detail) {
      const state = {
        total: typeof detail.total === 'number' ? detail.total : null,
        days: typeof detail.days === 'number' ? detail.days : null,
        offer: detail.offer || null,
        isReady: Boolean(detail.isReady)
      };
      form.__orderState = state;
      form.dispatchEvent(new CustomEvent(formStateEventName, { detail: state }));
    }

    function isRentalOffer(value) {
      const offerValue = value || offerSelect.value;
      return offerValue === 'location_sans' || offerValue === 'location_avec';
    }

    function showElement(element, shouldShow) {
      if (!element) {
        return;
      }
      element.classList.toggle('d-none', !shouldShow);
      element.querySelectorAll('input').forEach((input) => {
        input.required = shouldShow;
      });
    }

    function resetSummary() {
      if (!summary) {
        return;
      }
      summary.classList.add('d-none');
      if (summaryDaysCount) {
        summaryDaysCount.textContent = '';
      }
      if (summaryTotalAmount) {
        summaryTotalAmount.textContent = '';
      }
    }

    function formatDays(days) {
      if (!summary) {
        return '';
      }
      const singular = summary.dataset.daySingular || 'jour';
      const plural = summary.dataset.dayPlural || 'jours';
      const label = days > 1 ? plural : singular;
      return `${days} ${label}`;
    }

    function setSummary(days, total) {
      if (!summary) {
        return;
      }
      summary.classList.remove('d-none');
      if (summaryDaysLabel) {
        summaryDaysLabel.textContent = summary.dataset.daysLabel || '';
      }
      if (summaryTotalLabel) {
        summaryTotalLabel.textContent = summary.dataset.totalLabel || '';
      }
      if (summaryDaysCount) {
        summaryDaysCount.textContent = formatDays(days);
      }
      if (summaryTotalAmount) {
        summaryTotalAmount.textContent = currencyFormatter.format(total);
      }
    }

    function renderPrice(total) {
      if (!priceDisplay) {
        return;
      }
      const template = priceDisplay.dataset.template || '{price}';
      priceDisplay.textContent = template.replace('{price}', currencyFormatter.format(total));
    }

    function clearPrice() {
      if (priceDisplay) {
        priceDisplay.textContent = '';
      }
    }

    function validateQuantity(showMessage = true) {
      if (!quantityInput || !quantityError) {
        return true;
      }
      const value = Number.parseInt(quantityInput.value, 10);
      const offerValue = offerSelect.value;
      let isValid = true;
      let message = '';

      if (Number.isNaN(value)) {
        isValid = false;
      }

      if (isRentalOffer(offerValue)) {
        if (value < 1) {
          isValid = false;
          message = quantityError.dataset.minRental || '';
        }
      } else if (offerValue === 'achat') {
        if (value < 50) {
          isValid = false;
          message = quantityError.dataset.minCustom || '';
        }
      } else if (offerValue === 'abonnement') {
        if (value < 0) {
          isValid = false;
          message = quantityError.dataset.minSubscription || '';
        } else if (quantityError.dataset.maxSubscription) {
          const max = Number.parseInt(quantityError.dataset.maxSubscription, 10);
          if (!Number.isNaN(max) && value > max) {
            isValid = false;
            message = quantityError.dataset.maxSubscriptionMessage || '';
          }
        }
      } else if (!offerValue) {
        isValid = false;
      }

      if (showMessage) {
        quantityError.textContent = message;
        quantityError.style.display = isValid ? 'none' : 'block';
      }

      return isValid;
    }

    function validateDates(showMessage = true) {
      if (!dateError) {
        return true;
      }
      if (!isRentalOffer()) {
        dateError.textContent = '';
        dateError.style.display = 'none';
        return true;
      }

      const missingMessage = dateError.dataset.missing || '';
      const rangeMessage = dateError.dataset.range || '';

      if (!startInput.value || !endInput.value) {
        if (showMessage) {
          dateError.textContent = missingMessage;
          dateError.style.display = missingMessage ? 'block' : 'none';
        }
        return false;
      }

      const days = computeDays(startInput.value, endInput.value);
      if (days === null) {
        if (showMessage) {
          dateError.textContent = missingMessage;
          dateError.style.display = missingMessage ? 'block' : 'none';
        }
        return false;
      }
      if (days === -1) {
        if (showMessage) {
          dateError.textContent = rangeMessage;
          dateError.style.display = rangeMessage ? 'block' : 'none';
        }
        return false;
      }

      dateError.textContent = '';
      dateError.style.display = 'none';
      return true;
    }

    function computeTotal() {
      const offerValue = offerSelect.value;
      const config = offerConfig[offerValue];
      if (!config) {
        return null;
      }

      const quantity = Number.parseInt(quantityInput.value, 10) || 0;

      if (config.type === 'package' || config.type === 'flat') {
        if (!isRentalOffer(offerValue)) {
          return { total: config.price, days: config.includedDays || null };
        }
        if (!validateDates(false)) {
          return null;
        }
        const included = clampMin(config.includedDays || 3, 1);
        const computedDays = computeDays(startInput.value, endInput.value);
        if (computedDays === -1) {
          return null;
        }
        const days = computedDays == null ? included : computedDays;
        const total = config.price;
        return { total, days };
      }

      if (config.type === 'per-unit') {
        const perUnitTotal = clampMin(quantity, 0) * config.price;
        return { total: perUnitTotal, days: null };
      }

      if (config.type === 'subscription') {
        let effectiveQuantity = clampMin(quantity, 0);
        const packSize = clampMin(config.packSize || 50, 1);
        let packs = effectiveQuantity > 0 ? Math.ceil(effectiveQuantity / packSize) : 1;
        if (config.maxQuantity && effectiveQuantity > config.maxQuantity) {
          packs = Math.ceil(config.maxQuantity / packSize);
        }
        return { total: packs * config.price, days: null };
      }

      return null;
    }

    function updateUI() {
      const offerValue = offerSelect.value;
      showElement(rentalFields, isRentalOffer(offerValue));
      const quantityValid = validateQuantity();
      const datesValid = validateDates();
      const totalInfo = computeTotal();
      const totalValue = totalInfo && typeof totalInfo.total === 'number'
        ? Number.parseFloat((Math.round(totalInfo.total * 100) / 100).toFixed(2))
        : null;

      if (!totalInfo) {
        if (isRentalOffer(offerValue) && datesValid) {
          resetSummary();
        }
        clearPrice();
      } else {
        const { total, days } = totalInfo;
        renderPrice(total);
        if (isRentalOffer(offerValue) && typeof days === 'number') {
          setSummary(days, total);
        } else {
          resetSummary();
        }
      }

      if (submitButton) {
        const baseValidity = form.checkValidity();
        const isReady = Boolean(
          offerValue &&
          quantityValid &&
          datesValid &&
          baseValidity &&
          totalValue !== null &&
          totalValue > 0
        );
        submitButton.disabled = !isReady;
        dispatchState({
          total: totalValue,
          days: totalInfo && typeof totalInfo.days === 'number' ? totalInfo.days : null,
          offer: offerValue,
          isReady
        });
      } else {
        dispatchState({
          total: totalValue,
          days: totalInfo && typeof totalInfo.days === 'number' ? totalInfo.days : null,
          offer: offerValue,
          isReady: Boolean(
            offerValue &&
            quantityValid &&
            datesValid &&
            totalValue !== null &&
            totalValue > 0
          )
        });
      }
    }

    if (submitButton) {
      submitButton.disabled = true;
    }

    if (offerSelect) {
      offerSelect.addEventListener('change', updateUI);
    }
    if (quantityInput) {
      quantityInput.addEventListener('input', updateUI);
    }
    if (startInput) {
      startInput.addEventListener('change', updateUI);
    }
    if (endInput) {
      endInput.addEventListener('change', updateUI);
    }
    form.addEventListener('submit', (event) => {
      if (submitButton && submitButton.disabled) {
        event.preventDefault();
        return;
      }
      if (!validateQuantity() || !validateDates()) {
        event.preventDefault();
      }
    });

    updateUI();
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-order-form]').forEach(initOrderForm);
  });
})();
