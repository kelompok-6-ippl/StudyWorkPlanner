const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5432/studywork_db';

const pool = new Pool({
  connectionString
});

pool.on('error', (err) => {
  console.error('PostgreSQL Client Error:', err.message);
});

function getDbInstanceName() {
  try {
    const parsed = new URL(connectionString);
    return parsed.pathname.replace(/^\//, '') || 'studywork_db';
  } catch {
    return 'studywork_db';
  }
}

async function checkDbConnection() {
  const dbInstance = getDbInstanceName();
  try {
    const client = await pool.connect();
    console.log(`Database connection (${dbInstance}): Success`);
    client.release();
  } catch (error) {
    console.error(`Database connection (${dbInstance}): Failed, check your database connection string`);
  }
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  checkDbConnection,
  initDb: checkDbConnection
};
