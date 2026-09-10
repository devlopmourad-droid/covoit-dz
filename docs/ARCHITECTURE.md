# Architecture — décisions et justifications

## Pourquoi NestJS + TypeORM + PostgreSQL/PostGIS

- **NestJS** : structure modulaire imposée (modules/services/contrôleurs),
  ce qui compte pour un projet destiné à grandir avec plusieurs
  développeurs — plus adapté qu'un Express nu pour "une vraie startup".
- **PostgreSQL + PostGIS** : c'est le seul choix sérieux pour une
  marketplace géolocalisée avec recherche par rayon, tri par distance,
  et — point clé — les contraintes d'intégrité avancées (`EXCLUDE USING
  GIST`) qui permettent de garantir l'absence de double-réservation *au
  niveau base de données*, pas seulement en code applicatif. Une solution
  NoSQL (Mongo, Firebase) aurait rendu cette garantie beaucoup plus
  difficile à obtenir avec la même fiabilité.
- **TypeORM plutôt que Prisma** : Prisma n'a pas de support de première
  classe pour les colonnes géométriques PostGIS ni pour les contraintes
  `EXCLUDE`. TypeORM permet de mixer repositories classiques et requêtes
  SQL brutes paramétrées là où c'est nécessaire (voir
  `GeographyService`, `VehiclesService.search`), ce qui est indispensable
  ici.
- **Migrations en SQL brut (`schema.sql`) plutôt que génération
  automatique** : un schéma avec extensions PostGIS, triggers, et
  contraintes `EXCLUDE` est plus sûr à écrire et relire à la main qu'à
  faire deviner par un générateur de migration. `synchronize: false` est
  donc volontaire et permanent — les entités TypeORM doivent rester en
  phase avec `schema.sql`, pas l'inverse.

## Pourquoi une contrainte SQL plutôt qu'un verrou applicatif pour les réservations

L'approche naïve ("vérifier qu'il n'y a pas de conflit, puis insérer") a
une race condition classique : deux requêtes peuvent toutes les deux
passer la vérification avant que l'une des deux insère. La corriger
proprement en code demande soit un verrou pessimiste (`SELECT ... FOR
UPDATE`) qui sérialise toutes les réservations sur un même véhicule (mauvais
pour la latence), soit une contrainte au niveau base de données qui laisse
Postgres arbitrer — ce qui est le choix fait ici
(`no_overlapping_active_bookings`, voir `schema.sql`). Testé avec 10
requêtes HTTP réellement simultanées : exactly one a réussi, les 9 autres
ont reçu une 409 propre (voir `docs/ROADMAP.md`).

## Pourquoi un garde d'authentification global (liste blanche)

`JwtAuthGuard` est enregistré comme garde global (`APP_GUARD`) : **toute**
route est protégée par défaut, sauf celles explicitement marquées
`@Public()`. C'est l'inverse du réflexe "protéger route par route", plus
sûr par défaut pour une marketplace où un contrôleur oublié = une fuite de
données. Le prix : chaque nouvelle route publique doit être marquée
explicitement, ce qui est un compromis délibéré (visibilité > confort).

## Pourquoi `ClassSerializerInterceptor` global

Détecté pendant les tests (voir ROADMAP) : une relation imbriquée
(`vehicle.owner`) exposait le hash bcrypt du mot de passe dans une réponse
API, alors qu'aucun contrôleur ne le faisait "exprès". Un correctif
localisé (exclure le champ dans un DTO de sortie précis) aurait laissé le
même risque ouvert ailleurs. La solution retenue agit au niveau plateforme
: `@Exclude()` sur l'entité + interceptor global, donc *tout* endpoint
actuel ou futur qui renvoie un `User` (même imbriqué) est protégé par
construction.

## Ce qui n'est PAS encore résilient (à traiter avant une vraie prod)

- Pas de file d'attente / job asynchrone (ex. BullMQ) pour les emails,
  notifications, recalculs — tout est synchrone pour l'instant.
- Pas de stockage de fichiers réel (S3 ou équivalent) — les champs
  `*_url` sont de simples chaînes.
- Pas de tests automatisés (unitaires/e2e) — la validation faite ici est
  manuelle via curl, documentée dans ROADMAP.md, mais devrait être
  formalisée en suite de tests avant toute mise en production.
- Pas de logs structurés / observabilité (ex. Sentry, OpenTelemetry).
- Pas de vérification anti-fraude au-delà des documents d'identité stockés
  (pas d'OCR, pas de vérification tierce du permis de conduire).
