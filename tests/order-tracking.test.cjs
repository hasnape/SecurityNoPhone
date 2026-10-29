const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildTrackingContact } = require('../js/order-tracking.js');

test('a demonstration-looking reference prepares contact instead of an order status', () => {
  const link = new URL(buildTrackingContact('CMD123', 'Suivi de commande'));
  assert.equal(link.protocol, 'mailto:');
  assert.equal(link.pathname, 'snophone.info@gmail.com');
  assert.equal(link.searchParams.get('subject'), 'Suivi de commande — CMD123');
});

test('references cannot inject additional mail headers or URL parameters', () => {
  const reference = 'N° 42&bcc=external@example.org\r\nSubject: autre';
  const link = new URL(buildTrackingContact(reference, 'Commande'));
  assert.deepEqual([...link.searchParams.keys()], ['subject']);
  assert.equal(link.searchParams.get('subject'), 'Commande — N° 42&bcc=external@example.org  Subject: autre');
  assert.doesNotMatch(link.searchParams.get('subject'), /[\r\n]/);
});
