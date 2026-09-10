import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class GeographyService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async listWilayas() {
    return this.dataSource.query(
      `SELECT id, code, name_fr AS "nameFr", name_ar AS "nameAr",
              ST_Y(center::geometry) AS lat, ST_X(center::geometry) AS lng
       FROM wilayas ORDER BY code::int`,
    );
  }

  async listCommunesByWilaya(wilayaId: number) {
    return this.dataSource.query(
      `SELECT id, wilaya_id AS "wilayaId", daira_id AS "dairaId", postal_code AS "postalCode",
              name_fr AS "nameFr", name_ar AS "nameAr",
              ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng
       FROM communes WHERE wilaya_id = $1 ORDER BY name_fr`,
      [wilayaId],
    );
  }

  /** Recherche textuelle floue (tolère les fautes de frappe/accents) sur le nom d'une commune. */
  async searchCommunes(query: string, limit = 15) {
    return this.dataSource.query(
      `SELECT c.id, c.name_fr AS "nameFr", c.name_ar AS "nameAr", c.postal_code AS "postalCode",
              w.id AS "wilayaId", w.name_fr AS "wilayaName",
              ST_Y(c.location::geometry) AS lat, ST_X(c.location::geometry) AS lng
       FROM communes c
       JOIN wilayas w ON w.id = c.wilaya_id
       WHERE c.name_fr % $1 OR c.name_fr ILIKE '%' || $1 || '%'
       ORDER BY similarity(c.name_fr, $1) DESC
       LIMIT $2`,
      [query, limit],
    );
  }

  /** Communes dans un rayon (km) autour d'un point — utilisé pour la recherche de véhicules. */
  async communesNear(lat: number, lng: number, radiusKm: number) {
    return this.dataSource.query(
      `SELECT id, name_fr AS "nameFr", wilaya_id AS "wilayaId",
              ROUND((ST_Distance(location, ST_SetSRID(ST_MakePoint($2,$1),4326)::geography) / 1000)::numeric, 1) AS "distanceKm"
       FROM communes
       WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint($2,$1),4326)::geography, $3 * 1000)
       ORDER BY location <-> ST_SetSRID(ST_MakePoint($2,$1),4326)::geography`,
      [lat, lng, radiusKm],
    );
  }
}
