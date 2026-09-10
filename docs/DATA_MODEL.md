# Modèle de données — ce qui est réel, ce qui est vérifié, ce qui manque

## Géographie (wilayas / daïras / communes)

**Source utilisée** : dataset ouvert GitHub
`Kenandarabeh/algeria-wilayas-communes-2026`, choisi après vérification
qu'il reflète la réforme d'avril 2026 (loi 26-06, 58→69 wilayas) — confirmé
par recoupement avec des sources de presse indépendantes le jour de
l'import.

### Wilayas — ✅ fiable
69 wilayas importées avec code, nom FR, nom AR, coordonnées. Un bug de la
source a été détecté et corrigé à l'import : les champs `longitude` et
`latitude` du fichier JSON sont **inversés** (ex. Adrar y est donné à
`longitude=27.97 / latitude=-0.20`, alors que les coordonnées réelles
d'Adrar sont `lat≈27.87°N, lng≈-0.29°E`). Le script `seed_geography.py`
permute les deux valeurs à l'import — voir les commentaires en tête de ce
fichier pour le détail.

### Communes — ⚠️ à valider avant production
Le fichier source contient 1708 lignes. Après déduplication stricte sur
(nom, wilaya) on obtient **1609 communes uniques**, chargées dans la base.
Le chiffre officiel attendu est **1541 communes**. L'écart de 68 n'a pas pu
être expliqué avec certitude à partir des données disponibles (hypothèse
possible : mélange de communes et d'agglomérations secondaires dans la
source, ou doublons liés à la réorganisation post-2019/2026 non nettoyés
par l'auteur du dataset). **Ne pas considérer cette liste comme définitive**
sans recoupement avec la nomenclature ONS ou le Journal Officiel.

Deux lignes avaient par ailleurs un champ numérique malformé (virgule
parasite en tête, ex. `,2.8140852`) — nettoyées par `safe_float()` dans le
script de seed plutôt que silencieusement ignorées ou plantées.

### Daïras — ❌ non chargées, schéma prêt
Aucune source ouverte fiable et à jour vis-à-vis de la loi 26-06 (avril
2026, 548 daïras attendues) n'a été trouvée. Plutôt que d'inventer une
répartition commune→daïra (ce qui aurait produit de fausses données
présentées comme réelles), la table `dairas` a son schéma complet et prêt,
et `communes.daira_id` reste `NULL` pour toutes les lignes. **Action
requise** : obtenir la liste officielle (Journal Officiel algérien ou ONS)
et écrire un script de seed dédié une fois la source identifiée.

## Utilisateurs, véhicules, réservations, etc.

Toutes ces tables sont vides par construction (pas de données fictives
pré-remplies) — elles se peuplent à l'usage réel de l'application. Le
schéma complet est dans `backend/database/schema.sql`, commenté.

## Champs marqués "pending_legal_validation"

Recherchez cette chaîne dans le code (`business-rules.config.ts`,
`protection_plans.legal_status`) pour la liste exhaustive des valeurs qui
sont des hypothèses de travail et non des décisions validées
juridiquement. Voir `docs/LEGAL_TODO.md`.
