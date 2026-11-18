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
  '\n({ OFFER_CONFIG, NOTICE_DAYS, DEPOSIT_PER_POUCH, addCalendarDays, franceTodayISO, earliestRequestDate, minimumRentalEndDate, purchaseUnitPrice, replacementUnitPrice });');
const { OFFER_CONFIG, NOTICE_DAYS, DEPOSIT_PER_POUCH,
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
test('sales tiers, replacements and distinct refundable deposit', () => {
  const prices = [[49, 5.9], [50, 5.9], [99, 5.9], [100, 5.5],
                  [182, 5.5], [299, 5.5], [300, 4.9], [484, 4.9], [605, 4.9]];
  prices.forEach(([quantity, rate]) => {
    assert.equal(purchaseUnitPrice(quantity), rate);
    assert.equal(replacementUnitPrice(quantity), rate);
  });
  assert.equal(OFFER_CONFIG.achat.minQuantity, 50);
  assert.equal(DEPOSIT_PER_POUCH, 1.5);
  assert.equal(605 * DEPOSIT_PER_POUCH, 907.5);
});
test('all service requests require dates, without automatic booking', () => {
  assert.match(source, /targetInput\.required = dated/);
  assert.match(source, /startInput\.required = professional/);
  assert.match(source, /endInput\.required = professional/);
  assert.match(source, /const earliest = earliestRequestDate\(\)/);
  assert.match(source, /start < earliest/);
  assert.match(source, /requested < earliest/);
  assert.match(source, /form\.addEventListener\('submit'/);
});
