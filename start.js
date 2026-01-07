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

// Helper function to get or insert lugar
async function getOrInsertLugar(client, ciudad, pais) {
  // Check if exists
  const checkQuery = 'SELECT id_lugar FROM Lugar WHERE ciudad = $1 AND pais = $2';
  const checkResult = await client.query(checkQuery, [ciudad, pais]);
  if (checkResult.rows.length > 0) {
    return checkResult.rows[0].id_lugar;
  }
  // Insert new
  const insertQuery = 'INSERT INTO Lugar (ciudad, pais) VALUES ($1, $2) RETURNING id_lugar';
  const insertResult = await client.query(insertQuery, [ciudad, pais]);
  return insertResult.rows[0].id_lugar;
}

// Register Persona
app.post('/api/register/persona', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { nombre, apellido, cedula, ciudad, pais, fecha, sexo, bio, usuario, correo, contrasena } = req.body;

    // Check if username or email exists
    const checkUser = await client.query('SELECT username FROM Usuario WHERE username = $1 OR email = $2', [usuario, correo]);
    if (checkUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Usuario o correo ya existe' });
    }

    // Insert Usuario
    await client.query('INSERT INTO Usuario (username, email, password) VALUES ($1, $2, $3)', [usuario, correo, contrasena]);

    // Get or insert lugar
    const id_lugar = await getOrInsertLugar(client, ciudad, pais);

    // Insert Persona
    await client.query('INSERT INTO Persona (cedula, nombre, apellido, fecha_nacimiento, sexo, biografia, username, id_lugar) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', 
      [parseInt(cedula), nombre, apellido, fecha, sexo, bio || null, usuario, id_lugar]);

    await client.query('COMMIT');
    res.json({ success: true, message: 'Registro de persona exitoso' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Register persona error:', err);
    res.status(500).json({ error: 'Error interno' });
  } finally {
    client.release();
  }
});

// Register Dependencia
app.post('/api/register/dependencia', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { abreviatura, nombre, tipo, usuario, correo, contrasena } = req.body;

    // Map tipo
    const tipoMap = { academica: 'Facultad', administrativa: 'Direccion', servicios: 'Centro', otra: 'Escuela' };
    const tipoDB = tipoMap[tipo] || 'Escuela';

    // Check if username or email exists
    const checkUser = await client.query('SELECT username FROM Usuario WHERE username = $1 OR email = $2', [usuario, correo]);
    if (checkUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Usuario o correo ya existe' });
    }

    // Insert Usuario
    await client.query('INSERT INTO Usuario (username, email, password) VALUES ($1, $2, $3)', [usuario, correo, contrasena]);

    // Insert Dependencia
    await client.query('INSERT INTO Dependencia_UCAB (abreviatura, nombre, tipo, username) VALUES ($1, $2, $3, $4)', 
      [abreviatura, nombre, tipoDB, usuario]);

    await client.query('COMMIT');
    res.json({ success: true, message: 'Registro de dependencia exitoso' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Register dependencia error:', err);
    res.status(500).json({ error: 'Error interno' });
  } finally {
    client.release();
  }
});

// Register Organizacion
app.post('/api/register/organizacion', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { nombre, rif, ciudad, pais, descripcion, sector, miembros, usuario, correo, contrasena } = req.body;

    // Check if username or email exists
    const checkUser = await client.query('SELECT username FROM Usuario WHERE username = $1 OR email = $2', [usuario, correo]);
    if (checkUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Usuario o correo ya existe' });
    }

    // Insert Usuario
    await client.query('INSERT INTO Usuario (username, email, password) VALUES ($1, $2, $3)', [usuario, correo, contrasena]);

    // Get or insert lugar
    const id_lugar = await getOrInsertLugar(client, ciudad, pais);

    // Insert Organizacion
    await client.query('INSERT INTO Organizacion_Asociada (RIF, nombre_organizacion, descripcion, sector, miembros, id_lugar, username) VALUES ($1, $2, $3, $4, $5, $6, $7)', 
      [parseInt(rif), nombre, descripcion || null, sector, miembros, id_lugar, usuario]);

    await client.query('COMMIT');
    res.json({ success: true, message: 'Registro de organización exitoso' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Register organizacion error:', err);
    res.status(500).json({ error: 'Error interno' });
  } finally {
    client.release();
  }
});

// Serve static frontend from root directory
app.use(express.static(path.join(__dirname)));

// Route for /login to serve src/login/index.html
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/login/index.html'));
});

// Start server after testing DB
(async function start() {
  await testDb();
  const server = app.listen(PORT, () => {
    const addr = server.address();
    let host = addr.address;
    if (host === '::' || host === '0.0.0.0') host = 'localhost';
    const protocol = process.env.HTTPS === 'true' ? 'https' : 'http';
    console.log(`Server listening at ${protocol}://${host}:${addr.port}`);
    console.log(`Server listening at ${protocol}://${host}:${addr.port}/login`);
  });
})();
