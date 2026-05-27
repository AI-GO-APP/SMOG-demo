-- ============================================================
-- SMOG Schema v0.3 — Section 5: RLS Policies (demo 寬鬆版)
-- ============================================================
-- 為什麼需要這個：
--   新版 Supabase Publishable Key (sb_publishable_*) 強制要求 RLS。
--   即使「沒啟用 RLS」也會拒絕讀取（這是 2024 後的新行為）。
--   要讓前端 anon 連線能讀寫，必須明確 ENABLE RLS + 加 policy。
--
-- ⚠️ 這份 policy 是「demo 寬鬆版」：
--   anon 跟 authenticated 都能讀寫所有資料。
--   正式版 (v0.4) 要改成依 location_id 限制。
-- ============================================================


-- ===== 1) 啟用所有 table 的 RLS =====

ALTER TABLE company_locations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE technicians          ENABLE ROW LEVEL SECURITY;
ALTER TABLE technician_shifts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_assignments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases                ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_status_log      ENABLE ROW LEVEL SECURITY;


-- ===== 2) 為每個 table 加 demo 寬鬆 policy =====
-- FOR ALL = SELECT + INSERT + UPDATE + DELETE 都允許
-- TO anon, authenticated = 兩種角色都允許
-- USING (true) = 沒有任何 row 過濾
-- WITH CHECK (true) = 沒有任何寫入限制

CREATE POLICY "demo_all" ON company_locations  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "demo_all" ON customers          FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "demo_all" ON vehicles           FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "demo_all" ON technicians        FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "demo_all" ON technician_shifts  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "demo_all" ON daily_assignments  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "demo_all" ON cases              FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "demo_all" ON case_status_log    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);


-- ============================================================
-- 跑完後驗證
-- ============================================================
-- 檢查所有 policy 都建了（應該看到 8 列）：
--
--   SELECT schemaname, tablename, policyname, cmd, roles
--   FROM pg_policies
--   WHERE schemaname = 'public'
--   ORDER BY tablename;
--
-- ============================================================
