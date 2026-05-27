-- ============================================================
-- SMOG Demo - 5/27~5/31 假資料 (v0.5)
-- 用來測試新演算法:
--   • 第一場 9:30 / 10:00 規則
--   • 順路 vs 孤立 vs 空白日
--   • 客戶期望時間 (軟限制 + 加分)
--   • 客服預估時長 override
-- ============================================================


-- ============================================================
-- Step 1: 清舊測試資料 (5/27~5/31 case + 諮詢中 case)
-- ============================================================

-- 清 5/27~5/31 的 cases
DELETE FROM cases WHERE scheduled_date BETWEEN '2026-05-27' AND '2026-05-31';

-- 不清 daily_assignments (沿用之前 08-test-seed-data 的 5 月配對)


-- ============================================================
-- Step 2: 確保新客戶存在 (T9~T17)
-- ============================================================

INSERT INTO customers (name, phone, line_id, line_name, address, city, district, lat, lng) VALUES
  -- 5/27 已排
  ('王中壢-T9',  '0911-T-009', 'LINE-T-009', '王中壢2', '桃園市中壢區中央西路300號',   '桃園市', '中壢區', 24.9540, 121.2240),
  ('陳八德-T10', '0911-T-010', 'LINE-T-010', '陳八德2', '桃園市八德區介壽路二段80號',   '桃園市', '八德區', 24.9290, 121.2855),
  -- 5/28 已排
  ('林信義-T11', '0911-T-011', 'LINE-T-011', '林信義', '台北市信義區信義路五段100號',   '台北市', '信義區', 25.0330, 121.5654),
  ('黃龜山-T12', '0911-T-012', 'LINE-T-012', '黃龜山', '桃園市龜山區復興一路200號',     '桃園市', '龜山區', 24.9950, 121.3370),
  -- 5/29 已排 (南港孤立)
  ('吳南港-T13', '0911-T-013', 'LINE-T-013', '吳南港2', '台北市南港區研究院路二段50號', '台北市', '南港區', 25.0420, 121.6135),
  -- 諮詢中 (測試用)
  ('趙中壢-T14', '0911-T-014', 'LINE-T-014', '趙中壢', '桃園市中壢區延平路200號',       '桃園市', '中壢區', 24.9555, 121.2255),
  ('錢南港-T15', '0911-T-015', 'LINE-T-015', '錢南港', '台北市南港區市民大道八段250號', '台北市', '南港區', 25.0510, 121.6020),
  ('孫淡水-T16', '0911-T-016', 'LINE-T-016', '孫淡水', '新北市淡水區英專路80號',         '新北市', '淡水區', 25.1690, 121.4480),
  ('李八德-T17', '0911-T-017', 'LINE-T-017', '李八德', '桃園市八德區介壽路一段50號',     '桃園市', '八德區', 24.9285, 121.2820)
ON CONFLICT (line_id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng;


-- ============================================================
-- Step 3: 5 筆已排丈量案件 (5/27, 5/28, 5/29)
-- ============================================================

INSERT INTO cases
  (code, customer_id, location_id, address, city, district, lat, lng,
   case_type, status, source, scheduled_date, scheduled_start, duration_minutes,
   is_confirmed, vehicle_id, case_nature, notes)
VALUES
  -- 5/27 第一場 09:30 桃園中壢 (近, 適用 9:30 規則) - 60 min
  ('TST-27-09-V1',
   (SELECT id FROM customers WHERE line_id = 'LINE-T-009'),
   (SELECT id FROM company_locations WHERE code = 'taoyuan'),
   '桃園市中壢區中央西路300號', '桃園市', '中壢區', 24.9540, 121.2240,
   'measurement_on_site', 'measurement_scheduled', 'line_official',
   '2026-05-27', '09:30', 60, true,
   (SELECT id FROM vehicles WHERE code = 'V1'), 'normal',
   '測試 - 5/27 第一場 9:30 (近)'),

  -- 5/27 第二場 13:00 桃園八德 - 90 min
  ('TST-27-13-V1',
   (SELECT id FROM customers WHERE line_id = 'LINE-T-010'),
   (SELECT id FROM company_locations WHERE code = 'taoyuan'),
   '桃園市八德區介壽路二段80號', '桃園市', '八德區', 24.9290, 121.2855,
   'measurement_on_site', 'measurement_scheduled', 'line_official',
   '2026-05-27', '13:00', 90, true,
   (SELECT id FROM vehicles WHERE code = 'V1'), 'normal',
   '測試 - 5/27 第二場 13:00'),

  -- 5/28 第一場 10:00 台北信義 (遠, 適用 10:00 規則) - 90 min
  ('TST-28-10-V2',
   (SELECT id FROM customers WHERE line_id = 'LINE-T-011'),
   (SELECT id FROM company_locations WHERE code = 'taoyuan'),
   '台北市信義區信義路五段100號', '台北市', '信義區', 25.0330, 121.5654,
   'measurement_on_site', 'measurement_scheduled', 'line_official',
   '2026-05-28', '10:00', 90, true,
   (SELECT id FROM vehicles WHERE code = 'V2'), 'normal',
   '測試 - 5/28 第一場 10:00 (遠，需 75 min 車程)'),

  -- 5/28 第二場 13:00 桃園龜山 - 60 min
  ('TST-28-13-V2',
   (SELECT id FROM customers WHERE line_id = 'LINE-T-012'),
   (SELECT id FROM company_locations WHERE code = 'taoyuan'),
   '桃園市龜山區復興一路200號', '桃園市', '龜山區', 24.9950, 121.3370,
   'measurement_on_site', 'measurement_scheduled', 'line_official',
   '2026-05-28', '13:00', 60, true,
   (SELECT id FROM vehicles WHERE code = 'V2'), 'normal',
   '測試 - 5/28 第二場 13:00'),

  -- 5/29 孤立 13:00 南港 - 60 min
  ('TST-29-13-V3',
   (SELECT id FROM customers WHERE line_id = 'LINE-T-013'),
   (SELECT id FROM company_locations WHERE code = 'taoyuan'),
   '台北市南港區研究院路二段50號', '台北市', '南港區', 25.0420, 121.6135,
   'measurement_on_site', 'measurement_scheduled', 'line_official',
   '2026-05-29', '13:00', 60, true,
   (SELECT id FROM vehicles WHERE code = 'V3'), 'normal',
   '測試 - 5/29 孤立日 13:00 南港');


-- ============================================================
-- Step 4: 4 筆諮詢中 (未排，給你測試「建議排入」)
-- ============================================================

INSERT INTO cases
  (code, customer_id, location_id, address, city, district, lat, lng,
   case_type, status, source, duration_minutes, case_nature, notes)
VALUES
  -- 順路測試: 桃園中壢 (期待排到 5/27 順路)
  ('TST-INQ-中壢2',
   (SELECT id FROM customers WHERE line_id = 'LINE-T-014'),
   (SELECT id FROM company_locations WHERE code = 'taoyuan'),
   '桃園市中壢區延平路200號', '桃園市', '中壢區', 24.9555, 121.2255,
   'measurement_on_site', 'inquiry', 'line_official', 60, 'normal',
   '測試: 期待排到 5/27 順路 (跟 T9 中壢距離 < 5km)'),

  -- 順路測試: 南港 (期待排到 5/29 順路)
  ('TST-INQ-南港2',
   (SELECT id FROM customers WHERE line_id = 'LINE-T-015'),
   (SELECT id FROM company_locations WHERE code = 'taoyuan'),
   '台北市南港區市民大道八段250號', '台北市', '南港區', 25.0510, 121.6020,
   'measurement_on_site', 'inquiry', 'line_official', 60, 'normal',
   '測試: 期待排到 5/29 順路 (跟 T13 南港 < 2km)'),

  -- 孤立測試: 淡水 (期待 → 空白日 13:00)
  ('TST-INQ-淡水2',
   (SELECT id FROM customers WHERE line_id = 'LINE-T-016'),
   (SELECT id FROM company_locations WHERE code = 'taoyuan'),
   '新北市淡水區英專路80號', '新北市', '淡水區', 25.1690, 121.4480,
   'measurement_on_site', 'inquiry', 'line_official', 60, 'normal',
   '測試: 期待排到 5/30 或 5/31 空白日 13:00 (離 HQ 50km, 跟其他都遠)'),

  -- 客戶期望時間測試: 桃園八德, preferred_date=5/30, preferred_start=14:00
  ('TST-INQ-八德2',
   (SELECT id FROM customers WHERE line_id = 'LINE-T-017'),
   (SELECT id FROM company_locations WHERE code = 'taoyuan'),
   '桃園市八德區介壽路一段50號', '桃園市', '八德區', 24.9285, 121.2820,
   'measurement_on_site', 'inquiry', 'line_official', 60, 'normal',
   '測試: 客戶期望 5/30 14:00 (軟限制加分)');


-- ============================================================
-- 驗證
-- ============================================================

SELECT '5/27~5/31 已排案件' AS info, COUNT(*) AS n
FROM cases WHERE scheduled_date BETWEEN '2026-05-27' AND '2026-05-31';

SELECT '新增的諮詢中案件' AS info, COUNT(*) AS n
FROM cases WHERE code IN ('TST-INQ-中壢2','TST-INQ-南港2','TST-INQ-淡水2','TST-INQ-八德2');

SELECT code, scheduled_date, scheduled_start, address
FROM cases
WHERE scheduled_date BETWEEN '2026-05-27' AND '2026-05-31'
ORDER BY scheduled_date, scheduled_start;
