# Déploiement sur Railway

Ce document décrit la procédure exacte, prête à exécuter dès que les deux
points bloquants (voir `docs/ROADMAP.md`) sont levés : limite du plan
gratuit Railway, et accès GitHub pour héberger le code source.

## 1. Base de données (PostGIS)

Railway n'a pas de PostGIS dans son template Postgres officiel — il faut
déployer l'image `postgis/postgis` directement :

```
Railway:create-service  projectId=<id>  image="postgis/postgis:16-3.4"  name="Postgres"
Railway:create-volume   projectId=<id>  serviceId=<postgres-id>  mountPath="/var/lib/postgresql/data"  name="pgdata"
Railway:set-variables   projectId=<id>  serviceId=<postgres-id>  variables={
  "POSTGRES_USER": "covoit",
  "POSTGRES_PASSWORD": "<mot de passe généré>",
  "POSTGRES_DB": "covoit_dz",
  "PGDATA": "/var/lib/postgresql/data/pgdata",
  "DATABASE_URL": "postgresql://${{POSTGRES_USER}}:${{POSTGRES_PASSWORD}}@${{RAILWAY_PRIVATE_DOMAIN}}:5432/${{POSTGRES_DB}}"
}
```

`PGDATA` pointe vers un sous-dossier du volume monté : l'image Postgres
exige un data dir vide au tout premier démarrage, et monter le volume
directement sur `/var/lib/postgresql/data` pose parfois des soucis de
permissions selon l'état initial du volume.

## 2. Backend (NestJS)

Une fois le code sur GitHub (`owner/repo`) :

```
Railway:create-deployment  projectId=<id>  repo="owner/repo"  branch="main"  name="api"
```

Puis configurer :

```
Railway:set-variables  projectId=<id>  serviceId=<api-id>  variables={
  "DATABASE_URL": "${{Postgres.DATABASE_URL}}",
  "JWT_ACCESS_SECRET": "<secret généré>",
  "JWT_REFRESH_SECRET": "<secret généré>",
  "JWT_ACCESS_EXPIRES_IN": "15m",
  "JWT_REFRESH_EXPIRES_IN": "30d",
  "NODE_ENV": "production",
  "PORT": "3000"
}

Railway:update-service  projectId=<id>  serviceId=<api-id>
  preDeployCommand=["npm run migrate"]
  healthcheckPath="/api/v1/health"
  startCommand="npm run start"

Railway:generate-domain  projectId=<id>  serviceId=<api-id>
```

`npm run migrate` (voir `backend/src/database/migrate.ts`) applique le
schéma et peuple la géographie **uniquement si nécessaire** — testé en
conditions réelles : premier passage sur base vierge (schéma + 69 wilayas
+ 1609 communes appliqués), second passage immédiat (tout détecté comme
déjà présent, aucune erreur, aucun doublon). Sûr à relancer à chaque
déploiement.

## 3. Vérification post-déploiement

Comme mon bac à sable n'a pas accès au réseau public de Railway
(`*.up.railway.app` n'est pas dans la liste blanche de domaines de mon
environnement d'exécution), la vérification après déploiement se fait via
les outils Railway eux-mêmes plutôt que par un `curl` direct de ma part :

```
Railway:get-logs             — confirmer "Nest application successfully started"
Railway:environment-status   — état de santé du service
Railway:domain-status        — DNS/certificat du domaine généré
```

## 4. Ce qui reste manuel après déploiement

- Créer le premier compte admin (voir `README.md`, section "Aucun compte
  admin n'est créable via l'API publique")
- Remplacer les secrets JWT par des valeurs générées aléatoirement
  (`openssl rand -hex 32`), jamais celles de `.env.example`
