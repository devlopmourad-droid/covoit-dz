-- =====================================================================
-- COVOIT-DZ — Schéma de base de données
-- Plateforme d'autopartage entre particuliers (Algérie)
-- =====================================================================
-- Conventions :
--  - Toutes les tables ont created_at / updated_at.
--  - Les clés primaires "métier" sont en UUID (évite l'énumération d'IDs
--    séquentiels par un attaquant sur une marketplace publique).
--  - Les tables géographiques de référence (wilayas/dairas/communes)
--    utilisent des ID séquentiels (données de référence, pas de risque).
--  - Champs marqués [CONFIGURABLE - VALIDATION JURIDIQUE REQUISE] :
--    la valeur par défaut est une hypothèse raisonnable, PAS un avis
--    juridique. À valider avec un professionnel du droit algérien
--    avant mise en production (assurance, caution, âge minimum, etc.)
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS btree_gist;   -- pour les contraintes EXCLUDE
CREATE EXTENSION IF NOT EXISTS pgcrypto;     -- pour gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;       -- pour email insensible à la casse
CREATE EXTENSION IF NOT EXISTS pg_trgm;      -- pour la recherche floue sur les noms de communes

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- 1. GÉOGRAPHIE — Wilaya → Daïra → Commune
-- =====================================================================
-- NOTE IMPORTANTE : depuis la loi 26-06 (avril 2026), l'Algérie compte
-- 69 wilayas (contre 58 depuis 2019, 48 avant 2019). Le schéma est conçu
-- pour ce découpage actuel et non les 48 wilayas historiques.

CREATE TABLE wilayas (
  id            SERIAL PRIMARY KEY,
  code          VARCHAR(3) UNIQUE NOT NULL,      -- "01".."69"
  name_fr       VARCHAR(100) NOT NULL,
  name_ar       VARCHAR(100) NOT NULL,
  center        geography(Point, 4326),           -- centroïde approximatif
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE dairas (
  id            SERIAL PRIMARY KEY,
  wilaya_id     INT NOT NULL REFERENCES wilayas(id) ON DELETE RESTRICT,
  code          VARCHAR(6),
  name_fr       VARCHAR(100) NOT NULL,
  name_ar       VARCHAR(100),
  center        geography(Point, 4326),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- NOTE DE QUALITÉ DE DONNÉES : la couche "daïra" (548 attendues) n'a
-- pas encore été importée. Aucune source ouverte fiable et à jour vis-à-vis
-- de la loi 26-06 n'a été trouvée automatiquement. La table est prête ;
-- communes.daira_id reste NULLABLE tant que ces données ne sont pas
-- chargées depuis une source officielle (Journal Officiel / ONS).
-- => Ne pas fabriquer ces données : voir docs/DATA_MODEL.md.

CREATE TABLE communes (
  id            SERIAL PRIMARY KEY,
  wilaya_id     INT NOT NULL REFERENCES wilayas(id) ON DELETE RESTRICT,
  daira_id      INT REFERENCES dairas(id) ON DELETE SET NULL,
  postal_code   VARCHAR(5),
  name_fr       VARCHAR(100) NOT NULL,
  name_ar       VARCHAR(100),
  location      geography(Point, 4326),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_communes_location ON communes USING GIST(location);
CREATE INDEX idx_communes_wilaya   ON communes(wilaya_id);
CREATE INDEX idx_communes_name_fr  ON communes USING GIN (name_fr gin_trgm_ops);

-- =====================================================================
-- 2. UTILISATEURS
-- =====================================================================

CREATE TYPE user_role AS ENUM ('renter', 'owner', 'admin', 'support');
CREATE TYPE verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected');

CREATE TABLE users (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                         CITEXT UNIQUE NOT NULL,
  phone                         VARCHAR(20) UNIQUE,
  password_hash                 VARCHAR(255) NOT NULL,
  first_name                    VARCHAR(100) NOT NULL,
  last_name                     VARCHAR(100) NOT NULL,
  roles                         user_role[] NOT NULL DEFAULT ARRAY['renter']::user_role[],
  date_of_birth                 DATE,
  commune_id                    INT REFERENCES communes(id),
  avatar_url                    TEXT,
  identity_verification_status  verification_status NOT NULL DEFAULT 'unverified',
  license_verification_status   verification_status NOT NULL DEFAULT 'unverified',
  rating_avg                    NUMERIC(2,1) NOT NULL DEFAULT 0,
  rating_count                  INT NOT NULL DEFAULT 0,
  is_active                     BOOLEAN NOT NULL DEFAULT true,
  failed_login_attempts         INT NOT NULL DEFAULT 0,
  locked_until                  TIMESTAMPTZ,
  last_login_at                 TIMESTAMPTZ,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- [CONFIGURABLE - VALIDATION JURIDIQUE] âge minimum pour louer/proposer
-- un véhicule en Algérie. Valeur par défaut appliquée en code (21 ans,
-- cohérente avec la plupart des contrats d'assurance temporaire), voir
-- backend/src/config/business-rules.config.ts

CREATE TABLE refresh_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash    VARCHAR(255) NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  revoked_at    TIMESTAMPTZ,
  user_agent    TEXT,
  ip_address    INET,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);

CREATE TABLE user_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          VARCHAR(30) NOT NULL, -- national_id, driver_license, proof_of_address
  file_url      TEXT NOT NULL,
  status        verification_status NOT NULL DEFAULT 'pending',
  reviewed_by   UUID REFERENCES users(id),
  reviewed_at   TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_user_documents_user ON user_documents(user_id);

-- =====================================================================
-- 3. VÉHICULES
-- =====================================================================

CREATE TYPE vehicle_status AS ENUM ('draft', 'pending_review', 'active', 'paused', 'suspended', 'archived');
CREATE TYPE fuel_type AS ENUM ('essence', 'diesel', 'hybride', 'electrique', 'gpl');
CREATE TYPE transmission_type AS ENUM ('manuelle', 'automatique');

CREATE TABLE vehicles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id              UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  brand                 VARCHAR(50) NOT NULL,
  model                 VARCHAR(50) NOT NULL,
  year                  INT NOT NULL CHECK (year BETWEEN 1980 AND 2100),
  license_plate         VARCHAR(20) NOT NULL UNIQUE,
  color                 VARCHAR(30),
  seats                 INT NOT NULL DEFAULT 5 CHECK (seats BETWEEN 1 AND 9),
  doors                 INT DEFAULT 4,
  fuel_type             fuel_type NOT NULL,
  transmission          transmission_type NOT NULL,
  commune_id            INT REFERENCES communes(id),
  location              geography(Point, 4326) NOT NULL,
  address_label         TEXT,
  price_per_day         NUMERIC(10,2) NOT NULL CHECK (price_per_day > 0),
  deposit_amount        NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (deposit_amount >= 0),
  min_rental_days       INT NOT NULL DEFAULT 1,
  max_rental_days       INT NOT NULL DEFAULT 30,
  instant_booking       BOOLEAN NOT NULL DEFAULT false,
  mileage_limit_per_day INT,   -- NULL = illimité
  extra_km_price        NUMERIC(10,2),
  status                vehicle_status NOT NULL DEFAULT 'draft',
  description           TEXT,
  features               TEXT[] NOT NULL DEFAULT '{}',  -- gps, clim, bluetooth, sieges_bebe...
  avg_rating            NUMERIC(2,1) NOT NULL DEFAULT 0,
  rating_count           INT NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_vehicles_location ON vehicles USING GIST(location);
CREATE INDEX idx_vehicles_owner ON vehicles(owner_id);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE TRIGGER trg_vehicles_updated BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE vehicle_photos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id    UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  position      INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_vehicle_photos_vehicle ON vehicle_photos(vehicle_id);

-- Blocages manuels du calendrier par le propriétaire (indispo, entretien...)
CREATE TABLE vehicle_blocked_periods (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id    UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  start_at      TIMESTAMPTZ NOT NULL,
  end_at        TIMESTAMPTZ NOT NULL,
  reason        VARCHAR(255),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_block_dates CHECK (end_at > start_at)
);
-- Même logique anti-chevauchement que pour les réservations (voir plus bas)
ALTER TABLE vehicle_blocked_periods ADD CONSTRAINT no_overlapping_blocks
  EXCLUDE USING GIST (
    vehicle_id WITH =,
    tstzrange(start_at, end_at) WITH &&
  );

-- =====================================================================
-- 4. RÉSERVATIONS
-- =====================================================================

CREATE TYPE booking_status AS ENUM (
  'pending',      -- créée, en attente de confirmation propriétaire (si pas instant_booking) ou de paiement
  'confirmed',    -- confirmée et payée, en attente du check-in
  'ongoing',      -- check-in effectué, location en cours
  'completed',    -- check-out effectué
  'cancelled_by_renter',
  'cancelled_by_owner',
  'rejected',     -- refusée par le propriétaire
  'disputed'
);

CREATE TABLE bookings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id        UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  renter_id         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  owner_id          UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  start_at          TIMESTAMPTZ NOT NULL,
  end_at            TIMESTAMPTZ NOT NULL,
  status            booking_status NOT NULL DEFAULT 'pending',
  price_per_day     NUMERIC(10,2) NOT NULL,
  days_count        INT NOT NULL,
  subtotal          NUMERIC(10,2) NOT NULL,
  service_fee       NUMERIC(10,2) NOT NULL DEFAULT 0,   -- commission plateforme
  protection_fee    NUMERIC(10,2) NOT NULL DEFAULT 0,
  deposit_amount    NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount      NUMERIC(10,2) NOT NULL,
  protection_plan_id UUID,
  cancellation_reason TEXT,
  cancelled_at      TIMESTAMPTZ,
  confirmed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_booking_dates CHECK (end_at > start_at),
  CONSTRAINT renter_not_owner CHECK (renter_id <> owner_id)
);
CREATE INDEX idx_bookings_vehicle ON bookings(vehicle_id);
CREATE INDEX idx_bookings_renter ON bookings(renter_id);
CREATE INDEX idx_bookings_owner ON bookings(owner_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE TRIGGER trg_bookings_updated BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- *** RÈGLE ANTI DOUBLE-RÉSERVATION AU NIVEAU BASE DE DONNÉES ***
-- Une contrainte EXCLUDE garantit, y compris sous forte concurrence
-- (deux requêtes simultanées), qu'aucun véhicule ne peut avoir deux
-- réservations actives ("pending","confirmed","ongoing") qui se
-- chevauchent. C'est plus robuste qu'une simple vérification côté
-- application (race condition impossible à exploiter).
ALTER TABLE bookings ADD CONSTRAINT no_overlapping_active_bookings
  EXCLUDE USING GIST (
    vehicle_id WITH =,
    tstzrange(start_at, end_at) WITH &&
  ) WHERE (status IN ('pending', 'confirmed', 'ongoing'));

-- =====================================================================
-- 5. ÉTAT DES LIEUX (check-in / check-out)
-- =====================================================================

CREATE TYPE inspection_type AS ENUM ('check_in', 'check_out');

CREATE TABLE vehicle_inspections (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id            UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  type                  inspection_type NOT NULL,
  mileage               INT,
  fuel_level_percent    INT CHECK (fuel_level_percent BETWEEN 0 AND 100),
  exterior_notes        TEXT,
  interior_notes        TEXT,
  damages_reported      BOOLEAN NOT NULL DEFAULT false,
  performed_by          UUID NOT NULL REFERENCES users(id),
  performed_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  signature_renter_url  TEXT,
  signature_owner_url   TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (booking_id, type)
);

CREATE TABLE inspection_photos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id   UUID NOT NULL REFERENCES vehicle_inspections(id) ON DELETE CASCADE,
  url             TEXT NOT NULL,
  position        INT NOT NULL DEFAULT 0
);

-- =====================================================================
-- 6. DOMMAGES / LITIGES
-- =====================================================================

CREATE TYPE claim_status AS ENUM ('open', 'under_review', 'accepted', 'rejected', 'resolved');

CREATE TABLE damage_claims (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id        UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  reported_by       UUID NOT NULL REFERENCES users(id),
  description       TEXT NOT NULL,
  estimated_cost    NUMERIC(10,2),
  status            claim_status NOT NULL DEFAULT 'open',
  resolution_notes  TEXT,
  resolved_by       UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_claims_updated BEFORE UPDATE ON damage_claims
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE damage_claim_photos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id    UUID NOT NULL REFERENCES damage_claims(id) ON DELETE CASCADE,
  url         TEXT NOT NULL
);

-- =====================================================================
-- 7. PAIEMENTS  (couche d'abstraction — [CONFIGURABLE / EN ATTENTE PSP])
-- =====================================================================
-- Aucun prestataire de paiement algérien (SATIM/CIB, carte Edahabia...)
-- n'est intégré : cela nécessite un contrat marchand réel. La table est
-- conçue pour brancher un vrai PSP sans changer le reste du système ;
-- le provider "mock" simule les paiements en environnement de dev/démo.

CREATE TYPE payment_provider AS ENUM ('mock', 'cib_satim', 'edahabia', 'cash_on_pickup');
CREATE TYPE payment_status AS ENUM ('pending', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded');
CREATE TYPE payment_purpose AS ENUM ('rental', 'deposit', 'protection', 'payout', 'refund');

CREATE TABLE payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id          UUID REFERENCES bookings(id) ON DELETE SET NULL,
  user_id             UUID NOT NULL REFERENCES users(id),
  provider            payment_provider NOT NULL DEFAULT 'mock',
  purpose             payment_purpose NOT NULL,
  amount              NUMERIC(10,2) NOT NULL,
  currency            VARCHAR(3) NOT NULL DEFAULT 'DZD',
  status              payment_status NOT NULL DEFAULT 'pending',
  provider_reference  VARCHAR(255),
  failure_reason      TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Formules de protection/assurance — [CONFIGURABLE - VALIDATION JURIDIQUE]
-- Les montants et garanties ci-dessous sont des hypothèses de travail,
-- PAS un produit d'assurance réel. Nécessite validation par un assureur
-- agréé en Algérie avant toute mise en production.
CREATE TABLE protection_plans (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                  VARCHAR(30) UNIQUE NOT NULL,
  name_fr               VARCHAR(100) NOT NULL,
  name_ar               VARCHAR(100),
  deductible_amount     NUMERIC(10,2) NOT NULL,
  daily_price           NUMERIC(10,2) NOT NULL,
  coverage_description  TEXT,
  is_active             BOOLEAN NOT NULL DEFAULT true,
  legal_status          VARCHAR(30) NOT NULL DEFAULT 'pending_legal_validation',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE bookings ADD CONSTRAINT fk_booking_protection_plan
  FOREIGN KEY (protection_plan_id) REFERENCES protection_plans(id);

-- =====================================================================
-- 8. MESSAGERIE
-- =====================================================================

CREATE TABLE conversations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id    UUID UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  vehicle_id    UUID REFERENCES vehicles(id),
  renter_id     UUID NOT NULL REFERENCES users(id),
  owner_id      UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id         UUID NOT NULL REFERENCES users(id),
  content           TEXT NOT NULL,
  read_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);

-- =====================================================================
-- 9. AVIS / NOTATION
-- =====================================================================

CREATE TABLE reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id    UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  reviewer_id   UUID NOT NULL REFERENCES users(id),
  reviewee_id   UUID NOT NULL REFERENCES users(id),
  direction     VARCHAR(20) NOT NULL CHECK (direction IN ('renter_to_owner', 'owner_to_renter')),
  rating        SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (booking_id, direction)
);

-- =====================================================================
-- 10. SUPPORT / LITIGES
-- =====================================================================

CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'waiting_user', 'resolved', 'closed');
CREATE TYPE ticket_priority AS ENUM ('low', 'normal', 'high', 'urgent');

CREATE TABLE support_tickets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id),
  booking_id    UUID REFERENCES bookings(id),
  subject       VARCHAR(255) NOT NULL,
  status        ticket_status NOT NULL DEFAULT 'open',
  priority      ticket_priority NOT NULL DEFAULT 'normal',
  assigned_to   UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_tickets_updated BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE support_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES users(id),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- 11. ADMINISTRATION / AUDIT / NOTIFICATIONS
-- =====================================================================

CREATE TABLE audit_logs (
  id            BIGSERIAL PRIMARY KEY,
  actor_id      UUID REFERENCES users(id),
  action        VARCHAR(100) NOT NULL,
  entity_type   VARCHAR(50) NOT NULL,
  entity_id     TEXT,
  metadata      JSONB,
  ip_address    INET,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        VARCHAR(50) NOT NULL,
  title       VARCHAR(255) NOT NULL,
  body        TEXT,
  data        JSONB,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON notifications(user_id, read_at);

-- =====================================================================
-- FIN DU SCHÉMA
-- =====================================================================
