# Baseline et limites — SecurityNoPhone

Base de reprise : `a43dfd100abe8e5bdb95630c9090592e1219f7d1`, 29 octobre 2026.

## Contrats à préserver

- Pages publiques et destinations : Accueil, Solutions, Accompagnement, Expérience, Publics, Secteurs, Contact, Guides, Ressources, Support, Commande, Suivi et documents légaux.
- Langues communes : FR/EN/DE/AR ; AR en RTL. Le choix explicite persiste dans la navigation.
- Offres et valeurs de référence : autonome 150 EUR/jour ; personnel 390 EUR/jour ; agent supplémentaire 100 EUR/jour ; déplacement 80 EUR ; logement 80 EUR/jour/agent ; achat 3,50 EUR/unité, minimum 50 ; Starter 19 EUR/mois jusqu'à 50 pochettes ; caution 300 EUR par tranche de 700 pour location/abonnement. Au-delà des quantités annoncées : devis.
- Dates inclusives de location ; jours inversés ou dates manquantes bloqués ; quantités entières positives ; achat inférieur à 50 bloqué. Les champs masqués ne bloquent pas la demande.
- Formulaire principal `commande.html` : action `https://formspree.io/f/xqaqogdv`, méthode POST, noms des champs et anti-robot conservés. Ce formulaire ne capture pas de paiement.
- Présélections : `#rental`, `#autonomous`, `#custom`, `#abonnement`, `#special`. Saisie et choix restent préservés lors d'un changement de langue.
- Contacts existants et fichier du logo conservés. Les fichiers légaux ne sont pas réécrits par une correction graphique.
- Support et Ressources : conserver les six fiches du kit (retour matériel, livraison/retour, protocole, notice, contact, signalétique FR/EN), leur téléchargement PDF et leur ouverture pour impression. Le guide de formation issu du déroulé historique est également disponible en PDF. Les modèles sont en français, la signalétique en français/anglais ; ce statut linguistique est explicite dans l'interface.
- Description produit : référence propriétaire du 29 octobre dans `docs/PRODUCT_FACTS.md`. Modèle avec fenêtre : écran utilisable, appels/messages, image de caméra avant floutée. Modèle sans fenêtre : pas d'accès à l'écran. Tous les modèles : similicuir, antivol et aimant professionnel fourni. Ce sont des caractéristiques communiquées, pas une nouvelle preuve d'essai matériel.

## Preuves acquises et limites

La recette précédente a observé l'accueil et les nouveaux contenus en quatre langues sur ordinateur ; les calculs et limites du formulaire ont été vérifiés localement, puis l'achat 50 unités à 175 EUR a été observé en production sans envoi. Ce sont des preuves de rendu/calcul, pas de réception commerciale ou d'exécution de commande.

Mobile réel ou viewport mobile : non vérifié. Réception Formspree, paiement, facturation, suivi logistique réel et conformité juridique : non certifiés par ces contrôles. Aucun espace authentifié n'a été constaté dans le parcours principal.

Les pages historiques `commande_*.html`, `order*.html`, `index_fully_translated_*.html` et `index_es.html` sont des surfaces distinctes, avec du contenu et parfois des scripts différents. Ne pas les considérer conformes au seul motif que le formulaire principal fonctionne ; les inventorier et les traiter par un lot dédié avant d'annoncer une validation globale.

Le suivi initial présente des données de démonstration pour CMD123/456/789, sans raccordement logistique constaté. Corriger cette présentation sans inventer de statut réel.
