# Validation et publication — SecurityNoPhone

Appliquer les exigences Nexus à ce site statique, avec les outils réellement présents. Ne pas copier une commande npm, un service ou une validation qui n'existe pas ici.

## Contrôle reproductible

Depuis la racine du candidat :

```sh
python3 scripts/validate_release.py
```

Ce contrôle vérifie la syntaxe JS externe et inline, les fichiers liés et identifiants des pages du parcours principal, les clés FR/EN/DE/AR, les contrats minimaux du formulaire, les contrastes des paires communes et les tests de régression disponibles. Il produit une empreinte du contenu contrôlé dans `.release-validation/result.json` (ignoré par Git). Il échoue si un contrôle requis échoue ; ne pas supprimer un garde pour le contourner.

Le contrôle source ne certifie ni le rendu, ni un navigateur mobile, ni la réception Formspree, ni les paiements, ni le contenu juridique des PDF. Les pages historiques et les validations externes restent explicitement séparées.

Le workflow `.github/workflows/validate.yml` exécute le même contrôle sur le SHA exact de la PR et sur les push de `main`, avec Node.js 24 et un jeton limité à la lecture. Les actions officielles sont épinglées par SHA. Sa présence dans le code ne vaut pas réussite : vérifier le vrai résultat du job avant de fusionner. Il ne déploie pas lui-même le site et ne modifie pas les protections de branche.

## Recette et publication

1. Partir du dernier `main`, isoler les corrections confirmées dans une branche et lire les fichiers liés.
2. Comparer la baseline, exécuter le contrôle et les scénarios manuels des surfaces touchées. Documenter un changement volontaire de contrat dans la même PR.
3. Vérifier le candidat dans le navigateur : langues, RTL, focus, textes longs, erreurs, montants et navigation. Mobile seulement à une vraie largeur mobile ; sinon noter NV.
4. Ouvrir une PR avec problème, résultat, SHA, preuves et limites. Aucun changement de paiement/endpoints/contrat sans scénario adapté.
5. Après validation du candidat, fusionner et attendre la réussite du vrai job GitHub Pages du commit exact. Une mise à jour de branche ne prouve pas un déploiement.
6. Contrôler les pages affectées sur `https://securitynophone.com/`, puis consigner résultat et SHA. Conserver le retour arrière par revert du lot concerné.

Ne pas envoyer de demande commerciale, modifier un contrat, souscrire un abonnement ou effectuer un paiement réel pour un simple test d'affichage. Employer un environnement et des destinataires de test autorisés quand une preuve de transport ou de paiement est nécessaire. Ne pas stocker de secrets ou de données de visiteurs dans les preuves.
