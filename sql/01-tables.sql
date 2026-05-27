-- ============================================================
-- SMOG Schema v0.3 — Section 1: ENUM + TABLE + INDEX
-- ============================================================
-- 跑完這個檔案後，應該有 6 個 enum + 8 張 table
-- 驗證 SQL 在檔案最下方
-- ============================================================


-- ===== 1.1) ENUM（全英文）=====

CREATE TYPE case_type AS ENUM (
  'measurement_on_site',
  'measurement_online',
  'installation'
);

CREATE TYPE case_status AS ENUM (
  'inquiry',
  'measurement_scheduled',
  'measured',
  'awaiting_quote',
  'quoted',
  'awaiting_deposit',
  'awaiting_schedule',
  'work_scheduled',
  'work_in_progress',
  'work_completed',
  'no_show',
  'cancelled'
);

CREATE TYPE case_source AS ENUM (
  'line_official',
  'phone',
  'referral',
  'walk_in',
  'website',
  'other'
);

CREATE TYPE vehicle_type AS ENUM (
  'measurement',
  'installation',
  'both'
);

CREATE TYPE shift_status AS ENUM (
  'on_duty',
  'off_duty',
  'overtime',
  'annual_leave',
  'personal_leave',
  'sick_leave'
);

CREATE TYPE skill_type AS ENUM (
  'measurement',
  'installation'
);


-- ===== 1.2) 公司據點 =====

CREATE TABLE company_locations (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text          UNIQUE NOT NULL,
  name        text          NOT NULL,
  address     text,
  lat         numeric(10,7),
  lng         numeric(10,7),
  phone       text,
  notes       text,
  is_active   boolean       NOT NULL DEFAULT true,
  sort_order  int           NOT NULL DEFAULT 0,
  created_at  timestamptz   NOT NULL DEFAULT now(),
  updated_at  timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX idx_locations_active ON company_locations(is_active);
CREATE INDEX idx_locations_code   ON company_locations(code);


-- ===== 1.3) 客戶 =====

CREATE TABLE customers (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text          NOT NULL,
  phone       text          NOT NULL,
  line_id     text          NOT NULL UNIQUE,
  line_name   text,
  email       text,
  address     text,
  city        text,
  district    text,
  lat         numeric(10,7),
  lng         numeric(10,7),
  notes       text,
  created_at  timestamptz   NOT NULL DEFAULT now(),
  updated_at  timestamptz   NOT NULL DEFAULT now(),
  deleted_at  timestamptz,
  CONSTRAINT  customers_phone_check    CHECK (phone <> ''),
  CONSTRAINT  customers_line_id_check  CHECK (line_id <> '')
);

CREATE INDEX idx_customers_phone     ON customers(phone)     WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_name      ON customers(name)      WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_line_name ON customers(line_name) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_district  ON customers(district);


-- ===== 1.4) 車輛 =====

CREATE TABLE vehicles (
  id           uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  code         text          UNIQUE NOT NULL,
  name         text          NOT NULL,
  type         vehicle_type  NOT NULL,
  color        text,
  location_id  uuid          NOT NULL REFERENCES company_locations(id) ON DELETE RESTRICT,
  notes        text,
  is_active    boolean       NOT NULL DEFAULT true,
  created_at   timestamptz   NOT NULL DEFAULT now(),
  updated_at   timestamptz   NOT NULL DEFAULT now(),
  deleted_at   timestamptz
);

CREATE INDEX idx_vehicles_active   ON vehicles(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_vehicles_location ON vehicles(location_id);


-- ===== 1.5) 師傅 =====

CREATE TABLE technicians (
  id           uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  code         text          UNIQUE NOT NULL,
  name         text          NOT NULL,
  phone        text,
  skills       skill_type[]  NOT NULL DEFAULT '{}',
  location_id  uuid          NOT NULL REFERENCES company_locations(id) ON DELETE RESTRICT,
  is_active    boolean       NOT NULL DEFAULT true,
  hired_at     date,
  notes        text,
  created_at   timestamptz   NOT NULL DEFAULT now(),
  updated_at   timestamptz   NOT NULL DEFAULT now(),
  deleted_at   timestamptz
);

CREATE INDEX idx_technicians_active   ON technicians(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_technicians_location ON technicians(location_id);


-- ===== 1.6) 班表 / 分派 =====

CREATE TABLE technician_shifts (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id   uuid          NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
  shift_date      date          NOT NULL,
  status          shift_status  NOT NULL DEFAULT 'on_duty',
  overtime_start  time,
  overtime_end    time,
  notes           text,
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now(),
  UNIQUE (technician_id, shift_date)
);

CREATE INDEX idx_shifts_date      ON technician_shifts(shift_date);
CREATE INDEX idx_shifts_tech_date ON technician_shifts(technician_id, shift_date);

CREATE TABLE daily_assignments (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id      uuid          NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  technician_id   uuid          NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
  assignment_date date          NOT NULL,
  is_driver       boolean       NOT NULL DEFAULT false,
  notes           text,
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now(),
  UNIQUE (vehicle_id, technician_id, assignment_date)
);

CREATE INDEX idx_assignments_date         ON daily_assignments(assignment_date);
CREATE INDEX idx_assignments_vehicle_date ON daily_assignments(vehicle_id, assignment_date);
CREATE INDEX idx_assignments_tech_date    ON daily_assignments(technician_id, assignment_date);


-- ===== 1.7) 案件 =====

CREATE TABLE cases (
  id                          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  code                        text          UNIQUE NOT NULL,
  customer_id                 uuid          NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  location_id                 uuid          NOT NULL REFERENCES company_locations(id) ON DELETE RESTRICT,

  -- 服務地址
  address                     text          NOT NULL,
  city                        text,
  district                    text,
  lat                         numeric(10,7),
  lng                         numeric(10,7),

  case_type                   case_type     NOT NULL,
  status                      case_status   NOT NULL DEFAULT 'inquiry',
  source                      case_source   NOT NULL,

  -- 主時段（會 block 時間表）
  scheduled_date              date,
  scheduled_start             time,
  duration_minutes            integer       NOT NULL DEFAULT 60,
  is_confirmed                boolean       NOT NULL DEFAULT false,

  -- 預選時段
  proposed_slots              jsonb         NOT NULL DEFAULT '[]'::jsonb,
  released_slots              jsonb         NOT NULL DEFAULT '[]'::jsonb,

  -- 後補名單
  is_waiting_earlier          boolean       NOT NULL DEFAULT false,
  earliest_acceptable_date    date,
  latest_acceptable_date      date,

  vehicle_id                  uuid          REFERENCES vehicles(id) ON DELETE SET NULL,
  estimated_amount            numeric(12,2),
  final_amount                numeric(12,2),
  product_request             text,
  special_conditions          text[]        NOT NULL DEFAULT '{}',
  notes                       text,
  created_at                  timestamptz   NOT NULL DEFAULT now(),
  updated_at                  timestamptz   NOT NULL DEFAULT now(),
  created_by                  uuid,
  deleted_at                  timestamptz,

  CONSTRAINT cases_scheduled_consistency CHECK (
    (scheduled_date IS NULL AND scheduled_start IS NULL) OR
    (scheduled_date IS NOT NULL AND scheduled_start IS NOT NULL)
  ),
  CONSTRAINT cases_acceptable_date_order CHECK (
    earliest_acceptable_date IS NULL OR latest_acceptable_date IS NULL OR
    earliest_acceptable_date <= latest_acceptable_date
  )
);

CREATE INDEX idx_cases_status                 ON cases(status)                               WHERE deleted_at IS NULL;
CREATE INDEX idx_cases_date                   ON cases(scheduled_date)                       WHERE deleted_at IS NULL;
CREATE INDEX idx_cases_vehicle_date           ON cases(vehicle_id, scheduled_date)           WHERE deleted_at IS NULL;
CREATE INDEX idx_cases_customer               ON cases(customer_id);
CREATE INDEX idx_cases_unscheduled            ON cases(status)                               WHERE vehicle_id IS NULL AND deleted_at IS NULL;
CREATE INDEX idx_cases_district               ON cases(district);
CREATE INDEX idx_cases_location               ON cases(location_id);
CREATE INDEX idx_cases_waiting_earlier        ON cases(latest_acceptable_date)               WHERE is_waiting_earlier = true AND deleted_at IS NULL;
CREATE INDEX idx_cases_proposed_slots         ON cases USING GIN (proposed_slots);

CREATE TABLE case_status_log (
  id           uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id      uuid          NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  old_status   case_status,
  new_status   case_status   NOT NULL,
  changed_by   uuid,
  changed_at   timestamptz   NOT NULL DEFAULT now(),
  notes        text
);

CREATE INDEX idx_status_log_case ON case_status_log(case_id);


-- ============================================================
-- 跑完後驗證
-- ============================================================
-- 1. 確認 8 張 table 都建好（在 SQL Editor 新開 query 跑這段）：
--
--   SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public' ORDER BY table_name;
--
--   應看到：case_status_log, cases, company_locations, customers,
--          daily_assignments, technician_shifts, technicians, vehicles
--
-- 2. 確認 6 個 enum：
--
--   SELECT typname FROM pg_type WHERE typtype = 'e' ORDER BY typname;
--
--   應看到：case_source, case_status, case_type, shift_status,
--          skill_type, vehicle_type
-- ============================================================
