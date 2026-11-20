# SecurityNoPhone — Location personnalisée pro / particulier

Date : 20 novembre 2026, Europe/Paris.

## Demande du propriétaire
Permettre à un particulier ou à un professionnel de choisir librement le nombre de pochettes à louer, **sans supprimer les packs fixes**, et conserver l'option agent et ses conditions.

## Parcours réalisés
- Accueil et Solutions : présentation différenciée particulier / professionnel avec liens `commande.html#location_particulier` et `commande.html#location_pro`.
- Menu et pied de page : raccourci « Location personnalisée ».
- Commande : choix des deux offres, quantité libre entière dès **10**, bloc explicatif, dates de début et de fin sans durée minimale, caution indicative (1,50 € par pochette), option autonome ou avec agent.
- Particulier : début J+30 minimum, fin libre, même jour possible (une journée), aucune durée minimale.
- Professionnel personnalisé : début J+30 minimum, fin libre, même jour possible, **sans durée minimale**. Les **packs Pro standards** restent soumis à trois mois calendaires minimum.
- Avec agent : 100 € TTC × agents × journées de sept heures au maximum ; à l'extérieur de Lyon, déplacement et hébergement si nécessaire en supplément sur devis.
- Le loyer des pochettes personnalisées reste **sur devis**, car aucun prix unitaire de location personnalisée n'a été approuvé. L'estimation de personnel et la caution ne constituent pas un total de location.
- Formspree et les noms des champs de commande historiques conservés ; pas de réservation ni paiement automatique.
- FR/EN/DE/AR et RTL conservés. Versions de traduction et formulaire mises à jour sur 19 pages.
- Sitemap actualisé pour Accueil, Solutions et Commande.

## Tests / non-régression
- Tests DOM-like de `tests/custom-rental-ui.test.cjs` adaptés au minimum de 10 pochettes, au rejet de 9 pochettes et au calendrier personnalisé sans durée minimale ; contrôle de la caution 37 × 1,50 = 55,50 €, des agents 2 × 3 × 100 = 600 €, des packs Pro standards à trois mois et de l'absence de prix de location inventé.
- Scénarios interactifs exécutés en environnement JS isolé : 18/18 réussis.
- Tests de fichiers, d'offres, de langues et du cache adaptés ; nouvelle suite reliée à `scripts/validate_release.py`.
- Limites : pas de preuve de réception Formspree, pas de contrôle du stock réel, pas de contrat de location personnalisé signé, pas de test navigateur mobile ou de revue juridique complète.
- Les PDF de la grille 2026 continuent de décrire les packs standards ; ils ne présentent pas comme acquis un tarif de location personnalisée.
- Séparation Nexus Support Hub respectée.

## Correction commerciale du 20 novembre 2026

L'offre de **location personnalisée** est disponible dès **10 pochettes**, pour particuliers et professionnels, sans durée minimale ; la date de début de mise à disposition est demandée **au moins 30 jours calendaires à l'avance**, ce préavis n'étant pas une durée de location. Les forfaits événementiels et les packs Pro restent à quantités fixes, ces derniers conservant leur engagement de trois mois minimum. Le devis personnalisé dépend du volume, de la durée, de la logistique, du stock et des éventuels agents, sans prix unitaire public inventé.

## Référence de simulation tarifaire (complément du 20/11/2026)

Le simulateur affiche désormais une **estimation TTC non contractuelle** pour les locations personnalisées de 10 à 484 pochettes, fondée sur les références Pro mensuelles approuvées : 10–92 = 69 € ; 93–182 = 119 € ; 183–363 = 229 € ; 364–605 = 349 € par tranche de **30 jours commencée**. L'estimation retient le maximum de cette référence pour le nombre de tranches et du tarif de la formule événementielle couvrant le volume demandé (69/109/189/299/449 € selon les cinq paliers). Pour 485 pochettes ou plus, l'estimation totale reste « sur devis », même si une référence Pro reste affichée jusqu'à 605 pochettes. L'utilisateur reste libre de louer une journée ou plusieurs jours, sans durée minimale.

Exemples de contrôle : 10 pochettes pour 1 jour → 69 € indicatifs, caution 15 € ; 37 pochettes pour 90 jours → 207 € indicatifs, caution 55,50 € ; 182 pochettes pour 1 jour → 189 € indicatifs, caution 273 € ; 182 pochettes pour 90 jours → 357 € indicatifs. L'agent optionnel reste 100 € TTC par agent/jour, en sus ; frais de déplacement et hébergement éventuels hors de Lyon sur devis. **Ces montants ne sont pas des prix garantis ni des réservations**.
