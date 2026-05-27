-- ============================================================
-- SMOG Schema v0.3 — Section 2: TRIGGERS
-- ============================================================
-- 前置條件：Section 1（01-tables.sql）必須已成功執行
-- 跑完這個檔案後，會建立：
--   - 7 個 updated_at 自動更新 trigger
--   - 1 個 案件狀態變更 log trigger
--   - 1 個 預選時段釋放 trigger
-- ============================================================


-- ===== 2.1) 自動更新 updated_at =====

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_locations BEFORE UPDATE ON company_locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_customers BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_vehicles BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_technicians BEFORE UPDATE ON technicians
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_shifts BEFORE UPDATE ON technician_shifts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_assignments BEFORE UPDATE ON daily_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_cases BEFORE UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ===== 2.2) 案件狀態變更自動記錄 =====

CREATE OR REPLACE FUNCTION log_case_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO case_status_log (case_id, old_status, new_status, changed_at)
    VALUES (NEW.id, OLD.status, NEW.status, now());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_case_status AFTER UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION log_case_status_change();


-- ===== 2.3) 案件 confirm 主時段 → 釋放他案備選時段 =====

CREATE OR REPLACE FUNCTION release_overlapping_proposed_slots()
RETURNS TRIGGER AS $$
DECLARE
  affected_case RECORD;
  new_proposed jsonb;
  new_released jsonb;
BEGIN
  IF NEW.is_confirmed = true
     AND NEW.scheduled_date IS NOT NULL
     AND NEW.scheduled_start IS NOT NULL
     AND NEW.vehicle_id IS NOT NULL
     AND (
       OLD.is_confirmed IS DISTINCT FROM NEW.is_confirmed
       OR OLD.scheduled_date IS DISTINCT FROM NEW.scheduled_date
       OR OLD.scheduled_start IS DISTINCT FROM NEW.scheduled_start
       OR OLD.vehicle_id IS DISTINCT FROM NEW.vehicle_id
     )
  THEN
    FOR affected_case IN
      SELECT id, code, proposed_slots, released_slots
      FROM cases
      WHERE id <> NEW.id
        AND deleted_at IS NULL
        AND proposed_slots @> jsonb_build_array(
          jsonb_build_object('date', NEW.scheduled_date::text)
        )
    LOOP
      SELECT
        jsonb_agg(slot) FILTER (
          WHERE NOT (
            slot->>'date' = NEW.scheduled_date::text
            AND slot->>'vehicle_id' = NEW.vehicle_id::text
          )
        ),
        jsonb_agg(
          slot || jsonb_build_object(
            'released_at', now(),
            'released_to_case_id', NEW.id,
            'released_to_case_code', NEW.code
          )
        ) FILTER (
          WHERE slot->>'date' = NEW.scheduled_date::text
            AND slot->>'vehicle_id' = NEW.vehicle_id::text
        )
      INTO new_proposed, new_released
      FROM jsonb_array_elements(affected_case.proposed_slots) AS slot;

      IF new_released IS NOT NULL THEN
        UPDATE cases
        SET proposed_slots = COALESCE(new_proposed, '[]'::jsonb),
            released_slots = released_slots || new_released
        WHERE id = affected_case.id;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER release_proposed_on_confirm AFTER UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION release_overlapping_proposed_slots();


-- ============================================================
-- 跑完後驗證
-- ============================================================
-- 確認 trigger 都建好（在 SQL Editor 新開 query 跑這段）：
--
--   SELECT trigger_name, event_object_table
--   FROM information_schema.triggers
--   WHERE trigger_schema = 'public'
--   ORDER BY event_object_table, trigger_name;
--
-- 應看到 9 列，包含：
--   set_updated_at_*  (7 個)
--   track_case_status  (1 個)
--   release_proposed_on_confirm  (1 個)
-- ============================================================
