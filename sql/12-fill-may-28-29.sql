-- ============================================================
-- SMOG Demo - 5/28~5/29 各分區滿載 + 跨區案件 (90%)
-- 5/30 (週六) 5/31 (週日) 跳過假日
-- 每分區至少 1 天有 >40km 遠案件
--
-- 桃園跨區: 淡水/南港
-- 台中跨區: 苗栗/雲林斗六
-- 台南跨區: 嘉義/屏東
-- 高雄跨區: 恆春
-- ============================================================

-- 清舊
DELETE FROM cases WHERE scheduled_date BETWEEN '2026-05-28' AND '2026-05-29';


-- ============================================================
-- 客戶 (T20~T68, 共 49 位)
-- ============================================================

INSERT INTO customers (name, phone, line_id, line_name, address, city, district, lat, lng) VALUES
  -- 桃園客戶 (T20~T44, 25 位)
  ('王先生-T20',  '0911-T-020', 'LINE-T-020', '王先生',  '桃園市中壢區中央西路11號',    '桃園市', '中壢區', 24.9532, 121.2230),
  ('李太太-T21',  '0911-T-021', 'LINE-T-021', '李太太',  '桃園市中壢區延平路20號',       '桃園市', '中壢區', 24.9560, 121.2250),
  ('林小姐-T22',  '0911-T-022', 'LINE-T-022', '林小姐',  '桃園市八德區介壽路30號',       '桃園市', '八德區', 24.9290, 121.2850),
  ('張先生-T23',  '0911-T-023', 'LINE-T-023', '張先生',  '桃園市八德區廣興路40號',       '桃園市', '八德區', 24.9300, 121.2900),
  ('陳先生-T24',  '0911-T-024', 'LINE-T-024', '陳先生',  '桃園市龜山區復興路50號',       '桃園市', '龜山區', 24.9950, 121.3380),
  ('黃太太-T25',  '0911-T-025', 'LINE-T-025', '黃太太',  '桃園市龜山區光峰路60號',       '桃園市', '龜山區', 24.9970, 121.3400),
  ('吳先生-T26',  '0911-T-026', 'LINE-T-026', '吳先生',  '桃園市平鎮區金陵路70號',       '桃園市', '平鎮區', 24.9400, 121.2200),
  ('蔡先生-T27',  '0911-T-027', 'LINE-T-027', '蔡先生',  '桃園市楊梅區大成路80號',       '桃園市', '楊梅區', 24.9100, 121.1500),
  ('郭小姐-T28',  '0911-T-028', 'LINE-T-028', '郭小姐',  '桃園市中壢區中正路90號',       '桃園市', '中壢區', 24.9540, 121.2240),
  ('周太太-T29',  '0911-T-029', 'LINE-T-029', '周太太',  '桃園市八德區介壽路100號',      '桃園市', '八德區', 24.9292, 121.2855),
  ('徐先生-T30',  '0911-T-030', 'LINE-T-030', '徐先生',  '桃園市中壢區中山路110號',      '桃園市', '中壢區', 24.9550, 121.2260),
  ('賴小姐-T31',  '0911-T-031', 'LINE-T-031', '賴小姐',  '桃園市龜山區萬壽路120號',      '桃園市', '龜山區', 24.9960, 121.3390),
  ('鄭先生-T32',  '0911-T-032', 'LINE-T-032', '鄭先生',  '桃園市中壢區環中東路130號',    '桃園市', '中壢區', 24.9570, 121.2280),
  ('謝太太-T33',  '0911-T-033', 'LINE-T-033', '謝太太',  '桃園市八德區建國路140號',      '桃園市', '八德區', 24.9295, 121.2860),
  ('彭先生-T34',  '0911-T-034', 'LINE-T-034', '彭先生',  '桃園市中壢區忠孝路150號',      '桃園市', '中壢區', 24.9555, 121.2270),
  ('呂小姐-T35',  '0911-T-035', 'LINE-T-035', '呂小姐',  '桃園市平鎮區延平路160號',      '桃園市', '平鎮區', 24.9410, 121.2210),
  ('蘇太太-T36',  '0911-T-036', 'LINE-T-036', '蘇太太',  '桃園市龜山區公西路170號',      '桃園市', '龜山區', 24.9980, 121.3410),
  ('馬先生-T37',  '0911-T-037', 'LINE-T-037', '馬先生',  '桃園市楊梅區光華街180號',      '桃園市', '楊梅區', 24.9110, 121.1510),
  -- 桃園遠距離 (淡水/南港)
  ('沈太太-T38',  '0911-T-038', 'LINE-T-038', '沈太太',  '新北市淡水區英專路200號',      '新北市', '淡水區', 25.1700, 121.4500),
  ('江先生-T39',  '0911-T-039', 'LINE-T-039', '江先生',  '台北市南港區市民大道八段300號','台北市', '南港區', 25.0500, 121.6000),
  ('鄒先生-T40',  '0911-T-040', 'LINE-T-040', '鄒先生',  '新北市淡水區中山北路50號',     '新北市', '淡水區', 25.1690, 121.4480),
  ('唐小姐-T41',  '0911-T-041', 'LINE-T-041', '唐小姐',  '桃園市中壢區環中東路210號',    '桃園市', '中壢區', 24.9580, 121.2290),
  ('馮太太-T42',  '0911-T-042', 'LINE-T-042', '馮太太',  '桃園市中壢區金陵路220號',      '桃園市', '中壢區', 24.9590, 121.2300),
  ('歐先生-T43',  '0911-T-043', 'LINE-T-043', '歐先生',  '桃園市八德區大新路230號',      '桃園市', '八德區', 24.9305, 121.2870),
  ('于太太-T44',  '0911-T-044', 'LINE-T-044', '于太太',  '桃園市龜山區大同路240號',      '桃園市', '龜山區', 24.9990, 121.3420),

  -- 台中客戶 (T45~T54, 10 位)
  ('莊先生-T45',  '0922-T-045', 'LINE-T-045', '莊先生',  '台中市西屯區市政路300號',      '台中市', '西屯區', 24.1632, 120.6470),
  ('簡太太-T46',  '0922-T-046', 'LINE-T-046', '簡太太',  '台中市北屯區崇德路310號',      '台中市', '北屯區', 24.1737, 120.6877),
  ('柯先生-T47',  '0922-T-047', 'LINE-T-047', '柯先生',  '台中市南屯區大墩路320號',      '台中市', '南屯區', 24.1440, 120.6440),
  ('范小姐-T48',  '0922-T-048', 'LINE-T-048', '范小姐',  '台中市西屯區台灣大道330號',    '台中市', '西屯區', 24.1640, 120.6500),
  ('白先生-T49',  '0922-T-049', 'LINE-T-049', '白先生',  '台中市北區三民路340號',        '台中市', '北區',   24.1500, 120.6800),
  ('葉太太-T50',  '0922-T-050', 'LINE-T-050', '葉太太',  '台中市南屯區公益路350號',      '台中市', '南屯區', 24.1450, 120.6450),
  ('連小姐-T51',  '0922-T-051', 'LINE-T-051', '連小姐',  '台中市西屯區文心路360號',      '台中市', '西屯區', 24.1650, 120.6520),
  -- 台中遠距離 (苗栗/雲林斗六)
  ('費先生-T52',  '0922-T-052', 'LINE-T-052', '費先生',  '苗栗縣苗栗市中正路400號',      '苗栗縣', '苗栗市', 24.5600, 120.8200),
  ('溫太太-T53',  '0922-T-053', 'LINE-T-053', '溫太太',  '雲林縣斗六市民生路410號',      '雲林縣', '斗六市', 23.7100, 120.5400),
  ('鄧先生-T54',  '0922-T-054', 'LINE-T-054', '鄧先生',  '苗栗縣頭份市中華路420號',      '苗栗縣', '頭份市', 24.6900, 120.9000),

  -- 台南客戶 (T55~T62, 8 位)
  ('蕭先生-T55',  '0933-T-055', 'LINE-T-055', '蕭先生',  '台南市永康區中正路500號',      '台南市', '永康區', 23.0247, 120.2532),
  ('鍾太太-T56',  '0933-T-056', 'LINE-T-056', '鍾太太',  '台南市永康區大灣路510號',      '台南市', '永康區', 23.0260, 120.2550),
  ('袁先生-T57',  '0933-T-057', 'LINE-T-057', '袁先生',  '台南市東區裕農路520號',        '台南市', '東區',   22.9800, 120.2100),
  ('阮太太-T58',  '0933-T-058', 'LINE-T-058', '阮太太',  '台南市仁德區中山路530號',      '台南市', '仁德區', 22.9700, 120.2700),
  ('丁先生-T59',  '0933-T-059', 'LINE-T-059', '丁先生',  '台南市永康區小東路540號',      '台南市', '永康區', 23.0250, 120.2540),
  ('夏小姐-T60',  '0933-T-060', 'LINE-T-060', '夏小姐',  '台南市東區東門路550號',        '台南市', '東區',   22.9810, 120.2120),
  -- 台南遠距離 (嘉義/屏東)
  ('梁先生-T61',  '0933-T-061', 'LINE-T-061', '梁先生',  '嘉義市東區民國路600號',        '嘉義市', '東區',   23.4800, 120.4500),
  ('卓太太-T62',  '0933-T-062', 'LINE-T-062', '卓太太',  '屏東縣屏東市中正路610號',      '屏東縣', '屏東市', 22.6700, 120.4900),

  -- 高雄客戶 (T63~T68, 6 位)
  ('哲先生-T63',  '0955-T-063', 'LINE-T-063', '哲先生',  '高雄市楠梓區土庫路700號',      '高雄市', '楠梓區', 22.7300, 120.3000),
  ('佩太太-T64',  '0955-T-064', 'LINE-T-064', '佩太太',  '高雄市左營區自由路710號',      '高雄市', '左營區', 22.6900, 120.3000),
  ('蔚先生-T65',  '0955-T-065', 'LINE-T-065', '蔚先生',  '高雄市三民區建工路720號',      '高雄市', '三民區', 22.6600, 120.3000),
  ('崔太太-T66',  '0955-T-066', 'LINE-T-066', '崔太太',  '高雄市楠梓區後昌路730號',      '高雄市', '楠梓區', 22.7310, 120.3010),
  -- 高雄遠距離 (恆春)
  ('婁先生-T67',  '0955-T-067', 'LINE-T-067', '婁先生',  '屏東縣恆春鎮中正路800號',      '屏東縣', '恆春鎮', 22.0000, 120.7400),
  ('熊太太-T68',  '0955-T-068', 'LINE-T-068', '熊太太',  '高雄市左營區博愛路740號',      '高雄市', '左營區', 22.6920, 120.3020)
ON CONFLICT (line_id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng;


-- ============================================================
-- 案件 (約 50 筆)
-- 每分區 5/28 + 5/29 共 ~12-14 筆 (V 車滿載)
-- 每分區至少 1 筆跨區 (>40km)
-- ============================================================

INSERT INTO cases
  (code, customer_id, location_id, address, city, district, lat, lng,
   case_type, status, source, scheduled_date, scheduled_start, duration_minutes,
   is_confirmed, vehicle_id, case_nature, notes)
VALUES
  -- ========== 桃園 5/28 (週四) ==========
  -- V1: 4 場 (中壢)
  ('TST-F-28-V1-09', (SELECT id FROM customers WHERE line_id='LINE-T-020'), (SELECT id FROM company_locations WHERE code='taoyuan'), '桃園市中壢區中央西路11號',  '桃園市', '中壢區', 24.9532, 121.2230, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-28', '09:30',  60, true, (SELECT id FROM vehicles WHERE code='V1'), 'normal', '5/28 桃園'),
  ('TST-F-28-V1-11', (SELECT id FROM customers WHERE line_id='LINE-T-021'), (SELECT id FROM company_locations WHERE code='taoyuan'), '桃園市中壢區延平路20號',    '桃園市', '中壢區', 24.9560, 121.2250, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-28', '11:00',  60, true, (SELECT id FROM vehicles WHERE code='V1'), 'normal', '5/28 桃園'),
  ('TST-F-28-V1-13', (SELECT id FROM customers WHERE line_id='LINE-T-028'), (SELECT id FROM company_locations WHERE code='taoyuan'), '桃園市中壢區中正路90號',    '桃園市', '中壢區', 24.9540, 121.2240, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-28', '13:00',  60, true, (SELECT id FROM vehicles WHERE code='V1'), 'normal', '5/28 桃園'),
  ('TST-F-28-V1-15', (SELECT id FROM customers WHERE line_id='LINE-T-030'), (SELECT id FROM company_locations WHERE code='taoyuan'), '桃園市中壢區中山路110號',   '桃園市', '中壢區', 24.9550, 121.2260, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-28', '15:00',  60, true, (SELECT id FROM vehicles WHERE code='V1'), 'normal', '5/28 桃園'),

  -- V2: 3 場 (八德)
  ('TST-F-28-V2-09', (SELECT id FROM customers WHERE line_id='LINE-T-022'), (SELECT id FROM company_locations WHERE code='taoyuan'), '桃園市八德區介壽路30號',    '桃園市', '八德區', 24.9290, 121.2850, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-28', '09:30',  60, true, (SELECT id FROM vehicles WHERE code='V2'), 'normal', '5/28 桃園'),
  ('TST-F-28-V2-13', (SELECT id FROM customers WHERE line_id='LINE-T-023'), (SELECT id FROM company_locations WHERE code='taoyuan'), '桃園市八德區廣興路40號',    '桃園市', '八德區', 24.9300, 121.2900, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-28', '13:00',  60, true, (SELECT id FROM vehicles WHERE code='V2'), 'normal', '5/28 桃園'),
  ('TST-F-28-V2-15', (SELECT id FROM customers WHERE line_id='LINE-T-029'), (SELECT id FROM company_locations WHERE code='taoyuan'), '桃園市八德區介壽路100號',   '桃園市', '八德區', 24.9292, 121.2855, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-28', '15:00',  60, true, (SELECT id FROM vehicles WHERE code='V2'), 'normal', '5/28 桃園'),

  -- V3: 桃園跨區到淡水 (1 筆遠 + 2 筆本區)
  ('TST-F-28-V3-10', (SELECT id FROM customers WHERE line_id='LINE-T-024'), (SELECT id FROM company_locations WHERE code='taoyuan'), '桃園市龜山區復興路50號',    '桃園市', '龜山區', 24.9950, 121.3380, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-28', '10:00',  60, true, (SELECT id FROM vehicles WHERE code='V3'), 'normal', '5/28 桃園'),
  ('TST-F-28-V3-14', (SELECT id FROM customers WHERE line_id='LINE-T-038'), (SELECT id FROM company_locations WHERE code='taoyuan'), '新北市淡水區英專路200號',   '新北市', '淡水區', 25.1700, 121.4500, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-28', '14:00', 120, true, (SELECT id FROM vehicles WHERE code='V3'), 'normal', '⭐ 桃園遠距離: 淡水 (~50km)'),

  -- V4: 4 場 (龜山)
  ('TST-F-28-V4-09', (SELECT id FROM customers WHERE line_id='LINE-T-025'), (SELECT id FROM company_locations WHERE code='taoyuan'), '桃園市龜山區光峰路60號',    '桃園市', '龜山區', 24.9970, 121.3400, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-28', '09:30',  60, true, (SELECT id FROM vehicles WHERE code='V4'), 'normal', '5/28 桃園'),
  ('TST-F-28-V4-11', (SELECT id FROM customers WHERE line_id='LINE-T-031'), (SELECT id FROM company_locations WHERE code='taoyuan'), '桃園市龜山區萬壽路120號',   '桃園市', '龜山區', 24.9960, 121.3390, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-28', '11:00',  60, true, (SELECT id FROM vehicles WHERE code='V4'), 'normal', '5/28 桃園'),
  ('TST-F-28-V4-13', (SELECT id FROM customers WHERE line_id='LINE-T-036'), (SELECT id FROM company_locations WHERE code='taoyuan'), '桃園市龜山區公西路170號',   '桃園市', '龜山區', 24.9980, 121.3410, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-28', '13:00',  60, true, (SELECT id FROM vehicles WHERE code='V4'), 'normal', '5/28 桃園'),
  ('TST-F-28-V4-15', (SELECT id FROM customers WHERE line_id='LINE-T-044'), (SELECT id FROM company_locations WHERE code='taoyuan'), '桃園市龜山區大同路240號',   '桃園市', '龜山區', 24.9990, 121.3420, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-28', '15:00',  60, true, (SELECT id FROM vehicles WHERE code='V4'), 'normal', '5/28 桃園'),

  -- V5: 3 場 (混合)
  ('TST-F-28-V5-09', (SELECT id FROM customers WHERE line_id='LINE-T-026'), (SELECT id FROM company_locations WHERE code='taoyuan'), '桃園市平鎮區金陵路70號',    '桃園市', '平鎮區', 24.9400, 121.2200, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-28', '09:30',  60, true, (SELECT id FROM vehicles WHERE code='V5'), 'normal', '5/28 桃園'),
  ('TST-F-28-V5-13', (SELECT id FROM customers WHERE line_id='LINE-T-035'), (SELECT id FROM company_locations WHERE code='taoyuan'), '桃園市平鎮區延平路160號',   '桃園市', '平鎮區', 24.9410, 121.2210, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-28', '13:00',  60, true, (SELECT id FROM vehicles WHERE code='V5'), 'normal', '5/28 桃園'),
  ('TST-F-28-V5-15', (SELECT id FROM customers WHERE line_id='LINE-T-027'), (SELECT id FROM company_locations WHERE code='taoyuan'), '桃園市楊梅區大成路80號',    '桃園市', '楊梅區', 24.9100, 121.1500, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-28', '15:00',  60, true, (SELECT id FROM vehicles WHERE code='V5'), 'normal', '5/28 桃園'),

  -- ========== 桃園 5/29 (週五) ==========
  ('TST-F-29-V1-09', (SELECT id FROM customers WHERE line_id='LINE-T-032'), (SELECT id FROM company_locations WHERE code='taoyuan'), '桃園市中壢區環中東路130號', '桃園市', '中壢區', 24.9570, 121.2280, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-29', '09:30',  60, true, (SELECT id FROM vehicles WHERE code='V1'), 'normal', '5/29 桃園'),
  ('TST-F-29-V1-11', (SELECT id FROM customers WHERE line_id='LINE-T-034'), (SELECT id FROM company_locations WHERE code='taoyuan'), '桃園市中壢區忠孝路150號',   '桃園市', '中壢區', 24.9555, 121.2270, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-29', '11:00',  60, true, (SELECT id FROM vehicles WHERE code='V1'), 'normal', '5/29 桃園'),
  ('TST-F-29-V1-14', (SELECT id FROM customers WHERE line_id='LINE-T-041'), (SELECT id FROM company_locations WHERE code='taoyuan'), '桃園市中壢區環中東路210號', '桃園市', '中壢區', 24.9580, 121.2290, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-29', '14:00',  60, true, (SELECT id FROM vehicles WHERE code='V1'), 'normal', '5/29 桃園'),

  ('TST-F-29-V2-09', (SELECT id FROM customers WHERE line_id='LINE-T-033'), (SELECT id FROM company_locations WHERE code='taoyuan'), '桃園市八德區建國路140號',   '桃園市', '八德區', 24.9295, 121.2860, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-29', '09:30',  60, true, (SELECT id FROM vehicles WHERE code='V2'), 'normal', '5/29 桃園'),
  ('TST-F-29-V2-11', (SELECT id FROM customers WHERE line_id='LINE-T-043'), (SELECT id FROM company_locations WHERE code='taoyuan'), '桃園市八德區大新路230號',   '桃園市', '八德區', 24.9305, 121.2870, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-29', '11:00',  60, true, (SELECT id FROM vehicles WHERE code='V2'), 'normal', '5/29 桃園'),
  ('TST-F-29-V2-14', (SELECT id FROM customers WHERE line_id='LINE-T-042'), (SELECT id FROM company_locations WHERE code='taoyuan'), '桃園市中壢區金陵路220號',   '桃園市', '中壢區', 24.9590, 121.2300, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-29', '14:00',  60, true, (SELECT id FROM vehicles WHERE code='V2'), 'normal', '5/29 桃園'),

  -- V3 5/29 跨區到南港
  ('TST-F-29-V3-14', (SELECT id FROM customers WHERE line_id='LINE-T-039'), (SELECT id FROM company_locations WHERE code='taoyuan'), '台北市南港區市民大道八段300號', '台北市', '南港區', 25.0500, 121.6000, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-29', '14:00', 120, true, (SELECT id FROM vehicles WHERE code='V3'), 'normal', '⭐ 桃園遠距離: 南港'),

  ('TST-F-29-V4-09', (SELECT id FROM customers WHERE line_id='LINE-T-037'), (SELECT id FROM company_locations WHERE code='taoyuan'), '桃園市楊梅區光華街180號',   '桃園市', '楊梅區', 24.9110, 121.1510, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-29', '09:30',  60, true, (SELECT id FROM vehicles WHERE code='V4'), 'normal', '5/29 桃園'),
  ('TST-F-29-V4-13', (SELECT id FROM customers WHERE line_id='LINE-T-040'), (SELECT id FROM company_locations WHERE code='taoyuan'), '新北市淡水區中山北路50號',  '新北市', '淡水區', 25.1690, 121.4480, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-29', '13:00', 120, true, (SELECT id FROM vehicles WHERE code='V4'), 'normal', '⭐ 桃園遠距離: 淡水'),

  ('TST-F-29-V5-09', (SELECT id FROM customers WHERE line_id='LINE-T-024'), (SELECT id FROM company_locations WHERE code='taoyuan'), '桃園市龜山區復興路50號',    '桃園市', '龜山區', 24.9950, 121.3380, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-29', '09:30',  60, true, (SELECT id FROM vehicles WHERE code='V5'), 'normal', '5/29 桃園'),
  ('TST-F-29-V5-13', (SELECT id FROM customers WHERE line_id='LINE-T-020'), (SELECT id FROM company_locations WHERE code='taoyuan'), '桃園市中壢區中央西路11號',  '桃園市', '中壢區', 24.9532, 121.2230, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-29', '13:00',  60, true, (SELECT id FROM vehicles WHERE code='V5'), 'normal', '5/29 桃園'),

  -- ========== 台中 5/28 (週四) ==========
  -- V6: 4 場
  ('TST-F-28-V6-09', (SELECT id FROM customers WHERE line_id='LINE-T-045'), (SELECT id FROM company_locations WHERE code='taichung'), '台中市西屯區市政路300號',   '台中市', '西屯區', 24.1632, 120.6470, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-28', '09:30',  60, true, (SELECT id FROM vehicles WHERE code='V6'), 'normal', '5/28 台中'),
  ('TST-F-28-V6-11', (SELECT id FROM customers WHERE line_id='LINE-T-048'), (SELECT id FROM company_locations WHERE code='taichung'), '台中市西屯區台灣大道330號', '台中市', '西屯區', 24.1640, 120.6500, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-28', '11:00',  60, true, (SELECT id FROM vehicles WHERE code='V6'), 'normal', '5/28 台中'),
  ('TST-F-28-V6-13', (SELECT id FROM customers WHERE line_id='LINE-T-051'), (SELECT id FROM company_locations WHERE code='taichung'), '台中市西屯區文心路360號',   '台中市', '西屯區', 24.1650, 120.6520, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-28', '13:00',  60, true, (SELECT id FROM vehicles WHERE code='V6'), 'normal', '5/28 台中'),
  ('TST-F-28-V6-15', (SELECT id FROM customers WHERE line_id='LINE-T-047'), (SELECT id FROM company_locations WHERE code='taichung'), '台中市南屯區大墩路320號',   '台中市', '南屯區', 24.1440, 120.6440, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-28', '15:00',  60, true, (SELECT id FROM vehicles WHERE code='V6'), 'normal', '5/28 台中'),

  -- V7 5/28 跨區到苗栗 (遠)
  ('TST-F-28-V7-10', (SELECT id FROM customers WHERE line_id='LINE-T-046'), (SELECT id FROM company_locations WHERE code='taichung'), '台中市北屯區崇德路310號',   '台中市', '北屯區', 24.1737, 120.6877, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-28', '10:00',  60, true, (SELECT id FROM vehicles WHERE code='V7'), 'normal', '5/28 台中'),
  ('TST-F-28-V7-14', (SELECT id FROM customers WHERE line_id='LINE-T-052'), (SELECT id FROM company_locations WHERE code='taichung'), '苗栗縣苗栗市中正路400號',   '苗栗縣', '苗栗市', 24.5600, 120.8200, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-28', '14:00', 120, true, (SELECT id FROM vehicles WHERE code='V7'), 'normal', '⭐ 台中遠距離: 苗栗 (~50km)'),

  -- ========== 台中 5/29 (週五) ==========
  ('TST-F-29-V6-09', (SELECT id FROM customers WHERE line_id='LINE-T-049'), (SELECT id FROM company_locations WHERE code='taichung'), '台中市北區三民路340號',     '台中市', '北區',   24.1500, 120.6800, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-29', '09:30',  60, true, (SELECT id FROM vehicles WHERE code='V6'), 'normal', '5/29 台中'),
  ('TST-F-29-V6-11', (SELECT id FROM customers WHERE line_id='LINE-T-050'), (SELECT id FROM company_locations WHERE code='taichung'), '台中市南屯區公益路350號',   '台中市', '南屯區', 24.1450, 120.6450, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-29', '11:00',  60, true, (SELECT id FROM vehicles WHERE code='V6'), 'normal', '5/29 台中'),
  ('TST-F-29-V6-13', (SELECT id FROM customers WHERE line_id='LINE-T-054'), (SELECT id FROM company_locations WHERE code='taichung'), '苗栗縣頭份市中華路420號',   '苗栗縣', '頭份市', 24.6900, 120.9000, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-29', '13:00', 120, true, (SELECT id FROM vehicles WHERE code='V6'), 'normal', '⭐ 台中遠距離: 頭份'),

  ('TST-F-29-V7-10', (SELECT id FROM customers WHERE line_id='LINE-T-053'), (SELECT id FROM company_locations WHERE code='taichung'), '雲林縣斗六市民生路410號',   '雲林縣', '斗六市', 23.7100, 120.5400, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-29', '10:00', 120, true, (SELECT id FROM vehicles WHERE code='V7'), 'normal', '⭐ 台中遠距離: 斗六 (~50km)'),

  -- ========== 台南 5/28 (週四) ==========
  ('TST-F-28-V8-09', (SELECT id FROM customers WHERE line_id='LINE-T-055'), (SELECT id FROM company_locations WHERE code='tainan'), '台南市永康區中正路500號',     '台南市', '永康區', 23.0247, 120.2532, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-28', '09:30',  60, true, (SELECT id FROM vehicles WHERE code='V8'), 'normal', '5/28 台南'),
  ('TST-F-28-V8-11', (SELECT id FROM customers WHERE line_id='LINE-T-056'), (SELECT id FROM company_locations WHERE code='tainan'), '台南市永康區大灣路510號',     '台南市', '永康區', 23.0260, 120.2550, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-28', '11:00',  60, true, (SELECT id FROM vehicles WHERE code='V8'), 'normal', '5/28 台南'),
  ('TST-F-28-V8-13', (SELECT id FROM customers WHERE line_id='LINE-T-059'), (SELECT id FROM company_locations WHERE code='tainan'), '台南市永康區小東路540號',     '台南市', '永康區', 23.0250, 120.2540, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-28', '13:00',  60, true, (SELECT id FROM vehicles WHERE code='V8'), 'normal', '5/28 台南'),
  ('TST-F-28-V8-15', (SELECT id FROM customers WHERE line_id='LINE-T-057'), (SELECT id FROM company_locations WHERE code='tainan'), '台南市東區裕農路520號',       '台南市', '東區',   22.9800, 120.2100, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-28', '15:00',  60, true, (SELECT id FROM vehicles WHERE code='V8'), 'normal', '5/28 台南'),

  -- V9 5/28 跨區到嘉義 (遠)
  ('TST-F-28-V9-10', (SELECT id FROM customers WHERE line_id='LINE-T-058'), (SELECT id FROM company_locations WHERE code='tainan'), '台南市仁德區中山路530號',     '台南市', '仁德區', 22.9700, 120.2700, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-28', '10:00',  60, true, (SELECT id FROM vehicles WHERE code='V9'), 'normal', '5/28 台南'),
  ('TST-F-28-V9-14', (SELECT id FROM customers WHERE line_id='LINE-T-061'), (SELECT id FROM company_locations WHERE code='tainan'), '嘉義市東區民國路600號',       '嘉義市', '東區',   23.4800, 120.4500, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-28', '14:00', 120, true, (SELECT id FROM vehicles WHERE code='V9'), 'normal', '⭐ 台南遠距離: 嘉義 (~50km)'),

  -- ========== 台南 5/29 (週五) ==========
  ('TST-F-29-V8-09', (SELECT id FROM customers WHERE line_id='LINE-T-060'), (SELECT id FROM company_locations WHERE code='tainan'), '台南市東區東門路550號',       '台南市', '東區',   22.9810, 120.2120, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-29', '09:30',  60, true, (SELECT id FROM vehicles WHERE code='V8'), 'normal', '5/29 台南'),
  ('TST-F-29-V8-11', (SELECT id FROM customers WHERE line_id='LINE-T-055'), (SELECT id FROM company_locations WHERE code='tainan'), '台南市永康區中正路500號',     '台南市', '永康區', 23.0247, 120.2532, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-29', '11:00',  60, true, (SELECT id FROM vehicles WHERE code='V8'), 'normal', '5/29 台南'),
  ('TST-F-29-V8-13', (SELECT id FROM customers WHERE line_id='LINE-T-058'), (SELECT id FROM company_locations WHERE code='tainan'), '台南市仁德區中山路530號',     '台南市', '仁德區', 22.9700, 120.2700, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-29', '13:00',  60, true, (SELECT id FROM vehicles WHERE code='V8'), 'normal', '5/29 台南'),

  ('TST-F-29-V9-10', (SELECT id FROM customers WHERE line_id='LINE-T-062'), (SELECT id FROM company_locations WHERE code='tainan'), '屏東縣屏東市中正路610號',     '屏東縣', '屏東市', 22.6700, 120.4900, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-29', '10:00', 120, true, (SELECT id FROM vehicles WHERE code='V9'), 'normal', '⭐ 台南遠距離: 屏東 (~50km)'),

  -- ========== 高雄 5/28 (週四) ==========
  ('TST-F-28-V10-09', (SELECT id FROM customers WHERE line_id='LINE-T-063'), (SELECT id FROM company_locations WHERE code='kaohsiung'), '高雄市楠梓區土庫路700號',  '高雄市', '楠梓區', 22.7300, 120.3000, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-28', '09:30',  60, true, (SELECT id FROM vehicles WHERE code='V10'), 'normal', '5/28 高雄'),
  ('TST-F-28-V10-11', (SELECT id FROM customers WHERE line_id='LINE-T-064'), (SELECT id FROM company_locations WHERE code='kaohsiung'), '高雄市左營區自由路710號',  '高雄市', '左營區', 22.6900, 120.3000, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-28', '11:00',  60, true, (SELECT id FROM vehicles WHERE code='V10'), 'normal', '5/28 高雄'),
  ('TST-F-28-V10-13', (SELECT id FROM customers WHERE line_id='LINE-T-065'), (SELECT id FROM company_locations WHERE code='kaohsiung'), '高雄市三民區建工路720號',  '高雄市', '三民區', 22.6600, 120.3000, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-28', '13:00',  60, true, (SELECT id FROM vehicles WHERE code='V10'), 'normal', '5/28 高雄'),
  ('TST-F-28-V10-15', (SELECT id FROM customers WHERE line_id='LINE-T-066'), (SELECT id FROM company_locations WHERE code='kaohsiung'), '高雄市楠梓區後昌路730號',  '高雄市', '楠梓區', 22.7310, 120.3010, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-28', '15:00',  60, true, (SELECT id FROM vehicles WHERE code='V10'), 'normal', '5/28 高雄'),

  -- V11 5/28 跨區到恆春 (遠)
  ('TST-F-28-V11-13', (SELECT id FROM customers WHERE line_id='LINE-T-067'), (SELECT id FROM company_locations WHERE code='kaohsiung'), '屏東縣恆春鎮中正路800號',  '屏東縣', '恆春鎮', 22.0000, 120.7400, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-28', '13:00', 180, true, (SELECT id FROM vehicles WHERE code='V11'), 'normal', '⭐ 高雄遠距離: 恆春 (~85km)'),

  -- ========== 高雄 5/29 (週五) ==========
  ('TST-F-29-V10-09', (SELECT id FROM customers WHERE line_id='LINE-T-068'), (SELECT id FROM company_locations WHERE code='kaohsiung'), '高雄市左營區博愛路740號',  '高雄市', '左營區', 22.6920, 120.3020, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-29', '09:30',  60, true, (SELECT id FROM vehicles WHERE code='V10'), 'normal', '5/29 高雄'),
  ('TST-F-29-V10-11', (SELECT id FROM customers WHERE line_id='LINE-T-063'), (SELECT id FROM company_locations WHERE code='kaohsiung'), '高雄市楠梓區土庫路700號',  '高雄市', '楠梓區', 22.7300, 120.3000, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-29', '11:00',  60, true, (SELECT id FROM vehicles WHERE code='V10'), 'normal', '5/29 高雄'),
  ('TST-F-29-V10-13', (SELECT id FROM customers WHERE line_id='LINE-T-064'), (SELECT id FROM company_locations WHERE code='kaohsiung'), '高雄市左營區自由路710號',  '高雄市', '左營區', 22.6900, 120.3000, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-29', '13:00',  60, true, (SELECT id FROM vehicles WHERE code='V10'), 'normal', '5/29 高雄'),

  ('TST-F-29-V11-10', (SELECT id FROM customers WHERE line_id='LINE-T-065'), (SELECT id FROM company_locations WHERE code='kaohsiung'), '高雄市三民區建工路720號',  '高雄市', '三民區', 22.6600, 120.3000, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-29', '10:00',  60, true, (SELECT id FROM vehicles WHERE code='V11'), 'normal', '5/29 高雄'),
  ('TST-F-29-V11-13', (SELECT id FROM customers WHERE line_id='LINE-T-066'), (SELECT id FROM company_locations WHERE code='kaohsiung'), '高雄市楠梓區後昌路730號',  '高雄市', '楠梓區', 22.7310, 120.3010, 'measurement_on_site', 'measurement_scheduled', 'line_official', '2026-05-29', '13:00',  60, true, (SELECT id FROM vehicles WHERE code='V11'), 'normal', '5/29 高雄');


-- ============================================================
-- 驗證
-- ============================================================
SELECT scheduled_date,
       (SELECT code FROM company_locations WHERE id = cases.location_id) AS branch,
       COUNT(*) AS 案件數
FROM cases
WHERE scheduled_date BETWEEN '2026-05-28' AND '2026-05-29'
GROUP BY scheduled_date, branch
ORDER BY scheduled_date, branch;

SELECT '⭐ 跨區案件' AS info, COUNT(*) AS n
FROM cases
WHERE scheduled_date BETWEEN '2026-05-28' AND '2026-05-29'
  AND notes LIKE '%遠距離%';
