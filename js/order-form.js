// Ne pas exposer de clés secrètes dans le front. Les chaînes type AVGPt… ou EKV-… appartiennent au serveur.
// Regénérez les clés si elles ont été publiées.
(function () {
  const OFFER_CONFIG = {
    location_sans: { type: 'rental', dailyRate: 150 },
    location_avec: { type: 'rental', dailyRate: 390, staffDailyRate: 100 },
    abonnement: { type: 'subscription', pricePerPack: 19, packSize: 50, maxQuantity: 50 },
    achat: { type: 'purchase', unitPrice: 3.5, minQuantity: 50 },
    special_event: { type: 'custom' }
  };

  const META_FIELDS = ['paypal_order_id', 'paypal_payer_email', 'paypal_amount', 'payment_status', 'submission_type'];
  const PAYPAL_MAX_ATTEMPTS = 40;
  const PAYPAL_RETRY_DELAY = 150;

  function clampMin(value, min) {
    return value < min ? min : value;
  }

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
    return clampMin(rawDays + 1, 1);
  }

  function waitForPayPal() {
    if (window.PayPalSDK && typeof window.PayPalSDK.Buttons === 'function') {
      return Promise.resolve(window.PayPalSDK);
    }
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts += 1;
        if (window.PayPalSDK && typeof window.PayPalSDK.Buttons === 'function') {
          clearInterval(interval);
          resolve(window.PayPalSDK);
        } else if (attempts >= PAYPAL_MAX_ATTEMPTS) {
          clearInterval(interval);
          reject(new Error('PayPal SDK unavailable'));
        }
      }, PAYPAL_RETRY_DELAY);
    });
  }

  function addHiddenInput(form, name, value) {
    let input = form.querySelector(`input[name="${name}"]`);
    if (!input) {
      input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      form.appendChild(input);
    }
    input.value = value || '';
  }

  function clearMetaFields(form) {
    META_FIELDS.forEach((name) => {
      const existing = form.querySelector(`input[name="${name}"]`);
      if (existing) {
        existing.remove();
      }
    });
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
    const summaryDaysCount = summary ? summary.querySelector('[data-summary-days-count]') : null;
    const summaryTotalAmount = summary ? summary.querySelector('[data-summary-total-amount]') : null;
    const priceDisplay = form.querySelector('[data-total-display]');
    const quantityError = form.querySelector('#quantityError, [data-quantity-error]');
    const dateError = form.querySelector('#dateError, [data-date-error]');
    const paypalMessage = form.querySelector('[data-paypal-message]');
    const paypalButtons = form.querySelector('[data-paypal-buttons]');
    const paypalStatus = form.querySelector('[data-paypal-status]');
    const infoButton = form.querySelector('[data-info-only]');
    const feedback = form.querySelector('[data-feedback]');

    let currentState = {
      offer: '',
      total: null,
      days: null,
      readyForPayPal: false
    };

    function showElement(element, shouldShow) {
      if (!element) {
        return;
      }
      element.classList.toggle('d-none', !shouldShow);
      element.querySelectorAll('input, select, textarea').forEach((input) => {
        if (shouldShow) {
          input.removeAttribute('disabled');
        } else {
          input.setAttribute('disabled', 'disabled');
          if (input.type === 'number') {
            input.value = input.value || '0';
          }
        }
      });
    }

    function showStatus(message, tone = 'muted') {
      if (!paypalStatus) {
        return;
      }
      const classMap = {
        muted: 'text-muted',
        info: 'text-info',
        success: 'text-success',
        error: 'text-danger'
      };
      paypalStatus.textContent = message || '';
      paypalStatus.classList.remove('text-muted', 'text-info', 'text-success', 'text-danger');
      paypalStatus.classList.add(classMap[tone] || 'text-muted');
    }

    function showFeedback(message, tone = 'info') {
      if (!feedback) {
        return;
      }
      feedback.textContent = message || '';
      feedback.className = '';
      feedback.classList.add('mt-3');
      if (!message) {
        return;
      }
      const toneClass = {
        info: 'text-info',
        success: 'text-success',
        error: 'text-danger'
      };
      feedback.classList.add(toneClass[tone] || 'text-info');
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

    function validateQuantity(offer) {
      if (!quantityInput) {
        return true;
      }
      const rawValue = Number.parseInt(quantityInput.value, 10);
      const quantity = Number.isNaN(rawValue) ? 0 : rawValue;
      let message = '';

      if (!offer) {
        setQuantityValidity('');
        return false;
      }

      if (offer === 'location_sans' || offer === 'location_avec') {
        if (quantity < 1) {
          message = quantityInput.dataset.msgMinRental || '';
        }
      } else if (offer === 'achat') {
        if (quantity < (OFFER_CONFIG.achat.minQuantity || 50)) {
          message = quantityInput.dataset.msgMinCustom || '';
        }
      } else if (offer === 'abonnement') {
        if (quantity < 1) {
          message = quantityInput.dataset.msgMinSubscription || '';
        } else if (quantity > (OFFER_CONFIG.abonnement.maxQuantity || 50)) {
          message = quantityInput.dataset.msgMaxSubscription || '';
        }
      } else {
        if (quantity < 0) {
          message = quantityInput.dataset.msgMinRental || '';
        }
      }

      setQuantityValidity(message);
      return !message;
    }

    function validateDates(offer) {
      if (!startInput || !endInput) {
        return true;
      }
      if (offer !== 'location_sans' && offer !== 'location_avec') {
        setDateValidity('');
        return true;
      }
      if (!startInput.value || !endInput.value) {
        setDateValidity(startInput.dataset.msgMissing || endInput.dataset.msgMissing || form.querySelector('[data-msg-missing]')?.dataset.msgMissing || '');
        return false;
      }
      const days = computeInclusiveDays(startInput.value, endInput.value);
      if (days === null) {
        setDateValidity(startInput.dataset.msgMissing || endInput.dataset.msgMissing || form.querySelector('[data-msg-missing]')?.dataset.msgMissing || '');
        return false;
      }
      if (days === -1) {
        const rangeMessage = startInput.dataset.msgRange || endInput.dataset.msgRange || form.querySelector('[data-msg-range]')?.dataset.msgRange || '';
        setDateValidity(rangeMessage);
        return false;
      }
      setDateValidity('');
      return true;
    }

    function renderSummary(days, total) {
      if (!summary) {
        return;
      }
      if (typeof days === 'number' && typeof total === 'number') {
        summary.classList.remove('d-none');
        if (summaryDaysCount) {
          const singular = summary.dataset.daySingular || 'jour';
          const plural = summary.dataset.dayPlural || 'jours';
          const label = days > 1 ? plural : singular;
          summaryDaysCount.textContent = `${days} ${label}`;
        }
        if (summaryTotalAmount) {
          summaryTotalAmount.textContent = formatCurrency(locale, total, currency);
        }
      } else {
        summary.classList.add('d-none');
      }
    }

    function renderPrice(total, offer) {
      if (!priceDisplay) {
        return;
      }
      if (typeof total === 'number' && total > 0) {
        const template = priceDisplay.dataset.template || '{price}';
        priceDisplay.textContent = template.replace('{price}', formatCurrency(locale, total, currency));
      } else if (offer === 'special_event') {
        priceDisplay.textContent = form.dataset.customMessage || '';
      } else if (offer) {
        priceDisplay.textContent = form.dataset.paypalInvalid || '';
      } else {
        priceDisplay.textContent = '';
      }
    }

    let currentButtonsInstance = null;

    function teardownButtons() {
      if (paypalButtons) {
        paypalButtons.innerHTML = '';
      }
      if (currentButtonsInstance && typeof currentButtonsInstance.close === 'function') {
        try {
          currentButtonsInstance.close();
        } catch (error) {
          // ignore teardown errors
        }
      }
      currentButtonsInstance = null;
    }

    function renderPayPal(total, offer) {
      const amountNumber = typeof total === 'number' && total > 0 ? Number((Math.round(total * 100) / 100).toFixed(2)) : null;
      if (!paypalButtons) {
        return;
      }

      if (!amountNumber) {
        teardownButtons();
        if (paypalMessage) {
          paypalMessage.innerHTML = '';
          paypalMessage.setAttribute('data-pp-amount', '0.00');
        }
        const idleMessage = offer === 'special_event' ? (form.dataset.customMessage || '') : (form.dataset.paypalInvalid || '');
        showStatus(idleMessage, 'muted');
        return;
      }

      waitForPayPal()
        .then((sdk) => {
          if (paypalMessage) {
            paypalMessage.innerHTML = '';
            paypalMessage.setAttribute('data-pp-amount', amountNumber.toFixed(2));
            try {
              sdk.Messages({ amount: amountNumber.toFixed(2) }).render(paypalMessage);
            } catch (error) {
              // ignore render errors
            }
          }

          teardownButtons();
          const prettyAmount = formatCurrency(locale, amountNumber, currency);
          const readyTemplate = form.dataset.paypalReady || '';
          if (readyTemplate) {
            showStatus(readyTemplate.replace('{amount}', prettyAmount), 'info');
          } else {
            showStatus(prettyAmount, 'info');
          }

          currentButtonsInstance = sdk.Buttons({
            style: { layout: 'vertical' },
            onClick: function onClick(_, actions) {
              clearMetaFields(form);
              const offerValue = offerSelect ? offerSelect.value : '';
              const quantityValid = validateQuantity(offerValue);
              const datesValid = validateDates(offerValue);
              const baseValid = form.checkValidity();
              if (!quantityValid || !datesValid || !baseValid) {
                form.reportValidity();
                return actions.reject();
              }
              showStatus(form.dataset.paypalProcessing || '', 'info');
              return actions.resolve();
            },
            createOrder: function createOrder(_, actions) {
              return actions.order.create({
                purchase_units: [
                  {
                    description: form.dataset.paypalDescription || 'SecurityNoPhone Order',
                    amount: {
                      currency_code: currency,
                      value: amountNumber.toFixed(2)
                    }
                  }
                ]
              });
            },
            onApprove: function onApprove(data, actions) {
              showStatus(form.dataset.paypalProcessing || '', 'info');
              return actions.order.capture().then((details) => {
                const payerEmail = details && details.payer ? details.payer.email_address || '' : '';
                clearMetaFields(form);
                addHiddenInput(form, 'paypal_order_id', data.orderID || '');
                addHiddenInput(form, 'paypal_payer_email', payerEmail);
                addHiddenInput(form, 'paypal_amount', amountNumber.toFixed(2));
                addHiddenInput(form, 'payment_status', 'paid');
                addHiddenInput(form, 'submission_type', 'paypal');
                showStatus(form.dataset.paypalSuccess || '', 'success');
                form.submit();
              });
            },
            onCancel: function onCancel() {
              showStatus(form.dataset.paypalCancel || '', 'muted');
            },
            onError: function onError() {
              showStatus(form.dataset.paypalError || '', 'error');
            }
          });

          if (currentButtonsInstance) {
            currentButtonsInstance.render(paypalButtons).catch(() => {
              showStatus(form.dataset.paypalError || '', 'error');
            });
          }
        })
        .catch(() => {
          teardownButtons();
          showStatus(form.dataset.paypalError || '', 'error');
        });
    }

    function refreshState() {
      const offer = offerSelect ? offerSelect.value : '';
      const config = offer ? OFFER_CONFIG[offer] : null;
      showElement(rentalFields, offer === 'location_sans' || offer === 'location_avec');
      showElement(staffFields, offer === 'location_avec');

      const quantityValid = validateQuantity(offer);
      const datesValid = validateDates(offer);

      let total = null;
      let days = null;

      if (config) {
        if (config.type === 'rental') {
          if (datesValid) {
            days = computeInclusiveDays(startInput.value, endInput.value);
            if (typeof days === 'number' && days > 0) {
              total = config.dailyRate * days;
              if (offer === 'location_avec' && staffInput) {
                const staffRaw = Number.parseInt(staffInput.value, 10);
                const staffQty = Number.isNaN(staffRaw) ? 0 : clampMin(staffRaw, 0);
                staffInput.value = staffQty.toString();
                total += staffQty * (config.staffDailyRate || 0) * days;
              }
            }
          }
        } else if (config.type === 'purchase') {
          const qty = Number.parseInt(quantityInput.value, 10);
          if (!Number.isNaN(qty) && qty >= (config.minQuantity || 0)) {
            total = qty * (config.unitPrice || 0);
          }
        } else if (config.type === 'subscription') {
          const qty = clampMin(Number.parseInt(quantityInput.value, 10) || 0, 0);
          if (qty > 0) {
            const effectiveMax = config.maxQuantity || qty;
            const effectiveQty = qty > effectiveMax ? effectiveMax : qty;
            const packSize = clampMin(config.packSize || 50, 1);
            const packs = Math.max(1, Math.ceil(effectiveQty / packSize));
            total = packs * (config.pricePerPack || 0);
          }
        } else if (config.type === 'custom') {
          total = null;
        }
      }

      const readyForPayPal = Boolean(
        config && config.type !== 'custom' && quantityValid && datesValid && typeof total === 'number' && total > 0
      );

      renderPrice(total, offer);
      renderSummary(config && config.type === 'rental' ? days : null, total);
      currentState = { offer, total: typeof total === 'number' ? total : null, days, readyForPayPal };
      renderPayPal(currentState.total, offer);
    }

    if (offerSelect) {
      offerSelect.addEventListener('change', refreshState);
    }
    if (quantityInput) {
      quantityInput.addEventListener('input', refreshState);
    }
    if (startInput) {
      startInput.addEventListener('change', refreshState);
    }
    if (endInput) {
      endInput.addEventListener('change', refreshState);
    }
    if (staffInput) {
      staffInput.addEventListener('input', refreshState);
    }

    if (infoButton) {
      infoButton.addEventListener('click', (event) => {
        event.preventDefault();
        const offer = offerSelect ? offerSelect.value : '';
        const quantityValid = validateQuantity(offer);
        const datesValid = validateDates(offer);
        const baseValid = form.checkValidity();
        if (!quantityValid || !datesValid || !baseValid) {
          form.reportValidity();
          return;
        }
        clearMetaFields(form);
        const amount = typeof currentState.total === 'number' ? currentState.total : 0;
        addHiddenInput(form, 'paypal_amount', amount > 0 ? amount.toFixed(2) : '0.00');
        addHiddenInput(form, 'payment_status', 'unpaid');
        addHiddenInput(form, 'submission_type', 'info_only');
        showFeedback('', 'info');
        form.submit();
      });
    }

    refreshState();
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-order-form]').forEach(initOrderForm);
  });
})();
