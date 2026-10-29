# Validation et publication — SecurityNoPhone

Appliquer les exigences Nexus à ce site statique, avec les outils réellement présents. Ne pas copier une commande npm, un service ou une validation qui n'existe pas ici.

## Contrôle reproductible

Depuis la racine du candidat :

```sh
python3 scripts/validate_release.py
```

Ce contrôle vérifie la syntaxe JS externe et inline, les fichiers liés et identifiants des pages du parcours principal, les clés FR/EN/DE/AR, les contrats minimaux du formulaire, les contrastes des paires communes et les tests de régression disponibles. Il produit une empreinte du contenu contrôlé dans `.release-validation/result.json` (ignoré par Git). Il échoue si un contrôle requis échoue ; ne pas supprimer un garde pour le contourner.

Le contrôle source ne certifie ni le rendu, ni un navigateur mobile, ni la réception Formspree, ni les paiements, ni le contenu juridique des PDF. Les pages historiques et les validations externes restent explicitement séparées.

## Préférence propriétaire : publication manuelle

Le 29 octobre 2026, Amine demande explicitement une publication via le navigateur cloud et l'économie de GitHub Actions. Cette instruction remplace l'ancienne obligation de réussir la validation Actions avant fusion. La validation locale reproductible du candidat, le diff et la recette navigateur constituent le contrôle du lot statique ; une validation externe reste nécessaire si le contrat modifié l'exige.

Le workflow `.github/workflows/validate.yml` est désormais uniquement `workflow_dispatch`, sans déclenchement `push` ou `pull_request`. Il conserve le même contrôle, Node.js 24, les actions officielles épinglées et un jeton en lecture seule. Ne pas le lancer pour reproduire des contrôles locaux déjà acquis, sauf nécessité précise ou demande du propriétaire. Il ne déploie pas lui-même le site et ne modifie aucune protection de branche. Les anciens échecs avant démarrage restent historiques ; ne pas les présenter comme un échec du code ou une validation réussie.

Le site est statique et contient `.nojekyll`. La configuration Pages observée est « Deploy from a branch », `main`, `/ (root)`, domaine `securitynophone.com`, HTTPS actif. Selon GitHub, Pages utilise malgré tout un workflow interne de déploiement. Une publication manuelle n'est donc pas une garantie de zéro exécution interne. Ne pas enchaîner les essais ni modifier cette configuration sans besoin ; privilégier un seul lot complet.

## Recette et publication

1. Partir du dernier `main`, isoler les corrections confirmées dans une branche et lire les fichiers liés.
2. Comparer la baseline, exécuter le contrôle et les scénarios manuels des surfaces touchées. Documenter un changement volontaire de contrat dans la même PR.
3. Vérifier le candidat dans le navigateur : langues, RTL, focus, textes longs, erreurs, montants et navigation. Mobile seulement à une vraie largeur mobile ; sinon noter NV.
4. Ouvrir une PR avec problème, résultat, SHA, preuves et limites. Éviter les validations Actions automatiques ; employer `[skip ci]` pour les commits de préparation lorsque pertinent. Aucun changement de paiement/endpoints/contrat sans scénario adapté.
5. Après contrôle local et navigateur, publier manuellement depuis le navigateur cloud, en fusionnant la PR vérifiée. Ne pas modifier une protection de branche pour forcer la fusion. Attendre le déploiement Pages du commit exact sans relance répétée ; son workflow interne peut rester indispensable. Une mise à jour de branche ne prouve pas un déploiement.
6. Contrôler les pages affectées sur `https://securitynophone.com/`, puis consigner résultat et SHA. Conserver le retour arrière par revert du lot concerné.

## Intégrité du déploiement complet

Après le succès de Pages, depuis le checkout du commit publié :

```sh
python3 scripts/verify_deployment.py
```

Le script effectue uniquement des GET HTTPS vers SecurityNoPhone, avec quatre requêtes simultanées au maximum. Il compare les SHA-256 du contenu reçu avec ceux des pages, scripts, styles, médias, documents publics et références de travail du dépôt. Les fichiers internes Git/Actions et les sources de test ne sont pas assimilés à des pages du site. Un paramètre de requête contenant le SHA public du commit limite les confusions de cache. Le rapport se trouve dans `.release-validation/deployment.json`, ignoré par Git.

`--inventory-only` liste le périmètre sans effectuer de requête. Un fichier indisponible ou différent doit être expliqué avant de déclarer le contrôle réussi. Les anciens formulaires sont contrôlés ici comme fichiers publiés, pas comme parcours commerciaux validés. Un hash correct ne valide ni la qualité linguistique, ni le mobile, ni la réception d'un formulaire, ni une transaction.

Les réglages du répondeur Nexus Support Hub et les déploiements Nexus restent hors périmètre. Seule une modification précisément attribuable au travail SecurityNoPhone et documentée avant/après peut faire l'objet du rétablissement ciblé demandé par Amine.

Ne pas envoyer de demande commerciale, modifier un contrat, souscrire un abonnement ou effectuer un paiement réel pour un simple test d'affichage. Employer un environnement et des destinataires de test autorisés quand une preuve de transport ou de paiement est nécessaire. Ne pas stocker de secrets ou de données de visiteurs dans les preuves.

Références : documentation officielle GitHub, « Configuring a publishing source for your GitHub Pages site » et « Skipping workflow runs », consultées le 29 octobre 2026. Un message `[skip ci]` vise les événements push/pull_request ; ne pas l'assimiler à une désactivation de tous les événements Pages.
