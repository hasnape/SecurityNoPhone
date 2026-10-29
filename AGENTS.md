# Règles de travail — SecurityNoPhone

Demandées par Amine Harbi le 29 octobre 2026 : appliquer les mêmes exigences de conception, de prudence et de validation que Nexus Support Hub. Lire ce fichier, `docs/DESIGN_SYSTEM.md`, `docs/RELEASE_VALIDATION.md` et `docs/VALIDATED_FEATURE_BASELINE.md` avant une intervention.

## Avant de modifier

- Partir de la version actuelle de `main`, contrôler le diff et lire les consommateurs, scripts, traductions, formulaires, liens et configurations concernés.
- Identifier le visiteur, sa tâche, l'action principale et les états attendus avant de dessiner l'interface.
- Examiner les conséquences sur les offres, les dates, les quantités, les cautions, les demandes, les paiements, les données et les consentements lorsqu'ils sont touchés.
- Corriger la cause et les fichiers liés nécessaires, en petits lots cohérents. Préserver les parcours déjà acquis. Ne pas remplacer le site par une ancienne pièce jointe.
- Consulter la documentation officielle lorsqu'un comportement technique reste incertain.

## Conception et contenu

- Réutiliser les variables et composants `snf-*` de `style.css`. Conserver le logo officiel et l'identité propre à SecurityNoPhone ; la méthode Nexus ne signifie pas copier sa palette bleue.
- Vérifier hiérarchie des actions, lisibilité, focus clavier, cibles, contrastes, textes longs, FR/EN/DE/AR et RTL. Employer les propriétés CSS logiques.
- Ne pas modifier implicitement tarifs, contrats, endpoints, consentements ou moyens de paiement pour une correction graphique.
- Ne pas inventer de clients, résultats, assurances, certifications, disponibilité humaine ou fonctions. Signaler les exemples et simulations avant leur utilisation. Un statut de commande doit provenir d'une source réelle ou être explicitement présenté comme exemple.
- Avant de modifier une description produit, lire `docs/PRODUCT_FACTS.md` : distinguer les modèles avec/sans fenêtre, l'effet sur la caméra avant, le similicuir et le verrouillage par antivol avec aimant fourni.
- Ne pas masquer un débordement global pour le déclarer corrigé. Traiter sa cause et tester les contenus longs.

## Après modification

- Lancer les contrôles adaptés avec `python3 scripts/validate_release.py`, les régressions utiles et la recette navigateur des parcours affectés.
- Vérifier les liens, traductions, contrats et fichiers liés ; examiner le diff et conserver les preuves dans le dépôt.
- Distinguer code relu, contrôle automatisé, recette navigateur du candidat, publication, contrôle en production et confirmation utilisateur.
- Une vue ordinateur, un zoom ou une règle CSS ne valent pas une recette mobile. Si aucune vraie largeur mobile n'est disponible, conserver le statut **non vérifié**.
- Une demande non envoyée ne prouve pas la réception d'un formulaire ; un lien de paiement ne prouve pas une capture ou un abonnement. Réserver les opérations réelles aux scénarios de test autorisés.
- Publier seulement le candidat vérifié, contrôler la réussite du déploiement du SHA exact puis la page publique. Conserver les limites et le retour arrière. Ne jamais déclarer le site entièrement validé lorsqu'un point requis reste ouvert.

Les règles métier spécifiques à Nexus (tenants, rôles, quotas IA, Live View, Supabase) ne sont pas des fonctions SecurityNoPhone. Si ces fonctions sont ajoutées, documenter et tester leurs contrats avant de les annoncer.
