/**
 * Bootstrap admin — crée un premier compte administrateur si AUCUN n'existe
 * encore en base, avec un mot de passe aléatoire affiché UNE SEULE FOIS
 * dans les logs de déploiement Railway (jamais écrit en clair nulle part
 * ailleurs — seul le hash bcrypt est stocké en base ensuite).
 *
 * Idempotent : si un compte admin existe déjà, ne fait rien.
 * Non bloquant : contrairement à migrate.ts, un échec ici n'empêche pas
 * l'application de démarrer (un admin manquant est gênant, pas critique).
 *
 * SÉCURITÉ : changez ce mot de passe dès la première connexion.
 */
import { Client } from 'pg';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const ADMIN_EMAIL = process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@covoit-dz.local';

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const existing = await client.query(`SELECT id FROM users WHERE 'admin' = ANY(roles) LIMIT 1`);
    if (existing.rows.length > 0) {
      console.log('[bootstrap-admin] Un compte admin existe déjà, rien à faire.');
      return;
    }

    const password = crypto.randomBytes(12).toString('base64url');
    const passwordHash = await bcrypt.hash(password, 12);

    const result = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, roles, identity_verification_status, license_verification_status)
       VALUES ($1, $2, 'Admin', 'COVOIT-DZ', ARRAY['admin']::user_role[], 'verified', 'verified')
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      [ADMIN_EMAIL, passwordHash],
    );

    if (result.rows.length === 0) {
      console.log(`[bootstrap-admin] Un compte existait déjà pour ${ADMIN_EMAIL} (rôle non-admin) — pas de mot de passe généré, pas de conflit forcé.`);
      return;
    }

    console.log('[bootstrap-admin] ================================================================');
    console.log('[bootstrap-admin] Compte admin créé :');
    console.log(`[bootstrap-admin]   email    : ${ADMIN_EMAIL}`);
    console.log(`[bootstrap-admin]   password : ${password}`);
    console.log('[bootstrap-admin] CHANGEZ CE MOT DE PASSE DÈS LA PREMIÈRE CONNEXION.');
    console.log('[bootstrap-admin] Il ne sera plus jamais affiché après ce déploiement.');
    console.log('[bootstrap-admin] ================================================================');
  } finally {
    await client.end();
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[bootstrap-admin] ÉCHEC (non bloquant) :', err);
    process.exit(0);
  });
