require('dotenv').config();
const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Pool using DATABASE_URL if present
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      host: process.env.PGHOST,
      port: process.env.PGPORT,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE
    });

// Test DB connection before starting
async function testDb() {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('Connected to Postgres successfully.');
  } catch (err) {
    console.error('Failed to connect to Postgres:', err.message || err);
    // don't exit; report and continue so dev can see error
  }
}

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { usuario, contrasena } = req.body;
    if (!usuario || !contrasena) return res.status(400).json({ error: 'Faltan credenciales' });

    const query = `SELECT username, email, password, activo FROM Usuario WHERE username = $1 OR email = $1 LIMIT 1`;
    const values = [usuario];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) return res.status(401).json({ error: 'Usuario no encontrado' });

    const user = result.rows[0];
    if (!user.activo) return res.status(403).json({ error: 'Usuario inactivo' });

    // NOTE: passwords in DB are plain text in your dataset. Replace with hashed checks later.
    if (user.password !== contrasena) return res.status(401).json({ error: 'Contraseña incorrecta' });

    const baseUrl = `${req.protocol}://${req.get('host')}`; // eg http://localhost:3000
    const endpoint = `${baseUrl}${req.originalUrl}`;

    return res.json({ success: true, username: user.username, serverUrl: baseUrl, endpoint });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

// Serve static frontend from root directory
app.use(express.static(path.join(__dirname)));

// Start server after testing DB
(async function start() {
  await testDb();
  const server = app.listen(PORT, () => {
    const addr = server.address();
    let host = addr.address;
    if (host === '::' || host === '0.0.0.0') host = 'localhost';
    const protocol = process.env.HTTPS === 'true' ? 'https' : 'http';
    console.log(`Server listening at ${protocol}://${host}:${addr.port}`);
  });
})();
