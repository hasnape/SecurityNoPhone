"""Cross-file contracts for the public journey and crawler-visible metadata."""
from html.parser import HTMLParser
from pathlib import Path
import json
import unittest
from urllib.parse import urlsplit
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://securitynophone.com/'
PUBLIC = {'index', 'solutions', 'accompagnement', 'experience', 'clients', 'secteurs',
          'contact', 'blog', 'ressources', 'support', 'commande', 'suivi', 'mentions-legales',
          'cgv', 'cgu', 'confidentialite', 'cookies', 'retraction', 'mediation'}


class Head(HTMLParser):
    def __init__(self):
        super().__init__()
        self.canonicals, self.descriptions, self.robots, self.title = [], [], [], ''
        self.in_title = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'title':
            self.in_title = True
        if tag == 'link' and attrs.get('rel') == 'canonical':
            self.canonicals.append(attrs.get('href'))
        if tag == 'meta' and attrs.get('name') == 'description':
            self.descriptions.append(attrs.get('content', ''))
        if tag == 'meta' and attrs.get('name') == 'robots':
            self.robots.append(attrs.get('content', ''))

    def handle_endtag(self, tag):
        if tag == 'title':
            self.in_title = False

    def handle_data(self, data):
        if self.in_title:
            self.title += data


class SeoContracts(unittest.TestCase):
    def test_sitemap_matches_current_canonical_journey(self):
        locations = [element.text for element in ET.parse(ROOT / 'sitemap.xml').iter(
            '{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
        expected = {ORIGIN + ('' if page == 'index' else page + '.html') for page in PUBLIC}
        self.assertEqual(set(locations), expected)
        self.assertEqual(len(locations), len(expected))
        for location in locations:
            with self.subTest(url=location):
                path = urlsplit(location).path.lstrip('/') or 'index.html'
                head = Head()
                head.feed((ROOT / path).read_text())
                self.assertEqual(head.canonicals, [location])
                self.assertFalse(any('noindex' in value.lower() for value in head.robots))

    def test_page_specific_metadata_and_rendering_resources(self):
        titles, descriptions = set(), set()
        for page in sorted(PUBLIC):
            with self.subTest(page=page):
                head = Head()
                head.feed((ROOT / (page + '.html')).read_text())
                self.assertTrue(head.title.strip())
                self.assertEqual(len(head.descriptions), 1)
                self.assertTrue(head.descriptions[0].strip())
                self.assertNotIn(head.title, titles)
                self.assertNotIn(head.descriptions[0], descriptions)
                titles.add(head.title)
                descriptions.add(head.descriptions[0])
        robots = (ROOT / 'robots.txt').read_text()
        self.assertIn('Sitemap: ' + ORIGIN + 'sitemap.xml', robots)
        self.assertNotIn('Disallow: /includes/', robots)

    def test_commercial_metadata_stays_distinct_in_each_language(self):
        translations = json.loads((ROOT / 'js/translations.js').read_text().removeprefix(
            'window.translations = ').removesuffix(';\n'))
        commercial = PUBLIC - {'mentions-legales', 'cgv', 'cgu', 'confidentialite',
                               'cookies', 'retraction', 'mediation'}
        for language in ['fr', 'en', 'de', 'ar']:
            for suffix in ['title', 'description']:
                with self.subTest(language=language, field=suffix):
                    values = [translations[language]['seo_' + page + '_' + suffix]
                              for page in commercial]
                    self.assertTrue(all(values))
                    self.assertEqual(len(set(values)), len(values))


if __name__ == '__main__':
    unittest.main()
