// Browserless DOM contract tests for Pro-based indicative personalized rental pricing.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const source = readFileSync(join(__dirname, '..', 'js', 'order-form.js'), 'utf8');
const translations = JSON.parse(readFileSync(join(__dirname, '..', 'js', 'translations.js'), 'utf8')
  .replace(/^window.translations = /, '').replace(/;\s*$/, ''));

function makeField(value = '') {
  const classes = new Set();
  return {
    value, textContent: '', style: {}, dataset: {}, checked: false, readOnly: false,
    disabled: false, required: false, validationMessage: '', listeners: {},
    children: [], named: {},
    classList: {
      add: name => classes.add(name),
      remove: name => classes.delete(name),
      toggle: (name, show) => show ? classes.add(name) : classes.delete(name),
      contains: name => classes.has(name)
    },
    setAttribute() {},
    setCustomValidity(message) { this.validationMessage = message; },
    addEventListener(type, listener) { this.listeners[type] = listener; },
    querySelectorAll() { return this.children; },
    querySelector(selector) { return this.named[selector] || null; }
  };
}

function boot(hash = '#location_particulier') {
  const names = [
    '#offerType', '#quantity', '[data-custom-quantity-hint]', '[data-pro-min-term-note]',
    '[data-custom-no-min-term-note]', '[data-custom-pricing-notice]', '[data-event-purchase-date]',
    '[data-requested-date]', '[data-requested-date-error]', '[data-rental-fields]',
    '[data-start-date]', '[data-end-date]', '#dateError', '#quantityError',
    '[data-agent-options]', '[data-rental-mode-group]', '[data-rental-mode]',
    '[data-simulation-hint]', '[data-pack-base-value]', '[data-pricing-method-value]', '[data-total-display]',
    '[data-caution-block]', '[data-caution-display]', '[data-payable-estimate-group]',
    '[data-payable-estimate-amount]', '[data-total-value]',
    '[data-caution-value]', '[data-replacement-price]', '[data-summary]',
    '[data-agent-rate-value]', '[data-agent-charge-value]', '[data-agent-extras-value]',
    '[data-agent-count]', '[data-agent-days]', '[data-agent-hours]', '[data-agent-zone]',
    '[data-agent-city]', '#lodgingRequired', '[data-outside-lyon-fields]'
  ];
  const fields = Object.fromEntries(names.map(key => [key, makeField()]));
  const set = (key, value) => { fields[key].value = value; };
  set('#quantity', '49');
  set('[data-requested-date]', '2099-01-01');
  set('[data-start-date]', '2099-01-01');
  set('[data-end-date]', '2099-03-31');
  set('[data-agent-count]', '2');
  set('[data-agent-days]', '3');
  set('[data-agent-hours]', '7');
  set('[data-agent-zone]', 'lyon');
  set('[data-agent-city]', 'Lyon');
  set('[data-rental-mode]', 'sans');

  fields['[data-event-purchase-date]'].children = [fields['[data-requested-date]']];
  fields['[data-rental-fields]'].children =
    [fields['[data-start-date]'], fields['[data-end-date]']];
  fields['[data-rental-mode-group]'].children = [fields['[data-rental-mode]']];
  const agentInputs = ['[data-agent-count]', '[data-agent-days]', '[data-agent-hours]',
    '[data-agent-zone]', '[data-agent-city]', '#lodgingRequired'];
  fields['[data-agent-options]'].children = agentInputs.map(key => fields[key]);
  fields['[data-outside-lyon-fields]'].children = [fields['#lodgingRequired']];
  const summaryKeys = ['[data-summary-days-count]', '[data-summary-base]',
    '[data-summary-extra-agents]', '[data-summary-travel]', '[data-summary-lodging]',
    '[data-summary-caution]', '[data-summary-total-amount]',
    '[data-summary-extra-agents-row]', '[data-summary-travel-row]',
    '[data-summary-lodging-row]'];
  for (const key of summaryKeys) fields['[data-summary]'].named[key] = makeField();

  const form = {
    dataset: { currency: 'EUR' }, listeners: {},
    querySelector: key => fields[key] || null,
    querySelectorAll: key => key === '[data-agent-options] input'
      ? agentInputs.filter(input => input !== '[data-agent-zone]').map(input => fields[input]) : [],
    addEventListener(key, listener) { this.listeners[key] = listener; },
    checkValidity() { return true; },
    reportValidity() { return true; }
  };
  const document = {
    documentElement: { lang: 'fr' },
    querySelectorAll: key => key === '[data-order-form]' ? [form] : [],
    addEventListener(key, listener) { if (key === 'DOMContentLoaded') listener(); }
  };
  const window = { location: { hash }, translations, addEventListener() {} };
  new Function('window', 'document', source)(window, document);
  const trigger = (key, event = 'input') => fields[key].listeners[event]();
  return { fields, form, trigger, set };
}

test('private customer chooses 37 pouches with a Pro-based indicative estimate', () => {
  const { fields: f, trigger, set } = boot();
  assert.equal(f['#offerType'].value, 'location_particulier');
  assert.equal(f['#quantity'].readOnly, false);
  assert.equal(f['#quantity'].value, '10');
  assert.equal(f['#quantity'].min, '10');
  assert.equal(f['[data-requested-date]'].required, false);
  assert.equal(f['[data-start-date]'].required, true);
  assert.equal(f['[data-end-date]'].required, true);
  set('#quantity', '37'); trigger('#quantity');
  assert.equal(f['#quantity'].validationMessage, '');
  assert.equal(f['[data-caution-value]'].value, '55.50');
  assert.equal(f['[data-total-value]'].value, '207.00');
  assert.match(f['[data-payable-estimate-amount]'].textContent, /262,50/);
  assert.match(f['[data-total-display]'].textContent, /207/);
  assert.match(f['[data-pricing-method-value]'].value, /Reference Pro/);
});

test('custom rental agent fee adds to Pro estimate but deposit and travel remain separate', () => {
  const { fields: f, trigger, set } = boot();
  set('#quantity', '37'); trigger('#quantity');
  set('[data-rental-mode]', 'avec'); trigger('[data-rental-mode]', 'change');
  assert.equal(f['[data-agent-charge-value]'].value, '600.00');
  assert.equal(f['[data-caution-value]'].value, '55.50');
  assert.equal(f['[data-total-value]'].value, '807.00');
  assert.match(f['[data-payable-estimate-amount]'].textContent, /862,50/);
  set('[data-agent-zone]', 'hors_lyon'); trigger('[data-agent-zone]', 'change');
  assert.match(f['[data-agent-extras-value]'].value, /Déplacement en supplément/);
  set('[data-rental-mode]', 'sans'); trigger('[data-rental-mode]', 'change');
  assert.equal(f['[data-agent-charge-value]'].value, '');
  assert.equal(f['[data-agent-extras-value]'].value, '');
  assert.equal(f['[data-total-value]'].value, '207.00');
});

test('professional custom rental allows short and one-day bookings with 10+ pouches', () => {
  const { fields: f, trigger, set } = boot('#location_pro');
  assert.equal(f['#offerType'].value, 'location_pro');
  assert.equal(f['[data-start-date]'].required, true);
  assert.equal(f['[data-end-date]'].required, true);
  assert.equal(f['[data-requested-date]'].required, false);
  set('#quantity', '182'); trigger('#quantity');
  assert.equal(f['[data-caution-value]'].value, '247.25');
  assert.equal(f['[data-total-value]'].value, '357.00');
  set('[data-end-date]', '2099-01-01'); trigger('[data-end-date]', 'change');
  assert.equal(f['[data-end-date]'].validationMessage, '');
  assert.equal(f['[data-total-value]'].value, '189.00');
  assert.equal(f['[data-end-date]'].min, '2099-01-01');
  set('[data-end-date]', '2099-01-02'); trigger('[data-end-date]', 'change');
  assert.equal(f['[data-end-date]'].validationMessage, '');
  assert.equal(f['[data-total-value]'].value, '189.00');
  set('[data-end-date]', '2098-12-31'); trigger('[data-end-date]', 'change');
  assert.notEqual(f['[data-end-date]'].validationMessage, '');
  assert.equal(f['[data-total-value]'].value, '');
  set('[data-end-date]', '2099-03-31'); trigger('[data-end-date]', 'change');
  assert.equal(f['[data-end-date]'].validationMessage, '');
  assert.equal(f['[data-total-value]'].value, '357.00');
});

test('existing fixed packs and minimum purchase quantity stay unchanged', () => {
  const { fields: f, trigger, set } = boot();
  set('#offerType', 'event_mini'); trigger('#offerType', 'change');
  assert.equal(f['#quantity'].value, '49');
  assert.equal(f['#quantity'].readOnly, true);
  assert.equal(f['[data-total-value]'].value, '69.00');
  set('#offerType', 'achat'); trigger('#offerType', 'change');
  assert.equal(f['#quantity'].value, '50');
  assert.equal(f['[data-total-value]'].value, '295.00');
  assert.equal(f['[data-caution-value]'].value, '0.00');
  assert.equal(f['[data-payable-estimate-group]'].classList.contains('d-none'), true);
  set('#offerType', 'location_particulier'); trigger('#offerType', 'change');
  assert.equal(f['#quantity'].readOnly, false);
  set('#quantity', '1.5'); trigger('#quantity');
  assert.notEqual(f['#quantity'].validationMessage, '');
});

test('required 30-day notice still rejects a past custom rental date', () => {
  const { fields: f, trigger, set } = boot();
  set('[data-start-date]', '2020-01-01');
  trigger('[data-start-date]', 'change');
  assert.notEqual(f['[data-start-date]'].validationMessage, '');
});

test('both custom profiles enforce 10 whole pouches and accept exactly 10', () => {
  for (const profile of ['#location_particulier', '#location_pro']) {
    const { fields: f, trigger, set } = boot(profile);
    assert.equal(f['#quantity'].value, '10');
    assert.equal(f['#quantity'].min, '10');
    assert.equal(f['[data-caution-value]'].value, '15.00');
    assert.equal(f['[data-total-value]'].value, '207.00');
    set('#quantity', '9'); trigger('#quantity');
    assert.notEqual(f['#quantity'].validationMessage, '');
    assert.equal(f['[data-caution-value]'].value, '');
    assert.equal(f['[data-total-value]'].value, '');
    set('#quantity', '10'); trigger('#quantity');
    assert.equal(f['#quantity'].validationMessage, '');
    assert.equal(f['[data-caution-value]'].value, '15.00');
    assert.equal(f['[data-total-value]'].value, '207.00');
    set('#quantity', '10.5'); trigger('#quantity');
    assert.notEqual(f['#quantity'].validationMessage, '');
  }
});

test('one-day custom rental accepted for private customers and professionals', () => {
  for (const profile of ['#location_particulier', '#location_pro']) {
    const { fields: f, trigger, set } = boot(profile);
    set('[data-start-date]', '2099-01-01'); trigger('[data-start-date]', 'change');
    set('[data-end-date]', '2099-01-01'); trigger('[data-end-date]', 'change');
    assert.equal(f['[data-start-date]'].validationMessage, '');
    assert.equal(f['[data-end-date]'].validationMessage, '');
    assert.equal(f['[data-end-date]'].min, '2099-01-01');
    assert.equal(f['[data-total-value]'].value, '69.00');
  }
});

test('three-calendar-month requirement remains only on standard professional packages', () => {
  const { fields: f, trigger, set } = boot();
  set('#offerType', 'pro_education'); trigger('#offerType', 'change');
  set('[data-start-date]', '2099-01-01'); trigger('[data-start-date]', 'change');
  set('[data-end-date]', '2099-01-02'); trigger('[data-end-date]', 'change');
  assert.notEqual(f['[data-end-date]'].validationMessage, '');
  assert.equal(f['[data-end-date]'].min, '2099-03-31');
  set('[data-end-date]', '2099-03-31'); trigger('[data-end-date]', 'change');
  assert.equal(f['[data-end-date]'].validationMessage, '');
});

test('custom pricing follows Pro quantity bands and never undercuts comparable event package', () => {
  const cases = [
    [10, '69.00'], [49, '69.00'], [50, '109.00'], [92, '109.00'],
    [93, '119.00'], [97, '119.00'], [98, '189.00'],
    [182, '189.00'], [183, '299.00'], [303, '299.00'],
    [304, '449.00'], [363, '449.00'], [364, '449.00'],
    [484, '449.00']
  ];
  for (const [count, price] of cases) {
    const { fields: f, trigger, set } = boot('#location_particulier');
    set('#quantity', String(count)); trigger('#quantity');
    set('[data-end-date]', '2099-01-01'); trigger('[data-end-date]', 'change');
    assert.equal(f['[data-total-value]'].value, price, count + ' pouches, one day');
  }
});

test('custom pricing respects started 30-day periods and Pro reference prices', () => {
  const { fields: f, trigger, set } = boot('#location_pro');
  set('#quantity', '182'); trigger('#quantity');
  set('[data-end-date]', '2099-01-30'); trigger('[data-end-date]', 'change');
  assert.equal(f['[data-total-value]'].value, '189.00'); // 30 days, event floor.
  set('[data-end-date]', '2099-01-31'); trigger('[data-end-date]', 'change');
  assert.equal(f['[data-total-value]'].value, '238.00'); // 31 days, 2 x 119.
  set('[data-end-date]', '2099-03-31'); trigger('[data-end-date]', 'change');
  assert.equal(f['[data-total-value]'].value, '357.00'); // 90 days, 3 x 119.
  assert.match(f['[data-total-display]'].textContent, /357/);
});

test('larger-than-event volumes and absent dates keep price quote-only', () => {
  const { fields: f, trigger, set } = boot('#location_pro');
  set('#quantity', '500'); trigger('#quantity');
  set('[data-end-date]', '2099-01-01'); trigger('[data-end-date]', 'change');
  assert.equal(f['[data-total-value]'].value, '');
  assert.match(f['[data-total-display]'].textContent, /349/);
  set('#quantity', '606'); trigger('#quantity');
  assert.equal(f['[data-total-value]'].value, '');
  assert.match(f['[data-total-display]'].textContent, /sur devis/);
  set('#quantity', '10'); trigger('#quantity');
  set('[data-start-date]', ''); trigger('[data-start-date]', 'change');
  assert.equal(f['[data-total-value]'].value, '');
  assert.match(f['[data-total-display]'].textContent, /69/);
});

test('agent option does not inflate the 25% event-pack deposit', () => {
  const { fields: f, trigger, set } = boot('#event_confort');
  set('[data-rental-mode]', 'avec'); trigger('[data-rental-mode]', 'change');
  set('[data-agent-count]', '1'); trigger('[data-agent-count]');
  set('[data-agent-days]', '1'); trigger('[data-agent-days]');
  assert.equal(f['[data-caution-value]'].value, '47.25');
  assert.equal(f['[data-total-value]'].value, '289.00');
  assert.match(f['[data-payable-estimate-amount]'].textContent, /336,25/);
  set('[data-rental-mode]', 'sans'); trigger('[data-rental-mode]', 'change');
  assert.equal(f['[data-caution-value]'].value, '47.25');
  assert.match(f['[data-payable-estimate-amount]'].textContent, /236,25/);
});

test('event packs use a 25% deposit and Pro packs remain progressive', () => {
  const { fields: f, trigger, set } = boot();
  set('#offerType', 'event_mini'); trigger('#offerType', 'change');
  assert.equal(f['[data-caution-value]'].value, '17.25');
  assert.equal(f['[data-total-value]'].value, '69.00');
  assert.match(f['[data-payable-estimate-amount]'].textContent, /86,25/);
  set('#offerType', 'event_confort'); trigger('#offerType', 'change');
  assert.equal(f['[data-caution-value]'].value, '47.25');
  assert.equal(f['[data-total-value]'].value, '189.00');
  assert.match(f['[data-payable-estimate-amount]'].textContent, /236,25/);
  for (const [key, amount] of [['event_essentiel','27.25'],['event_grand','74.75'],['event_prestige','112.25']]) {
    set('#offerType',key); trigger('#offerType','change');
    assert.equal(f['[data-caution-value]'].value,amount,key);
  }
  set('#offerType', 'pro_entreprise'); trigger('#offerType', 'change');
  assert.equal(f['[data-caution-value]'].value, '730.10');
  assert.equal(f['[data-total-value]'].value, '');
  assert.match(f['[data-payable-estimate-amount]'].textContent, /1.?777,10/);
  set('#offerType', 'achat'); trigger('#offerType', 'change');
  assert.equal(f['[data-caution-value]'].value, '0.00');
  assert.equal(f['[data-payable-estimate-group]'].classList.contains('d-none'), true);
});

test('the displayed amount to plan is indicative and preserves unpriced custom volumes', () => {
  const { fields: f, trigger, set } = boot('#location_pro');
  set('#quantity', '500'); trigger('#quantity');
  assert.equal(f['[data-total-value]'].value, '');
  assert.equal(f['[data-caution-value]'].value, '614.60');
  assert.equal(f['[data-payable-estimate-group]'].classList.contains('d-none'), true);
  set('#quantity', '182'); trigger('#quantity');
  assert.equal(f['[data-caution-value]'].value, '247.25');
  assert.equal(f['[data-payable-estimate-group]'].classList.contains('d-none'), false);
});
