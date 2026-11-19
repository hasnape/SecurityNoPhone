# Réparation des modules commerciaux — 19 novembre 2026

## Besoin
Réafficher les packs, la simulation, le suivi de commande et permettre une demande de location **avec ou sans agent**, sans réintroduire les anciens tarifs.

## Réparations proposées
- Menu partagé : raccourcis vers la grille de packs, le simulateur et le suivi.
- Page Commande : cinq packs événementiels et quatre packs professionnels sélectionnables directement depuis des liens ; prix de base et caution indicative visibles avant la saisie des dates.
- Location : un choix explicite sans agent/avec agent pour chaque formule événementielle et professionnelle, avec horaires (maximum sept heures/jour/agent), nombre d'agents, déplacement et hébergement si accompagnement.
- Accueil : liens avec/sans personnel corrigés ; les anciens liens renvoyaient à tort vers des formules professionnelles.
- Suivi : demande de suivi par formulaire (référence + e-mail) envoyée au même endpoint Formspree que les demandes commerciales, avec alternative e-mail. Il ne s'agit **pas** d'un suivi logistique en temps réel.
- Traductions FR/EN/DE/AR ; interface RTL existante conservée.
- Aucune modification de la grille tarifaire approuvée le 18/11/2026, de la caution à 1,50 € par pochette, des dates de 30 jours, de l'engagement professionnel de trois mois, des PDF ou des pages légales.

## Garanties et limites
- L'option agent et les frais externes restent **sur devis**. Le prix du pack hors agent ne devient jamais un total confirmé pour une commande avec personnel.
- Pas de réservation automatique ni d'encaissement ; le formulaire transmet une **demande**.
- Sur GitHub Pages, aucun statut transport ne peut être lu depuis Formspree sans une source de données authentifiée. La réponse humaine reste nécessaire.
- Vérifications sources effectuées ; contrôles navigateur (mobile, langue/RTL, Formspree, déploiement Pages) à effectuer avant de déclarer la publication en production entièrement validée.
- Réglages Nexus Support Hub non modifiés.
