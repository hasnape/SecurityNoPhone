# SecurityNoPhone — charte et méthode de conception

Version 1.0 — 29 octobre 2026 — Amine Harbi / Rép&Web.

Référence technique adaptée de la méthode Nexus Support Hub v1.9, à partir de l'identité SecurityNoPhone existante. Le CSS exécutable est `style.css`. Toute nouvelle primitive ou exception doit être motivée ; modifier la charte et le CSS ensemble.

## Identité

Nom : **SecurityNoPhone**. Logo existant : `images/IMG_20250421_182622-removebg-preview.png`. Garder proportions, contenu et zone de protection ; ne pas recolorer, étirer ou redessiner. Préserver le nom accessible du lien. Le fichier produit tiers reste légendé comme visuel fournisseur ; il ne constitue pas une référence client.

Conserver la palette or, encre et surfaces claires. Les dimensions du logo dépendent du contexte ; un ajustement d'en-tête ne doit pas modifier tous les logos par une surcharge globale. Une image carrée ne doit pas remplacer le mot-symbole horizontal.

## Variables et rôles

| Variable | Valeur | Usage |
|---|---|---|
| `--snf-background` | `#f7f8fb` | Fond général |
| `--snf-surface` | `#ffffff` | Surface principale |
| `--snf-surface-soft` | `#f1f4fa` | Surface secondaire |
| `--snf-text` | `#1d2330` | Texte et texte sur or |
| `--snf-text-muted` | `#5c6470` | Aide lisible |
| `--snf-accent` | `#c5a14e` | Action principale, avec texte encre |
| `--snf-accent-strong` | `#765411` | Liens/actions sur fond clair ; survol avec texte blanc |
| `--snf-focus` | `#765411` | Focus sur fond clair |
| `--snf-hero` | `#111b2a` | En-tête éditorial sombre |
| `--snf-focus-light` | `#f0d691` | Focus/commande sur fond sombre |

Ne pas utiliser l'or clair comme texte courant sur blanc. Les contrôles automatisés calculent les paires de contraste ; ils ne constituent pas un audit WCAG complet. Succès, erreur et attente comportent un texte explicite, pas seulement une couleur.

## Typographie et composants

- Pile système existante, Inter si disponible ; pas de nouvelle police pour une seule page. Préserver les glyphes arabes.
- Corps et champs : 16 px, interligne 1,6. Commandes/aides : 14 px minimum. Titre de section : 24 à 42 px fluide ; l'accueil peut avoir un titre plus grand selon la largeur.
- Une action principale par groupe ; alternatives secondaires. Une destination reste un lien natif ; une action reste un bouton. Aucun bouton imbriqué dans un lien.
- Cibles de commande de 44 px minimum comme règle interne de confort. Libellés de cases cliquables ; champs anti-robot masqués conservés.
- Focus visible et adapté à la surface. Champs nommés et erreurs reliées avec `aria-describedby`/`aria-invalid`. Ne pas effacer la saisie lors d'une erreur.
- Espacements cohérents : 4, 8, 12, 16, 24, 32, 48 px ; rayons existants 12, 20 et 28 px.
- Concevoir normal, survol, focus, sélection, désactivé, attente, résultat et erreur lorsque pertinents. Respecter la réduction des animations.

## Mise en page et langues

Une colonne à la base, grilles Bootstrap existantes aux grandes largeurs, commandes en retour à la ligne. Aucun mot long ou montant ne doit imposer la largeur de la page ; employer `min-width: 0` et des dimensions fluides. Les animations d'entrée restent dans le viewport par leur propre mouvement, sans masquage global.

FR/EN/DE en LTR, AR en RTL. Utiliser `text-align: start`, propriétés `*-inline-*`, numéros et emails isolés en LTR lorsque nécessaire. Tester les mêmes états et montants en quatre langues. Une présence de clé i18n ne prouve pas la qualité de la traduction ni une recette sur appareil mobile.

## Méthode

Besoin → action principale → blocs et états → primitives communes → langues/accessibilité → contrôles adaptés → recette du candidat → déploiement exact → contrôle public. Conserver les observations et les limites dans `docs/validation/`.
