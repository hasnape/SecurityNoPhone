// SecurityNoPhone — regression guard for recovered checkout journeys.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const get = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
const home = get('index.html'), nav = get('includes/navbar.html');
const order = get('commande.html'), tracking = get('suivi.html');
const calculator = get('js/order-form.js');
const trackingJS = get('js/order-tracking.js');
const translations = JSON.parse(get('js/translations.js')
  .replace(/^window\.translations = /, '').replace(/;\s*$/, ''));

test('nine existing packages are directly selectable from checkout and remain on homepage', () => {
  const offers = ['event_mini', 'event_essentiel', 'event_confort',
    'event_grand', 'event_prestige', 'pro_education',
    'pro_starter', 'pro_business', 'pro_entreprise'];
  offers.forEach(key => {
    assert.ok(order.includes('href="#' + key + '"'), 'checkout ' + key);
    assert.ok(order.includes('value="' + key + '"'), 'select ' + key);
    assert.ok(home.includes('commande.html#' + key), 'home ' + key);
  });
});
test('rental options with and without staff exist for a selected package', () => {
  assert.match(order, /name="mode_location"/);
  assert.match(order, /<option value="sans"/);
  assert.match(order, /<option value="avec"/);
  assert.match(order, /name="agents_souhaites"/);
  assert.match(order, /name="journees_intervention"/);
  assert.match(order, /name="zone_intervention"/);
  assert.match(order, /name="ville_intervention"/);
  assert.match(order, /data-agent-charge-value/);
  assert.match(order, /data-outside-lyon-fields/);
  assert.match(order, /name="heures_agent" min="1" max="7"/);
  assert.match(calculator, /rentalMode\?\.value === 'avec'/);
  assert.match(calculator, /showElement\(agentGroup, withAgent\)/);
  assert.match(calculator, /calculateAgentCharge\(agentCount, interventionDays\)/);
  assert.match(calculator, /agentZoneInput\?\.value === 'hors_lyon'/);
  assert.match(calculator, /valid && pricedSubtotal !== null && offer\.type !== 'professional'/);
  assert.match(home, /href="commande\.html#location_avec"/);
  assert.match(home, /href="commande\.html#location_sans"/);
  assert.match(calculator, /location_avec: 'event_essentiel'/);
  assert.match(calculator, /location_sans: 'event_essentiel'/);
});
test('estimate is visible without requested dates but cannot be booked automatically', () => {
  assert.match(order, /data-simulation-hint/);
  assert.match(calculator, /priceDisplay\.textContent = quantityOk \? label : ''/);
  assert.match(calculator, /const valid = quantityOk && datesOk/);
  assert.match(calculator, /const NOTICE_DAYS = 30;/);
  assert.match(calculator, /const DEPOSIT_TIERS = Object\.freeze/);
  assert.match(calculator, /function calculateDeposit\(quantity\)/);
  assert.match(calculator, /form\.addEventListener\('submit'/);
  assert.match(order, /https:\/\/formspree\.io\/f\/xqaqogdv/);
});
test('order tracking is reachable and requests contact rather than inventing status', () => {
  assert.match(nav, /href="suivi\.html"/);
  assert.match(nav, /href="commande\.html#simulateur"/);
  assert.match(nav, /href="index\.html#pricing"/);
  assert.match(tracking, /action="https:\/\/formspree\.io\/f\/xqaqogdv"/);
  assert.match(tracking, /name="reference_commande"/);
  assert.match(tracking, /name="email"/);
  assert.match(trackingJS, /buildTrackingContact/);
  assert.doesNotMatch(trackingJS, /CMD123|mockStatuses|order_status_3/);
  assert.doesNotMatch(trackingJS, /event\.preventDefault\(\)/);
});
test('recovered content exists in all supported translations', () => {
  const keys = ['nav_packs', 'nav_simulator', 'nav_tracking',
    'order_simulator_title', 'rental_mode_label', 'rental_mode_without',
    'rental_mode_with', 'agent_price_notice', 'agent_public_price_notice',
    'agent_days_label', 'agent_zone_label', 'booking_with_agent_subtotal',
    'order_simulation_ready',
    'tracking_request_email_label', 'tracking_request_send',
    'tracking_request_privacy'];
  for (const lang of ['fr', 'en', 'de', 'ar']) {
    keys.forEach(key => assert.equal(typeof translations[lang][key], 'string',
      lang + ': missing ' + key));
  }
});

test('private/pro custom rental is accessible, priced indicatively from Pro tiers and remains quote-led', () => {
  for (const offer of ['location_particulier', 'location_pro']) {
    assert.match(order, new RegExp('value="' + offer + '"'));
    assert.match(order, new RegExp('href="#' + offer + '"'));
    assert.match(home, new RegExp('href="commande\\.html#' + offer + '"'));
    assert.match(calculator, new RegExp(offer + ':'));
  }
  assert.match(order, /data-custom-quantity-hint/);
  assert.match(order, /data-custom-pricing-notice/);
  assert.match(order, /data-pricing-method-value/);
  assert.match(calculator, /function customRentalReference\(quantity, startISO, endISO\)/);
  assert.match(calculator, /CUSTOM_PRO_REFERENCE/);
  assert.match(calculator, /CUSTOM_EVENT_FLOOR/);
  assert.match(calculator, /CUSTOM_BILLING_DAYS = 30/);
  assert.match(order, /min="1" step="1" value="49"/);
  assert.match(calculator, /quantityInput\.readOnly = !!offer\?\.quantity/);
  assert.match(calculator, /customRental && quantityInput\) quantityInput\.value = '10'/);
  assert.match(calculator, /quantityInput\.min = customRental \? '10'/);
  assert.match(calculator, /const usesRentalDates = professional \|\| customRental/);
  assert.match(order, /data-custom-no-min-term-note/);
  assert.match(order, /data-pro-min-term-note/);
  assert.match(calculator, /showElement\(rentalGroup, usesRentalDates\)/);
  assert.match(calculator, /const caution = offer\.type === 'event' \|\| professional \|\| customRental/);
  assert.match(calculator, /const eligibleRental = offer\?\.type === 'event' \|\| usesRentalDates/);
  assert.match(calculator, /label = translate\('custom_rental_price_pending'/);
  assert.match(calculator, /label = translate\('custom_rental_agent_price_pending'/);
  assert.match(calculator, /label = translate\('custom_rental_pro_estimate'/);
  assert.match(calculator, /label = translate\('custom_rental_with_agent_estimate'/);
  assert.match(calculator, /const pricedSubtotal = total !== null/);
  assert.match(order, /data-caution-value/);
  assert.match(order, /data-deposit-tiers/);
  assert.match(order, /data-payable-estimate-group/);
  assert.match(order, /data-payable-estimate-amount/);
  assert.match(calculator, /const estimatedOutlay = pricedSubtotal !== null/);
  for (const lang of ['fr', 'en', 'de', 'ar']) {
    for (const key of ['offer_location_particulier', 'offer_location_pro',
      'custom_rental_section_title', 'custom_rental_quantity_help',
      'custom_rental_price_pending', 'custom_rental_agent_price_pending',
      'custom_rental_min_quantity', 'custom_rental_duration_help',
      'custom_rental_dates_order', 'custom_rental_pricing_policy',
      'deposit_tiers_summary', 'deposit_tiers_explainer',
      'deposit_tier_column', 'deposit_tier_rate_column',
      'deposit_tiers_example', 'estimated_outlay_label',
      'estimated_outlay_notice', 'pdf_deposit_update_notice',
      'custom_rental_public_price_logic', 'custom_rental_pro_estimate',
      'custom_rental_pro_reference_pending', 'custom_rental_with_agent_estimate']) {
      assert.equal(typeof translations[lang][key], 'string', lang + ': ' + key);
    }
  }
});
