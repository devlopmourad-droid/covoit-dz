#!/usr/bin/env python3
"""
Seed script — géographie administrative de l'Algérie (wilayas + communes).

Source des données brutes : dataset ouvert GitHub
  Kenandarabeh/algeria-wilayas-communes-2026 (69 wilayas, loi 26-06 avril 2026)

Nettoyage appliqué (et pourquoi) :
  1. Le fichier source inverse les champs "longitude" et "latitude"
     (ex. Adrar est donné à longitude=27.97/latitude=-0.20, alors que les
     coordonnées réelles d'Adrar sont lat≈27.87°N, lng≈-0.29°E). On corrige
     en permutant les deux valeurs à l'import.
  2. Le fichier communes.json contient 1708 lignes alors que le chiffre
     officiel attendu est 1541 communes. Après déduplication stricte sur
     (nom, wilaya) on obtient 1609 lignes uniques : il reste un écart de
     68 communes par rapport au chiffre officiel que cette source ne permet
     pas d'expliquer avec certitude (granularité "agglomération" vs
     "commune" possible). CE SCRIPT CHARGE LES 1609 LIGNES DÉDUPLIQUÉES ET
     LE MARQUE EXPLICITEMENT — à ne pas considérer comme validé pour la
     production sans recoupement avec la nomenclature officielle ONS /
     Journal Officiel. Voir docs/DATA_MODEL.md.

Usage:
    python3 seed_geography.py
"""
import json
import os
import psycopg2

DB_DSN = os.environ.get("DATABASE_URL", "postgresql://postgres:devpassword@localhost:5432/covoit_dz")

HERE = os.path.dirname(os.path.abspath(__file__))


def safe_float(value):
    """Certaines lignes de la source contiennent des valeurs numériques
    mal formées (ex. ',2.8140852' avec une virgule parasite en tête).
    On nettoie plutôt que d'échouer silencieusement ou de planter."""
    if value is None:
        return None
    s = str(value).strip().lstrip(",")
    try:
        return float(s)
    except ValueError:
        return None


def load(path):
    with open(os.path.join(HERE, path), encoding="utf-8-sig") as f:
        return json.load(f)


def main():
    wilayas = load("../../wilayas_raw.json") if os.path.exists(os.path.join(HERE, "../../wilayas_raw.json")) else load("wilayas_raw.json")
    communes = load("../../communes_raw.json") if os.path.exists(os.path.join(HERE, "../../communes_raw.json")) else load("communes_raw.json")

    conn = psycopg2.connect(DB_DSN)
    conn.autocommit = False
    cur = conn.cursor()

    print(f"Loaded {len(wilayas)} wilayas, {len(communes)} raw commune rows")

    cur.execute("TRUNCATE communes, dairas, wilayas RESTART IDENTITY CASCADE;")

    wilaya_id_map = {}  # source_id (string) -> db id
    for w in wilayas:
        code = str(w["code"]).zfill(2)
        name_fr = w["name"].strip()
        name_ar = w["ar_name"].strip()
        # champs inversés dans la source : "longitude" contient la latitude réelle
        real_lat = float(w["longitude"])
        real_lng = float(w["latitude"])
        cur.execute(
            """
            INSERT INTO wilayas (code, name_fr, name_ar, center)
            VALUES (%s, %s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography)
            RETURNING id
            """,
            (code, name_fr, name_ar, real_lng, real_lat),
        )
        db_id = cur.fetchone()[0]
        wilaya_id_map[str(w["id"])] = db_id

    print(f"Inserted {len(wilaya_id_map)} wilayas")

    # Dédoublonnage strict sur (nom normalisé, wilaya_id)
    seen = {}
    for c in communes:
        key = (c["name"].strip().lower(), c["wilaya_id"])
        if key not in seen:
            seen[key] = c
    unique_communes = list(seen.values())
    print(f"Deduplicated to {len(unique_communes)} unique communes")

    inserted, skipped = 0, 0
    for c in unique_communes:
        wilaya_db_id = wilaya_id_map.get(str(c["wilaya_id"]))
        if wilaya_db_id is None:
            skipped += 1
            continue
        name_fr = c["name"].strip()
        name_ar = (c.get("ar_name") or "").strip() or None
        postal_code = c.get("post_code")
        # même correction d'inversion longitude/latitude que pour les wilayas
        real_lat = safe_float(c["longitude"])
        real_lng = safe_float(c["latitude"])
        if real_lat is None or real_lng is None:
            print(f"  WARNING: skipping geo point for '{name_fr}' (id={c['id']}) — unparseable coordinates, inserting NULL location")
        cur.execute(
            """
            INSERT INTO communes (wilaya_id, postal_code, name_fr, name_ar, location)
            VALUES (%s, %s, %s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography)
            """,
            (wilaya_db_id, postal_code, name_fr, name_ar, real_lng, real_lat),
        )
        inserted += 1

    print(f"Inserted {inserted} communes, skipped {skipped} (unknown wilaya)")

    conn.commit()
    cur.close()
    conn.close()
    print("Done.")


if __name__ == "__main__":
    main()
