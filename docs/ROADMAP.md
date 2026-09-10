# Roadmap — état réel du projet

Ordre de priorité respecté : sécurité > fiabilité > réservation > paiement
> assurance/protection > géolocalisation > vérification > état des lieux >
UX > administration > performances > esthétique.

## ✅ Fait ET vérifié par des tests réels (pas de simulation)

Tous les points ci-dessous ont été testés par de vrais appels HTTP contre
un serveur NestJS réellement démarré, connecté à une vraie base
PostgreSQL/PostGIS réellement peuplée.

**Sécurité**
- Garde d'authentification global (liste blanche `@Public()`) — vérifié :
  requête sans token → 401
- RBAC par rôle — vérifié : un `renter` qui tente `POST /vehicles`
  (réservé à `owner`) → 403
- Rate limiting anti brute-force sur le login — vérifié : 429 après
  quelques tentatives échouées
- Refresh tokens hashés (SHA-256) en base, jamais stockés en clair,
  rotation à chaque refresh
- Verrouillage de compte après 5 échecs de connexion (15 min)
- **Fuite de données trouvée et corrigée** : le hash bcrypt du mot de
  passe du propriétaire était exposé via la relation imbriquée
  `vehicle.owner` dans la réponse de création de véhicule. Corrigé par
  `@Exclude()` + `ClassSerializerInterceptor` global (protège tous les
  endpoints actuels et futurs, pas seulement celui où le bug a été vu).
  Vérifié après correction : le champ n'apparaît plus dans la réponse.

**Fiabilité / concurrence**
- Contrainte SQL anti-double-réservation — **testée avec 10 requêtes HTTP
  réellement simultanées** (`curl ... &` × 10 + `wait`) sur le même
  véhicule et le même créneau libre : exactement 1 a reçu `201 Created`,
  les 9 autres `409 Conflict`. Vérifié également par requête SQL directe
  qu'une seule ligne existe en base pour ce créneau.

**Réservation**
- Création avec calcul de prix (sous-total, commission 15%, caution),
  respect des durées min/max du véhicule, refus d'auto-réservation
- Instant booking (confirmation immédiate) vs réservation classique
  (attente de confirmation propriétaire) — les deux chemins codés
- Cycle de statuts complet testé : `pending/confirmed → ongoing → completed`
- Annulation par locataire ou propriétaire avec distinction du délai
  gratuit (48h)

**Paiement (mode simulation uniquement)**
- Paiement loyer (capturé) + caution (autorisée, non débitée) — testé
- Restitution de caution — testé

**Géolocalisation**
- Recherche par rayon avec tri par distance réelle (PostGIS `ST_DWithin` +
  `<->`) — testée autour d'Alger, résultats corrects
- Recherche floue de communes (tolère fautes de frappe/accents via
  `pg_trgm`)
- 69 wilayas + 1609 communes réelles importées (voir `DATA_MODEL.md` pour
  les limites de cette donnée)

**État des lieux**
- Check-in / check-out avec kilométrage, niveau de carburant, notes,
  déclaration de dommages — testé, transitions de statut correctes

**Avis**
- Notation après location terminée uniquement — testé
- Recalcul automatique de la note moyenne (utilisateur + véhicule) — testé
- Anti-doublon (un avis par sens par réservation) — testé, 409 confirmé

**Messagerie**
- Conversation liée 1:1 à une réservation, envoi/liste de messages — testé

## 🚧 Codé mais pas testé en profondeur

- Modération admin (`/admin/vehicles/pending`, activation) — testé une
  fois manuellement, pas de suite de cas limites
- Rejet de réservation par le propriétaire (`/bookings/:id/reject`) —
  codé, pas testé dans cette session
- Gestion des dommages/litiges (`damage_claims`) — schéma + relations
  prêts, aucun endpoint construit

## ❌ Pas commencé

- App mobile : uniquement le scaffold Expo + écrans de démonstration,
  pas encore branchés à l'API (voir `mobile/README.md`)
- Back-office admin (interface, pas juste des endpoints)
- Notifications (push, email, SMS) — table prête, rien qui écrit dedans
- Upload de fichiers réel (photos véhicule, documents) — actuellement de
  simples champs texte
- Intégration PSP algérien réel — nécessite un contrat marchand que je
  n'ai pas
- Daïras (voir `DATA_MODEL.md`)
- Tests automatisés (la validation faite ici est manuelle, via curl,
  documentée mais pas rejouable en CI)
- Observabilité (logs structurés, monitoring, alerting)
- File d'attente asynchrone pour tâches différables

## Déploiement (Railway + GitHub) — en cours, deux points bloquants

Voir `docs/RAILWAY_DEPLOY.md` pour la procédure complète, prête à exécuter.

✅ **Fait et testé** :
- Script de migration Node idempotent (`backend/src/database/migrate.ts`)
  qui remplace le besoin de python3/psql au déploiement — **testé pour de
  vrai sur une base neuve** : premier passage applique schéma + seed
  (69 wilayas, 1609 communes), second passage détecte tout comme déjà
  présent, aucune erreur, aucun doublon.
- Endpoint `/api/v1/health` qui vérifie réellement la connexion base de
  données (pas un simple "200 OK" statique) — testé, répond `{"status":"ok"}`.
- Syntaxe exacte de variables de référence Railway confirmée via la
  documentation officielle (`${{Postgres.DATABASE_URL}}`,
  `${{RAILWAY_PRIVATE_DOMAIN}}`) plutôt que devinée.

⛔ **Bloqué, décision utilisateur nécessaire** :
- **Railway** : le compte est sur le plan gratuit et a atteint sa limite
  de ressources provisionnables (2 projets existants déjà présents,
  sans rapport avec ce projet — je ne les ai pas touchés). Impossible de
  créer un nouveau projet tant que ce n'est pas résolu.
- **GitHub** : aucun connecteur MCP GitHub disponible dans cet
  environnement (vérifié par recherche). `Railway:create-deployment`
  exige un dépôt GitHub existant — je ne peux pas en créer un ni y pousser
  du code sans une méthode d'accès.

## Prochaine étape suggérée

Continuer dans l'ordre de priorité déclaré : consolider la fiabilité
(tests automatisés du chemin de réservation concurrente, puisque c'est le
cœur de la garantie anti-fraude) avant d'avancer sur l'UX mobile.
