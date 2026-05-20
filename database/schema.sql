-- PostgreSQL Schema for Sales Dashboard
-- Run this script to create the database structure

-- Create database (run as postgres user)
-- CREATE DATABASE dashboard_db;
-- \c dashboard_db

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sales records table
CREATE TABLE IF NOT EXISTS sales_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID REFERENCES uploaded_files(id) ON DELETE SET NULL,
    grand_total VARCHAR(50) NOT NULL,
    week INTEGER NOT NULL,
    date DATE NOT NULL,
    product VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    customer_no VARCHAR(50),
    customer VARCHAR(255) NOT NULL,
    customer_type VARCHAR(50),
    salesman VARCHAR(100),
    village VARCHAR(100),
    district VARCHAR(100),
    city VARCHAR(100),
    units_bks DECIMAL(18,6) DEFAULT 0,
    units_slop DECIMAL(18,6) DEFAULT 0,
    units_bal DECIMAL(18,6) DEFAULT 0,
    units_dos DECIMAL(18,6) DEFAULT 0,
    omzet DECIMAL(18,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Uploaded files tracking table
CREATE TABLE IF NOT EXISTS uploaded_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    record_count INTEGER DEFAULT 0,
    total_omzet DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'processing',
    error_message TEXT,
    uploaded_by VARCHAR(100) NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table for authentication (optional)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_records_date ON sales_records(date);
CREATE INDEX IF NOT EXISTS idx_sales_records_week ON sales_records(week);
CREATE INDEX IF NOT EXISTS idx_sales_records_product ON sales_records(product);
CREATE INDEX IF NOT EXISTS idx_sales_records_customer ON sales_records(customer);
CREATE INDEX IF NOT EXISTS idx_sales_records_file_id ON sales_records(file_id);
CREATE INDEX IF NOT EXISTS idx_sales_records_city ON sales_records(city);
CREATE INDEX IF NOT EXISTS idx_sales_records_area ON sales_records(area);
CREATE INDEX IF NOT EXISTS idx_sales_records_category ON sales_records(category);
CREATE INDEX IF NOT EXISTS idx_sales_records_customer_type ON sales_records(customer_type);
CREATE INDEX IF NOT EXISTS idx_sales_records_salesman ON sales_records(salesman);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_sales_records_date_week ON sales_records(date, week);
CREATE INDEX IF NOT EXISTS idx_sales_records_year_week ON sales_records(EXTRACT(YEAR FROM date), week);
CREATE INDEX IF NOT EXISTS idx_sales_records_year_product ON sales_records(EXTRACT(YEAR FROM date), product);
CREATE INDEX IF NOT EXISTS idx_sales_records_year_city ON sales_records(EXTRACT(YEAR FROM date), city);
CREATE INDEX IF NOT EXISTS idx_sales_records_year_area ON sales_records(EXTRACT(YEAR FROM date), area);
CREATE INDEX IF NOT EXISTS idx_sales_records_week_product ON sales_records(week, product);
CREATE INDEX IF NOT EXISTS idx_sales_records_week_city ON sales_records(week, city);
CREATE INDEX IF NOT EXISTS idx_sales_records_week_area ON sales_records(week, area);

-- Performance indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_sales_records_date_product_customer ON sales_records(date, product, customer);
CREATE INDEX IF NOT EXISTS idx_sales_records_year_week_product ON sales_records(EXTRACT(YEAR FROM date), week, product);
CREATE INDEX IF NOT EXISTS idx_sales_records_year_week_city ON sales_records(EXTRACT(YEAR FROM date), week, city);
CREATE INDEX IF NOT EXISTS idx_sales_records_year_week_area ON sales_records(EXTRACT(YEAR FROM date), week, area);

-- Indexes for aggregation queries
CREATE INDEX IF NOT EXISTS idx_sales_records_date_omzet ON sales_records(date, omzet);
CREATE INDEX IF NOT EXISTS idx_sales_records_year_omzet ON sales_records(EXTRACT(YEAR FROM date), omzet);
CREATE INDEX IF NOT EXISTS idx_sales_records_week_omzet ON sales_records(week, omzet);

-- Indexes for uploaded_files
CREATE INDEX IF NOT EXISTS idx_uploaded_files_status ON uploaded_files(status);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_created_at ON uploaded_files(created_at);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_uploaded_by ON uploaded_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_original_name ON uploaded_files(original_name);

-- Partial indexes for common filters
CREATE INDEX IF NOT EXISTS idx_sales_records_active ON sales_records(date, week, product) WHERE omzet > 0;
CREATE INDEX IF NOT EXISTS idx_uploaded_files_completed ON uploaded_files(created_at) WHERE status = 'completed';

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_sales_records_updated_at BEFORE UPDATE ON sales_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_uploaded_files_updated_at BEFORE UPDATE ON uploaded_files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password_hash, role) 
VALUES ('admin', 'admin@dashboard.com', '$2b$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Grant permissions (adjust as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dashboard_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dashboard_user;
