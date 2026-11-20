"""Public SecurityNoPhone offer and 30-day booking regression checks."""
from pathlib import Path
import json
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
PAGES = {name: (ROOT / name).read_text(encoding="utf-8")
         for name in ("index.html", "solutions.html", "support.html", "commande.html",
                      "cgv.html", "blog.html", "includes/footer.html",
                      "js/order-form.js", "sitemap.xml")}
TRANSLATIONS = json.loads((ROOT / "js/translations.js").read_text(encoding="utf-8")
                          .removeprefix("window.translations = ").removesuffix(";\n"))
EVENTS = {"mini": (49, 69), "essentiel": (97, 109), "confort": (182, 189),
          "grand": (303, 299), "prestige": (484, 449)}
PROFESSIONAL = {"education": (92, 69), "starter": (182, 119),
                "business": (363, 229), "entreprise": (605, 349)}

class SecurityNoPhoneOffers2026(unittest.TestCase):
    def test_packages_prices_and_cta_are_same_on_commercial_pages(self):
        for page in ("index.html", "solutions.html", "support.html", "cgv.html"):
            with self.subTest(page=page):
                body = PAGES[page]
                for key, (qty, price) in EVENTS.items():
                    self.assertIn(f'commande.html#event_{key}', body)
                    self.assertRegex(body, re.escape(f'data-i18n="event_{key}_title"')
                                     + rf"[\s\S]*?<td>{qty}</td>[\s\S]*?{price} €")
                for key, (qty, price) in PROFESSIONAL.items():
                    self.assertIn(f'commande.html#pro_{key}', body)
                    self.assertRegex(body, re.escape(f'data-i18n="pro_{key}_title"')
                                     + rf"[\s\S]*?<td>{qty}</td>[\s\S]*?{price} €")
                for value in ("5,90 €", "5,50 €", "4,90 €"):
                    self.assertIn(value, body)
                for rule in ("booking_30_days_notice", "offer_delivery_included",
                             "offer_replacement_terms", "pro_includes_details"):
                    self.assertIn(f'data-i18n="{rule}"', body)

    def test_form_packages_and_existing_contact_contract(self):
        form = PAGES["commande.html"]
        script = PAGES["js/order-form.js"]
        self.assertIn('action="https://formspree.io/f/xqaqogdv"', form)
        self.assertIn('method="POST"', form)
        for name in ("offre", "quantite", "date_debut", "date_fin", "date_souhaitee",
                     "nom", "email", "adresse", "_gotcha", "montant_total_estime",
                     "caution_total", "tarif_remplacement_unitaire"):
            self.assertIn(f'name="{name}"', form)
        for offer in [f"event_{x}" for x in EVENTS] + [f"pro_{x}" for x in PROFESSIONAL] + ["achat", "special_event", "location_particulier", "location_pro"]:
            self.assertIn(f'value="{offer}"', form)
            self.assertIn(offer + ":", script)
        self.assertIn("const NOTICE_DAYS = 30;", script)
        self.assertIn("const DEPOSIT_PER_POUCH = 1.50;", script)
        self.assertIn("function earliestRequestDate()", script)
        self.assertIn("function minimumRentalEndDate(startValue)", script)
        self.assertIn("function purchaseUnitPrice(quantity)", script)
        self.assertIn("targetInput.required = dated", script)
        self.assertIn("startInput.required = professional", script)
        self.assertIn("endInput.required = professional", script)
        self.assertIn("priceDisplay.textContent = quantityOk ? label : ''", script)
        self.assertIn("replacementUnitPrice(quantity)", script)

    def test_four_languages_have_all_public_tariff_keys(self):
        keys = [
            "booking_30_days_notice", "event_includes_details", "pro_includes_details",
            "purchase_includes_details", "offer_delivery_included", "offer_replacement_terms",
            "booking_too_soon", "booking_date_required", "booking_event_estimate",
            "booking_pro_estimate", "booking_purchase_estimate",
            "booking_requested_date_label", "rental_min_term_info",
            "order_dates_min_three_months", "offer_quote_only",
            "offer_location_particulier", "offer_location_pro",
            "custom_rental_price_pending", "custom_rental_agent_price_pending",
            "custom_rental_quantity_help", "custom_rental_section_title",
            "custom_rental_pro_title", "custom_rental_private_title"]
        keys += ["offer_event_"+k for k in EVENTS]
        keys += ["offer_pro_"+k for k in PROFESSIONAL]
        for lang in ("fr", "en", "de", "ar"):
            with self.subTest(lang=lang):
                for key in keys:
                    self.assertTrue(TRANSLATIONS[lang].get(key), key)
                for key, (qty, price) in EVENTS.items():
                    value = TRANSLATIONS[lang]["offer_event_"+key]
                    self.assertIn(str(qty), value)
                    self.assertIn(str(price), value)
                for key, (qty, price) in PROFESSIONAL.items():
                    value = TRANSLATIONS[lang]["offer_pro_"+key]
                    self.assertIn(str(qty), value)
                    self.assertIn(str(price), value)

    def test_custom_rental_profiles_and_discoverability(self):
        form, script = PAGES["commande.html"], PAGES["js/order-form.js"]
        for key in ("location_particulier", "location_pro"):
            self.assertIn(f'value="{key}"', form)
            self.assertIn(f'href="#{key}"', form)
            self.assertIn(f'commande.html#{key}', PAGES["index.html"])
            self.assertIn(f'commande.html#{key}', PAGES["solutions.html"])
            self.assertIn(key + ":", script)
        self.assertIn('data-custom-quantity-hint', form)
        self.assertIn("const customRental =", script)
        self.assertIn("const professional = offer?.type === 'professional' || offer?.type === 'custom_professional'", script)
        self.assertIn("customRental && quantityInput) quantityInput.value = '1'", script)
        self.assertIn("const pricedSubtotal = total !== null", script)
        self.assertIn("const NOTICE_DAYS = 30;", script)
        self.assertIn("const DEPOSIT_PER_POUCH = 1.50;", script)
        self.assertIn("const AGENT_DAY_RATE = 100;", script)

    def test_cache_busting_on_all_19_pages(self):
        names = ("index", "solutions", "accompagnement", "experience", "clients",
                 "secteurs", "contact", "blog", "ressources", "support", "commande",
                 "suivi", "mentions-legales", "cgv", "cgu", "confidentialite",
                 "cookies", "retraction", "mediation")
        for name in names:
            with self.subTest(name=name):
                html = (ROOT / (name + ".html")).read_text(encoding="utf-8")
                self.assertIn("js/translations.js?v=20261120-custom-rental-v1", html)
        self.assertIn("js/order-form.js?v=20261120-custom-rental-v1", PAGES["commande.html"])

    def test_retired_three_day_and_old_price_offers_not_in_current_pages(self):
        for name in ("index.html", "solutions.html", "support.html", "cgv.html", "commande.html"):
            with self.subTest(name=name):
                html = PAGES[name]
                for retired in ("150 € TTC / jour", "390 € TTC / jour",
                                "20 € / mois", "60 € / mois", "3 jours = 450",
                                "1 170 € TTC", "300 € par tranche de 700"):
                    self.assertNotIn(retired, html)

    def test_support_pdf_documents_current(self):
        support = PAGES["support.html"]
        home = PAGES["index.html"]
        footer = PAGES["includes/footer.html"]
        for filename in ("fiche-retour-materiel.pdf", "bon-livraison-retour.pdf",
                         "protocole-confidentialite.pdf", "notice-utilisation-rapide.pdf",
                         "etiquette-contact.pdf", "signaletique-bilingue.pdf",
                         "guide-formation-equipes.pdf", "grille-offres-2026.pdf"):
            path = ROOT / "documents" / "support" / filename
            with self.subTest(pdf=filename):
                self.assertGreater(path.stat().st_size, 2000)
                data = path.read_bytes()
                self.assertTrue(data.startswith(b"%PDF-"))
                self.assertIn(b"%%EOF", data[-128:])
                self.assertIn(filename, support)
        self.assertIn("grille-offres-2026.pdf", home)
        self.assertIn("grille-offres-2026.pdf", footer)

    def test_archival_pdf_notice(self):
        self.assertIn('data-i18n="footer_pdf_archive_notice"', PAGES["includes/footer.html"])
        self.assertIn("illustratifs", PAGES["blog.html"])
        self.assertIn('data-i18n="legal_offers_2026_notice"', PAGES["cgv.html"])

    def test_sitemap_modified_dates(self):
        for path in ("", "solutions.html", "commande.html"):
            self.assertIn("<loc>https://securitynophone.com/" + path +
                          "</loc>\n    <lastmod>2026-11-20</lastmod>",
                          PAGES["sitemap.xml"])
        for path in ("support.html", "cgv.html"):
            self.assertIn("<loc>https://securitynophone.com/" + path +
                          "</loc>\n    <lastmod>2026-11-18</lastmod>",
                          PAGES["sitemap.xml"])

if __name__ == "__main__":
    unittest.main()
