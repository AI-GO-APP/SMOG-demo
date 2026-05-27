-- ============================================================
-- SMOG Demo — 把所有日期對齊到「今天」
-- ============================================================
-- 用途：
--   04-demo-data.sql 用 CURRENT_DATE 寫入，但隨時間流逝，
--   昨天跑的 demo 資料今天就看不到「今天的案件」。
--
--   這個 SQL 把：
--     - cases.scheduled_date
--     - daily_assignments.assignment_date
--     - technician_shifts.shift_date
--   全部更新成 CURRENT_DATE，讓 demo 看起來像今天。
--
-- 何時跑：每次打開 demo 看不到今天的資料時，跑這個重新對齊。
-- ============================================================


-- 1) 把所有「已排好時間」的案件移到今天（保留時間 hh:mm）
UPDATE cases
SET    scheduled_date = CURRENT_DATE,
       updated_at     = now()
WHERE  scheduled_date IS NOT NULL
   AND deleted_at IS NULL;


-- 2) 把所有 daily_assignments 移到今天
--    (簡單做法：把所有 assignment_date 統一改成 CURRENT_DATE)
UPDATE daily_assignments
SET    assignment_date = CURRENT_DATE,
       updated_at      = now();


-- 3) 把今天前的 shifts 移到今天（讓今天每個師傅都有班）
--    保留各人 status (上班/休假/...) 不變
UPDATE technician_shifts
SET    shift_date = CURRENT_DATE,
       updated_at = now()
WHERE  shift_date <= CURRENT_DATE
   AND NOT EXISTS (
     SELECT 1 FROM technician_shifts s2
     WHERE  s2.technician_id = technician_shifts.technician_id
       AND  s2.shift_date    = CURRENT_DATE
       AND  s2.id            <> technician_shifts.id
   );


-- ============================================================
-- 跑完後驗證
-- ============================================================
-- 確認資料都在「今天」：
--
--   SELECT 'cases'             AS t, COUNT(*) AS today_cnt
--   FROM cases WHERE scheduled_date = CURRENT_DATE
--   UNION ALL
--   SELECT 'daily_assignments', COUNT(*)
--   FROM daily_assignments WHERE assignment_date = CURRENT_DATE
--   UNION ALL
--   SELECT 'technician_shifts (today)', COUNT(*)
--   FROM technician_shifts WHERE shift_date = CURRENT_DATE;
--
--   應看到：cases=14, daily_assignments=9, technician_shifts (today)=9
-- ============================================================
