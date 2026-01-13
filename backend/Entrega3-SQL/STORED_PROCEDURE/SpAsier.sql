DROP FUNCTION IF EXISTS SP_CREAR_USUARIO_PERSONA(VARCHAR, VARCHAR, VARCHAR, INT, VARCHAR, VARCHAR, DATE, CHAR, INT, TEXT);

CREATE OR REPLACE FUNCTION SP_CREAR_USUARIO_PERSONA(
    p_username VARCHAR,
    p_email VARCHAR,
    p_password VARCHAR,
    p_cedula INT,
    p_nombre VARCHAR,
    p_apellido VARCHAR,
    p_fecha_nacimiento DATE,
    p_sexo CHAR,
    p_id_lugar INT,
    p_biografia TEXT
)
RETURNS TEXT AS $$
BEGIN

    IF EXISTS (SELECT 1 FROM Usuario WHERE username = p_username OR email = p_email) THEN
        RETURN 'ERROR: El usuario o correo ya existen.';
    END IF;

    INSERT INTO Usuario (username, email, password, activo)
    VALUES (p_username, p_email, p_password, TRUE);

    INSERT INTO Persona (cedula, nombre, apellido, fecha_nacimiento, sexo, biografia, username, id_lugar)
    VALUES (p_cedula, p_nombre, p_apellido, p_fecha_nacimiento, p_sexo,p_biografia, p_username, p_id_lugar);

    RETURN 'ÉXITO: Usuario y Perfil creados correctamente.';

EXCEPTION WHEN OTHERS THEN

    RETURN CONCAT('ERROR SQL: ', SQLERRM);
END;
$$ LANGUAGE plpgsql;


/* 
SELECT SP_CREAR_USUARIO_PERSONA(
    'nuevo_ingreso',           -- username
    'nuevo@ucab.edu.ve',       -- email
    'pass123',                 -- password
    30555777,                  -- cedula
    'Andres',                  -- nombre
    'Bello',                   -- apellido
    '2005-01-01',              -- nacimiento
    'M',                       -- sexo
    1,                         -- id_lugar (Caracas)
    'usuario de prueba SPAsier' -- biografia  
);

SELECT * FROM Usuario WHERE username = 'nuevo_ingreso';
SELECT * FROM Persona WHERE cedula = 30555777;
 */