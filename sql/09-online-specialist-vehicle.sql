-- ============================================================
-- SMOG Demo - 線上專員「虛擬車」(v0.5)
-- 為每個分區加一台 type=measurement 的虛擬車
-- 用途：承載線上丈量案件（線上專員不需要實體車）
-- ============================================================

INSERT INTO vehicles (code, name, type, color, location_id, notes) VALUES
  ('ONLINE-TY',  '線上專員(桃)', 'measurement', '#94A3B8', (SELECT id FROM company_locations WHERE code = 'taoyuan'),   '線上丈量虛擬車'),
  ('ONLINE-TC',  '線上專員(中)', 'measurement', '#94A3B8', (SELECT id FROM company_locations WHERE code = 'taichung'),  '線上丈量虛擬車'),
  ('ONLINE-TN',  '線上專員(南)', 'measurement', '#94A3B8', (SELECT id FROM company_locations WHERE code = 'tainan'),    '線上丈量虛擬車'),
  ('ONLINE-KH',  '線上專員(高)', 'measurement', '#94A3B8', (SELECT id FROM company_locations WHERE code = 'kaohsiung'), '線上丈量虛擬車')
ON CONFLICT (code) DO NOTHING;

-- 驗證
SELECT code, name, type, (SELECT name FROM company_locations WHERE id = vehicles.location_id) AS branch
FROM vehicles
WHERE code LIKE 'ONLINE-%';
