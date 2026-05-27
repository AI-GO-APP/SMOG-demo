-- ============================================================
-- SMOG Demo — 多分公司假資料（台中/台南/高雄）
-- ============================================================
-- 用途：給客戶 demo「多分公司」UI 切換用
-- 桃園資料保持不動，這個檔案另外加：
--   - 台中：V6/V7 + P10/P11/P12 + ~4 筆案件
--   - 台南：V8/V9 + P13/P14/P15 + ~4 筆案件
--   - 高雄：V10/V11 + P16/P17 + ~4 筆案件
-- 案件日期分散在 5/10 ~ 5/13
-- ============================================================


-- ============================================================
-- 1. 車輛 (6 台)
-- ============================================================
INSERT INTO vehicles (code, name, type, color, location_id) VALUES
  -- 台中
  ('V6',  '車6',  'both',         '#A78BFA', (SELECT id FROM company_locations WHERE code = 'taichung')),
  ('V7',  '車7',  'installation', '#F472B6', (SELECT id FROM company_locations WHERE code = 'taichung')),
  -- 台南
  ('V8',  '車8',  'both',         '#34D399', (SELECT id FROM company_locations WHERE code = 'tainan')),
  ('V9',  '車9',  'measurement',  '#FBBF24', (SELECT id FROM company_locations WHERE code = 'tainan')),
  -- 高雄
  ('V10', '車10', 'installation', '#F87171', (SELECT id FROM company_locations WHERE code = 'kaohsiung')),
  ('V11', '車11', 'both',         '#60A5FA', (SELECT id FROM company_locations WHERE code = 'kaohsiung'));


-- ============================================================
-- 2. 師傅 (8 位)
-- ============================================================
INSERT INTO technicians (code, name, phone, skills, location_id) VALUES
  -- 台中
  ('P10', '建宏', '0922-101-001', ARRAY['measurement','installation']::skill_type[], (SELECT id FROM company_locations WHERE code = 'taichung')),
  ('P11', '俊傑', '0922-101-002', ARRAY['installation']::skill_type[],                (SELECT id FROM company_locations WHERE code = 'taichung')),
  ('P12', '雅婷', '0922-101-003', ARRAY['measurement']::skill_type[],                 (SELECT id FROM company_locations WHERE code = 'taichung')),
  -- 台南
  ('P13', '志強', '0933-201-001', ARRAY['measurement','installation']::skill_type[], (SELECT id FROM company_locations WHERE code = 'tainan')),
  ('P14', '美玲', '0933-201-002', ARRAY['installation']::skill_type[],                (SELECT id FROM company_locations WHERE code = 'tainan')),
  ('P15', '志明', '0933-201-003', ARRAY['measurement']::skill_type[],                 (SELECT id FROM company_locations WHERE code = 'tainan')),
  -- 高雄
  ('P16', '哲宇', '0955-301-001', ARRAY['measurement','installation']::skill_type[], (SELECT id FROM company_locations WHERE code = 'kaohsiung')),
  ('P17', '佩珊', '0955-301-002', ARRAY['installation']::skill_type[],                (SELECT id FROM company_locations WHERE code = 'kaohsiung'));


-- ============================================================
-- 3. 客戶 (12 位)
-- ============================================================
INSERT INTO customers (name, phone, line_id, line_name, address, city, district, lat, lng) VALUES
  -- 台中客戶
  ('莊太太', '0922-501-001', 'LINE_0922501001', '莊太太', '台中市西屯區市政路100號',       '台中市', '西屯區', 24.1632, 120.6470),
  ('簡先生', '0922-501-002', 'LINE_0922501002', '簡先生', '台中市北屯區崇德路三段200號',   '台中市', '北屯區', 24.1737, 120.6877),
  ('鄭小姐', '0922-501-003', 'LINE_0922501003', '鄭小姐', '台中市南屯區公益路二段50號',   '台中市', '南屯區', 24.1473, 120.6491),
  ('賴先生', '0922-501-004', 'LINE_0922501004', '賴先生', '台中市東區建成路500號',         '台中市', '東區',   24.1376, 120.7066),
  -- 台南客戶
  ('王老闆', '0933-601-001', 'LINE_0933601001', '王老闆', '台南市永康區中華路100號',       '台南市', '永康區', 23.0247, 120.2532),
  ('陳大姐', '0933-601-002', 'LINE_0933601002', '陳大姐', '台南市東區裕農路200號',         '台南市', '東區',   22.9986, 120.2371),
  ('林董',   '0933-601-003', 'LINE_0933601003', '林董',   '台南市安平區安平路300號',       '台南市', '安平區', 23.0008, 120.1606),
  ('黃太太', '0933-601-004', 'LINE_0933601004', '黃太太', '台南市北區公園路150號',         '台南市', '北區',   23.0049, 120.2114),
  -- 高雄客戶
  ('呂先生', '0955-701-001', 'LINE_0955701001', '呂先生', '高雄市楠梓區建楠路50號',         '高雄市', '楠梓區', 22.7300, 120.3000),
  ('施太太', '0955-701-002', 'LINE_0955701002', '施太太', '高雄市左營區博愛二路500號',     '高雄市', '左營區', 22.6711, 120.3025),
  ('郭老闆', '0955-701-003', 'LINE_0955701003', '郭老闆', '高雄市三民區建工路200號',       '高雄市', '三民區', 22.6531, 120.3137),
  ('蘇小姐', '0955-701-004', 'LINE_0955701004', '蘇小姐', '高雄市鼓山區美術館路100號',     '高雄市', '鼓山區', 22.6520, 120.2848);


-- ============================================================
-- 4. 案件 (12 筆，分散在 5/10 ~ 5/13)
-- ============================================================

-- ===== 台中案件 (4 筆) =====
-- 5/10 (今天) 莊太太 V6 09:30 丈量
INSERT INTO cases (code, customer_id, location_id, address, city, district, lat, lng,
  case_type, status, source, scheduled_date, scheduled_start, duration_minutes, is_confirmed, vehicle_id, estimated_amount, notes)
VALUES ('TC001',
  (SELECT id FROM customers WHERE phone = '0922-501-001'),
  (SELECT id FROM company_locations WHERE code = 'taichung'),
  '台中市西屯區市政路100號', '台中市', '西屯區', 24.1632, 120.6470,
  'measurement_on_site', 'measurement_scheduled', 'line_official',
  CURRENT_DATE, '09:30', 60, true,
  (SELECT id FROM vehicles WHERE code = 'V6'),
  0, '商辦大樓 6F');

-- 5/10 簡先生 V7 14:00 施作
INSERT INTO cases (code, customer_id, location_id, address, city, district, lat, lng,
  case_type, status, source, scheduled_date, scheduled_start, duration_minutes, is_confirmed, vehicle_id, estimated_amount, notes)
VALUES ('TC002',
  (SELECT id FROM customers WHERE phone = '0922-501-002'),
  (SELECT id FROM company_locations WHERE code = 'taichung'),
  '台中市北屯區崇德路三段200號', '台中市', '北屯區', 24.1737, 120.6877,
  'installation', 'work_scheduled', 'line_official',
  CURRENT_DATE, '14:00', 120, true,
  (SELECT id FROM vehicles WHERE code = 'V7'),
  32000, '4面紗窗 + 加壓條');

-- 5/11 鄭小姐 V6 10:00 丈量
INSERT INTO cases (code, customer_id, location_id, address, city, district, lat, lng,
  case_type, status, source, scheduled_date, scheduled_start, duration_minutes, is_confirmed, vehicle_id, estimated_amount, notes)
VALUES ('TC003',
  (SELECT id FROM customers WHERE phone = '0922-501-003'),
  (SELECT id FROM company_locations WHERE code = 'taichung'),
  '台中市南屯區公益路二段50號', '台中市', '南屯區', 24.1473, 120.6491,
  'measurement_on_site', 'measurement_scheduled', 'line_official',
  CURRENT_DATE + 1, '10:00', 60, true,
  (SELECT id FROM vehicles WHERE code = 'V6'),
  0, '住家公寓');

-- 5/12 賴先生 V7 13:30 施作
INSERT INTO cases (code, customer_id, location_id, address, city, district, lat, lng,
  case_type, status, source, scheduled_date, scheduled_start, duration_minutes, is_confirmed, vehicle_id, estimated_amount, notes)
VALUES ('TC004',
  (SELECT id FROM customers WHERE phone = '0922-501-004'),
  (SELECT id FROM company_locations WHERE code = 'taichung'),
  '台中市東區建成路500號', '台中市', '東區', 24.1376, 120.7066,
  'installation', 'work_scheduled', 'line_official',
  CURRENT_DATE + 2, '13:30', 90, true,
  (SELECT id FROM vehicles WHERE code = 'V7'),
  26000, '3面紗窗');


-- ===== 台南案件 (4 筆) =====
-- 5/10 王老闆 V8 10:30 施作
INSERT INTO cases (code, customer_id, location_id, address, city, district, lat, lng,
  case_type, status, source, scheduled_date, scheduled_start, duration_minutes, is_confirmed, vehicle_id, estimated_amount, notes)
VALUES ('TN001',
  (SELECT id FROM customers WHERE phone = '0933-601-001'),
  (SELECT id FROM company_locations WHERE code = 'tainan'),
  '台南市永康區中華路100號', '台南市', '永康區', 23.0247, 120.2532,
  'installation', 'work_scheduled', 'line_official',
  CURRENT_DATE, '10:30', 90, true,
  (SELECT id FROM vehicles WHERE code = 'V8'),
  38000, '透天5面');

-- 5/11 陳大姐 V9 09:00 丈量
INSERT INTO cases (code, customer_id, location_id, address, city, district, lat, lng,
  case_type, status, source, scheduled_date, scheduled_start, duration_minutes, is_confirmed, vehicle_id, estimated_amount, notes)
VALUES ('TN002',
  (SELECT id FROM customers WHERE phone = '0933-601-002'),
  (SELECT id FROM company_locations WHERE code = 'tainan'),
  '台南市東區裕農路200號', '台南市', '東區', 22.9986, 120.2371,
  'measurement_on_site', 'measurement_scheduled', 'phone',
  CURRENT_DATE + 1, '09:00', 60, true,
  (SELECT id FROM vehicles WHERE code = 'V9'),
  0, '電話進線');

-- 5/12 林董 V8 14:00 施作
INSERT INTO cases (code, customer_id, location_id, address, city, district, lat, lng,
  case_type, status, source, scheduled_date, scheduled_start, duration_minutes, is_confirmed, vehicle_id, estimated_amount, notes)
VALUES ('TN003',
  (SELECT id FROM customers WHERE phone = '0933-601-003'),
  (SELECT id FROM company_locations WHERE code = 'tainan'),
  '台南市安平區安平路300號', '台南市', '安平區', 23.0008, 120.1606,
  'installation', 'work_scheduled', 'line_official',
  CURRENT_DATE + 2, '14:00', 120, true,
  (SELECT id FROM vehicles WHERE code = 'V8'),
  45000, '海邊豪宅多面');

-- 5/13 黃太太 V9 15:00 丈量
INSERT INTO cases (code, customer_id, location_id, address, city, district, lat, lng,
  case_type, status, source, scheduled_date, scheduled_start, duration_minutes, is_confirmed, vehicle_id, estimated_amount, notes)
VALUES ('TN004',
  (SELECT id FROM customers WHERE phone = '0933-601-004'),
  (SELECT id FROM company_locations WHERE code = 'tainan'),
  '台南市北區公園路150號', '台南市', '北區', 23.0049, 120.2114,
  'measurement_on_site', 'measurement_scheduled', 'line_official',
  CURRENT_DATE + 3, '15:00', 60, true,
  (SELECT id FROM vehicles WHERE code = 'V9'),
  0, '公寓4F');


-- ===== 高雄案件 (4 筆) =====
-- 5/10 呂先生 V10 09:00 施作
INSERT INTO cases (code, customer_id, location_id, address, city, district, lat, lng,
  case_type, status, source, scheduled_date, scheduled_start, duration_minutes, is_confirmed, vehicle_id, estimated_amount, notes)
VALUES ('KH001',
  (SELECT id FROM customers WHERE phone = '0955-701-001'),
  (SELECT id FROM company_locations WHERE code = 'kaohsiung'),
  '高雄市楠梓區建楠路50號', '高雄市', '楠梓區', 22.7300, 120.3000,
  'installation', 'work_in_progress', 'line_official',
  CURRENT_DATE, '09:00', 120, true,
  (SELECT id FROM vehicles WHERE code = 'V10'),
  52000, '透天6面 + 鋁條');

-- 5/11 施太太 V11 11:00 丈量
INSERT INTO cases (code, customer_id, location_id, address, city, district, lat, lng,
  case_type, status, source, scheduled_date, scheduled_start, duration_minutes, is_confirmed, vehicle_id, estimated_amount, notes)
VALUES ('KH002',
  (SELECT id FROM customers WHERE phone = '0955-701-002'),
  (SELECT id FROM company_locations WHERE code = 'kaohsiung'),
  '高雄市左營區博愛二路500號', '高雄市', '左營區', 22.6711, 120.3025,
  'measurement_on_site', 'measurement_scheduled', 'referral',
  CURRENT_DATE + 1, '11:00', 60, true,
  (SELECT id FROM vehicles WHERE code = 'V11'),
  0, '同事介紹');

-- 5/12 郭老闆 V10 10:00 施作
INSERT INTO cases (code, customer_id, location_id, address, city, district, lat, lng,
  case_type, status, source, scheduled_date, scheduled_start, duration_minutes, is_confirmed, vehicle_id, estimated_amount, notes)
VALUES ('KH003',
  (SELECT id FROM customers WHERE phone = '0955-701-003'),
  (SELECT id FROM company_locations WHERE code = 'kaohsiung'),
  '高雄市三民區建工路200號', '高雄市', '三民區', 22.6531, 120.3137,
  'installation', 'work_scheduled', 'line_official',
  CURRENT_DATE + 2, '10:00', 90, true,
  (SELECT id FROM vehicles WHERE code = 'V10'),
  35000, '工廠辦公室');

-- 5/13 蘇小姐 V11 13:30 施作
INSERT INTO cases (code, customer_id, location_id, address, city, district, lat, lng,
  case_type, status, source, scheduled_date, scheduled_start, duration_minutes, is_confirmed, vehicle_id, estimated_amount, notes)
VALUES ('KH004',
  (SELECT id FROM customers WHERE phone = '0955-701-004'),
  (SELECT id FROM company_locations WHERE code = 'kaohsiung'),
  '高雄市鼓山區美術館路100號', '高雄市', '鼓山區', 22.6520, 120.2848,
  'installation', 'work_scheduled', 'line_official',
  CURRENT_DATE + 3, '13:30', 90, true,
  (SELECT id FROM vehicles WHERE code = 'V11'),
  28000, '美術館旁公寓');


-- ============================================================
-- 5. Daily Assignments (每個分公司今天的車↔人配對)
-- ============================================================
INSERT INTO daily_assignments (vehicle_id, technician_id, assignment_date, is_driver) VALUES
  -- 台中
  ((SELECT id FROM vehicles WHERE code = 'V6'),  (SELECT id FROM technicians WHERE code = 'P10'), CURRENT_DATE, true),
  ((SELECT id FROM vehicles WHERE code = 'V6'),  (SELECT id FROM technicians WHERE code = 'P12'), CURRENT_DATE, false),
  ((SELECT id FROM vehicles WHERE code = 'V7'),  (SELECT id FROM technicians WHERE code = 'P11'), CURRENT_DATE, true),
  -- 台南
  ((SELECT id FROM vehicles WHERE code = 'V8'),  (SELECT id FROM technicians WHERE code = 'P13'), CURRENT_DATE, true),
  ((SELECT id FROM vehicles WHERE code = 'V8'),  (SELECT id FROM technicians WHERE code = 'P14'), CURRENT_DATE, false),
  ((SELECT id FROM vehicles WHERE code = 'V9'),  (SELECT id FROM technicians WHERE code = 'P15'), CURRENT_DATE, true),
  -- 高雄
  ((SELECT id FROM vehicles WHERE code = 'V10'), (SELECT id FROM technicians WHERE code = 'P16'), CURRENT_DATE, true),
  ((SELECT id FROM vehicles WHERE code = 'V10'), (SELECT id FROM technicians WHERE code = 'P17'), CURRENT_DATE, false),
  ((SELECT id FROM vehicles WHERE code = 'V11'), (SELECT id FROM technicians WHERE code = 'P16'), CURRENT_DATE + 1, true),
  ((SELECT id FROM vehicles WHERE code = 'V11'), (SELECT id FROM technicians WHERE code = 'P17'), CURRENT_DATE + 1, false);


-- ============================================================
-- 6. Technician Shifts (今天每個新師傅都 on_duty)
-- ============================================================
INSERT INTO technician_shifts (technician_id, shift_date, status) VALUES
  ((SELECT id FROM technicians WHERE code = 'P10'), CURRENT_DATE, 'on_duty'),
  ((SELECT id FROM technicians WHERE code = 'P11'), CURRENT_DATE, 'on_duty'),
  ((SELECT id FROM technicians WHERE code = 'P12'), CURRENT_DATE, 'on_duty'),
  ((SELECT id FROM technicians WHERE code = 'P13'), CURRENT_DATE, 'on_duty'),
  ((SELECT id FROM technicians WHERE code = 'P14'), CURRENT_DATE, 'on_duty'),
  ((SELECT id FROM technicians WHERE code = 'P15'), CURRENT_DATE, 'on_duty'),
  ((SELECT id FROM technicians WHERE code = 'P16'), CURRENT_DATE, 'on_duty'),
  ((SELECT id FROM technicians WHERE code = 'P17'), CURRENT_DATE, 'on_duty');


-- ============================================================
-- 跑完後驗證
-- ============================================================
-- 看各分公司車輛數：
--   SELECT l.code, l.name, COUNT(v.id) AS vehicles
--   FROM company_locations l
--   LEFT JOIN vehicles v ON v.location_id = l.id AND v.deleted_at IS NULL
--   GROUP BY l.id, l.code, l.name
--   ORDER BY l.sort_order;
--
--   應看到：taoyuan=5, taichung=2, tainan=2, kaohsiung=2
--
-- 看案件分散日期：
--   SELECT scheduled_date, COUNT(*) FROM cases
--   WHERE scheduled_date >= CURRENT_DATE
--   GROUP BY scheduled_date
--   ORDER BY scheduled_date;
-- ============================================================
