// Tests fonctionnels minimaux de la durée de location, sans navigateur ni réseau.
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const source = readFileSync(join(__dirname, '..', 'js', 'order-form.js'), 'utf8');
const begin = source.indexOf('  function minimumRentalEndDate(startValue) {');
const end = source.indexOf('\n  function computeCaution(', begin);
assert.ok(begin >= 0 && end > begin, 'La fonction de durée minimale doit rester accessible dans le fichier');
const minimumRentalEndDate = vm.runInNewContext(source.slice(begin, end) + '\nminimumRentalEndDate;');

test('minimum 3 mois calendaires, retour inclus', () => {
  assert.equal(minimumRentalEndDate('2026-11-18'), '2027-02-17');
  assert.equal(minimumRentalEndDate('2027-02-01'), '2027-04-30');
});

test('gestion des débuts en fin de mois', () => {
  assert.equal(minimumRentalEndDate('2027-01-31'), '2027-04-29');
  assert.equal(minimumRentalEndDate('2028-01-31'), '2028-04-29');
  assert.equal(minimumRentalEndDate('2026-12-31'), '2027-03-30');
});

test('date manquante ou invalide refusée', () => {
  for (const input of ['', '2026-13-01', '2026-02-30', 'incorrect']) {
    assert.equal(minimumRentalEndDate(input), null);
  }
});

test('la location reste sur devis et non une multiplication journalière automatique', () => {
  assert.match(source, /const needsQuote = offer\.type === 'rental' \|\|/);
  assert.match(source, /order_dates_min_three_months/);
  assert.match(source, /quote_rental_long_term/);
});
