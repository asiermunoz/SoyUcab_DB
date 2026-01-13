CREATE TABLE Lugar (
    id_lugar SERIAL PRIMARY KEY,
    ciudad VARCHAR(100) NOT NULL,
    pais VARCHAR(100) NOT NULL
);

CREATE TABLE Usuario (
    username VARCHAR(50) PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, 
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE Persona (
    cedula INT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    sexo CHAR(1) CHECK (sexo IN ('M', 'F', 'O')),
    biografia TEXT,
    
    username VARCHAR(50) UNIQUE NOT NULL,
    id_lugar INT,
    
    CONSTRAINT fk_persona_usuario FOREIGN KEY (username) REFERENCES Usuario(username) ON DELETE CASCADE,
    CONSTRAINT fk_persona_lugar FOREIGN KEY (id_lugar) REFERENCES Lugar(id_lugar)
);

CREATE TABLE Nexo (
    id_nexo SERIAL PRIMARY KEY,
    usuario_solicitante VARCHAR(50) NOT NULL,
    usuario_solicitado VARCHAR(50) NOT NULL,
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    tipo VARCHAR(20) CHECK (tipo IN ('asimetrica', 'simetrica', 'tipificada')),
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aceptada', 'rechazada')),
    
    CONSTRAINT fk_nexo_solicitante FOREIGN KEY (usuario_solicitante) REFERENCES Usuario(username),
    CONSTRAINT fk_nexo_solicitado FOREIGN KEY (usuario_solicitado) REFERENCES Usuario(username),
    CONSTRAINT uq_relacion UNIQUE (usuario_solicitante, usuario_solicitado)
);

CREATE TABLE Dependencia_UCAB (
    abreviatura VARCHAR(10) PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    tipo VARCHAR(50) CHECK (tipo IN ('Facultad', 'Escuela', 'Direccion', 'Centro')),
    username VARCHAR(50) UNIQUE NOT NULL,

    CONSTRAINT fk_dependencia_usuario FOREIGN KEY (username) REFERENCES Usuario(username) ON DELETE CASCADE
);

CREATE TABLE Organizacion_Asociada (
    RIF INT PRIMARY KEY,
    nombre_organizacion VARCHAR(255) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    sector VARCHAR(255),
    miembros INT,

    id_lugar INT NOT NULL, 
    username VARCHAR(50) UNIQUE NOT NULL,

    CONSTRAINT fk_organizacion_usuario FOREIGN KEY (username) REFERENCES Usuario(username) ON DELETE CASCADE,
    CONSTRAINT fk_organizacion_lugar FOREIGN KEY (id_lugar) REFERENCES Lugar (id_lugar) ON UPDATE CASCADE
);

CREATE TABLE Carrera (
    codigo_carrera VARCHAR(20) PRIMARY KEY, 
    nombre VARCHAR(100) NOT NULL UNIQUE, 
    duracion_semestres INT NOT NULL CHECK (duracion_semestres > 0),
    id_facultad VARCHAR(10) NOT NULL,
    
    CONSTRAINT fk_carrera_dependencia FOREIGN KEY (id_facultad) REFERENCES Dependencia_UCAB(abreviatura)
);

CREATE TABLE Rol (
    id_rol SERIAL PRIMARY KEY,
    nombre_cargo VARCHAR(100) NOT NULL, 
    descripcion TEXT
);

CREATE TABLE Evento (
    id_evento SERIAL PRIMARY KEY,
    nombre_evento VARCHAR(150) NOT NULL,
    descripcion TEXT,
    fecha_evento TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP NOT NULL,
    lugar_fisico VARCHAR(200),
    direccion TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'En espera' CHECK (estado IN ('En espera', 'En Curso', 'Finalizado')),
    categoria VARCHAR(50) NOT NULL DEFAULT 'Otro' CHECK (categoria IN ('Académico', 'Cultural', 'Deportivo', 'Social', 'Voluntariado', 'Institucional', 'Otro')),

    organizador_responsable VARCHAR(50) NOT NULL, 
    
    CONSTRAINT fk_evento_organizador FOREIGN KEY (organizador_responsable) REFERENCES Usuario(username),
    CONSTRAINT chk_fechas_evento CHECK (fecha_fin > fecha_evento)
);

CREATE TABLE Cursa (
    cedula_persona INT,
    codigo_carrera VARCHAR(20),
    fecha_inicio DATE DEFAULT CURRENT_DATE,
    
    PRIMARY KEY (cedula_persona, codigo_carrera),
    CONSTRAINT fk_cursa_persona FOREIGN KEY (cedula_persona) REFERENCES Persona(cedula),
    CONSTRAINT fk_cursa_carrera FOREIGN KEY (codigo_carrera) REFERENCES Carrera(codigo_carrera)
);

CREATE TABLE Desempena (
    cedula_persona INT,
    id_rol INT,
    
    PRIMARY KEY (cedula_persona, id_rol),
    CONSTRAINT fk_desempena_persona FOREIGN KEY (cedula_persona) REFERENCES Persona(cedula),
    CONSTRAINT fk_desempena_rol FOREIGN KEY (id_rol) REFERENCES Rol(id_rol)
);

CREATE TABLE Asiste (
    cedula_persona INT,
    id_evento INT,
    fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    check_in BOOLEAN NOT NULL,
    
    PRIMARY KEY (cedula_persona, id_evento),
    CONSTRAINT fk_asiste_persona FOREIGN KEY (cedula_persona) REFERENCES Persona(cedula),
    CONSTRAINT fk_asiste_evento FOREIGN KEY (id_evento) REFERENCES Evento(id_evento)
);

CREATE TABLE Grupo (
    id_grupo SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(50),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creador_username VARCHAR(50),
    
    CONSTRAINT fk_grupo_creador FOREIGN KEY (creador_username) REFERENCES Usuario(username)
);

CREATE TABLE Es_Miembro (
    id_grupo INT,
    id_usuario VARCHAR(50),
    fecha_ingreso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id_grupo, id_usuario),
    CONSTRAINT fk_miembro_grupo FOREIGN KEY (id_grupo) REFERENCES Grupo(id_grupo),
    CONSTRAINT fk_miembro_usuario FOREIGN KEY (id_usuario) REFERENCES Usuario(username)
);

CREATE TABLE Publicacion (
    id_publicacion SERIAL PRIMARY KEY,
    fecha_publicacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    likes INT DEFAULT 0 CHECK (likes >= 0), 
    url_multimedia TEXT,
    comentarios JSONB DEFAULT '[]'::JSONB, 
    
    autor VARCHAR(50) NOT NULL,
    id_grupo INT NOT NULL,
    
    CONSTRAINT fk_publicacion_autor FOREIGN KEY (autor) REFERENCES Usuario(username),
    CONSTRAINT fk_publicacion_grupo FOREIGN KEY (id_grupo) REFERENCES Grupo(id_grupo)
);

CREATE TABLE Mensaje (
    id_mensaje SERIAL PRIMARY KEY,
    contenido TEXT NOT NULL,
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    emisor VARCHAR(50) NOT NULL,
    id_grupo_destino INT, 
    
    CONSTRAINT fk_mensaje_emisor FOREIGN KEY (emisor) REFERENCES Usuario(username),
    CONSTRAINT fk_mensaje_grupo FOREIGN KEY (id_grupo_destino) REFERENCES Grupo(id_grupo)
);

CREATE TABLE Notificacion (
    id_notificacion SERIAL PRIMARY KEY,
    contenido TEXT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tipo VARCHAR(20) CHECK (tipo IN ('relacion', 'comentario')),
    
    usuario_emisor VARCHAR(50),
    usuario_receptor VARCHAR(50) NOT NULL,
    
    CONSTRAINT fk_noti_emisor FOREIGN KEY (usuario_emisor) REFERENCES Usuario(username),
    CONSTRAINT fk_noti_receptor FOREIGN KEY (usuario_receptor) REFERENCES Usuario(username)
);
