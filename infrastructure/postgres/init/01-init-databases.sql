-- Looper HQ PostgreSQL Initialization Script
-- This script initializes the databases and basic configuration

-- Ensure UTF-8 encoding for Hong Kong legal case support
SET client_encoding = 'UTF8';

-- Create Keycloak database if it doesn't exist
SELECT 'CREATE DATABASE keycloak'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'keycloak')\gexec

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE looper_hq TO postgres;
GRANT ALL PRIVILEGES ON DATABASE keycloak TO postgres;

-- Configure connection pooling and performance settings
-- NOTE: These ALTER SYSTEM commands write to postgresql.auto.conf
-- and will take effect on the next server restart (already handled by Docker container lifecycle)
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET min_wal_size = '1GB';
ALTER SYSTEM SET max_wal_size = '4GB';

-- Set timezone to Hong Kong
ALTER SYSTEM SET timezone = 'Asia/Hong_Kong';

-- Configure logging for development
ALTER SYSTEM SET log_destination = 'stderr';
ALTER SYSTEM SET logging_collector = on;
ALTER SYSTEM SET log_directory = 'pg_log';
ALTER SYSTEM SET log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log';
ALTER SYSTEM SET log_statement = 'mod';
ALTER SYSTEM SET log_duration = on;
ALTER SYSTEM SET log_min_duration_statement = 1000;

-- Reload configuration
SELECT pg_reload_conf();
