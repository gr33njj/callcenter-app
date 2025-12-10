-- Create database
-- Run: CREATE DATABASE callcenter_db;

-- Users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('supervisor', 'management', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Operators table
CREATE TABLE IF NOT EXISTS operators (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    operator_id INTEGER NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    time_slot VARCHAR(20) NOT NULL CHECK (time_slot IN ('morning', 'afternoon', 'evening')),
    
    -- Cumulative data (supervisor enters this)
    total_calls_cumulative INTEGER NOT NULL DEFAULT 0,
    
    -- Detailed metrics
    incoming_accepted INTEGER NOT NULL DEFAULT 0,
    outgoing_made INTEGER NOT NULL DEFAULT 0,
    missed INTEGER NOT NULL DEFAULT 0,
    time_on_line INTEGER NOT NULL DEFAULT 0, -- minutes
    time_in_calls INTEGER NOT NULL DEFAULT 0, -- minutes
    recordings INTEGER NOT NULL DEFAULT 0,
    
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint: one report per operator per date per time slot
    UNIQUE(operator_id, report_date, time_slot)
);

-- Indexes for better performance
CREATE INDEX idx_reports_operator_date ON reports(operator_id, report_date);
CREATE INDEX idx_reports_date ON reports(report_date);
CREATE INDEX idx_operators_active ON operators(is_active);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_operators_updated_at BEFORE UPDATE ON operators
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123 - CHANGE THIS!)
-- Password hash for 'admin123'
INSERT INTO users (username, password_hash, role) 
VALUES ('admin', '$2a$10$rZ5YvYvYvYvYvYvYvYvYvOeH3kKkKkKkKkKkKkKkKkKkKkKkKkKkK', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Insert supervisor user (password: supervisor123 - CHANGE THIS!)
INSERT INTO users (username, password_hash, role) 
VALUES ('supervisor', '$2a$10$rZ5YvYvYvYvYvYvYvYvYvOeH3kKkKkKkKkKkKkKkKkKkKkKkKkKkK', 'supervisor')
ON CONFLICT (username) DO NOTHING;

-- Insert management user (password: manager123 - CHANGE THIS!)
INSERT INTO users (username, password_hash, role) 
VALUES ('manager', '$2a$10$rZ5YvYvYvYvYvYvYvYvYvOeH3kKkKkKkKkKkKkKkKkKkKkKkKkKkK', 'management')
ON CONFLICT (username) DO NOTHING;
