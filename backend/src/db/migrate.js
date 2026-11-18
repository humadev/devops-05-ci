import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'devops',
  password: process.env.DB_PASSWORD || 'devops_secret',
  database: process.env.DB_NAME || 'tickets_ci'
});

const SQL = `CREATE TABLE IF NOT EXISTS reservations (
  id SERIAL PRIMARY KEY,
  event_code VARCHAR(50) NOT NULL,
  attendee_email VARCHAR(120) NOT NULL,
  seat_qty INT NOT NULL,
  total_price INT NOT NULL,
  status VARCHAR(20) DEFAULT 'CONFIRMED',
  created_at TIMESTAMP DEFAULT NOW()
);`;

await pool.query(SQL);
console.log('Migration completed: reservations table is ready.');
await pool.end();
process.exit(0);
