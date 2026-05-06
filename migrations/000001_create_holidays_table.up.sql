-- Create holidays table
CREATE TABLE IF NOT EXISTS holidays (
    id SERIAL PRIMARY KEY,
    day_of_week VARCHAR(20) NOT NULL,
    date_value DATE NOT NULL,
    occasion VARCHAR(200) NOT NULL,
    month INTEGER NOT NULL,
    day_number INTEGER NOT NULL,
    year INTEGER NOT NULL DEFAULT 2026,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT unique_holiday_date UNIQUE (date_value, year),
    CONSTRAINT valid_month CHECK (month BETWEEN 1 AND 12),
    CONSTRAINT valid_day_number CHECK (day_number BETWEEN 1 AND 31),
    CONSTRAINT valid_year CHECK (year = 2026)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_holidays_month ON holidays(month);
CREATE INDEX IF NOT EXISTS idx_holidays_year ON holidays(year);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date_value);
CREATE INDEX IF NOT EXISTS idx_holidays_month_day ON holidays(month, day_number);

-- Insert Belize holidays for 2026
INSERT INTO holidays (day_of_week, date_value, occasion, month, day_number, year) VALUES
    ('Thursday', '2026-01-01', 'New Year''s Day', 1, 1, 2026),
    ('Thursday', '2026-01-15', 'George Price Day', 1, 15, 2026),
    ('Monday', '2026-03-09', 'National Heroes and Benefactor Day', 3, 9, 2026),
    ('Friday', '2026-04-03', 'Good Friday', 4, 3, 2026),
    ('Saturday', '2026-04-04', 'Holy Saturday', 4, 4, 2026),
    ('Monday', '2026-04-06', 'Easter Monday', 4, 6, 2026),
    ('Friday', '2026-05-01', 'Labour Day', 5, 1, 2026),
    ('Saturday', '2026-08-01', 'Emancipation Day', 8, 1, 2026),
    ('Thursday', '2026-09-10', 'St. George''s Caye Day', 9, 10, 2026),
    ('Monday', '2026-09-21', 'Independence Day', 9, 21, 2026),
    ('Monday', '2026-10-12', 'Indigenous People''s Resistance Day', 10, 12, 2026),
    ('Thursday', '2026-11-19', 'Garifuna Settlement Day', 11, 19, 2026),
    ('Friday', '2026-12-25', 'Christmas Day', 12, 25, 2026),
    ('Saturday', '2026-12-26', 'Boxing Day', 12, 26, 2026)
ON CONFLICT (date_value, year) DO NOTHING;

-- Create views
CREATE OR REPLACE VIEW vw_holidays_2026 AS
SELECT 
    id,
    day_of_week,
    TO_CHAR(date_value, 'DD Month YYYY') AS formatted_date,
    TO_CHAR(date_value, 'DDth Month') AS short_formatted_date,
    date_value AS actual_date,
    occasion,
    month,
    day_number
FROM holidays
WHERE year = 2026
ORDER BY date_value;

-- Create function to check if a date is a holiday
CREATE OR REPLACE FUNCTION is_holiday(check_date DATE)
RETURNS TABLE(
    is_holiday BOOLEAN,
    occasion VARCHAR,
    day_of_week VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXISTS(SELECT 1 FROM holidays WHERE date_value = check_date) AS is_holiday,
        (SELECT occasion FROM holidays WHERE date_value = check_date LIMIT 1) AS occasion,
        (SELECT day_of_week FROM holidays WHERE date_value = check_date LIMIT 1) AS day_of_week;
END;
$$ LANGUAGE plpgsql;

-- Create function to get holidays by month
CREATE OR REPLACE FUNCTION get_holidays_by_month(p_month INTEGER, p_year INTEGER DEFAULT 2026)
RETURNS TABLE(
    id INTEGER,
    day_of_week VARCHAR,
    date_value DATE,
    occasion VARCHAR,
    month INTEGER,
    day_number INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.id,
        h.day_of_week,
        h.date_value,
        h.occasion,
        h.month,
        h.day_number
    FROM holidays h
    WHERE h.month = p_month AND h.year = p_year
    ORDER BY h.day_number;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_holidays_updated_at ON holidays;
CREATE TRIGGER update_holidays_updated_at
    BEFORE UPDATE ON holidays
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();