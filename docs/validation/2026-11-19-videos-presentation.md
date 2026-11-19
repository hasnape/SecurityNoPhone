# Présentation vidéo sur l'accueil — 19 novembre 2026

## Portée du lot

- Nouvelle section `#presentation-videos` sur l'accueil, après le bandeau principal.
- Trois vidéos **déjà présentes dans le dépôt** : `media/pochette-securitynophone.mp4`, `media/personnalisation.mp4`, `media/pochette-finitions.mp4`.
- Légendes descriptives FR/EN/DE/AR et lecture volontaire, commandes natives, format portrait préservé, lien MP4.
- Action commerciale vers Contact, lien vers toutes les démonstrations sur Solutions.
- Aucun changement des offres, formulaires, contrats, documents PDF, liens de téléchargement, domaines ou règles Nexus.

## Média publicitaire récent non inclus dans cette PR

La vidéo TikTok créée en novembre 2026 (29,4 s) et la courte démonstration du dispositif d'ouverture ne sont **pas** hébergées par cette PR, car les nouveaux fichiers vidéo n'ont pas pu être transférés directement au dépôt depuis l'environnement de travail. Les originaux et des versions web optimisées sont fournis dans un lot d'intégration distinct.

Avant d'annoncer que la nouvelle vidéo TikTok est en ligne, il faudra déposer ces médias dans `media/`, remplacer la source du lecteur principal par `media/presentation-securitynophone.mp4`, ajouter l'affiche `media/presentation-securitynophone-poster.jpg`, puis vérifier les réponses HTTPS et la lecture réelle.

## Vérifications réalisées et limites

- Section nouvelle, identifiants distincts, chemins MP4 déjà connus dans le dépôt.
- Clés nouvelles présentes dans les quatre langues ; syntaxe de l'objet de traduction revalidée.
- CSS autonome, sans lecture automatique ni nouvelle dépendance JavaScript.
- Validation complète `scripts/validate_release.py`, recette sur navigateur/mobile et déploiement public : **non exécutés dans cette intervention**.
- La PR doit être relue et fusionnée selon la procédure de publication manuelle en vigueur ; son existence ne signifie pas publication.
