const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'dashboard_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'cakra123',
});

async function setupDatabase() {
  try {
    console.log('Setting up database...');
    
    // Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS uploaded_files (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_size BIGINT NOT NULL,
        record_count INTEGER NOT NULL,
        total_omzet DECIMAL(15,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'processing',
        uploaded_by VARCHAR(100) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS sales_records (
        id SERIAL PRIMARY KEY,
        file_id INTEGER REFERENCES uploaded_files(id) ON DELETE CASCADE,
        grand_total VARCHAR(100),
        week INTEGER NOT NULL,
        date DATE,
        product VARCHAR(255) NOT NULL,
        category VARCHAR(255),
        customer_no VARCHAR(100),
        customer VARCHAR(255) NOT NULL,
        customer_type VARCHAR(100),
        salesman VARCHAR(255),
        village VARCHAR(255),
        district VARCHAR(255),
        city VARCHAR(255),
        units_bks DECIMAL(10,2) DEFAULT 0,
        units_slop DECIMAL(10,2) DEFAULT 0,
        units_bal DECIMAL(10,2) DEFAULT 0,
        units_dos DECIMAL(10,2) DEFAULT 0,
        omzet DECIMAL(15,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE,
        password_hash VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_sales_records_file_id ON sales_records(file_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_sales_records_date ON sales_records(date);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_sales_records_week ON sales_records(week);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_sales_records_product ON sales_records(product);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_sales_records_customer ON sales_records(customer);');

    // Create trigger for updated_at
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await pool.query('DROP TRIGGER IF EXISTS update_uploaded_files_updated_at ON uploaded_files;');
    await pool.query('CREATE TRIGGER update_uploaded_files_updated_at BEFORE UPDATE ON uploaded_files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();');

    await pool.query('DROP TRIGGER IF EXISTS update_sales_records_updated_at ON sales_records;');
    await pool.query('CREATE TRIGGER update_sales_records_updated_at BEFORE UPDATE ON sales_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();');

    await pool.query('DROP TRIGGER IF EXISTS update_users_updated_at ON users;');
    await pool.query('CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();');

    // Insert default admin user
    await pool.query(`
      INSERT INTO users (username, email, password_hash, role)
      VALUES ('admin', 'admin@dashboard.com', '$2b$10$placeholder', 'admin')
      ON CONFLICT (username) DO NOTHING;
    `);

    console.log('Database setup completed successfully!');
    
  } catch (error) {
    console.error('Database setup failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

setupDatabase().catch(console.error);
