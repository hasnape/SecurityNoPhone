// Non-network regression tests: dates, price tiers and fixed package quantities.
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const source = readFileSync(join(__dirname, '..', 'js', 'order-form.js'), 'utf8');
const begin = source.indexOf('  const OFFER_CONFIG = Object.freeze(');
const end = source.indexOf('  function showElement(', begin);
assert.ok(begin > 0 && end > begin, 'Source pricing/date functions must be accessible');
const funcs = vm.runInNewContext(source.slice(begin, end) +
  '\n({ OFFER_CONFIG, NOTICE_DAYS, EVENT_DEPOSIT_PERCENT, calculateEventDeposit, DEPOSIT_TIERS, calculateDeposit, AGENT_DAY_RATE, MAX_AGENT_HOURS, CUSTOM_PRO_REFERENCE, CUSTOM_EVENT_FLOOR, CUSTOM_BILLING_DAYS, customRentalReference, calculateAgentCharge, addCalendarDays, franceTodayISO, earliestRequestDate, minimumRentalEndDate, purchaseUnitPrice, replacementUnitPrice });');
const { OFFER_CONFIG, NOTICE_DAYS, EVENT_DEPOSIT_PERCENT, calculateEventDeposit, DEPOSIT_TIERS, calculateDeposit, AGENT_DAY_RATE, MAX_AGENT_HOURS, CUSTOM_PRO_REFERENCE, CUSTOM_EVENT_FLOOR, CUSTOM_BILLING_DAYS, customRentalReference, calculateAgentCharge,
        addCalendarDays, franceTodayISO, earliestRequestDate,
        minimumRentalEndDate, purchaseUnitPrice, replacementUnitPrice } = funcs;

test('30 calendar days from the local Paris date for ALL offers', () => {
  assert.equal(NOTICE_DAYS, 30);
  assert.equal(earliestRequestDate(), addCalendarDays(franceTodayISO(), 30));
  assert.equal(addCalendarDays('2026-11-18', 30), '2026-12-18');
  assert.ok(addCalendarDays('2026-11-18', 29) < addCalendarDays('2026-11-18', 30));
});
test('invalid dates and day-month rollover are handled', () => {
  assert.equal(addCalendarDays('2026-12-15', 30), '2027-01-14');
  assert.equal(addCalendarDays('2028-02-28', 1), '2028-02-29');
  for (const input of ['', '2026-13-01', '2026-02-30', 'bad']) {
    assert.equal(addCalendarDays(input, 30), null);
  }
});
test('three full calendar months for professional contract (return included)', () => {
  assert.equal(minimumRentalEndDate('2026-11-18'), '2027-02-17');
  assert.equal(minimumRentalEndDate('2027-01-31'), '2027-04-29');
  assert.equal(minimumRentalEndDate('2027-02-01'), '2027-04-30');
});
test('approved event prices and quantities cannot drift', () => {
  const expected = [
    ['event_mini', 49, 69], ['event_essentiel', 97, 109],
    ['event_confort', 182, 189], ['event_grand', 303, 299],
    ['event_prestige', 484, 449]
  ];
  expected.forEach(([key, quantity, price]) => {
    assert.equal(OFFER_CONFIG[key].type, 'event');
    assert.equal(OFFER_CONFIG[key].quantity, quantity);
    assert.equal(OFFER_CONFIG[key].price, price);
  });
});
test('approved professional monthly prices/quantities and minimum commitment', () => {
  const expected = [
    ['pro_education', 92, 69], ['pro_starter', 182, 119],
    ['pro_business', 363, 229], ['pro_entreprise', 605, 349]
  ];
  expected.forEach(([key, quantity, price]) => {
    assert.equal(OFFER_CONFIG[key].type, 'professional');
    assert.equal(OFFER_CONFIG[key].quantity, quantity);
    assert.equal(OFFER_CONFIG[key].monthlyPrice, price);
    assert.equal(OFFER_CONFIG[key].minMonths, 3);
  });
});
test('fixed event deposit is 25% of pack rental price', () => {
  assert.equal(EVENT_DEPOSIT_PERCENT, 25);
  for (const [key, expected] of [['event_mini',17.25], ['event_essentiel',27.25], ['event_confort',47.25], ['event_grand',74.75], ['event_prestige',112.25]]) {
    assert.equal(calculateEventDeposit(OFFER_CONFIG[key].price), expected, key);
  }
  assert.equal(calculateEventDeposit(-1), null);
});

test('sales tiers, replacements and progressive refundable deposit', () => {
  const prices = [[49, 5.9], [50, 5.9], [99, 5.9], [100, 5.5],
                  [182, 5.5], [299, 5.5], [300, 4.9], [484, 4.9], [605, 4.9]];
  prices.forEach(([quantity, rate]) => {
    assert.equal(purchaseUnitPrice(quantity), rate);
    assert.equal(replacementUnitPrice(quantity), rate);
  });
  assert.equal(OFFER_CONFIG.achat.minQuantity, 50);
  assert.deepEqual(Array.from(DEPOSIT_TIERS, tier => [tier.upTo, tier.cents]),
    [[49, 150], [99, 140], [299, 125], [Infinity, 110]]);
  const deposits = [[1,1.5],[10,15],[37,55.5],[49,73.5],[50,74.9],
    [97,140.7],[99,143.5],[100,144.75],[182,247.25],
    [299,393.5],[300,394.6],[303,397.9],[484,597],[605,730.1]];
  for (const [quantity, expected] of deposits) {
    assert.equal(calculateDeposit(quantity), expected, quantity + ' pouches');
  }
  for (let quantity = 1; quantity < 1000; quantity++) {
    assert.ok(calculateDeposit(quantity + 1) > calculateDeposit(quantity),
      'adding a pouch cannot reduce total deposit');
  }
  for (const quantity of [0, -1, 1.5, Infinity, NaN, '49']) {
    assert.equal(calculateDeposit(quantity), null);
  }
  assert.match(source, /calculateDeposit\(quantity\)/);
});
test('all service requests require dates, without automatic booking', () => {
  assert.match(source, /targetInput\.required = dated/);
  assert.match(source, /startInput\.required = usesRentalDates/);
  assert.match(source, /endInput\.required = usesRentalDates/);
  assert.match(source, /const earliest = earliestRequestDate\(\)/);
  assert.match(source, /start < earliest/);
  assert.match(source, /requested < earliest/);
  assert.match(source, /form\.addEventListener\('submit'/);
});

test('agent price is EUR 100 incl. VAT per person and on-site day, up to 7 hours', () => {
  assert.equal(AGENT_DAY_RATE, 100);
  assert.equal(MAX_AGENT_HOURS, 7);
  assert.equal(calculateAgentCharge(1, 1), 100);
  assert.equal(calculateAgentCharge(2, 1), 200);
  assert.equal(calculateAgentCharge(2, 3), 600);
  for (const [agents, days] of [[0, 1], [-1, 1], [1, 0], [1.5, 1], [1, 365.5], [21, 1], [1, 366]]) {
    assert.equal(calculateAgentCharge(agents, days), null);
  }
  assert.match(source, /100 EUR|AGENT_DAY_RATE = 100/);
  assert.match(source, /agentZoneInput\?\.value === 'hors_lyon'/);
  assert.match(source, /Déplacement en supplément, logement si nécessaire/);
});

test('custom rentals retain freely selectable quantity and duration and use indicative Pro rates', () => {
  assert.equal(OFFER_CONFIG.location_particulier.type, 'custom_event');
  assert.equal(OFFER_CONFIG.location_pro.type, 'custom_professional');
  assert.equal(OFFER_CONFIG.location_particulier.quantity, undefined);
  assert.equal(OFFER_CONFIG.location_pro.quantity, undefined);
  assert.equal(OFFER_CONFIG.location_particulier.price, undefined);
  assert.equal(OFFER_CONFIG.location_pro.monthlyPrice, undefined);
  assert.match(source, /const customRental = offer\?\.type === 'custom_event' \|\| offer\?\.type === 'custom_professional'/);
  assert.match(source, /const professional = offer\?\.type === 'professional';/);
  assert.match(source, /const usesRentalDates = professional \|\| customRental/);
  assert.match(source, /quantityInput\.min = customRental \? '10'/);
  assert.match(source, /customRental && quantityInput\) quantityInput\.value = '10'/);
  assert.match(source, /if \(standardPro\) \{/);
  assert.match(source, /custom_rental_dates_order/);
  assert.match(source, /const caution = offer\.type === 'event' \|\| professional \|\| customRental/);
  assert.match(source, /calculateDeposit\(quantity\)/);
  assert.match(source, /function customRentalReference\(quantity, startISO, endISO\)/);
  assert.match(source, /custom_rental_pro_estimate/);
  assert.match(source, /custom_rental_price_pending/);
  assert.match(source, /const pricedSubtotal = total !== null/);
  assert.match(source, /const valid = quantityOk && datesOk && agentValid/);
});

test('custom reference uses approved professional tiers and event floors', () => {
  assert.equal(CUSTOM_BILLING_DAYS, 30);
  assert.deepEqual(Array.from(CUSTOM_PRO_REFERENCE, x => [x.upTo, x.monthly]),
    [[92, 69], [182, 119], [363, 229], [605, 349]]);
  assert.deepEqual(Array.from(CUSTOM_EVENT_FLOOR, x => [x.upTo, x.amount]),
    [[49, 69], [97, 109], [182, 189], [303, 299], [484, 449]]);
  for (const [quantity, amount] of [[10, 69], [49, 69], [50, 109],
     [92, 109], [93, 119], [98, 189], [182, 189],
     [183, 299], [303, 299], [304, 449], [484, 449]]) {
    assert.equal(customRentalReference(quantity, '2099-01-01', '2099-01-01').estimate,
      amount, quantity + ' pouches one day');
  }
  assert.equal(customRentalReference(182, '2099-01-01', '2099-01-30').estimate, 189);
  assert.equal(customRentalReference(182, '2099-01-01', '2099-01-31').estimate, 238);
  assert.equal(customRentalReference(182, '2099-01-01', '2099-03-31').estimate, 357);
  assert.equal(customRentalReference(363, '2099-01-01', '2099-03-31').estimate, 687);
  assert.equal(customRentalReference(10, '2099-01-01', '2099-03-31').estimate, 207);
});

test('custom quote-only handling beyond available event benchmark and invalid inputs', () => {
  assert.equal(customRentalReference(9, '2099-01-01', '2099-01-01'), null);
  assert.equal(customRentalReference(10.5, '2099-01-01', '2099-01-01'), null);
  const fiveHundred = customRentalReference(500, '2099-01-01', '2099-01-01');
  assert.equal(fiveHundred.monthly, 349);
  assert.equal(fiveHundred.estimate, null);
  assert.equal(customRentalReference(606, '2099-01-01', '2099-01-01').estimate, null);
  assert.equal(customRentalReference(10, '2099-01-02', '2099-01-01').estimate, null);
  assert.equal(customRentalReference(10, '', '').estimate, null);
  assert.equal(customRentalReference(10, '2099-01-01', '2099-01-01').days, 1);
});
