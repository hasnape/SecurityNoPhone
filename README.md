# SecurityNoPhone

Site statique publié sur https://securitynophone.com/ via GitHub Pages.

## Règles et validation

Lire `AGENTS.md`, `docs/DESIGN_SYSTEM.md`, `docs/RELEASE_VALIDATION.md` et `docs/VALIDATED_FEATURE_BASELINE.md` avant de modifier le site. Ces références appliquent les exigences Nexus à l’identité et aux parcours SecurityNoPhone.

Les caractéristiques des deux modèles de pochettes sont référencées dans `docs/PRODUCT_FACTS.md`, à partir des précisions fournies par le propriétaire.

Préférence du propriétaire : publication manuelle via le navigateur cloud et contrôles locaux. La validation Actions est uniquement manuelle pour préserver les ressources ; le déploiement interne GitHub Pages peut rester nécessaire. Voir `docs/RELEASE_VALIDATION.md`.

Contrôle local sans dépendance supplémentaire, avec Python 3 et Node.js :

```sh
python3 scripts/validate_release.py
```

Servir les fichiers par HTTP pour la prévisualisation : les en-têtes et pieds de page sont chargés depuis `includes/` et ne fonctionnent pas par simple ouverture en `file://`. En environnement Work géré, utiliser `sites-preview` selon sa procédure.

## Sources

- `index.html` et les pages HTML : parcours publics actuels.
- `style.css` : variables et composants communs.
- `js/main.js` et `js/translations.js` : navigation et FR/EN/DE/AR.
- `js/order-form.js` : estimation de demande, sans capture de paiement.
- `js/order-tracking.js` : préparation d’un contact par référence, sans statut logistique inventé.
- `images/` : ressources existantes ; `Mention legale/` : documents légaux.
- `docs/validation/` : observations, résultats et limites par lot.

Les anciens fichiers `order*.html`, `commande_*.html` et `index_fully_translated_*.html` restent distincts du parcours principal. Leur présence ne vaut pas validation ; voir la baseline.
