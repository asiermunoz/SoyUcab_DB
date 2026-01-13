CREATE OR REPLACE FUNCTION FN_TRG_SEGURIDAD_PUBLICACION()
RETURNS TRIGGER AS $$
DECLARE
    es_institucion BOOLEAN;
    es_miembro BOOLEAN;
BEGIN

    SELECT EXISTS (
        SELECT 1 FROM Dependencia_UCAB WHERE username = NEW.autor
        UNION ALL
        SELECT 1 FROM Organizacion_Asociada WHERE username = NEW.autor
    ) INTO es_institucion;


    IF NOT es_institucion THEN
        RAISE EXCEPTION 'Violación de Regla de Negocio: El usuario "%" es una Persona natural. Solo las Dependencias UCAB u Organizaciones Asociadas pueden crear publicaciones.', NEW.autor;
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM Es_Miembro
        WHERE id_grupo = NEW.id_grupo 
          AND id_usuario = NEW.autor
    ) INTO es_miembro;


    IF NOT es_miembro THEN
        RAISE EXCEPTION 'Violación de Seguridad: La entidad "%" no es miembro del grupo ID % y no tiene permiso para publicar en él.', NEW.autor, NEW.id_grupo;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS TRG_SEGURIDAD_PUBLICACION ON Publicacion;

CREATE TRIGGER TRG_SEGURIDAD_PUBLICACION
BEFORE INSERT ON Publicacion
FOR EACH ROW
EXECUTE FUNCTION FN_TRG_SEGURIDAD_PUBLICACION();



/* codigo donde se probo el trigger

INSERT INTO Publicacion (autor, id_grupo, likes, comentarios) 
VALUES ('juan_perez', 1, 0, '[]'::JSONB);

INSERT INTO Publicacion (autor, id_grupo, likes, comentarios) 
VALUES ('ana_martinez', 1, 0, '[]'::JSONB);

INSERT INTO Publicacion (autor, id_grupo, likes, comentarios) 
VALUES ('juan_perez', NULL, 0, '[]'::JSONB);

INSERT INTO Es_Miembro (id_usuario, id_grupo, fecha_ingreso)
VALUES ('admin_ingenieria', 3, '2023-01-01 00:00:00')
ON CONFLICT DO NOTHING; 


INSERT INTO Publicacion (
    autor, 
    id_grupo, 
    url_multimedia, 
    likes, 
    fecha_publicacion, 
    comentarios
) VALUES (
    'admin_ingenieria', 
    3,                   
    'https://ucab.edu.ve/img/feria_proyectos_2024.png', 
    125,                 
    CURRENT_TIMESTAMP,   
    
    '[
        {
            "autor": "carlos_gonzalez", 
            "contenido": "¿Hasta cuándo son las inscripciones?", 
            "fecha": "2024-04-10 09:15:00"
        },
        {
            "autor": "sofia_rodriguez", 
            "contenido": "¡Qué buena iniciativa! Ya tengo equipo.", 
            "fecha": "2024-04-10 09:45:00"
        },
        {
            "autor": "luis_torres", 
            "contenido": "Nos vemos allá, llevaré mi prototipo.", 
            "fecha": "2024-04-10 11:30:00"
        }
    ]'::JSONB
);

 */