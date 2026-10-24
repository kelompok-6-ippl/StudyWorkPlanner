const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5432/studywork_db'
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

async function checkDbConnection() {
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
      console.log('-------------------------------------------------------');
      console.log('ℹ️  INFO: Tabel database belum dibuat.');
      console.log('👉 Silakan buka pgAdmin, pilih database "studywork_db", lalu buka Query Tool:');
      console.log('   1. Buka dan jalankan backend/src/db/ddl.sql (F5)');
      console.log('   2. Buka dan jalankan backend/src/db/dml.sql (F5)');
      console.log('-------------------------------------------------------');
    } else {
      console.log('Database tables verified.');
    }
    client.release();
  } catch (error) {
    console.error('Warning: Could not connect to PostgreSQL:', error.message);
    console.log('Please ensure PostgreSQL server is active and accessible via pgAdmin.');
  }
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  checkDbConnection,
  initDb: checkDbConnection
};
