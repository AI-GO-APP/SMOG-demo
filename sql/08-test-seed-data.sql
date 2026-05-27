-- ============================================================
-- SMOG Demo - 測試用假資料 (v0.5)
-- 日期：2026-05-21
-- 目的：測試排程建議演算法（順路 / 孤立 / 同區聚集）
--
-- 內容：
--   • 5/21~5/25: 5 筆已排丈量案件
--   • 3 筆未排丈量案件（淡水、南港、桃園八德）
--   • 整個 5 月: 隨機車人配對（週末跳過）
--
-- 使用：在 Supabase SQL Editor 全選後 Run
-- ============================================================


-- ============================================================
-- Step 1: 清除舊資料
-- ============================================================

-- 1.1 清除 5/21~5/25 的所有案件
DELETE FROM cases WHERE scheduled_date BETWEEN '2026-05-21' AND '2026-05-25';

-- 1.2 清除所有「諮詢中」未排案件（避免干擾）
DELETE FROM cases WHERE status = 'inquiry';

-- 1.3 清除 5 月的所有車人配對
DELETE FROM daily_assignments WHERE assignment_date BETWEEN '2026-05-01' AND '2026-05-31';


-- ============================================================
-- Step 2: 確保測試客戶存在
-- ============================================================

INSERT INTO customers (name, phone, line_id, line_name, address, city, district, lat, lng) VALUES
  -- 已排案件用
  ('王中壢-T1', '0911-T-001', 'LINE-T-001', '王中壢', '桃園市中壢區中央西路200號',   '桃園市', '中壢區',  24.9532, 121.2235),
  ('陳八德-T2', '0911-T-002', 'LINE-T-002', '陳八德', '桃園市八德區介壽路二段60號',   '桃園市', '八德區',  24.9286, 121.2849),
  ('林中壢-T3', '0911-T-003', 'LINE-T-003', '林中壢', '桃園市中壢區延平路100號',       '桃園市', '中壢區',  24.9580, 121.2270),
  ('黃南港-T4', '0911-T-004', 'LINE-T-004', '黃南港', '台北市南港區市民大道八段100號', '台北市', '南港區',  25.0500, 121.6000),
  ('張中壢-T5', '0911-T-005', 'LINE-T-005', '張中壢', '桃園市中壢區中央東路50號',     '桃園市', '中壢區',  24.9551, 121.2278),
  -- 未排案件用
  ('蔡淡水-T6', '0911-T-006', 'LINE-T-006', '蔡淡水', '新北市淡水區中山北路一段50號', '新北市', '淡水區',  25.1700, 121.4500),
  ('吳南港-T7', '0911-T-007', 'LINE-T-007', '吳南港', '台北市南港區忠孝東路七段200號','台北市', '南港區',  25.0520, 121.6050),
  ('周八德-T8', '0911-T-008', 'LINE-T-008', '周八德', '桃園市八德區介壽路一段30號',   '桃園市', '八德區',  24.9280, 121.2810)
ON CONFLICT (line_id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng;


-- ============================================================
-- Step 3: 5 筆已排丈量案件 (5/21, 5/22, 5/25)
-- ============================================================

INSERT INTO cases
  (code, customer_id, location_id, address, city, district, lat, lng,
   case_type, status, source, scheduled_date, scheduled_start, duration_minutes,
   is_confirmed, vehicle_id, notes)
VALUES
  -- 5/21 桃園中壢 10:00 (車1)
  ('TST-21-10-V1',
   (SELECT id FROM customers WHERE line_id = 'LINE-T-001'),
   (SELECT id FROM company_locations WHERE code = 'taoyuan'),
   '桃園市中壢區中央西路200號', '桃園市', '中壢區', 24.9532, 121.2235,
   'measurement_on_site', 'measurement_scheduled', 'line_official',
   '2026-05-21', '10:00', 60, true,
   (SELECT id FROM vehicles WHERE code = 'V1'),
   '測試資料 - 5/21 桃園'),

  -- 5/21 桃園八德 14:00 (車2)
  ('TST-21-14-V2',
   (SELECT id FROM customers WHERE line_id = 'LINE-T-002'),
   (SELECT id FROM company_locations WHERE code = 'taoyuan'),
   '桃園市八德區介壽路二段60號', '桃園市', '八德區', 24.9286, 121.2849,
   'measurement_on_site', 'measurement_scheduled', 'line_official',
   '2026-05-21', '14:00', 60, true,
   (SELECT id FROM vehicles WHERE code = 'V2'),
   '測試資料 - 5/21 桃園'),

  -- 5/22 桃園中壢 10:00 (車1)
  ('TST-22-10-V1',
   (SELECT id FROM customers WHERE line_id = 'LINE-T-003'),
   (SELECT id FROM company_locations WHERE code = 'taoyuan'),
   '桃園市中壢區延平路100號', '桃園市', '中壢區', 24.9580, 121.2270,
   'measurement_on_site', 'measurement_scheduled', 'line_official',
   '2026-05-22', '10:00', 60, true,
   (SELECT id FROM vehicles WHERE code = 'V1'),
   '測試資料 - 5/22 桃園'),

  -- 5/22 南港 13:00 (車3) ← 重點: 跨區、孤立區
  ('TST-22-13-V3',
   (SELECT id FROM customers WHERE line_id = 'LINE-T-004'),
   (SELECT id FROM company_locations WHERE code = 'taoyuan'),
   '台北市南港區市民大道八段100號', '台北市', '南港區', 25.0500, 121.6000,
   'measurement_on_site', 'measurement_scheduled', 'line_official',
   '2026-05-22', '13:00', 60, true,
   (SELECT id FROM vehicles WHERE code = 'V3'),
   '測試資料 - 5/22 南港 (跨區)'),

  -- 5/25 桃園中壢 10:00 (車1)
  ('TST-25-10-V1',
   (SELECT id FROM customers WHERE line_id = 'LINE-T-005'),
   (SELECT id FROM company_locations WHERE code = 'taoyuan'),
   '桃園市中壢區中央東路50號', '桃園市', '中壢區', 24.9551, 121.2278,
   'measurement_on_site', 'measurement_scheduled', 'line_official',
   '2026-05-25', '10:00', 60, true,
   (SELECT id FROM vehicles WHERE code = 'V1'),
   '測試資料 - 5/25 桃園');


-- ============================================================
-- Step 4: 3 筆未排丈量案件 (諮詢中)
-- ============================================================

INSERT INTO cases
  (code, customer_id, location_id, address, city, district, lat, lng,
   case_type, status, source, duration_minutes, notes)
VALUES
  -- 淡水 (測 Scenario B: 太遠 → 排空白日下午)
  ('TST-INQ-淡水',
   (SELECT id FROM customers WHERE line_id = 'LINE-T-006'),
   (SELECT id FROM company_locations WHERE code = 'taoyuan'),
   '新北市淡水區中山北路一段50號', '新北市', '淡水區', 25.1700, 121.4500,
   'measurement_on_site', 'inquiry', 'line_official', 60,
   '測試: 期待排到空白日 13:00'),

  -- 南港 (測 Scenario C: 與 5/22 南港互為順路)
  ('TST-INQ-南港',
   (SELECT id FROM customers WHERE line_id = 'LINE-T-007'),
   (SELECT id FROM company_locations WHERE code = 'taoyuan'),
   '台北市南港區忠孝東路七段200號', '台北市', '南港區', 25.0520, 121.6050,
   'measurement_on_site', 'inquiry', 'line_official', 60,
   '測試: 期待排到 5/22 同天 (與南港案件順路)'),

  -- 桃園八德 (測 Scenario A: 與 5/22 桃園中壢順路)
  ('TST-INQ-八德',
   (SELECT id FROM customers WHERE line_id = 'LINE-T-008'),
   (SELECT id FROM company_locations WHERE code = 'taoyuan'),
   '桃園市八德區介壽路一段30號', '桃園市', '八德區', 24.9280, 121.2810,
   'measurement_on_site', 'inquiry', 'line_official', 60,
   '測試: 期待排到 5/22 順路插入');


-- ============================================================
-- Step 5: 整個 5 月隨機車人配對 (週末跳過)
-- ============================================================

DO $$
DECLARE
  d DATE;
  v RECORD;
  driver_id UUID;
  helper_id UUID;
BEGIN
  FOR d IN SELECT generate_series('2026-05-01'::date, '2026-05-31'::date, '1 day')::date LOOP
    -- 跳過週六(6) 週日(0)
    IF EXTRACT(DOW FROM d) IN (0, 6) THEN
      CONTINUE;
    END IF;

    -- 對每台車派 1 駕駛 + 30% 機率派 1 副手
    FOR v IN SELECT id, location_id FROM vehicles WHERE deleted_at IS NULL ORDER BY code LOOP
      -- 同分區隨機抽 1 個師傅當駕駛
      SELECT id INTO driver_id
      FROM technicians
      WHERE location_id = v.location_id AND deleted_at IS NULL
      ORDER BY random()
      LIMIT 1;

      IF driver_id IS NOT NULL THEN
        INSERT INTO daily_assignments (vehicle_id, technician_id, assignment_date, is_driver)
        VALUES (v.id, driver_id, d, true)
        ON CONFLICT (vehicle_id, technician_id, assignment_date) DO NOTHING;

        -- 30% 機率加一個副手
        IF random() < 0.3 THEN
          SELECT id INTO helper_id
          FROM technicians
          WHERE location_id = v.location_id
            AND deleted_at IS NULL
            AND id <> driver_id
          ORDER BY random()
          LIMIT 1;

          IF helper_id IS NOT NULL THEN
            INSERT INTO daily_assignments (vehicle_id, technician_id, assignment_date, is_driver)
            VALUES (v.id, helper_id, d, false)
            ON CONFLICT (vehicle_id, technician_id, assignment_date) DO NOTHING;
          END IF;
        END IF;
      END IF;
    END LOOP;
  END LOOP;
END $$;


-- ============================================================
-- 驗證
-- ============================================================
SELECT '案件總數' AS info, COUNT(*) AS n FROM cases WHERE scheduled_date BETWEEN '2026-05-21' AND '2026-05-25';
SELECT '未排測試案件' AS info, COUNT(*) AS n FROM cases WHERE code LIKE 'TST-INQ-%';
SELECT '5月車人配對' AS info, COUNT(*) AS n FROM daily_assignments WHERE assignment_date BETWEEN '2026-05-01' AND '2026-05-31';
