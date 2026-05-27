-- ============================================================
-- SMOG Schema v0.3 — Section 3: SEED 初始資料
-- ============================================================
-- 前置條件：
--   - Section 1（01-tables.sql）必須已成功執行
--   - Section 2（02-triggers.sql）建議也跑完
--
-- 跑完這個檔案後，會插入：
--   - company_locations: 4 筆（桃園/台中/台南/高雄）
-- ============================================================


-- 公司四個據點（座標為估計值，上線時請更新精確座標）
INSERT INTO company_locations (code, name, address, lat, lng, sort_order) VALUES
  ('taoyuan',   '桃園總部', '桃園市桃園區建國路61巷58號',     24.9936, 121.3010, 1),
  ('taichung',  '台中分部', '台中市西屯區惠中路二段50號',     24.1632, 120.6470, 2),
  ('tainan',    '台南分部', '台南市永康區復興路246巷8號',     23.0247, 120.2532, 3),
  ('kaohsiung', '高雄分部', '高雄市楠梓區土庫二路30號',       22.7300, 120.3000, 4);


-- ============================================================
-- 跑完後驗證
-- ============================================================
-- 確認據點都進去了：
--
--   SELECT code, name, address, sort_order FROM company_locations
--   ORDER BY sort_order;
--
-- 應看到 4 列：taoyuan, taichung, tainan, kaohsiung
-- ============================================================


-- ============================================================
-- ⏸️ 後續可選 seed（先註解，需要時再執行）
-- ============================================================
-- 注意：vehicles 跟 technicians 必須要先有 location_id，
-- 所以一定要 company_locations 先 seed 完才能跑下面這些。

-- ===== 範例：先建幾台車（拿掉註解再執行）=====
-- INSERT INTO vehicles (code, name, type, color, location_id) VALUES
--   ('V1', '車1', 'both',         '#0284C7', (SELECT id FROM company_locations WHERE code = 'taoyuan')),
--   ('V2', '車2', 'installation', '#1D4ED8', (SELECT id FROM company_locations WHERE code = 'taoyuan')),
--   ('V3', '車3', 'measurement',  '#10B981', (SELECT id FROM company_locations WHERE code = 'taoyuan'));

-- ===== 範例：建幾位師傅（拿掉註解再執行）=====
-- INSERT INTO technicians (code, name, phone, skills, location_id, hired_at) VALUES
--   ('P1', '阿志', '0900000001', ARRAY['measurement','installation']::skill_type[],
--    (SELECT id FROM company_locations WHERE code = 'taoyuan'), '2024-01-01'),
--   ('P2', 'Andy', '0900000002', ARRAY['measurement']::skill_type[],
--    (SELECT id FROM company_locations WHERE code = 'taoyuan'), '2024-03-15'),
--   ('P3', 'Joe',  '0900000003', ARRAY['installation']::skill_type[],
--    (SELECT id FROM company_locations WHERE code = 'taoyuan'), '2024-06-01');

-- ============================================================
