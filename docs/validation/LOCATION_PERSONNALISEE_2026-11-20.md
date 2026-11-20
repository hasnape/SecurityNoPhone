# SecurityNoPhone — Location personnalisée pro / particulier

Date : 20 novembre 2026, Europe/Paris.

## Demande du propriétaire
Permettre à un particulier ou à un professionnel de choisir librement le nombre de pochettes à louer, **sans supprimer les packs fixes**, et conserver l'option agent et ses conditions.

## Parcours réalisés
- Accueil et Solutions : présentation différenciée particulier / professionnel avec liens `commande.html#location_particulier` et `commande.html#location_pro`.
- Menu et pied de page : raccourci « Location personnalisée ».
- Commande : choix des deux offres, quantité libre entière dès 1, bloc explicatif, compteur de caution indicative (1,50 € par pochette), option autonome ou avec agent.
- Particulier : événement ponctuel, date J+30 au minimum.
- Professionnel : début J+30 au minimum, fin correspondant à **trois mois calendaires minimum**.
- Avec agent : 100 € TTC × agents × journées de sept heures au maximum ; à l'extérieur de Lyon, déplacement et hébergement si nécessaire en supplément sur devis.
- Le loyer des pochettes personnalisées reste **sur devis**, car aucun prix unitaire de location personnalisée n'a été approuvé. L'estimation de personnel et la caution ne constituent pas un total de location.
- Formspree et les noms des champs de commande historiques conservés ; pas de réservation ni paiement automatique.
- FR/EN/DE/AR et RTL conservés. Versions de traduction et formulaire mises à jour sur 19 pages.
- Sitemap actualisé pour Accueil, Solutions et Commande.

## Tests / non-régression
- 5 tests DOM-like ajoutés dans `tests/custom-rental-ui.test.cjs` : quantités libres, caution 37 × 1,50 = 55,50 €, mode agent 2 × 3 × 100 = 600 €, absence de prix inventé, période pro trois mois, forfaits et achats standards inchangés, rejet d'une date passée.
- Scénarios interactifs exécutés en environnement JS isolé : 18/18 réussis.
- Tests de fichiers, d'offres, de langues et du cache adaptés ; nouvelle suite reliée à `scripts/validate_release.py`.
- Limites : pas de preuve de réception Formspree, pas de contrôle du stock réel, pas de contrat de location personnalisé signé, pas de test navigateur mobile ou de revue juridique complète.
- Les PDF de la grille 2026 continuent de décrire les packs standards ; ils ne présentent pas comme acquis un tarif de location personnalisée.
- Séparation Nexus Support Hub respectée.
