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
    // Custom rentals retain quote-only pouch pricing; no tier is inferred from the fixed packs.
    location_particulier: { type: 'custom_event' },
    location_pro: { type: 'custom_professional' },
    achat: { type: 'purchase', minQuantity: 50 },
    special_event: { type: 'custom' }
  });
  const NOTICE_DAYS = 30;
  const DEPOSIT_PER_POUCH = 1.50;
  const AGENT_DAY_RATE = 100; // EUR per agent per on-site day, up to 7 hours (flat fee).
  const MAX_AGENT_HOURS = 7;

  function calculateAgentCharge(agentCount, interventionDays) {
    if (!Number.isInteger(agentCount) || agentCount < 1 || agentCount > 20 ||
        !Number.isInteger(interventionDays) || interventionDays < 1 || interventionDays > 365) {
      return null;
    }
    return agentCount * interventionDays * AGENT_DAY_RATE;
  }

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
    const customQuantityHint = form.querySelector('[data-custom-quantity-hint]');
    const targetGroup = form.querySelector('[data-event-purchase-date]');
    const targetInput = form.querySelector('[data-requested-date]');
    const targetError = form.querySelector('[data-requested-date-error]');
    const rentalGroup = form.querySelector('[data-rental-fields]');
    const startInput = form.querySelector('[data-start-date]');
    const endInput = form.querySelector('[data-end-date]');
    const dateError = form.querySelector('#dateError');
    const quantityError = form.querySelector('#quantityError');
    const agentGroup = form.querySelector('[data-agent-options]');
    const rentalModeGroup = form.querySelector('[data-rental-mode-group]');
    const rentalMode = form.querySelector('[data-rental-mode]');
    const simulationHint = form.querySelector('[data-simulation-hint]');
    const packBaseHidden = form.querySelector('[data-pack-base-value]');
    const agentRateHidden = form.querySelector('[data-agent-rate-value]');
    const agentChargeHidden = form.querySelector('[data-agent-charge-value]');
    const agentExtrasHidden = form.querySelector('[data-agent-extras-value]');
    const agentCountInput = form.querySelector('[data-agent-count]');
    const agentDaysInput = form.querySelector('[data-agent-days]');
    const agentHoursInput = form.querySelector('[data-agent-hours]');
    const agentZoneInput = form.querySelector('[data-agent-zone]');
    const agentCityInput = form.querySelector('[data-agent-city]');
    const lodgingInput = form.querySelector('#lodgingRequired');
    const outsideLyonFields = form.querySelector('[data-outside-lyon-fields]');
    const summaryDaysCount = form.querySelector('[data-summary-days-count]');
    const summaryBase = form.querySelector('[data-summary-base]');
    const summaryAgents = form.querySelector('[data-summary-extra-agents]');
    const summaryTravel = form.querySelector('[data-summary-travel]');
    const summaryLodging = form.querySelector('[data-summary-lodging]');
    const summaryCaution = form.querySelector('[data-summary-caution]');
    const summaryTotal = form.querySelector('[data-summary-total-amount]');
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

      if (offer.type === 'professional' || offer.type === 'custom_professional') {
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
      const professional = offer?.type === 'professional' || offer?.type === 'custom_professional';
      const customRental = offer?.type === 'custom_event' || offer?.type === 'custom_professional';
      const dated = !!offer && !professional;
      showElement(rentalGroup, professional);
      showElement(targetGroup, dated);
      const eligibleRental = offer?.type === 'event' || professional || customRental;
      showElement(rentalModeGroup, eligibleRental);
      if (customQuantityHint) customQuantityHint.classList.toggle('d-none', !customRental);
      const withAgent = offer?.type === 'custom' || (eligibleRental && rentalMode?.value === 'avec');
      showElement(agentGroup, withAgent);
      if (startInput) startInput.required = professional;
      if (endInput) endInput.required = professional;
      if (targetInput) targetInput.required = dated;
      const outsideLyon = withAgent && agentZoneInput?.value === 'hors_lyon';
      showElement(outsideLyonFields, outsideLyon);
      if (agentCountInput) agentCountInput.required = withAgent;
      if (agentDaysInput) agentDaysInput.required = withAgent;
      if (agentHoursInput) agentHoursInput.required = withAgent;
      if (agentZoneInput) agentZoneInput.required = withAgent;
      if (agentCityInput) agentCityInput.required = withAgent;
      if (!outsideLyon && lodgingInput) lodgingInput.checked = false;
      if (summary) summary.classList.add('d-none');

      if (offerSelect?.value !== currentOffer) {
        currentOffer = offerSelect?.value || null;
        if (offer?.quantity && quantityInput) quantityInput.value = String(offer.quantity);
        else if (offer?.type === 'purchase' && quantityInput) quantityInput.value = '50';
        else if (customRental && quantityInput) quantityInput.value = '1';
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
        if (packBaseHidden) packBaseHidden.value = '';
        if (agentRateHidden) agentRateHidden.value = '';
        if (agentChargeHidden) agentChargeHidden.value = '';
        if (agentExtrasHidden) agentExtrasHidden.value = '';
        if (simulationHint) simulationHint.textContent = translate('order_simulation_pick',
          'Sélectionnez un pack pour afficher une estimation indicative.');
        if (cautionHidden) cautionHidden.value = '';
        if (replacementHidden) replacementHidden.value = '';
        return false;
      }

      const quantity = Number(quantityInput?.value);
      const quantityOk = validateQuantity(offer, quantity);
      const datesOk = validateDates(offer);
      const agentCount = Number(agentCountInput?.value);
      const interventionDays = Number(agentDaysInput?.value);
      const hoursPerDay = Number(agentHoursInput?.value);
      const agentCharge = withAgent ? calculateAgentCharge(agentCount, interventionDays) : 0;
      const agentValid = !withAgent || (
        agentCharge !== null && Number.isInteger(hoursPerDay) &&
        hoursPerDay >= 1 && hoursPerDay <= MAX_AGENT_HOURS &&
        ['lyon', 'hors_lyon'].includes(agentZoneInput?.value) &&
        Boolean(agentCityInput?.value.trim())
      );
      const valid = quantityOk && datesOk && agentValid;
      const caution = offer.type === 'event' || professional || customRental
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
      } else if (customRental) {
        // No public per-pouch rental rate for arbitrary quantities: only the caution
        // and optional staffed service can be estimated without a custom quote.
        label = translate('custom_rental_price_pending',
          'Location personnalisée : {quantity} pochettes. Tarif des pochettes sur devis (caution indicative à part).')
          .replace('{quantity}', String(quantity));
      } else if (offer.type === 'purchase') {
        total = quantity * purchaseUnitPrice(quantity);
        label = translate('booking_purchase_estimate',
          'Achat : {unit}/unité, total indicatif {total}, sur devis')
          .replace('{unit}', format(purchaseUnitPrice(quantity)))
          .replace('{total}', format(total));
      } else {
        label = translate('offer_quote_only', 'Sur devis, sans réservation immédiate.');
      }

      const pricedSubtotal = total !== null ? total + (agentCharge || 0) : null;
      if (withAgent && agentCharge !== null) {
        if (customRental) {
          label = translate('custom_rental_agent_price_pending',
            'Location de {quantity} pochettes : sur devis. Agents : {agents} (hors caution et éventuels frais de déplacement/logement).')
            .replace('{quantity}', String(quantity))
            .replace('{agents}', format(agentCharge));
        } else if (total !== null) {
          label = translate('booking_with_agent_subtotal',
            'Pack : {base} + agents : {agents} = {total} (hors caution, déplacements et hébergement éventuel).')
            .replace('{base}', format(total))
            .replace('{agents}', format(agentCharge))
            .replace('{total}', format(pricedSubtotal));
        } else {
          label = translate('booking_agent_service_only',
            'Agents : {agents}. Pochettes, matériel et options à confirmer sur devis.')
            .replace('{agents}', format(agentCharge));
        }
      } else if (withAgent) {
        label = translate('booking_agent_invalid', 'Indiquez un nombre valide d’agents et de journées.');
      }

      if (withAgent && agentCharge !== null && summary) {
        summary.classList.remove('d-none');
        if (summaryDaysCount) summaryDaysCount.textContent = String(interventionDays);
        if (summaryBase) summaryBase.textContent = total !== null
          ? format(total) : translate('agent_summary_quote', 'Sur devis');
        if (summaryAgents) summaryAgents.textContent = format(agentCharge);
        const agentRow = summary.querySelector('[data-summary-extra-agents-row]');
        const travelRow = summary.querySelector('[data-summary-travel-row]');
        const lodgingRow = summary.querySelector('[data-summary-lodging-row]');
        if (agentRow) agentRow.classList.remove('d-none');
        if (travelRow) travelRow.classList.toggle('d-none', !outsideLyon);
        if (lodgingRow) lodgingRow.classList.toggle('d-none', !outsideLyon);
        if (summaryTravel) summaryTravel.textContent = translate('agent_summary_quote', 'Sur devis');
        if (summaryLodging) summaryLodging.textContent = lodgingInput?.checked
          ? translate('agent_summary_quote', 'Sur devis')
          : translate('agent_summary_if_needed', 'Si nécessaire : sur devis');
        if (summaryCaution) summaryCaution.textContent = caution > 0
          ? format(caution) : translate('agent_summary_quote', 'Sur devis');
        if (summaryTotal) summaryTotal.textContent = pricedSubtotal !== null
          ? format(pricedSubtotal)
          : translate('agent_summary_just_staff', '{agents} d’agents, hors matériel sur devis')
              .replace('{agents}', format(agentCharge));
      }
      if (priceDisplay) priceDisplay.textContent = quantityOk ? label : '';
      if (simulationHint) simulationHint.textContent = !quantityOk
        ? translate('order_simulation_quantity', 'Corrigez la quantité pour simuler le pack.')
        : !agentValid
          ? translate('order_simulation_agent_incomplete',
            'Pour demander un agent, renseignez ses horaires, le nombre de journées et le lieu.')
        : !datesOk
          ? translate('order_simulation_dates', 'Simulation indicative : précisez une date éligible (J+30 minimum) pour envoyer la demande.')
          : translate('order_simulation_ready', 'Estimation indicative : montant et disponibilité définitifs soumis à devis.');
      if (cautionGroup) cautionGroup.classList.toggle('d-none', !quantityOk || caution <= 0);
      if (cautionDisplay && quantityOk && caution > 0) cautionDisplay.value = format(caution);
      if (packBaseHidden) packBaseHidden.value = valid && total != null ? total.toFixed(2) : '';
      if (agentRateHidden) agentRateHidden.value = valid && withAgent ? AGENT_DAY_RATE.toFixed(2) : '';
      if (agentChargeHidden) agentChargeHidden.value = valid && withAgent ? agentCharge.toFixed(2) : '';
      if (agentExtrasHidden) agentExtrasHidden.value = valid && withAgent && outsideLyon
        ? 'Déplacement en supplément, logement si nécessaire : sur devis' : '';
      // For professional contracts this is only a 3-month reference, not a final
      // total for arbitrarily longer requested periods. Quote determines final total.
      if (totalHidden) totalHidden.value = valid && pricedSubtotal !== null && offer.type !== 'professional'
        ? pricedSubtotal.toFixed(2) : '';
      if (cautionHidden) cautionHidden.value = valid ? caution.toFixed(2) : '';
      if (replacementHidden) replacementHidden.value =
        valid && caution > 0 ? replacement.toFixed(2) : '';
      return valid;
    }

    function applyOfferFromLink() {
      const hash = window.location.hash.slice(1);
      const legacy = {
        rental: 'event_essentiel', autonomous: 'event_essentiel',
        location_avec: 'event_essentiel', location_sans: 'event_essentiel',
        abonnement: 'pro_starter', pro: 'pro_business',
        custom: 'achat', special: 'special_event'
      };
      const offerKey = legacy[hash] || (OFFER_CONFIG[hash] ? hash : '');
      if (offerKey && offerSelect) offerSelect.value = offerKey;
      if (rentalMode && ['rental', 'location_avec'].includes(hash)) rentalMode.value = 'avec';
      if (rentalMode && ['autonomous', 'location_sans'].includes(hash)) rentalMode.value = 'sans';
      refresh();
    }

    offerSelect?.addEventListener('change', refresh);
    quantityInput?.addEventListener('input', refresh);
    rentalMode?.addEventListener('change', refresh);
    agentZoneInput?.addEventListener('change', refresh);
    targetInput?.addEventListener('change', refresh);
    startInput?.addEventListener('change', refresh);
    endInput?.addEventListener('change', refresh);
    form.querySelectorAll('[data-agent-options] input').forEach(input => {
      input.addEventListener('change', refresh);
      input.addEventListener('input', refresh);
    });
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
