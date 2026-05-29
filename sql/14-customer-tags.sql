-- ============================================================
-- SMOG Demo - 客戶屬性 / 標籤 (v0.5.3)
-- 日期：2026-05-27
--
-- 紀錄客戶的家中狀況、年齡、印象等資訊
--   age (年齡) - 單選代碼 ATA/BTA/CTA/DTA
--   family (家庭成員) - 多選代碼 CC/DD/BB/DB/LB
--   home_style (家中風格) - 單選代碼 HD/DD/PD/LD
--   friendliness (親切度) - 1~5 數字
--   impression (印象) - 1~5 數字
-- ============================================================


-- ============================================================
-- 1. 客戶標籤類別 enum
-- ============================================================

DO $$ BEGIN
  CREATE TYPE customer_tag_category AS ENUM (
    'age',
    'family',
    'home_style',
    'friendliness',
    'impression'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ============================================================
-- 2. 標籤字典表 customer_tags
-- ============================================================

CREATE TABLE IF NOT EXISTS customer_tags (
  id           uuid                    PRIMARY KEY DEFAULT gen_random_uuid(),
  category     customer_tag_category   NOT NULL,
  code         text                    NOT NULL,
  description  text                    NOT NULL,
  sort_order   int                     NOT NULL DEFAULT 0,
  is_active    boolean                 NOT NULL DEFAULT true,
  notes        text,
  created_at   timestamptz             NOT NULL DEFAULT now(),
  updated_at   timestamptz             NOT NULL DEFAULT now(),
  UNIQUE (category, code)
);

COMMENT ON TABLE customer_tags IS '客戶標籤字典 - 各分類的可選代碼';
CREATE INDEX IF NOT EXISTS idx_customer_tags_category ON customer_tags(category) WHERE is_active = true;


-- ============================================================
-- 3. customer 加 tags jsonb 欄位
-- ============================================================

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS tags jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN customers.tags IS '客戶屬性 JSON: {age, family[], home_style, friendliness, impression}';


-- ============================================================
-- 4. 灌字典資料
-- ============================================================

INSERT INTO customer_tags (category, code, description, sort_order) VALUES
  -- 年齡分組 (Target Age) - 單選
  ('age',          'ATA', '25-35',     1),
  ('age',          'BTA', '35-45',     2),
  ('age',          'CTA', '45-55',     3),
  ('age',          'DTA', '55 以上',   4),

  -- 家庭成員 - 多選
  ('family',       'CC',  '有貓',           1),
  ('family',       'DD',  '有狗',           2),
  ('family',       'BB',  '有 0-7 歲小孩',  3),
  ('family',       'DB',  '有 8-15 歲小孩', 4),
  ('family',       'LB',  '有 65+ 老人',    5),

  -- 家中風格 - 單選
  ('home_style',   'HD',  '家中豪氣',         1),
  ('home_style',   'DD',  '家中精緻有設計感', 2),
  ('home_style',   'PD',  '家中普通',         3),
  ('home_style',   'LD',  '家中爛',           4),

  -- 親切度 1-5 (5 最高)
  ('friendliness', '5',   '5 - 超讚',  1),
  ('friendliness', '4',   '4 - 大方',  2),
  ('friendliness', '3',   '3 - 普通',  3),
  ('friendliness', '2',   '2 - 略差',  4),
  ('friendliness', '1',   '1 - 不友善', 5),

  -- 印象分數 1-5 (5 最高)
  ('impression',   '5',   '5 - 印象極佳', 1),
  ('impression',   '4',   '4 - 印象好',   2),
  ('impression',   '3',   '3 - 普通',     3),
  ('impression',   '2',   '2 - 印象差',   4),
  ('impression',   '1',   '1 - 印象極差', 5)
ON CONFLICT (category, code) DO UPDATE SET
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;


-- ============================================================
-- 5. RLS policy
-- ============================================================

ALTER TABLE customer_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "demo_all" ON customer_tags;
CREATE POLICY "demo_all" ON customer_tags FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);


-- ============================================================
-- 驗證
-- ============================================================
SELECT category, COUNT(*) AS option_count
FROM customer_tags
GROUP BY category
ORDER BY category;

SELECT '✅ customer_tags 字典已建立' AS result;
