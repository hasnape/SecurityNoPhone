(function () {
  const SDK_URL = 'https://www.paypal.com/sdk/js';
  const DEFAULT_COMPONENTS = 'buttons,messages';
  const DEFAULT_CURRENCY = 'EUR';
  let sdkPromise = null;

  function loadSdk(options) {
    const clientId = options.clientId;
    const currency = options.currency || DEFAULT_CURRENCY;
    const components = options.components || DEFAULT_COMPONENTS;
    if (!clientId) {
      return Promise.reject(new Error('PayPal client ID is required.'));
    }

    if (window.paypal) {
      return Promise.resolve(window.paypal);
    }

    if (!sdkPromise) {
      sdkPromise = new Promise((resolve, reject) => {
        const existing = document.querySelector('script[data-paypal-sdk="true"]');
        if (existing) {
          existing.addEventListener('load', () => resolve(window.paypal));
          existing.addEventListener('error', () => reject(new Error('Unable to load PayPal SDK.')));
          return;
        }

        const script = document.createElement('script');
        const url = new URL(SDK_URL);
        url.searchParams.set('client-id', clientId);
        url.searchParams.set('currency', currency);
        url.searchParams.set('components', components);
        url.searchParams.set('enable-funding', 'paylater,card');
        script.src = url.toString();
        script.async = true;
        script.defer = true;
        script.dataset.paypalSdk = 'true';
        script.addEventListener('load', () => {
          if (window.paypal) {
            resolve(window.paypal);
          } else {
            reject(new Error('PayPal SDK loaded without paypal namespace.'));
          }
        });
        script.addEventListener('error', () => reject(new Error('Unable to load PayPal SDK.')));
        document.head.appendChild(script);
      });
    }

    return sdkPromise;
  }

  function formatAmount(amount) {
    if (typeof amount !== 'number' || Number.isNaN(amount) || amount <= 0) {
      return null;
    }
    return (Math.round(amount * 100) / 100).toFixed(2);
  }

  function setupForm(form) {
  function loadPayPalSdk(options) {
    const clientId = options.clientId;
    const currency = options.currency;
    const intent = options.intent || DEFAULT_INTENT;
    const components = options.components || 'buttons,messages';
    const namespace = options.namespace || null;
    const requestedComponents = String(components)
      .split(',')
      .map(part => part.trim().toLowerCase())
      .filter(Boolean);
    const requiresMessages = requestedComponents.includes('messages');

    return new Promise((resolve, reject) => {
      if (window.paypal) {
        if (!requiresMessages || typeof window.paypal.Messages === 'function') {
          resolve(window.paypal);
          return;
        }
      }

      const existingScript = document.querySelector('script[data-paypal-sdk]');
      if (existingScript) {
        const existingComponents = String(existingScript.dataset.paypalComponents || '')
          .split(',')
          .map(part => part.trim().toLowerCase())
          .filter(Boolean);
        const existingHasMessages = existingComponents.includes('messages');
        if (!requiresMessages || existingHasMessages) {
          existingScript.addEventListener('load', () => resolve(window.paypal));
          existingScript.addEventListener('error', () => reject(new Error('Failed to load PayPal SDK')));
          return;
        }
      }

      const script = document.createElement('script');
      script.id = PAYPAL_SCRIPT_ID;
      const url = new URL('https://www.paypal.com/sdk/js');
      url.searchParams.set('client-id', clientId);
      url.searchParams.set('currency', currency);
      url.searchParams.set('intent', intent);
      if (components) {
        url.searchParams.set('components', components);
      }
      script.src = url.toString();
      script.async = true;
      script.dataset.paypalSdk = 'true';
      script.dataset.paypalClientId = clientId;
      script.dataset.paypalCurrency = currency;
      script.dataset.paypalIntent = intent;
      script.dataset.paypalComponents = components;
      if (namespace) {
        script.dataset.paypalNamespace = namespace;
        script.setAttribute('data-namespace', namespace);
      }
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
    const currency = (container.dataset.currency || DEFAULT_CURRENCY).toUpperCase();
    const components = container.dataset.components || DEFAULT_COMPONENTS;
    if (!clientId) {
      console.warn('PayPal client ID is missing for this order form.');
      return;
    }

    const currency = (container.dataset.currency || 'EUR').toUpperCase();
    const intent = (container.dataset.intent || DEFAULT_INTENT).toUpperCase();
    const components = container.dataset.components || 'buttons,messages';
    const namespace = container.dataset.namespace || null;
    const description = container.dataset.description || 'SecurityNoPhone Order';
    const autoSubmit = container.dataset.autoSubmit !== 'false';

    const status = document.createElement('div');
    status.className = 'paypal-status-message small text-muted mt-2';
    container.appendChild(status);

    const messageElement = form.querySelector('[data-paypal-message]');
    let messageComponent = null;
    let latestState = form.__orderState || { total: null, isReady: false };
    let buttonsInstance = null;
    let buttonsActions = null;
    if (container.dataset.messageInvalid) {
      setStatus(container.dataset.messageInvalid, 'muted');
    }

    ['paypal_order_id', 'paypal_payer_email', 'payment_method'].forEach(name => removeHiddenInput(form, name));

    let state = form.__orderState || { total: null, isReady: false };
    let buttonActions = null;
    const messageElement = form.querySelector('[data-paypal-message]');
    let messageComponent = null;
    let pendingMessageAmount = null;

    function setStatus(message, tone = 'muted') {
      status.textContent = message || '';
      status.classList.remove('text-danger', 'text-success', 'text-info', 'text-muted');
      const map = { error: 'text-danger', success: 'text-success', info: 'text-info', muted: 'text-muted' };
      status.classList.add(map[tone] || 'text-muted');
    }

    function updateHidden(name, value) {
      let input = form.querySelector(`input[name="${name}"]`);
      if (!input) {
        input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        form.appendChild(input);
      }
      input.value = value || '';
    }

    function clearHidden() {
      ['paypal_order_id', 'paypal_payer_email', 'payment_method'].forEach(name => {
        const input = form.querySelector(`input[name="${name}"]`);
        if (input) {
          input.remove();
        }
      });
    }

    function updateButtonsState() {
      if (!buttonsActions) {
        return;
      }
      if (latestState && latestState.isReady && typeof latestState.total === 'number' && latestState.total > 0) {
        buttonsActions.enable();
        const readyTemplate = container.dataset.messageReady || 'Montant estimé : {amount}';
        const formattedAmount = new Intl.NumberFormat(form.dataset.locale || 'fr-FR', {
          style: 'currency',
          currency
        }).format(latestState.total);
        setStatus(readyTemplate.replace('{amount}', formattedAmount));
      } else {
        buttonsActions.disable();
        setStatus(container.dataset.messageInvalid || 'Complétez le formulaire pour activer PayPal.');
      }
    }

    function renderMessage() {
      if (!messageElement) {
    function renderPayPalMessage() {
      if (!messageElement || !pendingMessageAmount) {
        return;
      }
      if (!window.paypal || typeof window.paypal.Messages !== 'function') {
        return;
      }
      try {
        messageElement.innerHTML = '';
        messageComponent = window.paypal.Messages({
          amount: pendingMessageAmount,
          placement: messageElement.dataset.ppPlacement || undefined
        });
        const renderResult = messageComponent.render(messageElement);
        if (renderResult && typeof renderResult.catch === 'function') {
          renderResult.catch(() => {
            messageComponent = null;
          });
        }
      } catch (error) {
        console.warn('Unable to render PayPal message:', error);
        messageComponent = null;
      }
    }

    function updatePayPalMessage(currentState) {
      if (!messageElement) {
        return;
      }

      const hasAmount = currentState && typeof currentState.total === 'number' && currentState.total > 0;
      if (!hasAmount) {
        messageElement.removeAttribute('data-pp-amount');
        pendingMessageAmount = null;
        if (messageComponent && typeof messageComponent.remove === 'function') {
          try {
            messageComponent.remove();
          } catch (error) {
            console.warn('Unable to remove PayPal message component:', error);
          }
        }
        messageElement.innerHTML = '';
        messageComponent = null;
        return;
      }

      const formattedAmount = formatAmountForPayPal(currentState.total);
      pendingMessageAmount = formattedAmount;
      messageElement.setAttribute('data-pp-amount', formattedAmount);

      if (messageComponent && typeof messageComponent.update === 'function') {
        messageComponent.update({ amount: formattedAmount }).catch(() => {
          messageComponent = null;
          renderPayPalMessage();
        });
      } else {
        renderPayPalMessage();
      }
    }

    function syncButtonState() {
      if (!buttonActions) {
        return;
      }
      if (!window.paypal || typeof window.paypal.Messages !== 'function') {
        return;
      }

      const formatted = formatAmount(latestState.total);
      if (!formatted) {
        if (messageComponent && typeof messageComponent.remove === 'function') {
          messageComponent.remove();
        }
        messageElement.innerHTML = '';
        messageComponent = null;
        return;
      }

      messageElement.setAttribute('data-pp-amount', formatted);
      try {
        if (messageComponent && typeof messageComponent.update === 'function') {
          messageComponent.update({ amount: formatted });
        } else {
          messageElement.innerHTML = '';
          messageComponent = window.paypal.Messages({ amount: formatted, placement: messageElement.dataset.ppPlacement || undefined });
          const renderPromise = messageComponent.render(messageElement);
          if (renderPromise && typeof renderPromise.catch === 'function') {
            renderPromise.catch(() => { messageComponent = null; });
          }
        }
      } catch (error) {
        console.warn('Unable to render PayPal message', error);
        messageComponent = null;
      }
    }

    form.addEventListener('order:state-change', event => {
      if (event.detail) {
        latestState = event.detail;
      }
      updateButtonsState();
      renderMessage();
    });

    loadSdk({ clientId, currency, components })
      .then(paypal => {
        renderMessage();
        buttonsInstance = paypal.Buttons({
      syncButtonState();
      updatePayPalMessage(state);
    });

    updatePayPalMessage(state);

    loadPayPalSdk({ clientId, currency, intent, components, namespace })
      .then(paypal => {
        updatePayPalMessage(state);
        const buttons = paypal.Buttons({
          style: {
            layout: container.dataset.layout || 'vertical',
            color: container.dataset.color || 'gold',
            shape: container.dataset.shape || 'rect',
            label: container.dataset.label || 'paypal'
          },
          onInit(_data, actions) {
            buttonsActions = actions;
            updateButtonsState();
          },
          onClick(_data, actions) {
            if (!latestState || !latestState.isReady || typeof latestState.total !== 'number' || latestState.total <= 0) {
              setStatus(container.dataset.messageInvalid || 'Complétez le formulaire pour activer PayPal.', 'error');
              return actions.reject();
            }
            setStatus(container.dataset.messageProcessing || 'Paiement en cours...', 'info');
            return true;
          },
          createOrder(_data, actions) {
            const formatted = formatAmount(latestState.total);
            if (!formatted) {
              throw new Error('Montant invalide.');
            }
            return actions.order.create({
              purchase_units: [
                {
                  amount: {
                    currency_code: currency,
                    value: formatted
                  },
                  description
                }
              ]
            });
          },
          onApprove(_data, actions) {
            setStatus(container.dataset.messageProcessing || 'Paiement en cours...', 'info');
            buttonsActions && buttonsActions.disable();
            return actions.order.capture().then(details => {
              updateHidden('paypal_order_id', details.id || '');
              updateHidden('paypal_payer_email', details?.payer?.email_address || '');
              updateHidden('payment_method', 'paypal');
              setStatus(container.dataset.messageSuccess || 'Paiement confirmé. Nous traitons votre commande.', 'success');
              if (autoSubmit) {
                if (typeof form.requestSubmit === 'function') {
                  form.requestSubmit();
                } else {
                  form.submit();
                }
              } else {
                updateButtonsState();
              }
            }).catch(error => {
              console.error('PayPal capture failed', error);
              setStatus(container.dataset.messageError || 'Le paiement via PayPal a échoué. Veuillez réessayer.', 'error');
              clearHidden();
              buttonsActions && buttonsActions.enable();
            });
          },
          onCancel() {
            setStatus(container.dataset.messageCancelled || 'Paiement PayPal annulé.', 'muted');
            clearHidden();
            updateButtonsState();
          },
          onError(error) {
            console.error('PayPal Buttons error', error);
            setStatus(container.dataset.messageError || 'Le paiement via PayPal a échoué. Veuillez réessayer.', 'error');
            clearHidden();
            updateButtonsState();
          }
        });

        if (buttonsInstance.isEligible()) {
          buttonsInstance.render(container);
        } else {
          setStatus(container.dataset.messageIneligible || 'PayPal n’est pas disponible pour cette commande.', 'error');
        }
      })
      .catch(error => {
        console.error('PayPal SDK initialization failed', error);
        setStatus(container.dataset.messageUnavailable || 'PayPal est indisponible pour le moment. Merci de réessayer plus tard.', 'error');
      });
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-order-form]').forEach(setupForm);
  });
})();
