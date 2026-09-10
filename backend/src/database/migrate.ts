/**
 * Migration runner — conçu pour tourner comme "pre-deploy command" sur
 * Railway (ou toute plateforme équivalente), donc SANS dépendre de psql
 * ou python3 dans l'image de build : uniquement Node + le paquet `pg`
 * déjà utilisé par le reste du backend.
 *
 * Idempotent par construction : sûr à exécuter à CHAQUE déploiement.
 *  1. Si la table `wilayas` n'existe pas encore -> applique schema.sql
 *     en entier (une seule requête multi-instructions ; le protocole
 *     "simple query" de Postgres l'exécute comme une transaction
 *     implicite : tout réussit, ou tout est annulé — pas d'état
 *     partiel possible en cas d'erreur).
 *  2. Si la table `communes` est vide -> lance le seed géographique.
 * Dans tous les autres cas : ne fait rien (démarrage rapide).
 */
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { seedGeography } from './seed-geography';

async function tableExists(client: Client, table: string): Promise<boolean> {
  const res = await client.query(
    `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = $1)`,
    [table],
  );
  return res.rows[0].exists as boolean;
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const schemaApplied = await tableExists(client, 'wilayas');
    if (!schemaApplied) {
      console.log('[migrate] Schéma absent — application de database/schema.sql…');
      const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');
      const sql = fs.readFileSync(schemaPath, 'utf-8');
      await client.query(sql);
      console.log('[migrate] Schéma appliqué avec succès.');
    } else {
      console.log('[migrate] Schéma déjà présent, rien à faire.');
    }

    const communesCount = await client.query('SELECT COUNT(*)::int AS n FROM communes');
    if (communesCount.rows[0].n === 0) {
      console.log('[migrate] Table communes vide — lancement du seed géographique…');
      await seedGeography(client);
    } else {
      console.log(`[migrate] ${communesCount.rows[0].n} communes déjà en base, seed ignoré.`);
    }
  } finally {
    await client.end();
  }
}

main()
  .then(() => {
    console.log('[migrate] Terminé.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[migrate] ÉCHEC :', err);
    // Sortie non-nulle : Railway doit considérer le déploiement en échec
    // plutôt que de démarrer une app connectée à une base non migrée.
    process.exit(1);
  });
