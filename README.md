# COVOIT-DZ — Plateforme d'autopartage entre particuliers (Algérie)

Marketplace P2P de location de véhicules entre particuliers, conçue pour
l'Algérie (69 wilayas, loi 26-06 d'avril 2026). Inspirée dans son
fonctionnement de plateformes comme Getaround, sans reprendre leur code,
marque, textes ou identité graphique.

## État du projet (voir ROADMAP.md pour le détail)

✅ **Fonctionnel et testé en conditions réelles** : base de données,
authentification, géographie, annonces véhicules, réservations
(y compris sous forte concurrence), paiement (mode simulation), état des
lieux, messagerie, avis.

🚧 **Squelette posé, à approfondir** : app mobile (écrans clés scaffoldés,
pas encore tous connectés), back-office admin (endpoints de base only).

⛔ **Non fait, nécessite des tiers externes que je n'ai pas** : intégration
PSP algérien réel (SATIM/CIB, Edahabia), produit d'assurance réel, stockage
de fichiers en production (S3 ou équivalent — actuellement les URLs de
photos sont de simples chaînes, sans upload réel).

## Stack technique

- **Backend** : NestJS 10 + TypeScript, TypeORM, PostgreSQL 16 + PostGIS 3.4
- **Mobile** : React Native + Expo (TypeScript)
- **Auth** : JWT (access 15 min) + refresh tokens rotatifs hashés (SHA-256) en base
- **Anti-fraude réservation** : contrainte `EXCLUDE USING GIST` PostgreSQL
  (voir `backend/database/schema.sql`) — empêche mathématiquement deux
  réservations actives en conflit sur un même véhicule, y compris sous
  requêtes strictement simultanées (testé avec 10 requêtes parallèles
  réelles, voir ROADMAP.md)

## Démarrage rapide (backend)

```bash
cd backend
cp .env.example .env      # ajuster DATABASE_URL si besoin
npm install

# Base de données (PostgreSQL 16 + PostGIS + btree_gist + pgcrypto + citext + pg_trgm requis)
psql -d covoit_dz -f database/schema.sql
DATABASE_URL="postgresql://user:pass@localhost:5432/covoit_dz" python3 database/seed_geography.py

npm run build
npm run start:dev   # http://localhost:3000/api/v1
```

Aucun compte admin n'est créable via l'API publique (choix de sécurité
volontaire). Pour le premier compte admin :

```sql
UPDATE users SET roles = ARRAY['owner','admin']::user_role[] WHERE email = '...';
```

## Démarrage rapide (mobile)

```bash
cd mobile
npm install
npx expo start
```

Voir `mobile/README.md` pour le détail des écrans scaffoldés et de ce qui
reste à connecter à l'API.

## Documents complémentaires

- `docs/ARCHITECTURE.md` — décisions techniques et pourquoi
- `docs/DATA_MODEL.md` — schéma de données, ce qui est réel vs à valider
- `docs/ROADMAP.md` — ce qui est fait, testé, et ce qu'il reste à construire,
  dans l'ordre de priorité demandé (sécurité > fiabilité > réservation >
  paiement > assurance > géoloc > vérification > état des lieux > UX >
  administration > performances > esthétique)
- `docs/LEGAL_TODO.md` — liste des points nécessitant une validation
  juridique/assurantielle en Algérie avant mise en production
