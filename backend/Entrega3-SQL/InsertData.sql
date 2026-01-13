-- USUARIOS
INSERT INTO Usuario (username, email, password, fecha_registro, activo) VALUES

('juan_perez', 'juan.perez@correo.com', 'Clave123', '2024-01-10 08:00:00', TRUE),
('sofia_rodriguez', 'sofia.rod@correo.com', 'Clave123', '2024-01-11 09:00:00', TRUE),
('carlos_gonzalez', 'carlos.gon@correo.com', 'Clave123', '2024-01-12 10:00:00', TRUE),
('ana_martinez', 'ana.mar@correo.com', 'Clave123', '2024-01-13 11:00:00', TRUE),
('luis_torres', 'luis.tor@correo.com', 'Clave123', '2024-01-14 12:00:00', TRUE),

('admin_ingenieria', 'ingenieria@ucab.edu.ve', 'AdminInst1', '2023-01-01 08:00:00', TRUE),
('admin_humanidades', 'humanidades@ucab.edu.ve', 'AdminInst2', '2023-01-01 08:00:00', TRUE),
('admin_postgrado', 'postgrado@ucab.edu.ve', 'AdminInst3', '2023-01-01 08:00:00', TRUE),
('admin_identidad', 'dim@ucab.edu.ve', 'AdminInst4', '2023-01-01 08:00:00', TRUE),
('admin_investigacion', 'cic@ucab.edu.ve', 'AdminInst5', '2023-01-01 08:00:00', TRUE),

('org_aiesec', 'aiesec@org.com', 'OrgPass1', '2024-02-01 08:00:00', TRUE),
('org_debate', 'debate@ucab.edu.ve', 'OrgPass2', '2024-02-01 08:00:00', TRUE),
('org_techo', 'techo@ong.org', 'OrgPass3', '2024-02-01 08:00:00', TRUE),
('org_mun', 'mun@ucab.edu.ve', 'OrgPass4', '2024-02-01 08:00:00', TRUE),
('org_polar', 'fundacion@polar.com', 'OrgPass5', '2024-02-01 08:00:00', TRUE);

-- LUGARES
INSERT INTO Lugar (ciudad, pais) VALUES 
('Caracas', 'Venezuela'),
('Valencia', 'Venezuela'),
('Maracaibo', 'Venezuela'),
('Barquisimeto', 'Venezuela'),
('San Cristóbal', 'Venezuela'),
('Puerto Ordaz', 'Venezuela'),
('Margarita', 'Venezuela'),
('Madrid', 'España'),
('Barcelona', 'España'),
('Miami', 'Estados Unidos'),
('Orlando', 'Estados Unidos'),
('Bogotá', 'Colombia'),
('Medellín', 'Colombia'),
('Ciudad de Panamá', 'Panamá'),
('Santiago', 'Chile'),
('Buenos Aires', 'Argentina'),
('Lima', 'Perú'),
('Ciudad de México', 'México'),
('Lisboa', 'Portugal'),
('Londres', 'Reino Unido');

-- PERSONAS
INSERT INTO Persona (cedula, nombre, apellido, fecha_nacimiento, sexo, biografia, username, id_lugar) VALUES
(20000100, 'Juan', 'Perez', '2002-05-15', 'M', 'Estudiante apasionado por el fútbol.', 'juan_perez', 1),
(20000101, 'Sofia', 'Rodriguez', '2001-08-20', 'F', 'Amante de la lectura y el café.', 'sofia_rodriguez', 2),
(20000102, 'Carlos', 'Gonzalez', '2003-01-10', 'M', 'Músico en mis tiempos libres.', 'carlos_gonzalez', 1),
(20000103, 'Ana', 'Martinez', '2000-11-05', 'F', 'Voluntaria en organizaciones sociales.', 'ana_martinez', 3),
(20000104, 'Luis', 'Torres', '1999-07-30', 'M', 'Ingeniero en proceso. Gamer.', 'luis_torres', 4);


-- Dependencias UCAB
INSERT INTO Dependencia_UCAB (abreviatura, nombre, tipo, username) VALUES
('ING', 'Facultad de Ingeniería', 'Facultad', 'admin_ingenieria'),
('HUM', 'Facultad de Humanidades y Educación', 'Facultad', 'admin_humanidades'),
('POST', 'Dirección de Postgrado', 'Direccion', 'admin_postgrado'),
('DIM', 'Dirección de Identidad y Misión', 'Direccion', 'admin_identidad'),
('CIC', 'Centro de Investigación y Comunicación', 'Centro', 'admin_investigacion');

-- Organizaciones Asociadas
INSERT INTO Organizacion_Asociada (RIF, nombre_organizacion, descripcion, sector, miembros, id_lugar, username) VALUES
(100100100, 'AIESEC Venezuela', 'Organización de liderazgo joven.', 'Liderazgo', 150, 1, 'org_aiesec'),
(200200200, 'Club de Debate UCAB', 'Fomentando el pensamiento crítico.', 'Académico', 45, 1, 'org_debate'),
(300300300, 'Techo Venezuela', 'Voluntariado para superación de la pobreza.', 'ONG', 300, 2, 'org_techo'),
(400400400, 'WorldMUN UCAB', 'Delegación Modelo de Naciones Unidas.', 'Diplomacia', 60, 1, 'org_mun'),
(500500500, 'Fundación Empresas Polar', 'Apoyo al desarrollo comunitario.', 'Empresarial', 500, 1, 'org_polar');

-- ROLES
INSERT INTO Rol (nombre_cargo, descripcion) VALUES 
('Estudiante Pregrado', 'Alumno activo cursando una carrera de pregrado.'),
('Estudiante Postgrado', 'Alumno cursando especialización, maestría o doctorado.'),
('Profesor', 'Docente contratado o de planta.'),
('Egresado', 'Antiguo alumno que ha culminado sus estudios.'),
('Personal Administrativo', 'Personal de apoyo y gestión de la universidad.'),
('Personal Limpieza', 'Persona dedicada a la limpieza y mantenimiento de las instalaciones'),
('Investigador', 'Persona dedicada a proyectos de investigación en centros.');


-- CARRERAS
INSERT INTO Carrera (codigo_carrera, nombre, duracion_semestres, id_facultad) VALUES 

('ING-INF', 'Ingeniería Informática', 10, 'ING'),
('ING-CIV', 'Ingeniería Civil', 10, 'ING'),
('ING-IND', 'Ingeniería Industrial', 10, 'ING'),
('ING-TEL', 'Ingeniería de Telecomunicaciones', 10, 'ING'),


('COM-SOC', 'Comunicación Social', 8, 'HUM'),
('PSICOL', 'Psicología', 10, 'HUM'),
('LETRAS', 'Letras', 8, 'HUM'),
('EDUC', 'Educación', 8, 'HUM'),

('MAE-SIS', 'Maestría en Sistemas de Información', 4, 'POST'),
('ESP-DDHH', 'Especialización en Derechos Humanos', 3, 'POST');


-- NEXOS
INSERT INTO Nexo (usuario_solicitante, usuario_solicitado, tipo, estado, fecha_solicitud) VALUES

('juan_perez', 'admin_ingenieria', 'tipificada', 'aceptada', '2024-01-15 08:30:00'),
('luis_torres', 'admin_ingenieria', 'tipificada', 'aceptada', '2024-01-15 09:00:00'),
('carlos_gonzalez', 'admin_ingenieria', 'tipificada', 'aceptada', '2024-01-16 10:15:00'),

('sofia_rodriguez', 'admin_humanidades', 'tipificada', 'aceptada', '2024-01-15 11:00:00'),
('ana_martinez', 'admin_humanidades', 'tipificada', 'aceptada', '2024-01-17 14:20:00'),

('juan_perez', 'org_aiesec', 'tipificada', 'aceptada', '2024-02-01 09:00:00'),
('ana_martinez', 'org_mun', 'tipificada', 'aceptada', '2024-02-05 16:45:00'),

('sofia_rodriguez', 'org_mun', 'tipificada', 'pendiente', '2024-03-10 10:00:00'), 

('juan_perez', 'sofia_rodriguez', 'simetrica', 'aceptada', '2024-01-20 18:00:00'),
('sofia_rodriguez', 'juan_perez', 'simetrica', 'aceptada', '2024-01-20 18:05:00'),

('luis_torres', 'ana_martinez', 'simetrica', 'aceptada', '2024-02-14 09:00:00'),
('ana_martinez', 'luis_torres', 'simetrica', 'aceptada', '2024-02-14 09:10:00'),

('carlos_gonzalez', 'juan_perez', 'simetrica', 'aceptada', '2024-01-25 12:00:00'),
('juan_perez', 'carlos_gonzalez', 'simetrica', 'aceptada', '2024-01-25 12:30:00'),

('ana_martinez', 'carlos_gonzalez', 'asimetrica', 'aceptada', '2024-03-01 15:00:00'),
('luis_torres', 'sofia_rodriguez', 'asimetrica', 'aceptada', '2024-02-28 20:00:00'),
('carlos_gonzalez', 'sofia_rodriguez', 'asimetrica', 'pendiente', '2024-03-12 08:00:00'),
('juan_perez', 'ana_martinez', 'asimetrica', 'aceptada', '2024-03-05 13:00:00'),
('sofia_rodriguez', 'carlos_gonzalez', 'asimetrica', 'rechazada', '2024-02-10 22:00:00');

-- EVENTOS
INSERT INTO Evento (nombre_evento, descripcion, fecha_evento, fecha_fin, lugar_fisico, direccion, estado, categoria, organizador_responsable) VALUES 

('Feria de Proyectos de Ingeniería 2024', 'Exhibición anual de prototipos y software.', 
 '2024-01-15 08:00:00', '2024-01-15 16:00:00', 
 'Edificio de Laboratorios', 'Piso 3, UCAB Montalbán', 
 'Finalizado', 'Académico', 'admin_ingenieria'),

('Cine Foro: Cine Venezolano', 'Proyección y debate sobre películas nacionales.', 
 '2025-06-20 14:00:00', '2025-06-20 18:00:00', 
 'Auditorio Hermano Lanz', 'PB, Módulo 2', 
 'En espera', 'Cultural', 'admin_humanidades'),

('Jornada de Construcción', 'Voluntariado en comunidades aledañas.', 
 '2024-02-10 07:00:00', '2024-02-11 17:00:00', 
 'La Vega', 'Punto de encuentro: Entrada Principal', 
 'Finalizado', 'Voluntariado', 'org_techo'),

('Global Village', 'Feria cultural de intercambio internacional.', 
 CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '4 hours', 
 'Feria de Comida', 'Plaza Central', 
 'En Curso', 'Social', 'org_aiesec'),

('Torneo Interuniversitario de Debate', 'Competencia regional de debate parlamentario.', 
 '2025-05-15 09:00:00', '2025-05-17 18:00:00', 
 'Aula Magna', 'Edificio Cincuentenario', 
 'En espera', 'Académico', 'org_debate'),

('Misa de Inicio de Semestre', 'Eucaristía de bienvenida.', 
 '2024-03-01 11:00:00', '2024-03-01 12:30:00', 
 'Parroquia María Trono de la Sabiduría', 'Campus UCAB', 
 'Finalizado', 'Institucional', 'admin_identidad'),

('Torneo Relámpago de Futbolito', 'Torneo amistoso pro-fondos de graduación.', 
 '2025-04-10 12:00:00', '2025-04-10 18:00:00', 
 'Canchas de Futbolito', 'Polideportivo', 
 'En espera', 'Deportivo', 'juan_perez');

-- ASISTENCIA
INSERT INTO Asiste (cedula_persona, id_evento, fecha_inscripcion, check_in) VALUES 

(20000104, 1, '2024-01-10 10:00:00', TRUE), 
(20000102, 1, '2024-01-11 11:00:00', TRUE), 

(20000101, 2, '2024-03-01 09:00:00', TRUE), 
(20000103, 2, '2024-03-02 14:00:00', TRUE), 

(20000103, 3, '2024-02-01 08:00:00', TRUE), 
(20000100, 3, '2024-02-01 09:30:00', TRUE), 

(20000100, 4, CURRENT_TIMESTAMP - INTERVAL '1 hour', TRUE),
(20000101, 4, CURRENT_TIMESTAMP - INTERVAL '30 minutes', TRUE),
(20000102, 4, CURRENT_TIMESTAMP - INTERVAL '10 minutes', TRUE),

(20000100, 7, '2024-03-05 10:00:00', TRUE),
(20000104, 7, '2024-03-05 11:00:00', TRUE);

--CURSA
INSERT INTO Cursa (cedula_persona, codigo_carrera, fecha_inicio) VALUES

(20000100, 'ING-INF', '2020-09-15'),
(20000101, 'LETRAS', '2021-09-20'),
(20000102, 'ING-IND', '2022-03-01'),
(20000104, 'ING-CIV', '2019-09-15'),
(20000104, 'ING-INF', '2021-09-15'); 

-- DESEMPEÑA
INSERT INTO Desempena (cedula_persona, id_rol) VALUES 

(20000100, 1),
(20000101, 1),
(20000101, 5),
(20000102, 1),
(20000103, 6),
(20000104, 1),
(20000104, 3);

-- GRUPOS
INSERT INTO Grupo (nombre, descripcion, creador_username, fecha_creacion) VALUES

('Estudiantes Ingeniería Informática', 'Grupo de apoyo para materias de la carrera.', 'admin_ingenieria', '2024-01-20 10:00:00'),
('Club de Lectura UCAB', 'Compartimos libros y café.', 'admin_humanidades', '2024-02-01 15:00:00'),
('Noticias Facultad de Ingeniería', 'Canal oficial de información.', 'admin_ingenieria', '2023-09-01 08:00:00'),
('Gamers UCAB', 'Torneos de LoL, Valorant y FIFA.', 'admin_ingenieria', '2024-03-10 18:00:00'),
('Voluntariado Global', 'Oportunidades de intercambio.', 'org_aiesec', '2024-01-15 09:00:00');


-- SON MIEMBROS de grupo
INSERT INTO Es_Miembro (id_grupo, id_usuario, fecha_ingreso) VALUES

(1, 'admin_ingenieria', '2024-01-20 9:00:00'),
(1, 'juan_perez', '2024-01-20 10:00:00'),
(1, 'carlos_gonzalez', '2024-01-21 09:00:00'),
(1, 'luis_torres', '2024-01-22 11:00:00'),

(2, 'admin_humanidades', '2024-02-01 13:00:00'),
(2, 'sofia_rodriguez', '2024-02-01 15:00:00'),
(2, 'ana_martinez', '2024-02-02 10:00:00'),
(2, 'juan_perez', '2024-02-05 16:00:00'),

(3, 'admin_ingenieria', '2023-09-01 08:00:00'),
(3, 'juan_perez', '2023-09-02 09:00:00'),
(3, 'carlos_gonzalez', '2023-09-02 09:00:00'),
(3, 'luis_torres', '2023-09-02 09:00:00'),

(4, 'admin_ingenieria', '2024-03-10 15:00:00'),
(4, 'luis_torres', '2024-03-10 18:00:00'),
(4, 'carlos_gonzalez', '2024-03-11 20:00:00'),

(5, 'org_aiesec', '2024-01-15 09:00:00'),
(5, 'ana_martinez', '2024-01-16 10:00:00'), 
(5, 'sofia_rodriguez', '2024-01-18 12:00:00');


-- MENSAJE
INSERT INTO Mensaje (contenido, fecha_envio, emisor, id_grupo_destino) VALUES

('Bienvenidos al grupo de estudio, muchachos.', '2024-01-20 10:05:00', 'juan_perez', 1),
('¿Alguien tiene la guía de cálculo?', '2024-01-21 09:30:00', 'carlos_gonzalez', 1),
('Yo la tengo, te la paso al correo.', '2024-01-21 09:45:00', 'luis_torres', 1),


('Recordatorio: Las inscripciones cierran el viernes.', '2024-02-15 08:00:00', 'admin_ingenieria', 3),

('¿Sale torneo de FIFA hoy?', '2024-03-11 21:00:00', 'carlos_gonzalez', 4),

('Hola Sofía, ¿me recomiendas un libro?', '2024-02-06 14:00:00', 'juan_perez', 2),
('¡Claro Juan! Lee "Cien Años de Soledad".', '2024-02-06 14:10:00', 'sofia_rodriguez', 2);

-- PUBLICACIONES
INSERT INTO Publicacion (autor, id_grupo, url_multimedia, fecha_publicacion, likes, comentarios) VALUES


('admin_ingenieria', 3, 'https://ucab.edu.ve/img/calendario2024.jpg', '2024-01-25 09:00:00', 45, 
 '[
    {"autor": "juan_perez", "contenido": "Gracias por la info", "fecha": "2024-01-25 09:10:00"},
    {"autor": "luis_torres", "contenido": "¿Esto aplica para tesistas?", "fecha": "2024-01-25 09:30:00"},
    {"autor": "sofia_rodriguez", "contenido": "Compartido!", "fecha": "2024-01-25 10:00:00"}
 ]'::JSONB),


('admin_humanidades', 2, 'https://ucab.edu.ve/img/feria_libro.jpg', '2024-02-02 14:00:00', 30, 
 '[
    {"autor": "sofia_rodriguez", "contenido": "¡Qué emoción! Ahí estaré.", "fecha": "2024-02-02 14:05:00"},
    {"autor": "ana_martinez", "contenido": "¿Venderán libros usados?", "fecha": "2024-02-02 14:20:00"},
    {"autor": "carlos_gonzalez", "contenido": "Intentaré pasar después de clases.", "fecha": "2024-02-02 15:00:00"}
 ]'::JSONB),


('org_aiesec', 5, 'https://aiesec.org/img/brazil_project.jpg', '2024-01-16 10:00:00', 120, 
 '[
    {"autor": "ana_martinez", "contenido": "Ya envié mi postulación.", "fecha": "2024-01-16 10:15:00"},
    {"autor": "juan_perez", "contenido": "¿Cubre pasajes?", "fecha": "2024-01-16 11:00:00"},
    {"autor": "luis_torres", "contenido": "Increíble oportunidad.", "fecha": "2024-01-16 12:00:00"}
 ]'::JSONB),


('admin_ingenieria', 4, 'https://ucab.edu.ve/img/torneo_lol.jpg', '2024-03-10 16:00:00', 80, 
 '[
    {"autor": "luis_torres", "contenido": "Busco equipo, soy Jungla.", "fecha": "2024-03-10 16:05:00"},
    {"autor": "carlos_gonzalez", "contenido": "Voy mid.", "fecha": "2024-03-10 16:10:00"},
    {"autor": "juan_perez", "contenido": "¿Premios en metálico?", "fecha": "2024-03-10 16:30:00"}
 ]'::JSONB),


('admin_ingenieria', 1, NULL, '2024-01-22 08:00:00', 15, 
 '[
    {"autor": "carlos_gonzalez", "contenido": "¿Alguien sabe qué aula es?", "fecha": "2024-01-22 08:15:00"},
    {"autor": "juan_perez", "contenido": "Creo que en el laboratorio 2.", "fecha": "2024-01-22 08:20:00"},
    {"autor": "luis_torres", "contenido": "Confirmado, lab 2.", "fecha": "2024-01-22 08:25:00"}
 ]'::JSONB),


('org_aiesec', 5, 'https://aiesec.org/img/global_village.jpg', '2024-02-15 09:00:00', 60, 
 '[
    {"autor": "sofia_rodriguez", "contenido": "Llevaré comida típica.", "fecha": "2024-02-15 09:10:00"},
    {"autor": "ana_martinez", "contenido": "¿A qué hora empieza?", "fecha": "2024-02-15 09:30:00"},
    {"autor": "juan_perez", "contenido": "Nos vemos allá.", "fecha": "2024-02-15 10:00:00"}
 ]'::JSONB),


('admin_humanidades', 2, NULL, '2024-02-10 11:00:00', 25, 
 '[
    {"autor": "ana_martinez", "contenido": "Voto por Realismo Mágico.", "fecha": "2024-02-10 11:05:00"},
    {"autor": "carlos_gonzalez", "contenido": "Prefiero Ciencia Ficción.", "fecha": "2024-02-10 11:20:00"},
    {"autor": "luis_torres", "contenido": "Apoyo Ciencia Ficción.", "fecha": "2024-02-10 11:45:00"}
 ]'::JSONB),


('admin_ingenieria', 3, 'https://ucab.edu.ve/img/aviso.png', '2024-02-28 08:00:00', 10, 
 '[
    {"autor": "juan_perez", "contenido": "Entendido.", "fecha": "2024-02-28 08:30:00"},
    {"autor": "luis_torres", "contenido": "Ojalá arreglen el aire del piso 2.", "fecha": "2024-02-28 09:00:00"},
    {"autor": "carlos_gonzalez", "contenido": "Gracias por avisar.", "fecha": "2024-02-28 09:15:00"}
 ]'::JSONB),


('admin_ingenieria', 4, 'https://ucab.edu.ve/img/fifa24.jpg', '2024-03-12 14:00:00', 55, 
 '[
    {"autor": "juan_perez", "contenido": "Reto a cualquiera.", "fecha": "2024-03-12 14:10:00"},
    {"autor": "carlos_gonzalez", "contenido": "Acepto el reto.", "fecha": "2024-03-12 14:15:00"},
    {"autor": "luis_torres", "contenido": "Preparen los controles.", "fecha": "2024-03-12 14:30:00"}
 ]'::JSONB),


('org_aiesec', 5, NULL, '2024-03-01 10:00:00', 40, 
 '[
    {"autor": "ana_martinez", "contenido": "Excelente ponente.", "fecha": "2024-03-01 10:30:00"},
    {"autor": "sofia_rodriguez", "contenido": "Muy inspirador.", "fecha": "2024-03-01 11:00:00"},
    {"autor": "luis_torres", "contenido": "¿Quedó grabado?", "fecha": "2024-03-01 12:00:00"}
 ]'::JSONB),


('admin_humanidades', 2, NULL, '2024-02-14 09:00:00', 90, 
 '[
    {"autor": "sofia_rodriguez", "contenido": "Hermoso poema.", "fecha": "2024-02-14 09:15:00"},
    {"autor": "juan_perez", "contenido": "Feliz día a todos.", "fecha": "2024-02-14 09:30:00"},
    {"autor": "ana_martinez", "contenido": "<3", "fecha": "2024-02-14 10:00:00"}
 ]'::JSONB),


('admin_ingenieria', 3, 'https://ucab.edu.ve/img/horario.pdf', '2024-03-05 08:00:00', 20, 
 '[
    {"autor": "carlos_gonzalez", "contenido": "¿Abren los sábados?", "fecha": "2024-03-05 08:10:00"},
    {"autor": "luis_torres", "contenido": "No veo el link.", "fecha": "2024-03-05 08:20:00"},
    {"autor": "admin_ingenieria", "contenido": "Ya se actualizó.", "fecha": "2024-03-05 08:25:00"}, 
    {"autor": "juan_perez", "contenido": "Gracias.", "fecha": "2024-03-05 08:30:00"} 
 ]'::JSONB), 


('admin_ingenieria', 1, NULL, '2024-02-20 15:00:00', 35, 
 '[
    {"autor": "ana_martinez", "contenido": "Yo puedo ayudar.", "fecha": "2024-02-20 15:15:00"},
    {"autor": "sofia_rodriguez", "contenido": "Cuenten conmigo.", "fecha": "2024-02-20 15:30:00"},
    {"autor": "juan_perez", "contenido": "¿Dónde llevamos los donativos?", "fecha": "2024-02-20 16:00:00"}
 ]'::JSONB),


('org_aiesec', 5, 'https://aiesec.org/img/bye.jpg', '2024-03-20 18:00:00', 200, 
 '[
    {"autor": "luis_torres", "contenido": "Buen viaje chicos.", "fecha": "2024-03-20 18:10:00"},
    {"autor": "ana_martinez", "contenido": "Éxitos.", "fecha": "2024-03-20 18:20:00"},
    {"autor": "carlos_gonzalez", "contenido": "Traigan alfajores.", "fecha": "2024-03-20 19:00:00"}
 ]'::JSONB),


('admin_humanidades', 2, NULL, '2024-03-08 10:00:00', 40, 
 '[
    {"autor": "sofia_rodriguez", "contenido": "No me gustó el final.", "fecha": "2024-03-08 10:15:00"},
    {"autor": "ana_martinez", "contenido": "A mi me encantó.", "fecha": "2024-03-08 10:30:00"},
    {"autor": "juan_perez", "contenido": "Sin spoilers por favor.", "fecha": "2024-03-08 11:00:00"}
 ]'::JSONB),


('admin_ingenieria', 3, 'https://ucab.edu.ve/img/becas.jpg', '2024-01-30 09:00:00', 150, 
 '[
    {"autor": "carlos_gonzalez", "contenido": "¿Promedio mínimo?", "fecha": "2024-01-30 09:30:00"},
    {"autor": "luis_torres", "contenido": "16 puntos.", "fecha": "2024-01-30 09:45:00"},
    {"autor": "ana_martinez", "contenido": "Gracias por el dato.", "fecha": "2024-01-30 10:00:00"}
 ]'::JSONB),


('admin_ingenieria', 4, 'https://youtube.com/link', '2024-03-15 20:00:00', 50, 
 '[
    {"autor": "luis_torres", "contenido": "Qué locura de tiempo.", "fecha": "2024-03-15 20:10:00"},
    {"autor": "juan_perez", "contenido": "Yo tardo 50 horas.", "fecha": "2024-03-15 20:20:00"},
    {"autor": "carlos_gonzalez", "contenido": "GG.", "fecha": "2024-03-15 20:30:00"}
 ]'::JSONB),


('org_aiesec', 5, NULL, '2024-02-12 16:00:00', 70, 
 '[
    {"autor": "sofia_rodriguez", "contenido": "Muy útil.", "fecha": "2024-02-12 16:15:00"},
    {"autor": "ana_martinez", "contenido": "Aprendí a usar LinkedIn.", "fecha": "2024-02-12 16:30:00"},
    {"autor": "carlos_gonzalez", "contenido": "¿Mandan las diapositivas?", "fecha": "2024-02-12 17:00:00"}
 ]'::JSONB),


('admin_ingenieria', 1, 'https://amazon.com/calc', '2024-01-28 11:00:00', 10, 
 '[
    {"autor": "juan_perez", "contenido": "Vendo una barata.", "fecha": "2024-01-28 11:10:00"},
    {"autor": "luis_torres", "contenido": "¿Modelo?", "fecha": "2024-01-28 11:15:00"},
    {"autor": "carlos_gonzalez", "contenido": "Yo también busco.", "fecha": "2024-01-28 11:30:00"}
 ]'::JSONB),


('admin_humanidades', 2, NULL, '2024-03-05 13:00:00', 33, 
 '[
    {"autor": "sofia_rodriguez", "contenido": "El libro siempre es mejor.", "fecha": "2024-03-05 13:10:00"},
    {"autor": "ana_martinez", "contenido": "Depende de la adaptación.", "fecha": "2024-03-05 13:20:00"},
    {"autor": "luis_torres", "contenido": "Dune es la excepción.", "fecha": "2024-03-05 13:40:00"}
 ]'::JSONB);

-- NOTIFICACIONES
INSERT INTO Notificacion (usuario_emisor, usuario_receptor, contenido, fecha, tipo) VALUES


('juan_perez', 'admin_ingenieria', 'Te ha enviado una solicitud de nexo tipificada', '2024-01-15 08:30:00', 'relacion'),
('admin_ingenieria', 'juan_perez', 'Ha aceptado tu solicitud de nexo tipificada', '2024-01-15 08:30:00', 'relacion'),


('luis_torres', 'admin_ingenieria', 'Te ha enviado una solicitud de nexo tipificada', '2024-01-15 09:00:00', 'relacion'),
('admin_ingenieria', 'luis_torres', 'Ha aceptado tu solicitud de nexo tipificada', '2024-01-15 09:00:00', 'relacion'),


('carlos_gonzalez', 'admin_ingenieria', 'Te ha enviado una solicitud de nexo tipificada', '2024-01-16 10:15:00', 'relacion'),
('admin_ingenieria', 'carlos_gonzalez', 'Ha aceptado tu solicitud de nexo tipificada', '2024-01-16 10:15:00', 'relacion'),


('sofia_rodriguez', 'admin_humanidades', 'Te ha enviado una solicitud de nexo tipificada', '2024-01-15 11:00:00', 'relacion'),
('admin_humanidades', 'sofia_rodriguez', 'Ha aceptado tu solicitud de nexo tipificada', '2024-01-15 11:00:00', 'relacion'),


('ana_martinez', 'admin_humanidades', 'Te ha enviado una solicitud de nexo tipificada', '2024-01-17 14:20:00', 'relacion'),
('admin_humanidades', 'ana_martinez', 'Ha aceptado tu solicitud de nexo tipificada', '2024-01-17 14:20:00', 'relacion'),


('juan_perez', 'org_aiesec', 'Te ha enviado una solicitud de nexo tipificada', '2024-02-01 09:00:00', 'relacion'),
('org_aiesec', 'juan_perez', 'Ha aceptado tu solicitud de nexo tipificada', '2024-02-01 09:00:00', 'relacion'),


('ana_martinez', 'org_mun', 'Te ha enviado una solicitud de nexo tipificada', '2024-02-05 16:45:00', 'relacion'),
('org_mun', 'ana_martinez', 'Ha aceptado tu solicitud de nexo tipificada', '2024-02-05 16:45:00', 'relacion'),


('sofia_rodriguez', 'org_mun', 'Te ha enviado una solicitud de nexo tipificada', '2024-03-10 10:00:00', 'relacion'),


('juan_perez', 'sofia_rodriguez', 'Te ha enviado una solicitud de nexo simetrica', '2024-01-20 18:00:00', 'relacion'),
('sofia_rodriguez', 'juan_perez', 'Ha aceptado tu solicitud de nexo simetrica', '2024-01-20 18:00:00', 'relacion'),


('sofia_rodriguez', 'juan_perez', 'Te ha enviado una solicitud de nexo simetrica', '2024-01-20 18:05:00', 'relacion'),
('juan_perez', 'sofia_rodriguez', 'Ha aceptado tu solicitud de nexo simetrica', '2024-01-20 18:05:00', 'relacion'),


('luis_torres', 'ana_martinez', 'Te ha enviado una solicitud de nexo simetrica', '2024-02-14 09:00:00', 'relacion'),
('ana_martinez', 'luis_torres', 'Ha aceptado tu solicitud de nexo simetrica', '2024-02-14 09:00:00', 'relacion'),


('ana_martinez', 'luis_torres', 'Te ha enviado una solicitud de nexo simetrica', '2024-02-14 09:10:00', 'relacion'),
('luis_torres', 'ana_martinez', 'Ha aceptado tu solicitud de nexo simetrica', '2024-02-14 09:10:00', 'relacion'),


('carlos_gonzalez', 'juan_perez', 'Te ha enviado una solicitud de nexo simetrica', '2024-01-25 12:00:00', 'relacion'),
('juan_perez', 'carlos_gonzalez', 'Ha aceptado tu solicitud de nexo simetrica', '2024-01-25 12:00:00', 'relacion'),


('juan_perez', 'carlos_gonzalez', 'Te ha enviado una solicitud de nexo simetrica', '2024-01-25 12:30:00', 'relacion'),
('carlos_gonzalez', 'juan_perez', 'Ha aceptado tu solicitud de nexo simetrica', '2024-01-25 12:30:00', 'relacion'),


('ana_martinez', 'carlos_gonzalez', 'Te ha enviado una solicitud de nexo asimetrica', '2024-03-01 15:00:00', 'relacion'),
('carlos_gonzalez', 'ana_martinez', 'Ha aceptado tu solicitud de nexo asimetrica', '2024-03-01 15:00:00', 'relacion'),


('luis_torres', 'sofia_rodriguez', 'Te ha enviado una solicitud de nexo asimetrica', '2024-02-28 20:00:00', 'relacion'),
('sofia_rodriguez', 'luis_torres', 'Ha aceptado tu solicitud de nexo asimetrica', '2024-02-28 20:00:00', 'relacion'),


('carlos_gonzalez', 'sofia_rodriguez', 'Te ha enviado una solicitud de nexo asimetrica', '2024-03-12 08:00:00', 'relacion'),


('juan_perez', 'ana_martinez', 'Te ha enviado una solicitud de nexo asimetrica', '2024-03-05 13:00:00', 'relacion'),
('ana_martinez', 'juan_perez', 'Ha aceptado tu solicitud de nexo asimetrica', '2024-03-05 13:00:00', 'relacion'),


('sofia_rodriguez', 'carlos_gonzalez', 'Te ha enviado una solicitud de nexo asimetrica', '2024-02-10 22:00:00', 'relacion'),



('juan_perez', 'admin_ingenieria', 'Ha comentado tu publicación', '2024-01-25 09:10:00', 'comentario'),
('luis_torres', 'admin_ingenieria', 'Ha comentado tu publicación', '2024-01-25 09:30:00', 'comentario'),
('sofia_rodriguez', 'admin_ingenieria', 'Ha comentado tu publicación', '2024-01-25 10:00:00', 'comentario'),


('sofia_rodriguez', 'admin_humanidades', 'Ha comentado tu publicación', '2024-02-02 14:05:00', 'comentario'),
('ana_martinez', 'admin_humanidades', 'Ha comentado tu publicación', '2024-02-02 14:20:00', 'comentario'),
('carlos_gonzalez', 'admin_humanidades', 'Ha comentado tu publicación', '2024-02-02 15:00:00', 'comentario'),


('ana_martinez', 'org_aiesec', 'Ha comentado tu publicación', '2024-01-16 10:15:00', 'comentario'),
('juan_perez', 'org_aiesec', 'Ha comentado tu publicación', '2024-01-16 11:00:00', 'comentario'),
('luis_torres', 'org_aiesec', 'Ha comentado tu publicación', '2024-01-16 12:00:00', 'comentario'),


('luis_torres', 'admin_ingenieria', 'Ha comentado tu publicación', '2024-03-10 16:05:00', 'comentario'),
('carlos_gonzalez', 'admin_ingenieria', 'Ha comentado tu publicación', '2024-03-10 16:10:00', 'comentario'),
('juan_perez', 'admin_ingenieria', 'Ha comentado tu publicación', '2024-03-10 16:30:00', 'comentario'),


('carlos_gonzalez', 'admin_ingenieria', 'Ha comentado tu publicación', '2024-01-22 08:15:00', 'comentario'),
('juan_perez', 'admin_ingenieria', 'Ha comentado tu publicación', '2024-01-22 08:20:00', 'comentario'),
('luis_torres', 'admin_ingenieria', 'Ha comentado tu publicación', '2024-01-22 08:25:00', 'comentario'),


('sofia_rodriguez', 'org_aiesec', 'Ha comentado tu publicación', '2024-02-15 09:10:00', 'comentario'),
('ana_martinez', 'org_aiesec', 'Ha comentado tu publicación', '2024-02-15 09:30:00', 'comentario'),
('juan_perez', 'org_aiesec', 'Ha comentado tu publicación', '2024-02-15 10:00:00', 'comentario'),


('ana_martinez', 'admin_humanidades', 'Ha comentado tu publicación', '2024-02-10 11:05:00', 'comentario'),
('carlos_gonzalez', 'admin_humanidades', 'Ha comentado tu publicación', '2024-02-10 11:20:00', 'comentario'),
('luis_torres', 'admin_humanidades', 'Ha comentado tu publicación', '2024-02-10 11:45:00', 'comentario'),


('juan_perez', 'admin_ingenieria', 'Ha comentado tu publicación', '2024-02-28 08:30:00', 'comentario'),
('luis_torres', 'admin_ingenieria', 'Ha comentado tu publicación', '2024-02-28 09:00:00', 'comentario'),
('carlos_gonzalez', 'admin_ingenieria', 'Ha comentado tu publicación', '2024-02-28 09:15:00', 'comentario'),


('juan_perez', 'admin_ingenieria', 'Ha comentado tu publicación', '2024-03-12 14:10:00', 'comentario'),
('carlos_gonzalez', 'admin_ingenieria', 'Ha comentado tu publicación', '2024-03-12 14:15:00', 'comentario'),
('luis_torres', 'admin_ingenieria', 'Ha comentado tu publicación', '2024-03-12 14:30:00', 'comentario'),


('ana_martinez', 'org_aiesec', 'Ha comentado tu publicación', '2024-03-01 10:30:00', 'comentario'),
('sofia_rodriguez', 'org_aiesec', 'Ha comentado tu publicación', '2024-03-01 11:00:00', 'comentario'),
('luis_torres', 'org_aiesec', 'Ha comentado tu publicación', '2024-03-01 12:00:00', 'comentario'),


('sofia_rodriguez', 'admin_humanidades', 'Ha comentado tu publicación', '2024-02-14 09:15:00', 'comentario'),
('juan_perez', 'admin_humanidades', 'Ha comentado tu publicación', '2024-02-14 09:30:00', 'comentario'),
('ana_martinez', 'admin_humanidades', 'Ha comentado tu publicación', '2024-02-14 10:00:00', 'comentario'),


('carlos_gonzalez', 'admin_ingenieria', 'Ha comentado tu publicación', '2024-03-05 08:10:00', 'comentario'),
('luis_torres', 'admin_ingenieria', 'Ha comentado tu publicación', '2024-03-05 08:20:00', 'comentario'),
('juan_perez', 'admin_ingenieria', 'Ha comentado tu publicación', '2024-03-05 08:30:00', 'comentario'),


('ana_martinez', 'admin_ingenieria', 'Ha comentado tu publicación', '2024-02-20 15:15:00', 'comentario'),
('sofia_rodriguez', 'admin_ingenieria', 'Ha comentado tu publicación', '2024-02-20 15:30:00', 'comentario'),
('juan_perez', 'admin_ingenieria', 'Ha comentado tu publicación', '2024-02-20 16:00:00', 'comentario'),


('luis_torres', 'org_aiesec', 'Ha comentado tu publicación', '2024-03-20 18:10:00', 'comentario'),
('ana_martinez', 'org_aiesec', 'Ha comentado tu publicación', '2024-03-20 18:20:00', 'comentario'),
('carlos_gonzalez', 'org_aiesec', 'Ha comentado tu publicación', '2024-03-20 19:00:00', 'comentario'),


('sofia_rodriguez', 'admin_humanidades', 'Ha comentado tu publicación', '2024-03-08 10:15:00', 'comentario'),
('ana_martinez', 'admin_humanidades', 'Ha comentado tu publicación', '2024-03-08 10:30:00', 'comentario'),
('juan_perez', 'admin_humanidades', 'Ha comentado tu publicación', '2024-03-08 11:00:00', 'comentario'),


('carlos_gonzalez', 'admin_ingenieria', 'Ha comentado tu publicación', '2024-01-30 09:30:00', 'comentario'),
('luis_torres', 'admin_ingenieria', 'Ha comentado tu publicación', '2024-01-30 09:45:00', 'comentario'),
('ana_martinez', 'admin_ingenieria', 'Ha comentado tu publicación', '2024-01-30 10:00:00', 'comentario'),


('luis_torres', 'admin_ingenieria', 'Ha comentado tu publicación', '2024-03-15 20:10:00', 'comentario'),
('juan_perez', 'admin_ingenieria', 'Ha comentado tu publicación', '2024-03-15 20:20:00', 'comentario'),
('carlos_gonzalez', 'admin_ingenieria', 'Ha comentado tu publicación', '2024-03-15 20:30:00', 'comentario'),


('sofia_rodriguez', 'org_aiesec', 'Ha comentado tu publicación', '2024-02-12 16:15:00', 'comentario'),
('ana_martinez', 'org_aiesec', 'Ha comentado tu publicación', '2024-02-12 16:30:00', 'comentario'),
('carlos_gonzalez', 'org_aiesec', 'Ha comentado tu publicación', '2024-02-12 17:00:00', 'comentario'),


('juan_perez', 'admin_ingenieria', 'Ha comentado tu publicación', '2024-01-28 11:10:00', 'comentario'),
('luis_torres', 'admin_ingenieria', 'Ha comentado tu publicación', '2024-01-28 11:15:00', 'comentario'),
('carlos_gonzalez', 'admin_ingenieria', 'Ha comentado tu publicación', '2024-01-28 11:30:00', 'comentario'),


('sofia_rodriguez', 'admin_humanidades', 'Ha comentado tu publicación', '2024-03-05 13:10:00', 'comentario'),
('ana_martinez', 'admin_humanidades', 'Ha comentado tu publicación', '2024-03-05 13:20:00', 'comentario'),
('luis_torres', 'admin_humanidades', 'Ha comentado tu publicación', '2024-03-05 13:40:00', 'comentario');