DROP TRIGGER IF EXISTS update_holidays_updated_at ON holidays;

DROP FUNCTION IF EXISTS get_holidays_by_month(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS is_holiday(DATE);
DROP FUNCTION IF EXISTS update_updated_at_column();

DROP VIEW IF EXISTS vw_holidays_2026;

DROP TABLE IF EXISTS holidays;