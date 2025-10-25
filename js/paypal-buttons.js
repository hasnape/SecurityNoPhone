(function () {
  const DEFAULT_MESSAGES = {
    invalid: 'Complete the form to enable PayPal checkout.',
    processing: 'Processing payment...',
    success: 'PayPal payment completed successfully. Your order has been sent.',
    error: 'Unable to process the PayPal payment. Please try again.',
    cancelled: 'PayPal payment cancelled.',
    unavailable: 'PayPal is currently unavailable. Please try again later.',
    ineligible: 'PayPal checkout is not available for this order.'
  };
  const PAYPAL_SCRIPT_ID = 'paypal-sdk';
  const DEFAULT_INTENT = 'CAPTURE';

  function ensureHiddenInput(form, name) {
    let input = form.querySelector(`input[name="${name}"]`);
    if (!input) {
      input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      form.appendChild(input);
    }
    return input;
  }

  function removeHiddenInput(form, name) {
    const input = form.querySelector(`input[name="${name}"]`);
    if (input) {
      input.remove();
    }
  }

  function setHiddenValue(form, name, value) {
    const input = ensureHiddenInput(form, name);
    input.value = value || '';
  }

  function submitForm(form) {
    if (typeof form.requestSubmit === 'function') {
      form.requestSubmit();
    } else {
      form.submit();
    }
  }

  function formatAmountForPayPal(amount) {
    if (typeof amount !== 'number' || Number.isNaN(amount)) {
      return '0.00';
    }
    return (Math.round(amount * 100) / 100).toFixed(2);
  }

  function createCurrencyFormatter(locale, currency) {
    try {
      const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency });
      return value => formatter.format(value);
    } catch (error) {
      console.warn('Unable to create currency formatter:', error);
      return value => `${formatAmountForPayPal(typeof value === 'number' ? value : 0)} ${currency}`;
    }
  }

  function loadPayPalSdk(options) {
    const clientId = options.clientId;
    const currency = options.currency;
    const intent = options.intent || DEFAULT_INTENT;

    return new Promise((resolve, reject) => {
      if (window.paypal) {
        resolve(window.paypal);
        return;
      }

      const existingScript = document.querySelector('script[data-paypal-sdk]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(window.paypal));
        existingScript.addEventListener('error', () => reject(new Error('Failed to load PayPal SDK')));
        return;
      }

      const script = document.createElement('script');
      script.id = PAYPAL_SCRIPT_ID;
      script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${encodeURIComponent(currency)}&intent=${encodeURIComponent(intent)}`;
      script.async = true;
      script.dataset.paypalSdk = 'true';
      script.dataset.paypalClientId = clientId;
      script.dataset.paypalCurrency = currency;
      script.dataset.paypalIntent = intent;
      script.addEventListener('load', () => {
        if (window.paypal) {
          resolve(window.paypal);
        } else {
          reject(new Error('PayPal SDK loaded but the paypal namespace is unavailable.'));
        }
      });
      script.addEventListener('error', () => reject(new Error('Failed to load PayPal SDK script.')));
      document.head.appendChild(script);
    });
  }

  function isFormReady(state) {
    return Boolean(state && state.isReady && typeof state.total === 'number' && state.total > 0);
  }

  function setupPayPalIntegration(form) {
    const container = form.querySelector('[data-paypal-container]');
    if (!container) {
      return;
    }

    const clientId = container.dataset.clientId || form.dataset.paypalClientId;
    if (!clientId) {
      console.warn('PayPal client ID is missing for this order form.');
      return;
    }

    const currency = (container.dataset.currency || 'EUR').toUpperCase();
    const intent = (container.dataset.intent || DEFAULT_INTENT).toUpperCase();
    const description = container.dataset.description || 'SecurityNoPhone Order';
    const autoSubmit = container.dataset.autoSubmit !== 'false';
    const locale = form.dataset.locale || document.documentElement.lang || 'en-US';
    const formatCurrency = createCurrencyFormatter(locale, currency);

    container.classList.add('paypal-integration');

    const buttonWrapper = document.createElement('div');
    buttonWrapper.className = 'paypal-buttons-wrapper';
    container.appendChild(buttonWrapper);

    const status = document.createElement('div');
    status.className = 'paypal-status-message small text-muted mt-2';
    container.appendChild(status);

    if (container.dataset.messageInvalid) {
      setStatus(container.dataset.messageInvalid, 'muted');
    }

    ['paypal_order_id', 'paypal_payer_email', 'payment_method'].forEach(name => removeHiddenInput(form, name));

    let state = form.__orderState || { total: null, isReady: false };
    let buttonActions = null;

    function setStatus(message, tone = 'muted') {
      const tones = ['text-danger', 'text-success', 'text-info', 'text-muted'];
      tones.forEach(cls => status.classList.remove(cls));

      let className = 'text-muted';
      if (tone === 'error') {
        className = 'text-danger';
      } else if (tone === 'success') {
        className = 'text-success';
      } else if (tone === 'info') {
        className = 'text-info';
      }

      status.classList.add(className);
      status.textContent = message || '';
    }

    function applyReadyMessage(currentState) {
      const template = container.dataset.messageReady;
      if (!template || typeof currentState.total !== 'number') {
        return;
      }
      const formatted = formatCurrency(currentState.total);
      setStatus(template.replace('{amount}', formatted), 'muted');
    }

    function syncButtonState() {
      if (!buttonActions) {
        return;
      }
      if (isFormReady(state)) {
        buttonActions.enable();
        applyReadyMessage(state);
      } else {
        buttonActions.disable();
        if (container.dataset.messageInvalid) {
          setStatus(container.dataset.messageInvalid, 'muted');
        } else {
          setStatus('', 'muted');
        }
      }
    }

    form.addEventListener('order:state-change', event => {
      if (event.detail) {
        state = event.detail;
      }
      syncButtonState();
    });

    loadPayPalSdk({ clientId, currency, intent })
      .then(paypal => {
        const buttons = paypal.Buttons({
          style: {
            layout: container.dataset.layout || 'vertical',
            color: container.dataset.color || 'gold',
            shape: container.dataset.shape || 'rect',
            label: container.dataset.label || 'paypal'
          },
          onInit(data, actions) {
            buttonActions = actions;
            syncButtonState();
          },
          onClick(data, actions) {
            if (!isFormReady(state)) {
              if (container.dataset.messageInvalid) {
                setStatus(container.dataset.messageInvalid, 'error');
              } else {
                setStatus(DEFAULT_MESSAGES.invalid, 'error');
              }
              if (typeof actions.reject === 'function') {
                return actions.reject();
              }
              return false;
            }
            setStatus(container.dataset.messageProcessing || DEFAULT_MESSAGES.processing, 'info');
            return true;
          },
          createOrder(data, actions) {
            const totalValue = isFormReady(state) ? state.total : 0;
            return actions.order.create({
              purchase_units: [
                {
                  amount: {
                    currency_code: currency,
                    value: formatAmountForPayPal(totalValue)
                  },
                  description
                }
              ]
            });
          },
          onApprove(data, actions) {
            setStatus(container.dataset.messageProcessing || DEFAULT_MESSAGES.processing, 'info');
            if (buttonActions && typeof buttonActions.disable === 'function') {
              buttonActions.disable();
            }
            return actions.order.capture()
              .then(details => {
                setHiddenValue(form, 'paypal_order_id', details.id || data.orderID || '');
                setHiddenValue(form, 'paypal_payer_email', details?.payer?.email_address || '');
                setHiddenValue(form, 'payment_method', 'paypal');
                setStatus(container.dataset.messageSuccess || DEFAULT_MESSAGES.success, 'success');
                if (autoSubmit) {
                  submitForm(form);
                } else {
                  syncButtonState();
                }
              })
              .catch(error => {
                console.error('PayPal capture failed:', error);
                setStatus(container.dataset.messageError || DEFAULT_MESSAGES.error, 'error');
                ['paypal_order_id', 'paypal_payer_email', 'payment_method'].forEach(name => removeHiddenInput(form, name));
                if (buttonActions && typeof buttonActions.enable === 'function') {
                  buttonActions.enable();
                }
                syncButtonState();
              });
          },
          onCancel() {
            setStatus(container.dataset.messageCancelled || DEFAULT_MESSAGES.cancelled, 'muted');
            ['paypal_order_id', 'paypal_payer_email', 'payment_method'].forEach(name => removeHiddenInput(form, name));
            syncButtonState();
          },
          onError(error) {
            console.error('PayPal Buttons error:', error);
            setStatus(container.dataset.messageError || DEFAULT_MESSAGES.error, 'error');
            ['paypal_order_id', 'paypal_payer_email', 'payment_method'].forEach(name => removeHiddenInput(form, name));
            syncButtonState();
          }
        });

        if (buttons.isEligible()) {
          buttons.render(buttonWrapper);
        } else {
          setStatus(container.dataset.messageIneligible || DEFAULT_MESSAGES.ineligible, 'error');
        }
      })
      .catch(error => {
        console.error('Failed to initialise PayPal:', error);
        setStatus(container.dataset.messageUnavailable || DEFAULT_MESSAGES.unavailable, 'error');
      });
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-order-form]').forEach(setupPayPalIntegration);
  });
})();
