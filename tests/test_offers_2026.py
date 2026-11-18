"""Static regression checks for the current public commercial statements."""
from pathlib import Path
import json
import unittest

ROOT = Path(__file__).resolve().parents[1]
PAGES = {name: (ROOT / name).read_text(encoding="utf-8")
         for name in ("index.html", "support.html", "commande.html", "cgv.html",
                      "blog.html", "includes/footer.html", "js/order-form.js",
                      "sitemap.xml")}
TRANSLATIONS = json.loads(
    (ROOT / "js/translations.js").read_text(encoding="utf-8")
        .removeprefix("window.translations = ").removesuffix(";\n")
)
OFFER_KEYS = ("pricing_rental_autonomous_title", "pricing_rental_staff_title",
              "pricing_subscription_title", "pricing_pro_title",
              "pricing_custom_title")
NEW_KEYS = ("pricing_pro_title", "pricing_pro_price", "pricing_pro_qty",
            "pricing_pro_note", "pricing_pro_summary", "option_subscription_pro",
            "pricing_starter_conditions", "support_offers_intro",
            "pricing_logistics_2026", "legal_cgv_revision_status",
            "legal_offers_2026_title", "legal_offers_2026_intro",
            "legal_agent_duration_2026", "legal_offers_2026_notice",
            "legal_offers_2026_cta", "footer_pdf_archive_notice")


class CommercialOffers2026(unittest.TestCase):
    def test_five_offers_visible_on_home_support_and_cgv(self):
        for filename in ("index.html", "support.html", "cgv.html"):
            with self.subTest(page=filename):
                for key in OFFER_KEYS:
                    self.assertIn('data-i18n="' + key + '"', PAGES[filename])

    def test_same_quantity_and_staff_duration(self):
        for filename in ("index.html", "support.html"):
            with self.subTest(page=filename):
                self.assertIn("500 pochettes", PAGES[filename])
                self.assertNotIn("700 pochettes</span>", PAGES[filename])
                self.assertIn("390 € TTC / jour", PAGES[filename])
                self.assertIn("150 € TTC / jour", PAGES[filename])
        self.assertIn("7 h", PAGES["support.html"])
        self.assertIn("7h/jour/agent", PAGES["index.html"])
        self.assertNotIn("Nos formules 2025", PAGES["support.html"])

    def test_official_prices_and_limits_on_public_pages(self):
        amounts = {
            "pricing_rental_autonomous_qty": "500",
            "pricing_rental_staff_qty": "500",
            "pricing_subscription_qty": "100",
            "pricing_pro_qty": "300",
            "pricing_subscription_price": "20",
            "pricing_pro_price": "60",
        }
        import re
        for page in ("index.html", "support.html", "cgv.html"):
            for key, expected in amounts.items():
                with self.subTest(page=page, key=key):
                    match = re.search(r'data-i18n="' + key + r'"[^>]*>([^<]+)', PAGES[page])
                    self.assertIsNotNone(match)
                    self.assertIn(expected, match.group(1))

    def test_official_price_translations(self):
        expected = {
            "pricing_rental_staff_qty": 500,
            "pricing_rental_autonomous_qty": 500,
            "pricing_subscription_qty": 100,
            "pricing_pro_qty": 300,
        }
        for lang in ("fr", "en", "de", "ar"):
            for key, amount in expected.items():
                with self.subTest(lang=lang, key=key):
                    self.assertIn(str(amount), TRANSLATIONS[lang][key])
            self.assertIn("20", TRANSLATIONS[lang]["pricing_subscription_price"])
            self.assertIn("60", TRANSLATIONS[lang]["pricing_pro_price"])

    def test_minimum_three_months_on_public_pages(self):
        for name in ("index.html", "support.html", "cgv.html"):
            with self.subTest(page=name):
                self.assertIn('data-i18n="pricing_rental_terms_note"', PAGES[name])
        self.assertIn('data-i18n="rental_min_term_info"', PAGES["commande.html"])
        for name in ("index.html", "commande.html"):
            self.assertNotIn("3 jours = 450", PAGES[name])
            self.assertNotIn("3 jours = 1 170", PAGES[name])
        for lang in ("fr", "en", "de", "ar"):
            for key in ("rental_min_term_info", "order_dates_min_three_months", "pricing_rental_terms_note", "quote_rental_long_term"):
                self.assertTrue(TRANSLATIONS[lang].get(key), (lang, key))

    def test_current_script_cache_across_all_pages(self):
        pages = ("index", "solutions", "accompagnement", "experience", "clients",
                 "secteurs", "contact", "blog", "ressources", "support", "commande",
                 "suivi", "mentions-legales", "cgv", "cgu", "confidentialite",
                 "cookies", "retraction", "mediation")
        for name in pages:
            with self.subTest(page=name):
                content = (ROOT / (name + ".html")).read_text(encoding="utf-8")
                self.assertIn("js/translations.js?v=20261117-offres-officielles", content)
        self.assertIn("js/order-form.js?v=20261117-offres-officielles",
                      PAGES["commande.html"])

    def test_pro_is_quote_only_not_auto_charge(self):
        self.assertIn('value="abonnement_pro"', PAGES["commande.html"])
        self.assertIn('commande.html#pro', PAGES["index.html"])
        self.assertIn("abonnement_pro: { type: 'custom' }", PAGES["js/order-form.js"])
        self.assertIn("pro: 'abonnement_pro'", PAGES["js/order-form.js"])
        self.assertIn("offer.type === 'rental'", PAGES["js/order-form.js"])
        self.assertIn("minimumRentalEndDate", PAGES["js/order-form.js"])
        self.assertIn("order_dates_min_three_months", PAGES["js/order-form.js"])
        self.assertIn("quantity > 100", PAGES["js/order-form.js"])

    def test_existing_form_and_rates_untouched(self):
        self.assertIn('action="https://formspree.io/f/xqaqogdv"', PAGES["commande.html"])
        self.assertIn("abonnement: { type: 'subscription', pricePerPack: 20, packSize: 100 }",
                      PAGES["js/order-form.js"])
        self.assertIn("return blocks * 300;", PAGES["js/order-form.js"])

    def test_translation_coverage(self):
        for lang in ("fr", "en", "de", "ar"):
            with self.subTest(lang=lang):
                for key in NEW_KEYS:
                    self.assertTrue(TRANSLATIONS[lang].get(key), key)

    def test_archival_pdf_and_nonfactual_examples_identified(self):
        self.assertIn('data-i18n="footer_pdf_archive_notice"', PAGES["includes/footer.html"])
        self.assertIn('data-i18n="pricing_pro_summary"', PAGES["commande.html"])
        self.assertIn('data-i18n="pricing_pro_price"', PAGES["cgv.html"])
        self.assertIn("illustratifs", PAGES["blog.html"])
        self.assertIn('data-i18n="legal_offers_2026_notice"', PAGES["cgv.html"])

    def test_sitemap_dates(self):
        for path in ("", "support.html", "commande.html", "cgv.html"):
            self.assertIn("<loc>https://securitynophone.com/" + path +
                          "</loc>\n    <lastmod>2026-11-17</lastmod>",
                          PAGES["sitemap.xml"])


if __name__ == "__main__":
    unittest.main()
