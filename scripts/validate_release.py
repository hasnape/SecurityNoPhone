#!/usr/bin/env python3
"""Dependency-free source gates; browser and external-service evidence stays separate."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import collections
import ast
import hashlib
import json
import re
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
PAGES = ['index.html', 'solutions.html', 'accompagnement.html', 'experience.html',
         'clients.html', 'secteurs.html', 'contact.html', 'blog.html', 'ressources.html',
         'support.html', 'commande.html', 'suivi.html', 'mentions-legales.html',
         'cgv.html', 'cgu.html', 'confidentialite.html', 'cookies.html',
         'retraction.html', 'mediation.html']
errors, warnings, checks = [], [], []


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.keys, self.urls, self.inline_scripts, self.forms = [], [], [], [], []
        self.h1, self.script = 0, None
        self.stack = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        self.keys.extend(attrs[key] for key in ['data-i18n', 'data-i18n-placeholder', 'data-i18n-title'] if key in attrs)
        for key in ['href', 'src']:
            if key in attrs:
                self.urls.append(attrs[key])
        if tag == 'h1':
            self.h1 += 1
        if tag == 'form':
            self.forms.append(attrs)
        if tag == 'script' and 'src' not in attrs and attrs.get('type', '') not in ['application/ld+json', 'application/json']:
            self.script = ''
        if tag in ['a', 'button']:
            if self.stack:
                errors.append('Interactive nesting: ' + tag + ' inside ' + self.stack[-1])
            self.stack.append(tag)

    def handle_endtag(self, tag):
        if tag == 'script' and self.script is not None:
            self.inline_scripts.append(self.script)
            self.script = None
        if self.stack and self.stack[-1] == tag:
            self.stack.pop()

    def handle_data(self, data):
        if self.script is not None:
            self.script += data


def run(command):
    result = subprocess.run(command, cwd=ROOT, text=True, capture_output=True)
    if result.returncode:
        errors.append(' '.join(command) + '\n' + result.stdout + result.stderr)
    return result


translations = json.loads((ROOT / 'js/translations.js').read_text().removeprefix('window.translations = ').removesuffix(';\n'))
for path in list((ROOT / 'js').glob('*.js')) + [ROOT / 'redirect-lang.js']:
    run(['node', '--check', str(path)])
checks.append('JavaScript syntax: all external scripts')
for script in (ROOT / 'scripts').glob('*.py'):
    ast.parse(script.read_text(), filename=str(script))
checks.append('Python validation scripts parse')

for name in PAGES + ['includes/navbar.html', 'includes/footer.html']:
    parsed = Page()
    parsed.feed((ROOT / name).read_text())
    if not name.startswith('includes/') and parsed.h1 != 1:
        errors.append(f'{name}: expected one H1, found {parsed.h1}')
    for value, count in collections.Counter(parsed.ids).items():
        if count > 1:
            errors.append(f'{name}: duplicate id {value}')
    for key in parsed.keys:
        for lang in ['fr', 'en', 'de', 'ar']:
            if key not in translations[lang]:
                errors.append(f'{name}: missing {lang} translation {key}')
    for value in parsed.urls:
        url = urlsplit(value)
        if not url.scheme and not url.netloc and url.path and not (ROOT / unquote(url.path)).exists():
            errors.append(f'{name}: missing local target {value}')
    for script in parsed.inline_scripts:
        with tempfile.NamedTemporaryFile(mode='w', suffix='.js') as temp:
            temp.write(script)
            temp.flush()
            run(['node', '--check', temp.name])
checks.append(f'{len(PAGES)} current pages + shared header/footer: H1, ids, local files, i18n keys, inline JS')
ET.parse(ROOT / 'sitemap.xml')
checks.append('Sitemap XML parses')

order = (ROOT / 'commande.html').read_text()
parsed = Page()
parsed.feed(order)
form = next((f for f in parsed.forms if f.get('id') == 'orderForm'), {})
if form.get('action') != 'https://formspree.io/f/xqaqogdv' or form.get('method', '').upper() != 'POST':
    errors.append('Primary form transport contract changed')
for value in ['location_sans', 'location_avec', 'abonnement', 'achat', 'special_event']:
    if f'value="{value}"' not in order:
        errors.append('Offer missing: ' + value)
for name in ['offre', 'quantite', 'date_debut', 'date_fin', 'nom', 'email', 'adresse', '_gotcha', 'montant_total_estime', 'caution_total']:
    if f'name="{name}"' not in order:
        errors.append('Form field removed: ' + name)
logo = hashlib.sha256((ROOT / 'images/IMG_20250421_182622-removebg-preview.png').read_bytes()).hexdigest()
if logo != 'd685886681a35b5fdfa8b5d628eb290371614d5d417ba7349991afa7be6d9531':
    errors.append('Official logo bytes changed: review baseline explicitly')
checks.append('Form endpoint, fields, offers and logo contracts')
calculator = (ROOT / 'js/order-form.js').read_text()
rates = {
    'autonomous': r"location_sans:\s*\{\s*type:\s*'rental',\s*dailyRate:\s*150\s*\}",
    'staff': r"location_avec:\s*\{\s*type:\s*'rental',\s*dailyRate:\s*390,\s*additionalAgentDailyRate:\s*100",
    'subscription': r"abonnement:\s*\{\s*type:\s*'subscription',\s*pricePerPack:\s*19,\s*packSize:\s*50\s*\}",
    'purchase': r"achat:\s*\{\s*type:\s*'purchase',\s*unitPrice:\s*3\.5,\s*minQuantity:\s*50\s*\}",
    'deposit': r'return blocks \* 300;'
}
for label, pattern in rates.items():
    if not re.search(pattern, calculator):
        errors.append('Pricing baseline changed: ' + label)
checks.append('Existing pricing and deposit configuration contracts')


def luminance(color):
    channels = [int(color[i:i + 2], 16) / 255 for i in [1, 3, 5]]
    channels = [v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in channels]
    return sum(v * w for v, w in zip(channels, [.2126, .7152, .0722]))


css = (ROOT / 'style.css').read_text()
variables = dict(re.findall(r'(--snf-[\w-]+):\s*(#[0-9a-fA-F]{6})', css))
pairs = [('primary', '--snf-text', '--snf-accent'),
         ('secondary', '--snf-accent-strong', '--snf-surface'),
         ('muted', '--snf-text-muted', '--snf-background'),
         ('focus-light', '--snf-focus-light', '--snf-hero')]
contrasts = {}
for label, foreground, background in pairs:
    values = sorted([luminance(variables[foreground]), luminance(variables[background])])
    ratio = (values[1] + .05) / (values[0] + .05)
    contrasts[label] = round(ratio, 2)
    if ratio < 4.5:
        errors.append(f'{label}: contrast {ratio:.2f} < 4.5')
if 'main { overflow-x: clip; }' in css:
    errors.append('Global overflow masking must not replace a layout repair')
checks.append('Reference contrast pairs and horizontal-animation repair')
test_result = run(['node', '--test', 'tests/order-tracking.test.cjs'])
checks.append('Tracking contact regression tests')
warnings.append('Mobile, real form delivery, payment, logistics and legal validation require separate evidence.')
warnings.append('Legacy translated index/order pages are outside this source gate; see baseline.')

files = subprocess.check_output(['git', 'ls-files', '--cached', '--others', '--exclude-standard'], cwd=ROOT, text=True).splitlines()
digest = hashlib.sha256()
for name in sorted(files):
    path = ROOT / name
    if path.is_file():
        digest.update(name.encode() + b'\0' + path.read_bytes() + b'\0')
report = {'ok': not errors, 'head': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
          'content_sha256': digest.hexdigest(), 'checks': checks, 'contrasts': contrasts,
          'errors': errors, 'limits': warnings, 'regression_output': test_result.stdout}
folder = ROOT / '.release-validation'
folder.mkdir(exist_ok=True)
(folder / 'result.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({key: report[key] for key in ['ok', 'head', 'content_sha256', 'checks', 'contrasts', 'errors', 'limits']}, ensure_ascii=False, indent=2))
sys.exit(0 if report['ok'] else 1)
