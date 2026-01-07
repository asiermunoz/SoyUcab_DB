require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('../frontend')); // Servir archivos estáticos del frontend

// Configuración de la conexión a PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Verificar conexión a la base de datos
pool.on('connect', () => {
  console.log('Conectado a la base de datos PostgreSQL');
});

pool.on('error', (err) => {
  console.error('Error en la conexión a la base de datos:', err);
});

// Middleware para verificar JWT
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Bearer token
  if (!token) return res.status(403).json({ error: 'Token requerido' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Token inválido' });
    req.user = decoded;
    next();
  });
};


app.get('/', (req, res) => {
  res.send('¡Hola! El backend está funcionando.');
});

// TEST DB
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ message: 'Conexión exitosa a la DB', time: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al conectar con la base de datos' });
  }
});

// LOGIN
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }
  try {

    // Buscar usuario en la base de datos
    const result = await pool.query('SELECT username, email, password FROM Usuario WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = result.rows[0];

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      // Intentar comparación directa (para usuarios con contraseñas en texto plano)
      if (password === user.password) {
        // Re-hashear la contraseña para actualizar
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('UPDATE Usuario SET password = $1 WHERE username = $2', [hashedPassword, user.username]);
      } else {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }
    }

    // Generar token JWT
    const token = jwt.sign({ username: user.username, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ message: 'Login exitoso', token, user: { username: user.username, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// REGISTRO DE PERSONA
app.post('/api/register/persona', async (req, res) => {
    const { nombre, apellido, cedula, ciudad, pais, fecha, sexo, bio, usuario, correo, contrasena } = req.body;
    if (!usuario || !contrasena || !correo || !nombre || !apellido || !cedula || !ciudad || !pais) {
        return res.status(400).json({ error: 'Campos obligatorios faltan'});
    }
    /* console.log(nombre);
    console.log(apellido);
    console.log(correo);
    console.log(sexo);
    console.log(ciudad);
    console.log(pais); */

    try{
        const existingUser = await pool.query('SELECT username FROM Usuario WHERE username = $1 OR email = $2', [usuario, correo]);
        if (existingUser.rows.length > 0) {
        return res.status(409).json({ error: 'Usuario o correo ya existe' });
        }

        let lugarResult = await pool.query('SELECT id_lugar FROM Lugar WHERE ciudad = $1 AND pais = $2', [ciudad, pais]);
        if (lugarResult.rows.length === 0) {
        return res.status(400).json({ error: 'Lugar no reconocido. Ciudad y país deben existir en la base de datos.' });
        }
        let id_lugar = lugarResult.rows[0].id_lugar;
        console.log('id_lugar obtenido:', id_lugar);

        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(contrasena, 10);

        await pool.query('INSERT INTO Usuario (username, email, password) VALUES ($1, $2, $3)', [usuario, correo, hashedPassword]);
        await pool.query('INSERT INTO Persona (cedula, nombre, apellido, fecha_nacimiento, sexo, biografia, username, id_lugar) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [cedula, nombre, apellido, fecha, sexo, bio, usuario, id_lugar]);
        res.status(201).json({ message: 'Registro exitoso' });

    } catch(err){
        await pool.query('DELETE FROM Usuario WHERE username = $1', [usuario]);
        console.error(err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
})

// REGISTRO DEPENDENCIA
app.post('/api/register/dependencia', async (req, res) => {
  const { abreviatura, nombre, tipo, usuario, correo, contrasena } = req.body;

  if (! abreviatura || !tipo || !usuario || !contrasena || !correo || !nombre) {
    return res.status(400).json({ error: 'Campos obligatorios faltan' });
  }

  try {

    const existingUser = await pool.query('SELECT username FROM Usuario WHERE username = $1 OR email = $2', [usuario, correo]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Usuario o correo ya existe' });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(contrasena, 10);


    await pool.query('INSERT INTO Usuario (username, email, password) VALUES ($1, $2, $3)', [usuario, correo, hashedPassword]);

    await pool.query('INSERT INTO Dependencia_UCAB (abreviatura, nombre, tipo, username) VALUES ($1, $2, $3, $4)', [abreviatura, nombre, tipo, usuario]);

    res.status(201).json({ message: 'Registro exitoso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// REGISTRO ORGANIZACION
app.post('/api/register/organizacion', async (req, res) => {

  const { nombre, descripcion, usuario, correo, contrasena, rif, sector, miembros, ciudad, pais } = req.body;

  if (!usuario || !contrasena || !correo || !nombre || !rif || !sector || !ciudad || !pais || !miembros) {
    return res.status(400).json({ error: 'Campos obligatorios faltan' });
  }


  try {

    const existingUser = await pool.query('SELECT username FROM Usuario WHERE username = $1 OR email = $2', [usuario, correo]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Usuario o correo ya existe' });
    }

    let lugarResult = await pool.query('SELECT id_lugar FROM Lugar WHERE ciudad = $1 AND pais = $2', [ciudad, pais]);
        if (lugarResult.rows.length === 0) {
        return res.status(400).json({ error: 'Lugar no reconocido. Ciudad y país deben existir en la base de datos.' });
        }
        let id_lugar = lugarResult.rows[0].id_lugar;
        console.log('id_lugar obtenido:', id_lugar);

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(contrasena, 10);

    await pool.query('INSERT INTO Usuario (username, email, password) VALUES ($1, $2, $3)', [usuario, correo, hashedPassword]);
    await pool.query('INSERT INTO Organizacion_Asociada (RIF, nombre_organizacion, sector, miembros, id_lugar, username) VALUES ($1, $2, $3, $4, $5, $6)', [rif, nombre, sector, miembros, id_lugar, usuario]);

    res.status(201).json({ message: 'Registro exitoso' });

    } catch(err){
        await pool.query('DELETE FROM Usuario WHERE username = $1', [usuario]);
        console.error(err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});


// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
  console.log(`Servidor corriendo en http://localhost:${port}/login`);
});