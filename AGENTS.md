# Règles de travail — SecurityNoPhone

Demandées par Amine Harbi le 29 octobre 2026 : appliquer les mêmes exigences de conception, de prudence et de validation que Nexus Support Hub. Lire ce fichier, `docs/DESIGN_SYSTEM.md`, `docs/RELEASE_VALIDATION.md` et `docs/VALIDATED_FEATURE_BASELINE.md` avant une intervention.

## Préférence de publication du propriétaire

Instruction explicite du 29 octobre 2026 : utiliser le navigateur cloud pour publier manuellement et éviter d'épuiser GitHub Actions. Conserver les contrôles locaux et la recette navigateur ; ne pas créer de validations Actions automatiques, relancer les jobs en boucle ou utiliser Actions pour des vérifications de confort. Le workflow de validation est uniquement à déclenchement manuel, sans obligation de le lancer pour une correction statique contrôlée localement. Cette instruction remplace l'ancienne exigence de succès du job de validation Actions avant fusion. Les gardes fonctionnelles locales restent obligatoires.

GitHub Pages exécute son propre déploiement, même depuis l'interface et même en mode « Deploy from a branch ». Limiter les publications au lot vérifié ; ne pas promettre une publication Pages sans aucun workflow interne. Ne pas changer de fournisseur, domaine, HTTPS ou droits d'accès pour contourner cette contrainte. Voir la procédure de publication manuelle.

## Séparation stricte avec Nexus Support Hub

Instruction complémentaire d'Amine du 29 octobre 2026 : ce travail concerne SecurityNoPhone. Les règles, prompts, réglages, sources de connaissances et comportement du répondeur Nexus Support Hub ne doivent pas être modifiés dans ce cadre. La reprise d'exigences de qualité ne transfère pas les consignes produit SecurityNoPhone dans le répondeur Nexus.

Vérifier le dépôt et la cible avant chaque écriture ou déploiement. Les évolutions Nexus indépendantes restent hors périmètre. Si une modification du répondeur provenant précisément d'un travail SecurityNoPhone est prouvée, comparer avant/après et rétablir uniquement cette modification en conservant les autres évolutions. Sans preuve ni ancienne valeur fiable, ne pas effectuer de réinitialisation ou de rollback global. Consigner le résultat de la vérification et ses limites.

## Déploiement complet et statut à jour

Préparer et publier un lot cohérent depuis le dernier `main`, avec les pages, traductions et ressources nécessaires. Après publication, vérifier le SHA du déploiement, la présence et l'intégrité des fichiers web, puis les parcours touchés dans le navigateur. La commande `python3 scripts/verify_deployment.py` contrôle en lecture seule les fichiers web et les références de travail exposés par le site ; elle ne lance aucun workflow.

Distinguer « ensemble des fichiers publié » et « toutes les fonctions validées ». Le mobile, les services externes et les pages historiques gardent leurs statuts propres. Actualiser le compte rendu et le même document persistant de consignes : un ancien message de blocage ou une ancienne proposition non publiée ne doit pas remplacer une preuve de publication plus récente.

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
- Avant une refonte, inventorier et préserver les téléchargements, PDF, fiches imprimables et supports de formation. Leur présence doit être contrôlée sur les pages et au téléchargement ; une nouvelle présentation ne justifie pas leur suppression.
- Distinguer code relu, contrôle automatisé, recette navigateur du candidat, publication, contrôle en production et confirmation utilisateur.
- Une vue ordinateur, un zoom ou une règle CSS ne valent pas une recette mobile. Si aucune vraie largeur mobile n'est disponible, conserver le statut **non vérifié**.
- Une demande non envoyée ne prouve pas la réception d'un formulaire ; un lien de paiement ne prouve pas une capture ou un abonnement. Réserver les opérations réelles aux scénarios de test autorisés.
- Publier seulement le candidat vérifié, contrôler la réussite du déploiement du SHA exact puis la page publique. Conserver les limites et le retour arrière. Ne jamais déclarer le site entièrement validé lorsqu'un point requis reste ouvert.

Les règles métier spécifiques à Nexus (tenants, rôles, quotas IA, Live View, Supabase) ne sont pas des fonctions SecurityNoPhone. Si ces fonctions sont ajoutées, documenter et tester leurs contrats avant de les annoncer.
