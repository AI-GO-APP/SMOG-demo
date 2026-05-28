-- ============================================================
-- SMOG Demo - 對齊客戶 Ragic schema (v0.5.2)
-- 日期：2026-05-27
--
-- 新增：
--   • communities 表 (社區)
--   • group_purchases 表 (團購)
--   • cases 加 venue_type / floor_plan / community_id / group_purchase_id
--   • case_source enum 擴充
-- ============================================================


-- ============================================================
-- 1. 社區表 (communities)
-- ============================================================

CREATE TABLE IF NOT EXISTS communities (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text          UNIQUE,
  name        text          NOT NULL,
  address     text,
  city        text,
  district    text,
  lat         numeric(10,7),
  lng         numeric(10,7),
  branch_location_id uuid REFERENCES company_locations(id),
  notes       text,
  is_active   boolean       NOT NULL DEFAULT true,
  created_at  timestamptz   NOT NULL DEFAULT now(),
  updated_at  timestamptz   NOT NULL DEFAULT now(),
  deleted_at  timestamptz
);

COMMENT ON TABLE communities IS '社區 / 案場主檔';
COMMENT ON COLUMN communities.code IS '社區編號 (對外)';

CREATE INDEX IF NOT EXISTS idx_communities_active ON communities(is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_communities_branch ON communities(branch_location_id);


-- ============================================================
-- 2. 團購表 (group_purchases)
-- ============================================================

CREATE TABLE IF NOT EXISTS group_purchases (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text          UNIQUE,
  name        text          NOT NULL,
  notes       text,
  is_active   boolean       NOT NULL DEFAULT true,
  created_at  timestamptz   NOT NULL DEFAULT now(),
  updated_at  timestamptz   NOT NULL DEFAULT now(),
  deleted_at  timestamptz
);

COMMENT ON TABLE group_purchases IS '團購 / 特約 主檔';

CREATE INDEX IF NOT EXISTS idx_group_purchases_active ON group_purchases(is_active) WHERE deleted_at IS NULL;


-- ============================================================
-- 3. 案場類型 / 格局 enum
-- ============================================================

DO $$ BEGIN
  CREATE TYPE venue_type AS ENUM ('building', 'townhouse', 'apartment', 'condo', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON TYPE venue_type IS '案場類型: building=大樓, townhouse=透天, apartment=公寓, condo=華廈, other=其他';

DO $$ BEGIN
  CREATE TYPE floor_plan AS ENUM (
    'studio',         -- 套房
    'one_room',       -- 一房一廳
    'two_bedroom',    -- 兩房
    'three_bedroom',  -- 三房
    'four_plus',      -- 四房以上
    'large_space',    -- 大面積空間
    'other',          -- 其他
    'pending'         -- 待確認
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON TYPE floor_plan IS '格局: studio=套房, one_room=一房一廳, two_bedroom=兩房, three_bedroom=三房, four_plus=四房+, large_space=大面積, other=其他, pending=待確認';


-- ============================================================
-- 4. 案件 cases 加欄位
-- ============================================================

ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS venue_type        venue_type,
  ADD COLUMN IF NOT EXISTS floor_plan        floor_plan,
  ADD COLUMN IF NOT EXISTS community_id      uuid REFERENCES communities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS group_purchase_id uuid REFERENCES group_purchases(id) ON DELETE SET NULL;

COMMENT ON COLUMN cases.venue_type IS '案場類型 (nullable)';
COMMENT ON COLUMN cases.floor_plan IS '格局 (nullable)';
COMMENT ON COLUMN cases.community_id IS '社區 FK (nullable)';
COMMENT ON COLUMN cases.group_purchase_id IS '團購 FK (nullable)';

CREATE INDEX IF NOT EXISTS idx_cases_community ON cases(community_id) WHERE community_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cases_group_purchase ON cases(group_purchase_id) WHERE group_purchase_id IS NOT NULL;


-- ============================================================
-- 5. case_source enum 擴充 (對齊客戶 10 種來源)
-- ============================================================

-- PostgreSQL 加 enum 值: ALTER TYPE ... ADD VALUE
DO $$ BEGIN
  ALTER TYPE case_source ADD VALUE IF NOT EXISTS 'fb_messenger';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE case_source ADD VALUE IF NOT EXISTS 'live_chat';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE case_source ADD VALUE IF NOT EXISTS 'butler';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE case_source ADD VALUE IF NOT EXISTS 'community_form';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE case_source ADD VALUE IF NOT EXISTS 'individual_form';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE case_source ADD VALUE IF NOT EXISTS 'public_broadcast';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE case_source ADD VALUE IF NOT EXISTS 'business_client';
EXCEPTION WHEN others THEN NULL; END $$;

-- 現有保留：line_official, phone, referral, walk_in (門市), website, other


-- ============================================================
-- 6. 範例社區 (給下拉選單測試用)
-- ============================================================

INSERT INTO communities (code, name, address, city, district, branch_location_id, notes) VALUES
  ('CM001', '青埔華爾街',         '桃園市中壢區高鐵北路', '桃園市', '中壢區',
    (SELECT id FROM company_locations WHERE code = 'taoyuan'), '示範社區'),
  ('CM002', '林口國家公園',       '新北市林口區文化二路', '新北市', '林口區',
    (SELECT id FROM company_locations WHERE code = 'taoyuan'), '示範社區'),
  ('CM003', '南崁站前廣場',       '桃園市蘆竹區南崁路一段', '桃園市', '蘆竹區',
    (SELECT id FROM company_locations WHERE code = 'taoyuan'), '示範社區'),
  ('CM004', '台中七期豪宅',       '台中市西屯區市政北路', '台中市', '西屯區',
    (SELECT id FROM company_locations WHERE code = 'taichung'), '示範社區'),
  ('CM005', '台南安平海景',       '台南市安平區安平路', '台南市', '安平區',
    (SELECT id FROM company_locations WHERE code = 'tainan'), '示範社區'),
  ('CM006', '高雄三民翡翠灣',     '高雄市三民區建工路', '高雄市', '三民區',
    (SELECT id FROM company_locations WHERE code = 'kaohsiung'), '示範社區')
ON CONFLICT (code) DO NOTHING;


-- ============================================================
-- 7. 範例團購
-- ============================================================

INSERT INTO group_purchases (code, name, notes) VALUES
  ('GP-2026-05', '五月早鳥團',       '2026 年 5 月早鳥優惠'),
  ('GP-2026-06', '六月夏季團',       '2026 年 6 月夏季促銷'),
  ('GP-DESIGNER', '設計師合作團',     '長期合作設計師團購')
ON CONFLICT (code) DO NOTHING;


-- ============================================================
-- 8. RLS 寬鬆 policy (跟現有 SMOG 表一致)
-- ============================================================
-- Supabase publishable key 強制要求 RLS。沒 policy 就讀不到。
-- demo 階段用「全部允許」policy；正式版要改成 location-based。

ALTER TABLE communities      ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_purchases  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "demo_all" ON communities;
DROP POLICY IF EXISTS "demo_all" ON group_purchases;

CREATE POLICY "demo_all" ON communities      FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "demo_all" ON group_purchases  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);


-- ============================================================
-- 驗證
-- ============================================================
SELECT 'communities' AS table_name, COUNT(*) AS rows FROM communities
UNION ALL
SELECT 'group_purchases', COUNT(*) FROM group_purchases;

SELECT '✅ schema 已對齊客戶 Ragic 基本欄位' AS result;
