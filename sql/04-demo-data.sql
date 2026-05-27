-- ============================================================
-- SMOG Schema v0.3 — Section 4: DEMO 資料（從 mock-data.js 轉換）
-- ============================================================
-- 前置條件：01-tables.sql + 02-triggers.sql + 03-seed.sql 都跑過
-- 跑完這個檔案後，會插入：
--   - 19 筆 customers（從 cases 的客戶資訊）
--   - 5 台 vehicles（V1 ~ V5）
--   - 9 位 technicians（P1 ~ P9）
--   - 19 筆 cases（C001 ~ C014 排好的 + P001 ~ P005 未排的）
--   - 9 筆 daily_assignments（今天的車↔人配對）
--   - 9 筆 technician_shifts（今天每個人的班別）
--
-- ⚠️ status 對應：
--   '已成交' → 'awaiting_schedule'（訂金到、等排施作）
--   '後補名單' → 'awaiting_schedule' + is_waiting_earlier=true
-- ============================================================


-- ╔══════════════════════════════════════════════════════════╗
-- ║  4.1) CUSTOMERS（19 筆）                                  ║
-- ║  line_id 用 phone 模擬，line_name = 客戶姓名              ║
-- ╚══════════════════════════════════════════════════════════╝

INSERT INTO customers (name, phone, line_id, line_name, address, city, district, lat, lng) VALUES
  -- C001 ~ C014 的客戶
  ('王小姐',  '0912-111-001', 'LINE_0912111001', '王小姐',  '桃園市中壢區中央西路100號',     '桃園市', '中壢區', 24.9532, 121.2235),
  ('陳先生',  '0912-111-002', 'LINE_0912111002', '陳先生',  '桃園市八德區介壽路二段50號',     '桃園市', '八德區', 24.9286, 121.2849),
  ('林太太',  '0912-111-003', 'LINE_0912111003', '林太太',  '桃園市龜山區萬壽路一段200號',   '桃園市', '龜山區', 25.0144, 121.3471),
  ('張先生',  '0922-222-001', 'LINE_0922222001', '張先生',  '新北市新莊區中正路500號',       '新北市', '新莊區', 25.0419, 121.4509),
  ('黃小姐',  '0922-222-002', 'LINE_0922222002', '黃小姐',  '新北市中和區景平路300號',       '新北市', '中和區', 24.9999, 121.4923),
  ('吳先生',  '0922-222-003', 'LINE_0922222003', '吳先生',  '新北市板橋區文化路一段80號',     '新北市', '板橋區', 25.0145, 121.4602),
  ('蔡小姐',  '0933-333-001', 'LINE_0933333001', '蔡小姐',  '新北市淡水區中山路150號',       '新北市', '淡水區', 25.1714, 121.4422),
  ('劉先生',  '0933-333-002', 'LINE_0933333002', '劉先生',  '新北市三重區重新路三段100號',   '新北市', '三重區', 25.0683, 121.4847),
  ('楊小姐',  '0933-333-003', 'LINE_0933333003', '楊小姐',  '新北市三重區重新路三段100號',   '新北市', '三重區', 25.0683, 121.4847),
  ('周先生',  '0944-444-001', 'LINE_0944444001', '周先生',  '台北市萬華區康定路250號',       '台北市', '萬華區', 25.0349, 121.5030),
  ('徐小姐',  '0944-444-002', 'LINE_0944444002', '徐小姐',  '桃園市平鎮區延平路100號',       '桃園市', '平鎮區', 24.9433, 121.2173),
  ('何先生',  '0955-555-001', 'LINE_0955555001', '何先生',  '台北市信義區信義路五段100號',   '台北市', '信義區', 25.0330, 121.5645),
  ('謝小姐',  '0955-555-002', 'LINE_0955555002', '謝小姐',  '台北市大安區仁愛路四段50號',     '台北市', '大安區', 25.0395, 121.5450),
  ('羅先生',  '0955-555-003', 'LINE_0955555003', '羅先生',  '台北市中山區南京東路二段80號',   '台北市', '中山區', 25.0531, 121.5320),
  -- P001 ~ P005 未排案件的客戶
  ('彭小姐',  '0966-666-001', 'LINE_0966666001', '彭小姐',  '台北市松山區八德路四段200號',   '台北市', '松山區', 25.0490, 121.5605),
  ('蘇先生',  '0966-666-002', 'LINE_0966666002', '蘇先生',  '台北市內湖區成功路三段150號',   '台北市', '內湖區', 25.0825, 121.5827),
  ('葉太太',  '0966-666-003', 'LINE_0966666003', '葉太太',  '台北市士林區中山北路六段100號', '台北市', '士林區', 25.0950, 121.5290),
  ('吳大哥',  '0966-666-004', 'LINE_0966666004', '吳大哥',  '台北市文山區興隆路二段50號',     '台北市', '文山區', 25.0023, 121.5536),
  ('張董',    '0966-666-005', 'LINE_0966666005', '張董',    '台北市北投區光明路100號',       '台北市', '北投區', 25.1366, 121.5074);


-- ╔══════════════════════════════════════════════════════════╗
-- ║  4.2) VEHICLES（5 台，全部綁桃園總部）                     ║
-- ║  type: 兩用→both, 施作→installation, 丈量→measurement      ║
-- ╚══════════════════════════════════════════════════════════╝

INSERT INTO vehicles (code, name, type, color, location_id) VALUES
  ('V1', '車1', 'both',         '#0284C7', (SELECT id FROM company_locations WHERE code = 'taoyuan')),
  ('V2', '車2', 'installation', '#2563EB', (SELECT id FROM company_locations WHERE code = 'taoyuan')),
  ('V3', '車3', 'measurement',  '#059669', (SELECT id FROM company_locations WHERE code = 'taoyuan')),
  ('V4', '車4', 'installation', '#D97706', (SELECT id FROM company_locations WHERE code = 'taoyuan')),
  ('V5', '車5', 'both',         '#7C3AED', (SELECT id FROM company_locations WHERE code = 'taoyuan'));


-- ╔══════════════════════════════════════════════════════════╗
-- ║  4.3) TECHNICIANS（9 位，全部綁桃園總部）                  ║
-- ║  skills: 丈量→measurement, 施作→installation               ║
-- ╚══════════════════════════════════════════════════════════╝

INSERT INTO technicians (code, name, phone, skills, location_id) VALUES
  ('P1', 'Andy',  '0911-001-001', ARRAY['measurement','installation']::skill_type[], (SELECT id FROM company_locations WHERE code = 'taoyuan')),
  ('P2', '小王',  '0911-001-002', ARRAY['installation']::skill_type[],                (SELECT id FROM company_locations WHERE code = 'taoyuan')),
  ('P3', 'Joe',   '0911-001-003', ARRAY['installation']::skill_type[],                (SELECT id FROM company_locations WHERE code = 'taoyuan')),
  ('P4', 'Mike',  '0911-001-004', ARRAY['installation']::skill_type[],                (SELECT id FROM company_locations WHERE code = 'taoyuan')),
  ('P5', 'Lisa',  '0911-001-005', ARRAY['measurement']::skill_type[],                 (SELECT id FROM company_locations WHERE code = 'taoyuan')),
  ('P6', 'Tom',   '0911-001-006', ARRAY['installation']::skill_type[],                (SELECT id FROM company_locations WHERE code = 'taoyuan')),
  ('P7', 'Jerry', '0911-001-007', ARRAY['installation']::skill_type[],                (SELECT id FROM company_locations WHERE code = 'taoyuan')),
  ('P8', 'Henry', '0911-001-008', ARRAY['measurement','installation']::skill_type[], (SELECT id FROM company_locations WHERE code = 'taoyuan')),
  ('P9', '阿志',  '0911-001-009', ARRAY['measurement','installation']::skill_type[], (SELECT id FROM company_locations WHERE code = 'taoyuan'));


-- ╔══════════════════════════════════════════════════════════╗
-- ║  4.4) CASES（19 筆）                                       ║
-- ║  case_type: 現場丈量→measurement_on_site,                  ║
-- ║             線上丈量→measurement_online,                   ║
-- ║             施作→installation                              ║
-- ║  status:    諮詢中→inquiry, 已排丈量→measurement_scheduled,║
-- ║             已丈量→measured, 已成交→awaiting_schedule,     ║
-- ║             已排施作→work_scheduled, 施作中→work_in_progress║
-- ║             已完工→work_completed, 後補名單→awaiting_schedule + is_waiting_earlier
-- ╚══════════════════════════════════════════════════════════╝

-- C001 王小姐 / V1 / 09:00 / 60min / 現場丈量 / 已排丈量
INSERT INTO cases (code, customer_id, location_id, address, city, district, lat, lng, case_type, status, source, scheduled_date, scheduled_start, duration_minutes, is_confirmed, vehicle_id, estimated_amount, notes)
VALUES ('C001',
  (SELECT id FROM customers WHERE phone = '0912-111-001'),
  (SELECT id FROM company_locations WHERE code = 'taoyuan'),
  '桃園市中壢區中央西路100號', '桃園市', '中壢區', 24.9532, 121.2235,
  'measurement_on_site', 'measurement_scheduled', 'line_official',
  CURRENT_DATE, '09:00', 60, true,
  (SELECT id FROM vehicles WHERE code = 'V1'),
  0, '透天3樓，6面紗窗');

-- C002 陳先生 / V1 / 11:00 / 90min / 施作 / 已排施作
INSERT INTO cases (code, customer_id, location_id, address, city, district, lat, lng, case_type, status, source, scheduled_date, scheduled_start, duration_minutes, is_confirmed, vehicle_id, estimated_amount, notes)
VALUES ('C002',
  (SELECT id FROM customers WHERE phone = '0912-111-002'),
  (SELECT id FROM company_locations WHERE code = 'taoyuan'),
  '桃園市八德區介壽路二段50號', '桃園市', '八德區', 24.9286, 121.2849,
  'installation', 'work_scheduled', 'line_official',
  CURRENT_DATE, '11:00', 90, true,
  (SELECT id FROM vehicles WHERE code = 'V1'),
  28000, '陽台2面 + 加壓條');

-- C003 林太太 / V1 / 14:00 / 90min / 施作 / 已排施作
INSERT INTO cases (code, customer_id, location_id, address, city, district, lat, lng, case_type, status, source, scheduled_date, scheduled_start, duration_minutes, is_confirmed, vehicle_id, estimated_amount, notes)
VALUES ('C003',
  (SELECT id FROM customers WHERE phone = '0912-111-003'),
  (SELECT id FROM company_locations WHERE code = 'taoyuan'),
  '桃園市龜山區萬壽路一段200號', '桃園市', '龜山區', 25.0144, 121.3471,
  'installation', 'work_scheduled', 'line_official',
  CURRENT_DATE, '14:00', 90, true,
  (SELECT id FROM vehicles WHERE code = 'V1'),
  35000, '4面紗窗 + 鋁條');

-- C004 張先生 / V2 / 09:30 / 90min / 施作 / 已排施作
INSERT INTO cases (code, customer_id, location_id, address, city, district, lat, lng, case_type, status, source, scheduled_date, scheduled_start, duration_minutes, is_confirmed, vehicle_id, estimated_amount, notes)
VALUES ('C004',
  (SELECT id FROM customers WHERE phone = '0922-222-001'),
  (SELECT id FROM company_locations WHERE code = 'taoyuan'),
  '新北市新莊區中正路500號', '新北市', '新莊區', 25.0419, 121.4509,
  'installation', 'work_scheduled', 'line_official',
  CURRENT_DATE, '09:30', 90, true,
  (SELECT id FROM vehicles WHERE code = 'V2'),
  42000, '5面 + 舊條難拆');

-- C005 黃小姐 / V2 / 13:00 / 120min / 施作 / 已排施作
INSERT INTO cases (code, customer_id, location_id, address, city, district, lat, lng, case_type, status, source, scheduled_date, scheduled_start, duration_minutes, is_confirmed, vehicle_id, estimated_amount, notes)
VALUES ('C005',
  (SELECT id FROM customers WHERE phone = '0922-222-002'),
  (SELECT id FROM company_locations WHERE code = 'taoyuan'),
  '新北市中和區景平路300號', '新北市', '中和區', 24.9999, 121.4923,
  'installation', 'work_scheduled', 'line_official',
  CURRENT_DATE, '13:00', 120, true,
  (SELECT id FROM vehicles WHERE code = 'V2'),
  55000, '陽台 3 面複雜');

-- C006 吳先生 / V2 / 16:00 / 60min / 施作 / 已排施作
INSERT INTO cases (code, customer_id, location_id, address, city, district, lat, lng, case_type, status, source, scheduled_date, scheduled_start, duration_minutes, is_confirmed, vehicle_id, estimated_amount, notes)
VALUES ('C006',
  (SELECT id FROM customers WHERE phone = '0922-222-003'),
  (SELECT id FROM company_locations WHERE code = 'taoyuan'),
  '新北市板橋區文化路一段80號', '新北市', '板橋區', 25.0145, 121.4602,
  'installation', 'work_scheduled', 'line_official',
  CURRENT_DATE, '16:00', 60, true,
  (SELECT id FROM vehicles WHERE code = 'V2'),
  22000, '2面紗窗');

-- C007 蔡小姐 / V3 / 10:00 / 60min / 現場丈量 / 已排丈量
INSERT INTO cases (code, customer_id, location_id, address, city, district, lat, lng, case_type, status, source, scheduled_date, scheduled_start, duration_minutes, is_confirmed, vehicle_id, estimated_amount, notes)
VALUES ('C007',
  (SELECT id FROM customers WHERE phone = '0933-333-001'),
  (SELECT id FROM company_locations WHERE code = 'taoyuan'),
  '新北市淡水區中山路150號', '新北市', '淡水區', 25.1714, 121.4422,
  'measurement_on_site', 'measurement_scheduled', 'line_official',
  CURRENT_DATE, '10:00', 60, true,
  (SELECT id FROM vehicles WHERE code = 'V3'),
  0, '淡水案件');

-- C008 劉先生 / V3 / 11:30 / 30min / 線上丈量 / 已排丈量
-- 線上丈量地址帶據點地址（桃園總部）
INSERT INTO cases (code, customer_id, location_id, address, city, district, lat, lng, case_type, status, source, scheduled_date, scheduled_start, duration_minutes, is_confirmed, vehicle_id, estimated_amount, notes)
VALUES ('C008',
  (SELECT id FROM customers WHERE phone = '0933-333-002'),
  (SELECT id FROM company_locations WHERE code = 'taoyuan'),
  '桃園市桃園區建國路61巷58號', '桃園市', '桃園區', 24.9936, 121.3010,
  'measurement_online', 'measurement_scheduled', 'line_official',
  CURRENT_DATE, '11:30', 30, true,
  (SELECT id FROM vehicles WHERE code = 'V3'),
  0, '視訊丈量');

-- C009 楊小姐 / V3 / 14:30 / 60min / 現場丈量 / 已排丈量
INSERT INTO cases (code, customer_id, location_id, address, city, district, lat, lng, case_type, status, source, scheduled_date, scheduled_start, duration_minutes, is_confirmed, vehicle_id, estimated_amount, notes)
VALUES ('C009',
  (SELECT id FROM customers WHERE phone = '0933-333-003'),
  (SELECT id FROM company_locations WHERE code = 'taoyuan'),
  '新北市三重區重新路三段100號', '新北市', '三重區', 25.0683, 121.4847,
  'measurement_on_site', 'measurement_scheduled', 'line_official',
  CURRENT_DATE, '14:30', 60, true,
  (SELECT id FROM vehicles WHERE code = 'V3'),
  0, '公寓 5F');

-- C010 周先生 / V4 / 09:00 / 90min / 施作 / 施作中
INSERT INTO cases (code, customer_id, location_id, address, city, district, lat, lng, case_type, status, source, scheduled_date, scheduled_start, duration_minutes, is_confirmed, vehicle_id, estimated_amount, notes)
VALUES ('C010',
  (SELECT id FROM customers WHERE phone = '0944-444-001'),
  (SELECT id FROM company_locations WHERE code = 'taoyuan'),
  '台北市萬華區康定路250號', '台北市', '萬華區', 25.0349, 121.5030,
  'installation', 'work_in_progress', 'line_official',
  CURRENT_DATE, '09:00', 90, true,
  (SELECT id FROM vehicles WHERE code = 'V4'),
  30000, '老公寓3面');

-- C011 徐小姐 / V4 / 13:30 / 120min / 施作 / 已排施作
INSERT INTO cases (code, customer_id, location_id, address, city, district, lat, lng, case_type, status, source, scheduled_date, scheduled_start, duration_minutes, is_confirmed, vehicle_id, estimated_amount, notes)
VALUES ('C011',
  (SELECT id FROM customers WHERE phone = '0944-444-002'),
  (SELECT id FROM company_locations WHERE code = 'taoyuan'),
  '桃園市平鎮區延平路100號', '桃園市', '平鎮區', 24.9433, 121.2173,
  'installation', 'work_scheduled', 'line_official',
  CURRENT_DATE, '13:30', 120, true,
  (SELECT id FROM vehicles WHERE code = 'V4'),
  48000, '陽台 + 加壓條');

-- C012 何先生 / V5 / 10:30 / 60min / 現場丈量 / 已排丈量
INSERT INTO cases (code, customer_id, location_id, address, city, district, lat, lng, case_type, status, source, scheduled_date, scheduled_start, duration_minutes, is_confirmed, vehicle_id, estimated_amount, notes)
VALUES ('C012',
  (SELECT id FROM customers WHERE phone = '0955-555-001'),
  (SELECT id FROM company_locations WHERE code = 'taoyuan'),
  '台北市信義區信義路五段100號', '台北市', '信義區', 25.0330, 121.5645,
  'measurement_on_site', 'measurement_scheduled', 'line_official',
  CURRENT_DATE, '10:30', 60, true,
  (SELECT id FROM vehicles WHERE code = 'V5'),
  0, '信義區公寓');

-- C013 謝小姐 / V5 / 13:00 / 90min / 施作 / 已排施作
INSERT INTO cases (code, customer_id, location_id, address, city, district, lat, lng, case_type, status, source, scheduled_date, scheduled_start, duration_minutes, is_confirmed, vehicle_id, estimated_amount, notes)
VALUES ('C013',
  (SELECT id FROM customers WHERE phone = '0955-555-002'),
  (SELECT id FROM company_locations WHERE code = 'taoyuan'),
  '台北市大安區仁愛路四段50號', '台北市', '大安區', 25.0395, 121.5450,
  'installation', 'work_scheduled', 'line_official',
  CURRENT_DATE, '13:00', 90, true,
  (SELECT id FROM vehicles WHERE code = 'V5'),
  26000, '大安區3面紗窗');

-- C014 羅先生 / V5 / 15:30 / 60min / 現場丈量 / 已排丈量
INSERT INTO cases (code, customer_id, location_id, address, city, district, lat, lng, case_type, status, source, scheduled_date, scheduled_start, duration_minutes, is_confirmed, vehicle_id, estimated_amount, notes)
VALUES ('C014',
  (SELECT id FROM customers WHERE phone = '0955-555-003'),
  (SELECT id FROM company_locations WHERE code = 'taoyuan'),
  '台北市中山區南京東路二段80號', '台北市', '中山區', 25.0531, 121.5320,
  'measurement_on_site', 'measurement_scheduled', 'line_official',
  CURRENT_DATE, '15:30', 60, true,
  (SELECT id FROM vehicles WHERE code = 'V5'),
  0, '中山區公寓');


-- ===== 未排案件（vehicle_id = NULL，scheduled_* = NULL）=====

-- P001 彭小姐 / 諮詢中 / LINE 進線
INSERT INTO cases (code, customer_id, location_id, address, city, district, lat, lng, case_type, status, source, duration_minutes, notes)
VALUES ('P001',
  (SELECT id FROM customers WHERE phone = '0966-666-001'),
  (SELECT id FROM company_locations WHERE code = 'taoyuan'),
  '台北市松山區八德路四段200號', '台北市', '松山區', 25.0490, 121.5605,
  'measurement_on_site', 'inquiry', 'line_official',
  60, '松山區新案 - LINE 進線');

-- P002 蘇先生 / 已成交（→awaiting_schedule）/ 電話
INSERT INTO cases (code, customer_id, location_id, address, city, district, lat, lng, case_type, status, source, duration_minutes, estimated_amount, notes)
VALUES ('P002',
  (SELECT id FROM customers WHERE phone = '0966-666-002'),
  (SELECT id FROM company_locations WHERE code = 'taoyuan'),
  '台北市內湖區成功路三段150號', '台北市', '內湖區', 25.0825, 121.5827,
  'installation', 'awaiting_schedule', 'phone',
  90, 38000, '內湖案，客戶確定要施作');

-- P003 葉太太 / 諮詢中 / LINE
INSERT INTO cases (code, customer_id, location_id, address, city, district, lat, lng, case_type, status, source, duration_minutes, notes)
VALUES ('P003',
  (SELECT id FROM customers WHERE phone = '0966-666-003'),
  (SELECT id FROM company_locations WHERE code = 'taoyuan'),
  '台北市士林區中山北路六段100號', '台北市', '士林區', 25.0950, 121.5290,
  'measurement_on_site', 'inquiry', 'line_official',
  60, '士林區');

-- P004 吳大哥 / 已丈量 / 電話
INSERT INTO cases (code, customer_id, location_id, address, city, district, lat, lng, case_type, status, source, duration_minutes, notes)
VALUES ('P004',
  (SELECT id FROM customers WHERE phone = '0966-666-004'),
  (SELECT id FROM company_locations WHERE code = 'taoyuan'),
  '台北市文山區興隆路二段50號', '台北市', '文山區', 25.0023, 121.5536,
  'measurement_on_site', 'measured', 'phone',
  60, '文山區，已丈量待報價');

-- P005 張董 / 後補名單（→awaiting_schedule + is_waiting_earlier=true）/ LINE
INSERT INTO cases (code, customer_id, location_id, address, city, district, lat, lng, case_type, status, source, duration_minutes, estimated_amount, is_waiting_earlier, latest_acceptable_date, notes)
VALUES ('P005',
  (SELECT id FROM customers WHERE phone = '0966-666-005'),
  (SELECT id FROM company_locations WHERE code = 'taoyuan'),
  '台北市北投區光明路100號', '台北市', '北投區', 25.1366, 121.5074,
  'installation', 'awaiting_schedule', 'line_official',
  90, 25000, true, CURRENT_DATE + INTERVAL '14 days',
  '北投區，客戶猶豫中，希望兩週內排到');


-- ╔══════════════════════════════════════════════════════════╗
-- ║  4.5) DAILY_ASSIGNMENTS（今天的車↔人配對）                 ║
-- ║  V1: P1(driver) + P2                                       ║
-- ║  V2: P3(driver) + P4                                       ║
-- ║  V3: P5(only)                                              ║
-- ║  V4: P6(driver) + P7                                       ║
-- ║  V5: P8(driver) + P9                                       ║
-- ╚══════════════════════════════════════════════════════════╝

INSERT INTO daily_assignments (vehicle_id, technician_id, assignment_date, is_driver) VALUES
  ((SELECT id FROM vehicles WHERE code = 'V1'), (SELECT id FROM technicians WHERE code = 'P1'), CURRENT_DATE, true),
  ((SELECT id FROM vehicles WHERE code = 'V1'), (SELECT id FROM technicians WHERE code = 'P2'), CURRENT_DATE, false),
  ((SELECT id FROM vehicles WHERE code = 'V2'), (SELECT id FROM technicians WHERE code = 'P3'), CURRENT_DATE, true),
  ((SELECT id FROM vehicles WHERE code = 'V2'), (SELECT id FROM technicians WHERE code = 'P4'), CURRENT_DATE, false),
  ((SELECT id FROM vehicles WHERE code = 'V3'), (SELECT id FROM technicians WHERE code = 'P5'), CURRENT_DATE, true),
  ((SELECT id FROM vehicles WHERE code = 'V4'), (SELECT id FROM technicians WHERE code = 'P6'), CURRENT_DATE, true),
  ((SELECT id FROM vehicles WHERE code = 'V4'), (SELECT id FROM technicians WHERE code = 'P7'), CURRENT_DATE, false),
  ((SELECT id FROM vehicles WHERE code = 'V5'), (SELECT id FROM technicians WHERE code = 'P8'), CURRENT_DATE, true),
  ((SELECT id FROM vehicles WHERE code = 'V5'), (SELECT id FROM technicians WHERE code = 'P9'), CURRENT_DATE, false);


-- ╔══════════════════════════════════════════════════════════╗
-- ║  4.6) TECHNICIAN_SHIFTS（今天 9 個人都是 on_duty）         ║
-- ║  之後可手動或在 demo 介面增加當月班表                       ║
-- ╚══════════════════════════════════════════════════════════╝

INSERT INTO technician_shifts (technician_id, shift_date, status) VALUES
  ((SELECT id FROM technicians WHERE code = 'P1'), CURRENT_DATE, 'on_duty'),
  ((SELECT id FROM technicians WHERE code = 'P2'), CURRENT_DATE, 'on_duty'),
  ((SELECT id FROM technicians WHERE code = 'P3'), CURRENT_DATE, 'on_duty'),
  ((SELECT id FROM technicians WHERE code = 'P4'), CURRENT_DATE, 'on_duty'),
  ((SELECT id FROM technicians WHERE code = 'P5'), CURRENT_DATE, 'on_duty'),
  ((SELECT id FROM technicians WHERE code = 'P6'), CURRENT_DATE, 'on_duty'),
  ((SELECT id FROM technicians WHERE code = 'P7'), CURRENT_DATE, 'on_duty'),
  ((SELECT id FROM technicians WHERE code = 'P8'), CURRENT_DATE, 'on_duty'),
  ((SELECT id FROM technicians WHERE code = 'P9'), CURRENT_DATE, 'on_duty');


-- ============================================================
-- 跑完後驗證
-- ============================================================
-- 在 SQL Editor 新開 query，分別跑這幾段：
--
-- 1. 每張表筆數應該對：
--   SELECT 'customers' AS t, COUNT(*) FROM customers
--   UNION ALL SELECT 'vehicles', COUNT(*) FROM vehicles
--   UNION ALL SELECT 'technicians', COUNT(*) FROM technicians
--   UNION ALL SELECT 'cases', COUNT(*) FROM cases
--   UNION ALL SELECT 'daily_assignments', COUNT(*) FROM daily_assignments
--   UNION ALL SELECT 'technician_shifts', COUNT(*) FROM technician_shifts;
--
--   預期：customers=19, vehicles=5, technicians=9,
--         cases=19, daily_assignments=9, technician_shifts=9
--
-- 2. 看排班全貌（今天有哪些案件，誰在做）：
--   SELECT v.code AS vehicle, c.code AS case_code, c.scheduled_start,
--          c.duration_minutes, c.status, cu.name AS customer
--   FROM cases c
--   JOIN vehicles v ON v.id = c.vehicle_id
--   JOIN customers cu ON cu.id = c.customer_id
--   WHERE c.scheduled_date = CURRENT_DATE
--   ORDER BY v.code, c.scheduled_start;
--
-- 3. 看未排案件：
--   SELECT code, status, source, cu.name, c.notes
--   FROM cases c
--   JOIN customers cu ON cu.id = c.customer_id
--   WHERE c.vehicle_id IS NULL
--   ORDER BY c.code;
-- ============================================================
