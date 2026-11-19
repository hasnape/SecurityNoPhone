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
  assert.match(order, /name="heures_agent" min="1" max="7"/);
  assert.match(calculator, /rentalMode\?\.value === 'avec'/);
  assert.match(calculator, /showElement\(agentGroup, withAgent\)/);
  assert.match(calculator, /offer\.type !== 'professional' && !withAgent/);
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
  assert.match(calculator, /const DEPOSIT_PER_POUCH = 1\.50;/);
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
    'rental_mode_with', 'booking_with_agent_base', 'order_simulation_ready',
    'tracking_request_email_label', 'tracking_request_send',
    'tracking_request_privacy'];
  for (const lang of ['fr', 'en', 'de', 'ar']) {
    keys.forEach(key => assert.equal(typeof translations[lang][key], 'string',
      lang + ': missing ' + key));
  }
});
