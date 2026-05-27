-- ============================================================
-- SMOG Demo - 加「參加說明會時間」+「案件性質」(v0.5.1)
-- 日期：2026-05-21
--
-- 業務規則：
--   舊客戶 (有 briefing_attended_at)        →  丈量 60 分
--   一般 (無 briefing, case_nature='normal') →  丈量 90 分
--   透天/兩戶/鄰居一起 (case_nature 其他)    →  丈量 120 分
-- ============================================================

-- 1. customers 加「參加說明會時間」(含一對一)
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS briefing_attended_at TIMESTAMPTZ;

COMMENT ON COLUMN customers.briefing_attended_at IS '客戶最近參加說明會 / 1對1 時間 (NULL=新客戶)';

-- 2. cases 加「案件性質」
DO $$ BEGIN
  CREATE TYPE case_nature AS ENUM ('normal', 'house', 'two_household', 'neighbors_combined');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS case_nature case_nature DEFAULT 'normal' NOT NULL;

COMMENT ON COLUMN cases.case_nature IS '案件性質：normal=一般, house=透天, two_household=兩戶, neighbors_combined=鄰居一起';


-- 3. 驗證
SELECT
  column_name, data_type,
  (SELECT obj_description((SELECT oid FROM pg_class WHERE relname='customers'), 'pg_class')) AS dummy
FROM information_schema.columns
WHERE table_name = 'customers' AND column_name = 'briefing_attended_at';

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'cases' AND column_name = 'case_nature';
