const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5432/studywork_db'
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

async function initDb() {
  try {
    const client = await pool.connect();
    console.log('Connected to PostgreSQL successfully.');
    
    // Check if tables exist
    const res = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'users'
      );
    `);

    if (!res.rows[0].exists) {
      console.log('Tables not found. Initializing schema & seed data...');
      const schemaSql = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
      const seedSql = fs.readFileSync(path.join(__dirname, '../db/seed.sql'), 'utf8');
      
      await client.query(schemaSql);
      await client.query(seedSql);
      console.log('Database initialized successfully with default SuperAdmin and categories.');
    } else {
      console.log('Database tables verified.');
    }
    client.release();
  } catch (error) {
    console.error('Warning: Could not auto-initialize PostgreSQL database:', error.message);
    console.log('Please ensure PostgreSQL is running (e.g. via docker compose up -d or local service).');
  }
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  initDb
};
