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

    // Verificar si el usuario está activo; si no, activarlo
    if (!user.activo) {
      await pool.query('UPDATE Usuario SET activo = true WHERE username = $1', [username]);
    }

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

    // Determinar role
    let role = 'persona'; // default
    const personaCheck = await pool.query('SELECT username FROM Persona WHERE username = $1', [username]);
    if (personaCheck.rows.length > 0) {
      role = 'persona';
    } else {
      const depCheck = await pool.query('SELECT username FROM Dependencia_UCAB WHERE username = $1', [username]);
      if (depCheck.rows.length > 0) {
        role = 'dependencia';
      } else {
        const orgCheck = await pool.query('SELECT username FROM Organizacion_Asociada WHERE username = $1', [username]);
        if (orgCheck.rows.length > 0) {
          role = 'organizacion';
        }
      }
    }

    // Verificar si es admin
    if (['adminAsier', 'adminEmiliany', 'adminJose'].includes(username)) {
      role = 'admin';
    }

    // Generar token JWT
    const token = jwt.sign({ username: user.username, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ message: 'Login exitoso', token, user: { username: user.username, email: user.email, role } });
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

        // Mapear sexo
        let dbSexo = sexo;
        if (sexo === 'f') dbSexo = 'F';
        else if (sexo === 'm') dbSexo = 'M';
        else dbSexo = 'O';

        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(contrasena, 10);

        await pool.query('INSERT INTO Usuario (username, email, password) VALUES ($1, $2, $3)', [usuario, correo, hashedPassword]);
        await pool.query('INSERT INTO Persona (cedula, nombre, apellido, fecha_nacimiento, sexo, biografia, username, id_lugar) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [cedula, nombre, apellido, fecha, dbSexo, bio, usuario, id_lugar]);
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

// MapaUCAB
app.get('/api/personas', async (req, res) => {
  try {
    const { q } = req.query;
    let query = `
      SELECT p.nombre, p.apellido, u.username, l.ciudad, l.pais
      FROM Persona p
      JOIN Usuario u ON p.username = u.username
      JOIN Lugar l ON p.id_lugar = l.id_lugar
      WHERE u.activo = true
    `;
    const params = [];
    if (q) {
      query += ` AND (u.username ILIKE $1 OR l.ciudad ILIKE $1 OR l.pais ILIKE $1)`;
      params.push(`%${q}%`);
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener personas' });
  }
});

// Buscador de Usuarios
app.get('/api/usuarios', async (req, res) => {
  try {
    const { q } = req.query;
    let query = `
      SELECT 'persona' as "tipo", u.username, CONCAT(p.nombre, ' ', p.apellido) as "displayName", l.ciudad, l.pais, NULL as "abreviatura", NULL as "sector"
      FROM Persona p
      JOIN Usuario u ON p.username = u.username
      LEFT JOIN Lugar l ON p.id_lugar = l.id_lugar
      WHERE u.activo = true
      UNION ALL
      SELECT 'dependencia' as "tipo", u.username, d.nombre as "displayName", NULL as ciudad, NULL as pais, d.abreviatura, d.tipo as "sector"
      FROM Dependencia_UCAB d
      JOIN Usuario u ON d.username = u.username
      WHERE u.activo = true
      UNION ALL
      SELECT 'organizacion' as "tipo", u.username, o.nombre_organizacion as "displayName", l.ciudad, l.pais, NULL as "abreviatura", o.sector
      FROM Organizacion_Asociada o
      JOIN Usuario u ON o.username = u.username
      LEFT JOIN Lugar l ON o.id_lugar = l.id_lugar
      WHERE u.activo = true
    `;
    const params = [];
    if (q) {
      query = `SELECT * FROM (${query}) AS usuarios WHERE username ILIKE $1 OR "displayName" ILIKE $1 OR ciudad ILIKE $1 OR pais ILIKE $1 OR "abreviatura" ILIKE $1 OR "sector" ILIKE $1`;
      params.push(`%${q}%`);
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
  console.log(`Servidor corriendo en http://localhost:${port}/login`);
});


// GET perfil del usuario autenticado
app.get('/api/profile', verifyToken, async (req, res) => {
  const { username } = req.user;

  try {
    // Obtener datos de Usuario
    const userResult = await pool.query('SELECT username, email FROM Usuario WHERE username = $1 AND activo = true', [username]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const user = userResult.rows[0];

    // Verificar si es Persona
    const personaResult = await pool.query(`
      SELECT p.cedula, p.nombre, p.apellido, p.fecha_nacimiento, p.sexo, p.biografia, l.ciudad, l.pais
      FROM Persona p
      JOIN Lugar l ON p.id_lugar = l.id_lugar
      WHERE p.username = $1
    `, [username]);

    if (personaResult.rows.length > 0) {
      const persona = personaResult.rows[0];
      return res.json({
        role: 'persona',
        general: {
          usuario: user.username,
          correo: user.email,
          ciudad: persona.ciudad,
          pais: persona.pais,
          bio: persona.biografia
        },
        persona: {
          nombre: persona.nombre,
          apellido: persona.apellido,
          cedula: persona.cedula,
          fechaNacimiento: persona.fecha_nacimiento ? persona.fecha_nacimiento.toISOString().split('T')[0] : '',
          sexo: persona.sexo === 'F' ? 'f' : persona.sexo === 'M' ? 'm' : ''
        }
      });
    }

    // Verificar si es Dependencia
    const depResult = await pool.query('SELECT abreviatura, nombre, tipo FROM Dependencia_UCAB WHERE username = $1', [username]);
    if (depResult.rows.length > 0) {
      const dep = depResult.rows[0];
      return res.json({
        role: 'dependencia',
        general: {
          usuario: user.username,
          correo: user.email
        },
        dependencia: {
          nombre: dep.nombre,
          abreviatura: dep.abreviatura,
          tipo: dep.tipo
        }
      });
    }

    // Verificar si es Organizacion
    const orgResult = await pool.query(`
      SELECT o.RIF, o.nombre_organizacion, o.descripcion, o.sector, o.miembros, l.ciudad, l.pais
      FROM Organizacion_Asociada o
      JOIN Lugar l ON o.id_lugar = l.id_lugar
      WHERE o.username = $1
    `, [username]);
    if (orgResult.rows.length > 0) {
      const org = orgResult.rows[0];
      return res.json({
        role: 'organizacion',
        general: {
          usuario: user.username,
          correo: user.email,
          ciudad: org.ciudad,
          pais: org.pais
        },
        organizacion: {
          nombre: org.nombre_organizacion,
          rif: org.rif,
          sector: org.sector,
          descripcion: org.descripcion,
          miembros: org.miembros
        }
      });
    }

    res.status(404).json({ error: 'Perfil no encontrado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

// PUT actualizar perfil
app.put('/api/profile', verifyToken, async (req, res) => {
  const { username } = req.user;
  const { general, persona, dependencia, organizacion } = req.body;

  try {
    // Actualizar Usuario
    if (general.correo) {
      await pool.query('UPDATE Usuario SET email = $1 WHERE username = $2', [general.correo, username]);
    }
    if (general.password) {
      const hashedPassword = await bcrypt.hash(general.password, 10);
      await pool.query('UPDATE Usuario SET password = $1 WHERE username = $2', [hashedPassword, username]);
    }

    // Actualizar según rol
    if (persona) {
      // Mapear sexo
      let sexo = persona.sexo;
      if (sexo === 'f') sexo = 'F';
      else if (sexo === 'm') sexo = 'M';
      else sexo = 'O';

      // Actualizar Lugar si ciudad/pais cambiaron
      let id_lugar = null;
      if (general.ciudad && general.pais) {
        let lugarResult = await pool.query('SELECT id_lugar FROM Lugar WHERE ciudad = $1 AND pais = $2', [general.ciudad, general.pais]);
        if (lugarResult.rows.length === 0) {
          lugarResult = await pool.query('INSERT INTO Lugar (ciudad, pais) VALUES ($1, $2) RETURNING id_lugar', [general.ciudad, general.pais]);
        }
        id_lugar = lugarResult.rows[0].id_lugar;
      }

      await pool.query(`
        UPDATE Persona SET
          nombre = $1, apellido = $2, fecha_nacimiento = NULLIF($3, '')::date, sexo = $4, biografia = $5, id_lugar = $6
        WHERE username = $7
      `, [persona.nombre, persona.apellido, persona.fechaNacimiento, sexo, general.bio, id_lugar, username]);
    } else if (dependencia) {
      await pool.query('UPDATE Dependencia_UCAB SET nombre = $1, tipo = $2 WHERE username = $3', [dependencia.nombre, dependencia.tipo, username]);
    } else if (organizacion) {
      // Actualizar Lugar
      let id_lugar = null;
      if (general.ciudad && general.pais) {
        let lugarResult = await pool.query('SELECT id_lugar FROM Lugar WHERE ciudad = $1 AND pais = $2', [general.ciudad, general.pais]);
        if (lugarResult.rows.length === 0) {
          lugarResult = await pool.query('INSERT INTO Lugar (ciudad, pais) VALUES ($1, $2) RETURNING id_lugar', [general.ciudad, general.pais]);
        }
        id_lugar = lugarResult.rows[0].id_lugar;
      }

      await pool.query(`
        UPDATE Organizacion_Asociada SET
          nombre_organizacion = $1, descripcion = $2, sector = $3, miembros = $4::int, id_lugar = $5
        WHERE username = $6
      `, [organizacion.nombre, organizacion.descripcion, organizacion.sector, organizacion.miembros, id_lugar, username]);
    }

    res.json({ message: 'Perfil actualizado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

// DELETE eliminar perfil (desactivar)
app.delete('/api/profile', verifyToken, async (req, res) => {
  const { username } = req.user;

  try {
    await pool.query('UPDATE Usuario SET activo = false WHERE username = $1', [username]);
    res.json({ message: 'Perfil eliminado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar perfil' });
  }
});

// Middleware para verificar admin
const verifyAdmin = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(403).json({ error: 'Token requerido' });

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Token inválido' });

    // Obtener role del usuario
    try {
      const userResult = await pool.query('SELECT username FROM Usuario WHERE username = $1 AND activo = true', [decoded.username]);
      if (userResult.rows.length === 0) return res.status(403).json({ error: 'Usuario no encontrado' });

      let role = 'persona';
      const personaCheck = await pool.query('SELECT username FROM Persona WHERE username = $1', [decoded.username]);
      if (personaCheck.rows.length > 0) {
        role = 'persona';
      } else {
        const depCheck = await pool.query('SELECT username FROM Dependencia_UCAB WHERE username = $1', [decoded.username]);
        if (depCheck.rows.length > 0) {
          role = 'dependencia';
        } else {
          const orgCheck = await pool.query('SELECT username FROM Organizacion_Asociada WHERE username = $1', [decoded.username]);
          if (orgCheck.rows.length > 0) {
            role = 'organizacion';
          }
        }
      }
      if (['adminAsier', 'adminEmiliany', 'adminJose'].includes(decoded.username)) {
        role = 'admin';
      }

      if (role !== 'admin') return res.status(403).json({ error: 'Acceso denegado: solo admin' });
      req.user = decoded;
      next();
    } catch (dbErr) {
      console.error(dbErr);
      res.status(500).json({ error: 'Error verificando permisos' });
    }
  });
};

// REPORTES DATA
app.get('/api/report-data/:id', verifyAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    let data = {};
    if (id === 'r1_total_usuarios') {
      const result = await pool.query(`
        SELECT 
          'Persona' as tipo_usuario, COUNT(*) as cantidad_registrada 
        FROM Persona 
        UNION ALL 
        SELECT 'Dependencia', COUNT(*) FROM Dependencia_UCAB 
        UNION ALL 
        SELECT 'Organizacion', COUNT(*) FROM Organizacion_Asociada
      `);
      const rows = result.rows;
      const total = rows.reduce((sum, r) => sum + parseInt(r.cantidad_registrada), 0);
      data = { rows, totalUsuarios: total };
    } else if (id === 'r3_total_grupos') {
      const result = await pool.query('SELECT tipo as tipo_de_grupo, COUNT(*) as cantidad FROM Grupo GROUP BY tipo');
      const rows = result.rows;
      const totalGrupos = rows.reduce((sum, r) => sum + parseInt(r.cantidad), 0);
      data = { rows, totalGrupos };
    } else if (id === 'r2_egresados_carrera_anio') {
      // Usando fecha_fin de Cursa como año de graduación
      const result = await pool.query(`
        SELECT c.nombre as carrera, EXTRACT(YEAR FROM cu.fecha_fin) as anio, COUNT(DISTINCT cu.cedula_persona) as cantidad
        FROM Carrera c
        LEFT JOIN Cursa cu ON c.codigo_carrera = cu.codigo_carrera
        WHERE cu.fecha_fin IS NOT NULL
        GROUP BY c.nombre, EXTRACT(YEAR FROM cu.fecha_fin)
        ORDER BY c.nombre, anio
      `);
      const rows = result.rows;
      const totalGeneral = rows.reduce((sum, r) => sum + parseInt(r.cantidad), 0);
      data = { rows, totalGeneral };
    } else if (id === 'r4_grupos_mayor_miembros') {
      // Tabla Es_Miembro en lugar de MiembrosGrupo
      const result = await pool.query(`
        SELECT g.nombre as nombre_grupo, g.tipo as tipo_grupo, COUNT(em.id_usuario) as miembros_activos
        FROM Grupo g
        LEFT JOIN Es_Miembro em ON g.id_grupo = em.id_grupo
        GROUP BY g.nombre, g.tipo
        ORDER BY miembros_activos DESC
        LIMIT 10
      `);
      const rows = result.rows;
      const totalMiembros = rows.reduce((sum, r) => sum + parseInt(r.miembros_activos), 0);
      data = { rows, totalMiembros };
    } else if (id === 'r5_eventos_mayor_asistencia') {
      // Tabla Asiste en lugar de AsistenciaEvento, asistencia por cedula_persona
      const result = await pool.query(`
        SELECT e.nombre_evento, u.username as organizador, COUNT(DISTINCT a.cedula_persona) as asistencia_registrada
        FROM Evento e
        LEFT JOIN Asiste a ON e.id_evento = a.id_evento
        LEFT JOIN Usuario u ON e.organizador_responsable = u.username
        GROUP BY e.nombre_evento, u.username
        ORDER BY asistencia_registrada DESC
        LIMIT 10
      `);
      const rows = result.rows;
      const totalAsistencia = rows.reduce((sum, r) => sum + parseInt(r.asistencia_registrada), 0);
      data = { rows, totalAsistencia };
    } else if (id === 'r6_eventos_por_mes') {
      // Campo fecha_evento en lugar de fecha
      const result = await pool.query(`
        SELECT EXTRACT(MONTH FROM fecha_evento) as mes, COUNT(*) as eventos_organizados
        FROM Evento
        GROUP BY EXTRACT(MONTH FROM fecha_evento)
        ORDER BY mes
      `);
      const rows = result.rows;
      const totalEventos = rows.reduce((sum, r) => sum + parseInt(r.eventos_organizados), 0);
      data = { rows, totalEventos };
    } else if (id === 'r7_usuarios_activos_mes') {
      // Usuarios registrados por mes
      const result = await pool.query(`
        SELECT EXTRACT(MONTH FROM fecha_registro) as mes, COUNT(*) as usuarios_activos
        FROM Usuario
        WHERE activo = true
        GROUP BY EXTRACT(MONTH FROM fecha_registro)
        ORDER BY mes
      `);
      const rows = result.rows;
      const totalUsuariosActivos = rows.reduce((sum, r) => sum + parseInt(r.usuarios_activos), 0);
      data = { rows, totalUsuariosActivos };
    } else if (id === 'r8_ranking_usuarios_publicaciones') {
      const result = await pool.query(`
        SELECT u.username as nombre_usuario, 
               CASE 
                 WHEN pe.username IS NOT NULL THEN 'Persona'
                 WHEN d.username IS NOT NULL THEN 'Dependencia'
                 WHEN o.username IS NOT NULL THEN 'Organizacion'
                 ELSE 'Admin'
               END as rol,
               COUNT(p.id_publicacion) as publicaciones_realizadas
        FROM Usuario u
        LEFT JOIN Publicacion p ON u.username = p.autor
        LEFT JOIN Persona pe ON u.username = pe.username
        LEFT JOIN Dependencia_UCAB d ON u.username = d.username
        LEFT JOIN Organizacion_Asociada o ON u.username = o.username
        GROUP BY u.username, pe.username, d.username, o.username
        ORDER BY publicaciones_realizadas DESC
        LIMIT 10
      `);
      const rows = result.rows;
      const totalPublicaciones = rows.reduce((sum, r) => sum + parseInt(r.publicaciones_realizadas), 0);
      data = { rows, totalPublicaciones };
    } else if (id === 'r9_publicaciones_mas_comentadas') {
      // Comentarios en JSONB, contar longitud del array
      const result = await pool.query(`
        SELECT p.contenido as titulo_publicacion, u.username as autor, COALESCE(array_length(p.comentarios, 1), 0) as comentarios_recibidos
        FROM Publicacion p
        LEFT JOIN Usuario u ON p.autor = u.username
        ORDER BY comentarios_recibidos DESC
        LIMIT 10
      `);
      const rows = result.rows;
      const totalComentarios = rows.reduce((sum, r) => sum + parseInt(r.comentarios_recibidos), 0);
      data = { rows, totalComentarios };
    } else {
      data = {};
    }
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error obteniendo data del reporte' });
  }
});

// ADMIN METRICS
app.get('/api/admin/metrics', verifyAdmin, async (req, res) => {
  try {
    const users = await pool.query('SELECT COUNT(*) as count FROM Usuario WHERE activo = true');
    const groups = await pool.query('SELECT COUNT(*) as count FROM Grupo');
    const events = await pool.query('SELECT COUNT(*) as count FROM Evento');
    const posts = await pool.query('SELECT COUNT(*) as count FROM Publicacion');
    res.json({
      users: users.rows[0].count,
      groups: groups.rows[0].count,
      events: events.rows[0].count,
      posts: posts.rows[0].count
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error obteniendo métricas' });
  }
});

// ADMIN LAST USERS
app.get('/api/admin/last-users', verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.username, u.email, 
             CASE 
               WHEN p.username IS NOT NULL THEN CONCAT(p.nombre, ' ', p.apellido)
               WHEN d.username IS NOT NULL THEN d.nombre
               WHEN o.username IS NOT NULL THEN o.nombre_organizacion
               ELSE u.username
             END as displayName,
             CASE 
               WHEN p.username IS NOT NULL THEN 'persona'
               WHEN d.username IS NOT NULL THEN 'dependencia'
               WHEN o.username IS NOT NULL THEN 'organizacion'
               ELSE 'persona'
             END as role
      FROM Usuario u
      LEFT JOIN Persona p ON u.username = p.username
      LEFT JOIN Dependencia_UCAB d ON u.username = d.username
      LEFT JOIN Organizacion_Asociada o ON u.username = o.username
      WHERE u.activo = true
      ORDER BY u.username DESC LIMIT 6
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error obteniendo últimos usuarios' });
  }
});

// ADMIN LAST GROUPS
app.get('/api/admin/last-groups', verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT nombre, tipo, estado FROM Grupo ORDER BY nombre DESC LIMIT 6');
    res.json(result.rows.map(g => ({ nombre: g.nombre, tipo: g.tipo, estado: g.estado })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error obteniendo últimos grupos' });
  }
});

// ADMIN USERS LIST
app.get('/api/admin/users', verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.username, u.email, 
             CASE 
               WHEN u.username IN ('adminAsier', 'adminEmiliany', 'adminJose') THEN 'admin'
               WHEN p.username IS NOT NULL THEN 'persona'
               WHEN d.username IS NOT NULL THEN 'dependencia'
               WHEN o.username IS NOT NULL THEN 'organizacion'
               ELSE 'persona'
             END as role
      FROM Usuario u
      LEFT JOIN Persona p ON u.username = p.username
      LEFT JOIN Dependencia_UCAB d ON u.username = d.username
      LEFT JOIN Organizacion_Asociada o ON u.username = o.username
      WHERE u.activo = true
      ORDER BY u.username
    `);
    res.json(result.rows.map(user => ({
      usuario: '@' + user.username,
      correo: user.email,
      role: user.role
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error obteniendo usuarios' });
  }
});

// DELETE USER (desactivar)
app.delete('/api/admin/users/:username', verifyAdmin, async (req, res) => {
  const { username } = req.params;
  try {
    await pool.query('UPDATE Usuario SET activo = false WHERE username = $1', [username]);
    res.json({ message: 'Usuario desactivado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error desactivando usuario' });
  }
});