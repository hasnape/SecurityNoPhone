"""The recovered operational kit must remain available and downloadable."""
from html.parser import HTMLParser
import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
FILES = {'fiche-retour-materiel.pdf', 'bon-livraison-retour.pdf',
         'protocole-confidentialite.pdf', 'notice-utilisation-rapide.pdf',
         'etiquette-contact.pdf', 'signaletique-bilingue.pdf',
         'guide-formation-equipes.pdf'}
PREFIX = 'documents/support/'


class Downloads(HTMLParser):
    def __init__(self):
        super().__init__()
        self.downloads, self.open_links = [], []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'a' and attrs.get('href', '').startswith(PREFIX):
            if 'download' in attrs:
                self.downloads.append(attrs['href'])
            if attrs.get('target') == '_blank' and 'noopener' in attrs.get('rel', ''):
                self.open_links.append(attrs['href'])


class SupportDocuments(unittest.TestCase):
    def test_both_pages_preserve_the_complete_kit(self):
        expected = {PREFIX + filename for filename in FILES}
        for page in ['support.html', 'ressources.html']:
            with self.subTest(page=page):
                parsed = Downloads()
                source = (ROOT / page).read_text()
                parsed.feed(source)
                self.assertEqual(set(parsed.downloads), expected)
                self.assertEqual(len(parsed.downloads), len(expected))
                self.assertEqual(set(parsed.open_links), expected)
                self.assertIn('id="documents-kit"', source)
                self.assertIn('data-i18n="support_docs_languages"', source)

    def test_pdf_assets_are_complete_and_in_deployment_inventory(self):
        spec = importlib.util.spec_from_file_location('verify_support', ROOT / 'scripts/verify_deployment.py')
        verifier = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(verifier)
        for filename in FILES:
            with self.subTest(document=filename):
                name = PREFIX + filename
                data = (ROOT / name).read_bytes()
                self.assertTrue(data.startswith(b'%PDF-'))
                self.assertTrue(data.rstrip().endswith(b'%%EOF'))
                self.assertGreater(len(data), 2000)
                self.assertTrue(verifier.included(name))


if __name__ == '__main__':
    unittest.main()
