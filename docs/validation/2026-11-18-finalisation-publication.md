# Finalisation et publication — 18 novembre 2026

## Cible et référence

Projet **SecurityNoPhone uniquement**, dépôt `hasnape/SecurityNoPhone`. Le lot part du `main` comprenant la grille validée et le délai commercial J+30. Aucune modification Nexus Support Hub.

## Contenu finalisé

- Grille approuvée : 5 offres événementielles (49/69 €, 97/109 €, 182/189 €, 303/299 €, 484/449 €) ; 4 abonnements pro sur trois mois minimum (92/69 €, 182/119 €, 363/229 €, 605/349 € par mois) ; vente définitive minimum 50, paliers 5,90 €/5,50 €/4,90 € selon volume.
- Délai de demande obligatoire de **30 jours calendaires minimum**, y compris achat, validé sur les dates civiles France métropolitaine côté navigateur. Les disponibilités ne sont pas réservées sans devis accepté. Aucun paiement reçu par ce formulaire.
- **Sept documents PDF de support régénérés** et **huitième guide PDF des offres** ajouté sous `documents/support/grille-offres-2026.pdf`. Visuels et contenus opérationnels dans la charte de marque, champ d'inventaire et supports FR / signalétique FR-EN.
- Liens PDF accessibles depuis Accueil, Support, CGV HTML et pied de page. PDF commerciaux valides en tant que supports d'information ; ils ne sont pas des conditions générales signées.
- Fiche fournisseur et coûts unitaires privés non publiés.
- Pages HTML de CGV, mentions légales, confidentialité et rétractation complétées avec les éléments vérifiables : GitHub Pages et coordonnées de l'hébergeur, traitement de la demande via Formspree, caution/remplacement, rétractation distincte du préavis commercial. Textes harmonisés FR/EN/DE/AR.
- Le nom nominatif du directeur de publication, l'attestation d'assurance, la durée effective de conservation des données, le choix d'un médiateur de la consommation et les modalités juridiques précises des contrats nécessitent encore confirmation et validation du propriétaire. Ne jamais les inventer.
- Les anciens PDF juridiques restent accessibles **uniquement comme archives**, sans les présenter comme le référentiel commercial actuel. Leur contenu n'est pas juridiquement révisé : remplacement à effectuer après validation par un conseil qualifié.
- Générateur des PDF de support et scripts de contrôle adaptés ; source responsable de fichiers (en cas de régénération future) documentée.
- Cache de `js/main.js` et `js/translations.js` invalidé sur 19 pages, chargement de l'en-tête/pied de page versionné pour exposer les nouveaux liens.

## Contrôles techniques réalisés dans cette session

- GitHub API : ancienne version commerciale `275b1873048f7e6662a6d851147c630469f265e9` : workflow interne « pages build and deployment » **success**, 18/11/2026 07:39 UTC. Ceci ne préjuge pas du déploiement du nouveau lot.
- Code branche candidate : **19 pages + 2 fragments**, vérifications statiques de toutes les clés de traduction en français/anglais/allemand/arabe et balises H1/IDs : aucun problème observé.
- **239 références locales** contrôlées sur 21 pages et fragments : aucune cible absente.
- **Six scripts JavaScript** vérifiés syntaxiquement.
- **34 tests réellement exécutés** sur les calculateurs de dates, les 9 quantités/prix, les trois paliers de vente, la caution et le préavis : passés.
- Les huit PDF sont bien présents dans l'arbre Git, leur taille est positive (2,7 à 7,1 Ko). Un PDF de même structure a été rendu et inspecté localement en A4 ; l'ensemble des huit fichiers exacts n'a **pas** été rendu individuellement par un visualiseur : ne pas prétendre une recette PDF graphique complète.
- Script `python3 scripts/validate_release.py` : à exécuter dans un vrai checkout Git. L'accès réseau de l'environnement d'exécution local empêche le clone du dépôt ; les vérifications ci-dessus ne constituent pas cette suite Python complète.

## Limites et points sous responsabilité du propriétaire

1. **Recette du domaine public** : le navigateur de consultation externe renvoie 502 ou une copie ancienne. Après fusion, confirmer le workflow Pages `success` sur SHA exact, puis faire un contrôle sur un vrai navigateur/mobile et vérifier les contenus, PDF et temps de chargement. Un workflow `success` ne prouve pas que le domaine fonctionne pour tous les visiteurs.
2. **Contrat** : CGV et droit de rétractation doivent être validés juridiquement ; les anciens PDF juridiques datés restent identifiés comme archives.
3. **Formulaire** : le préavis J+30 est vérifié **uniquement côté client**. Formspree peut techniquement recevoir une requête POST construite hors de l'interface. Vérifier les dates et disponibilités manuellement **avant** devis ferme et paiement.
4. **Formspree** : la réception des soumissions n'a pas été testée et aucune donnée personnelle de test n'a été envoyée.
5. **Mondial Relay** : poids, dimensions, transporteur et disponibilité des Lockers pour 303/363/484/605 pochettes doivent être validés par des colis pesés ; coûts supplémentaires à confirmer avant signature.
6. **Stock** : hypothèse commerciale d'un stock de 1 000 pochettes, pas un inventaire vérifié.
7. **Comptabilité** : mentions et facturation TVA doivent être validées avec le statut de l'entreprise.
8. **Recherche/SEO** : Search Console non accessible, indexation et anciennes URL PDF non vérifiées.

## Retour arrière

Revert du commit de finalisation seul sur `main` en cas de régression. Préserver la grille commerciale validée et les autres projets.
