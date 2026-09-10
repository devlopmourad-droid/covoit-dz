/**
 * Seed de données de démonstration — comptes, véhicules et quelques
 * réservations/avis réalistes pour pouvoir tester l'app (web + mobile)
 * sans partir d'une base totalement vide.
 *
 * Idempotent : si le compte démo "karim.boudiaf@nqasmo.demo" existe déjà,
 * ne fait rien. Sûr à relancer à chaque déploiement, comme migrate.ts et
 * bootstrap-admin.ts.
 *
 * Mot de passe commun à tous les comptes de démo : voir DEMO_PASSWORD.
 * Ce ne sont pas de vrais utilisateurs — à ne jamais faire dans un vrai
 * environnement de production avec de vraies données personnelles.
 */
import { Client } from 'pg';
import * as bcrypt from 'bcrypt';

const DEMO_PASSWORD = 'Demo1234!';

interface DemoUser {
  key: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  communeName: string | null;
}

const USERS: DemoUser[] = [
  { key: 'karim', email: 'karim.boudiaf@nqasmo.demo', firstName: 'Karim', lastName: 'Boudiaf', roles: ['owner'], communeName: 'Alger Centre' },
  { key: 'amel', email: 'amel.cherif@nqasmo.demo', firstName: 'Amel', lastName: 'Cherif', roles: ['owner'], communeName: 'Kouba' },
  { key: 'yacine', email: 'yacine.meziane@nqasmo.demo', firstName: 'Yacine', lastName: 'Meziane', roles: ['owner'], communeName: 'Oran' },
  { key: 'sara', email: 'sara.amrani@nqasmo.demo', firstName: 'Sara', lastName: 'Amrani', roles: ['renter'], communeName: 'Alger Centre' },
  { key: 'mounir', email: 'mounir.belkacem@nqasmo.demo', firstName: 'Mounir', lastName: 'Belkacem', roles: ['renter'], communeName: 'Constantine' },
];

interface DemoVehicle {
  key: string;
  ownerKey: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  fuelType: string;
  transmission: string;
  seats: number;
  lat: number;
  lng: number;
  addressLabel: string;
  pricePerDay: number;
  depositAmount: number;
  instantBooking: boolean;
  features: string[];
  description: string;
}

const VEHICLES: DemoVehicle[] = [
  {
    key: 'clio', ownerKey: 'karim', brand: 'Renault', model: 'Clio 4', year: 2019,
    licensePlate: '16-DEMO-001', fuelType: 'essence', transmission: 'manuelle', seats: 5,
    lat: 36.7755, lng: 3.0597, addressLabel: 'Alger Centre',
    pricePerDay: 4500, depositAmount: 60000, instantBooking: true,
    features: ['gps', 'climatisation', 'bluetooth'],
    description: "Clio bien entretenue, parfaite pour la ville. Carnet d'entretien à jour.",
  },
  {
    key: 'logan', ownerKey: 'karim', brand: 'Dacia', model: 'Logan', year: 2021,
    licensePlate: '16-DEMO-002', fuelType: 'diesel', transmission: 'manuelle', seats: 5,
    lat: 36.7167, lng: 3.0167, addressLabel: 'Hydra',
    pricePerDay: 3800, depositAmount: 50000, instantBooking: false,
    features: ['climatisation'],
    description: 'Idéale pour un usage familial, faible consommation.',
  },
  {
    key: 'i10', ownerKey: 'amel', brand: 'Hyundai', model: 'i10', year: 2020,
    licensePlate: '16-DEMO-003', fuelType: 'essence', transmission: 'automatique', seats: 4,
    lat: 36.7213, lng: 3.1877, addressLabel: 'Bab Azzouar',
    pricePerDay: 3200, depositAmount: 40000, instantBooking: true,
    features: ['bluetooth', 'climatisation'],
    description: 'Petite citadine automatique, pratique pour se garer facilement.',
  },
  {
    key: 'golf', ownerKey: 'amel', brand: 'Volkswagen', model: 'Golf 7', year: 2018,
    licensePlate: '16-DEMO-004', fuelType: 'diesel', transmission: 'manuelle', seats: 5,
    lat: 36.7167, lng: 3.0667, addressLabel: 'Kouba',
    pricePerDay: 5200, depositAmount: 70000, instantBooking: true,
    features: ['gps', 'climatisation', 'sieges_bebe'],
    description: 'Golf confortable pour les longs trajets, sièges bébé disponibles sur demande.',
  },
  {
    key: '208', ownerKey: 'yacine', brand: 'Peugeot', model: '208', year: 2022,
    licensePlate: '31-DEMO-005', fuelType: 'essence', transmission: 'automatique', seats: 5,
    lat: 35.6971, lng: -0.6337, addressLabel: 'Oran centre',
    pricePerDay: 4800, depositAmount: 60000, instantBooking: false,
    features: ['gps', 'bluetooth', 'climatisation'],
    description: 'Véhicule récent, très peu de kilométrage.',
  },
  {
    key: 'ibiza', ownerKey: 'yacine', brand: 'Seat', model: 'Ibiza', year: 2019,
    licensePlate: '31-DEMO-006', fuelType: 'essence', transmission: 'manuelle', seats: 5,
    lat: 35.7050, lng: -0.6450, addressLabel: 'Oran',
    pricePerDay: 3600, depositAmount: 45000, instantBooking: true,
    features: ['climatisation', 'bluetooth'],
    description: 'Bonne petite citadine, économique.',
  },
];

async function findCommuneId(client: Client, name: string | null): Promise<number | null> {
  if (!name) return null;
  const res = await client.query(`SELECT id FROM communes WHERE name_fr ILIKE $1 ORDER BY id LIMIT 1`, [name]);
  return res.rows[0]?.id ?? null;
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const already = await client.query(`SELECT id FROM users WHERE email = 'karim.boudiaf@nqasmo.demo'`);
    if (already.rows.length > 0) {
      console.log('[seed-demo] Données de démo déjà présentes, rien à faire.');
      return;
    }

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
    const userIds: Record<string, string> = {};

    for (const u of USERS) {
      const communeId = await findCommuneId(client, u.communeName);
      const res = await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, roles, commune_id, identity_verification_status, license_verification_status)
         VALUES ($1, $2, $3, $4, $5::user_role[], $6, 'verified', 'verified')
         RETURNING id`,
        [u.email, passwordHash, u.firstName, u.lastName, u.roles, communeId],
      );
      userIds[u.key] = res.rows[0].id;
      console.log(`[seed-demo] Utilisateur créé : ${u.email} (${u.roles.join(',')})`);
    }

    const vehicleIds: Record<string, string> = {};

    for (const v of VEHICLES) {
      const res = await client.query(
        `INSERT INTO vehicles
          (owner_id, brand, model, year, license_plate, fuel_type, transmission, seats,
           location, address_label, price_per_day, deposit_amount, instant_booking, features,
           description, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,
                 ST_SetSRID(ST_MakePoint($10,$9),4326)::geography,
                 $11,$12,$13,$14,$15,$16,'active')
         RETURNING id`,
        [
          userIds[v.ownerKey], v.brand, v.model, v.year, v.licensePlate, v.fuelType, v.transmission, v.seats,
          v.lat, v.lng, v.addressLabel, v.pricePerDay, v.depositAmount, v.instantBooking, v.features, v.description,
        ],
      );
      vehicleIds[v.key] = res.rows[0].id;
      console.log(`[seed-demo] Véhicule créé : ${v.brand} ${v.model} (${v.addressLabel})`);
    }

    // Deux réservations passées + avis, pour que les notes ne soient pas à zéro.
    const pastBookings = [
      {
        vehicleKey: 'clio', renterKey: 'sara', ownerKey: 'karim',
        daysAgco: 20, days: 3, rating: 5, comment: 'Voiture impeccable, propriétaire ponctuel. Je recommande !',
      },
      {
        vehicleKey: '208', renterKey: 'mounir', ownerKey: 'yacine',
        daysAgco: 12, days: 2, rating: 4, comment: 'Bonne expérience globale, léger retard au moment de la remise des clés.',
      },
    ];

    for (const b of pastBookings) {
      const vehicle = VEHICLES.find((v) => v.key === b.vehicleKey)!;
      const startAt = new Date(Date.now() - b.daysAgco * 86400000);
      const endAt = new Date(startAt.getTime() + b.days * 86400000);
      const subtotal = vehicle.pricePerDay * b.days;
      const serviceFee = Math.round(subtotal * 0.15);
      const total = subtotal + serviceFee;

      const bookingRes = await client.query(
        `INSERT INTO bookings
          (vehicle_id, renter_id, owner_id, start_at, end_at, status, price_per_day, days_count,
           subtotal, service_fee, deposit_amount, total_amount, confirmed_at)
         VALUES ($1,$2,$3,$4,$5,'completed',$6,$7,$8,$9,$10,$11,$4)
         RETURNING id`,
        [
          vehicleIds[b.vehicleKey], userIds[b.renterKey], userIds[b.ownerKey], startAt, endAt,
          vehicle.pricePerDay, b.days, subtotal, serviceFee, vehicle.depositAmount, total,
        ],
      );
      const bookingId = bookingRes.rows[0].id;

      await client.query(
        `INSERT INTO reviews (booking_id, reviewer_id, reviewee_id, direction, rating, comment)
         VALUES ($1,$2,$3,'renter_to_owner',$4,$5)`,
        [bookingId, userIds[b.renterKey], userIds[b.ownerKey], b.rating, b.comment],
      );

      await client.query(`UPDATE vehicles SET avg_rating = $1, rating_count = 1 WHERE id = $2`, [b.rating, vehicleIds[b.vehicleKey]]);
      await client.query(`UPDATE users SET rating_avg = $1, rating_count = 1 WHERE id = $2`, [b.rating, userIds[b.ownerKey]]);
      console.log(`[seed-demo] Réservation + avis (${b.rating}★) créés pour ${vehicle.brand} ${vehicle.model}`);
    }

    console.log('[seed-demo] ================================================================');
    console.log('[seed-demo] Comptes de démonstration créés (mot de passe commun) :');
    console.log(`[seed-demo]   mot de passe : ${DEMO_PASSWORD}`);
    for (const u of USERS) console.log(`[seed-demo]   - ${u.email}  (${u.roles.join(',')})`);
    console.log('[seed-demo] 6 véhicules actifs, 2 réservations terminées avec avis.');
    console.log('[seed-demo] ================================================================');
  } finally {
    await client.end();
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[seed-demo] ÉCHEC (non bloquant) :', err);
    process.exit(0);
  });
