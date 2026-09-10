/**
 * Seed géographique — port TypeScript de database/seed_geography.py
 * (voir ce fichier pour le contexte complet et les sources).
 *
 * Ce port existe uniquement pour que le déploiement (Railway ou autre)
 * n'ait pas besoin de python3/psycopg2 dans l'image : le backend est déjà
 * en Node, donc réutiliser `pg` (déjà une dépendance) évite un second
 * runtime au moment du build. La logique — y compris les deux correctifs
 * de qualité de données — est identique à la version Python :
 *   1. Les champs "longitude"/"latitude" de la source sont inversés.
 *   2. Deux communes ont un champ numérique malformé (virgule parasite).
 */
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

interface RawWilaya {
  id: string;
  code: string;
  name: string;
  ar_name: string;
  longitude: string; // contient en réalité la LATITUDE (bug de la source)
  latitude: string; // contient en réalité la LONGITUDE (bug de la source)
}

interface RawCommune {
  id: string;
  post_code: string;
  name: string;
  wilaya_id: string;
  ar_name: string;
  longitude: string;
  latitude: string;
}

function readJsonStrippingBom(filePath: string) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const stripped = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
  return JSON.parse(stripped);
}

/** Nettoie les valeurs numériques mal formées (ex. ",2.8140852") plutôt que de planter. */
function safeFloat(value: string | undefined | null): number | null {
  if (value === undefined || value === null) return null;
  const cleaned = String(value).trim().replace(/^,+/, '');
  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function seedGeography(client: Client) {
  const dbDir = path.join(process.cwd(), 'database');
  const wilayas: RawWilaya[] = readJsonStrippingBom(path.join(dbDir, 'wilayas_raw.json'));
  const communes: RawCommune[] = readJsonStrippingBom(path.join(dbDir, 'communes_raw.json'));

  console.log(`[seed] ${wilayas.length} wilayas, ${communes.length} lignes de communes brutes`);

  await client.query('TRUNCATE communes, dairas, wilayas RESTART IDENTITY CASCADE');

  const wilayaIdMap = new Map<string, number>();
  for (const w of wilayas) {
    const code = String(w.code).padStart(2, '0');
    const realLat = safeFloat(w.longitude); // inversion volontaire, voir en-tête
    const realLng = safeFloat(w.latitude);
    const res = await client.query(
      `INSERT INTO wilayas (code, name_fr, name_ar, center)
       VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography)
       RETURNING id`,
      [code, w.name.trim(), w.ar_name.trim(), realLng, realLat],
    );
    wilayaIdMap.set(String(w.id), res.rows[0].id);
  }
  console.log(`[seed] ${wilayaIdMap.size} wilayas insérées`);

  const seen = new Map<string, RawCommune>();
  for (const c of communes) {
    const key = `${c.name.trim().toLowerCase()}|${c.wilaya_id}`;
    if (!seen.has(key)) seen.set(key, c);
  }
  console.log(`[seed] ${communes.length} -> ${seen.size} communes uniques après déduplication`);

  let inserted = 0;
  let skipped = 0;
  for (const c of seen.values()) {
    const wilayaDbId = wilayaIdMap.get(String(c.wilaya_id));
    if (!wilayaDbId) {
      skipped++;
      continue;
    }
    const realLat = safeFloat(c.longitude);
    const realLng = safeFloat(c.latitude);
    if (realLat === null || realLng === null) {
      console.warn(`[seed] AVERTISSEMENT : coordonnées illisibles pour "${c.name}" (id=${c.id}), location NULL`);
    }
    await client.query(
      `INSERT INTO communes (wilaya_id, postal_code, name_fr, name_ar, location)
       VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326)::geography)`,
      [wilayaDbId, c.post_code ?? null, c.name.trim(), (c.ar_name ?? '').trim() || null, realLng, realLat],
    );
    inserted++;
  }
  console.log(`[seed] ${inserted} communes insérées, ${skipped} ignorées (wilaya inconnue)`);
}
