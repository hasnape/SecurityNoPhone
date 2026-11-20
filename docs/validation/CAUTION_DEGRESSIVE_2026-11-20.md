# Recette — caution dégressive progressive SecurityNoPhone
Date : 20 novembre 2026 — règle proposée puis validée dans la conversation.

## Contrat métier
- Caution indicative **remboursable** pour toutes les locations : événementielles, packs Pro et sur mesure ; **aucune caution pour les achats définitifs**.
- Calcul **marginal progressif**, sans réduction rétroactive du taux des premières pochettes :
  - pochettes 1 à 49 : 150 centimes chacune ;
  - pochettes 50 à 99 : 140 centimes chacune ;
  - pochettes 100 à 299 : 125 centimes chacune ;
  - à partir de la 300e : 110 centimes chacune.
- Exactitude des seuils : 49 = 73,50 € ; 50 = 74,90 € ; 99 = 143,50 € ; 100 = 144,75 € ; 299 = 393,50 € ; 300 = 394,60 €.
- Autres références : 10 = 15 € ; 37 = 55,50 € ; 97 = 140,70 € ; 182 = 247,25 € ; 303 = 397,90 € ; 484 = 597 € ; 605 = 730,10 €.
- La caution n'est pas un produit vendu, un revenu encaissé définitivement, ni le prix de remplacement des pochettes endommagées. Restitution après inventaire, déductions justifiées si besoin, **sans double facturation** ; usure normale non facturée.
- Les montants estimés à prévoir = location indicative + agents connus + caution remboursable ; afficher clairement **l'absence de paiement à l'envoi du formulaire** et les surcoûts logistiques/agent hors de Lyon au devis.
- Quantité de location personnalisée minimum 10 et durée libre, réservation demandée à J+30. Packs et tarifs existants et option agent à 100 € TTC/jour ≤7 heures inchangés.

## Parcours corrigés
- `js/order-form.js` : fonction unique `calculateDeposit` calculée en centimes entiers, valeur du champ Formspree `caution_total`, récap agent, estimation avant restitution et caution séparée.
- `commande.html` : détail repliable des quatre paliers, exemple à 182 pochettes, recapitulatif calculé et avertissement sans paiement.
- Accueil, Solutions, Support, CGV : remplacement des anciens taux de caution fixes.
- `js/translations.js` : traductions FR/EN/DE/AR, y compris montants au format local et rappel sur les documents PDF.
- `docs/OFFRES_2026.md` et la baseline enregistrent la règle approuvée.

## Suivi PDF
La grille commerciale PDF existante a été produite avant le présent ajustement. **Elle ne doit pas être invoquée comme source du nouveau barème de caution.** Un avertissement explicite est affiché à côté de ses liens publics ; les packs standards dans le PDF restent des références de tarif. Une éventuelle réédition du binaire PDF nécessite une recette graphique distincte. Le devis accepté et le simulateur à jour préviennent la confusion.

## Validation
- Les suites `tests/rental-term.test.cjs`, `tests/custom-rental-ui.test.cjs` et `tests/checkout-modules.test.cjs` couvrent les seuils, la monotonie, les changements d'offres et la caution nulle pour achat, les totaux estimés, l'absence de devis ferme et les offres historiques.
- `tests/test_offers_2026.py` et `scripts/validate_release.py` mis à jour.
- Tests réels Formspree, mobile, suivi logistique, audit juridique et rendu PDF **non prouvés** par les vérifications statiques ou les simulations JS.
