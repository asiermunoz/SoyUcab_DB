DROP FUNCTION IF EXISTS SP_AGREGAR_COMENTARIO(INT, VARCHAR, TEXT);

CREATE OR REPLACE FUNCTION SP_AGREGAR_COMENTARIO(
    p_id_publicacion INT,
    p_usuario_comentarista VARCHAR,
    p_texto_comentario TEXT
)
RETURNS TEXT AS $$
DECLARE
    v_id_grupo INT;
    v_autor_original VARCHAR;
    v_nuevo_comentario JSONB;
BEGIN

    SELECT id_grupo, autor INTO v_id_grupo, v_autor_original
    FROM Publicacion
    WHERE id_publicacion = p_id_publicacion;


    IF v_autor_original IS NULL THEN
        RETURN 'ERROR: La publicación no existe.';
    END IF;


    IF v_id_grupo IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM Es_Miembro 
            WHERE id_grupo = v_id_grupo AND id_usuario = p_usuario_comentarista
        ) THEN
            RETURN 'ERROR: No puedes comentar. No eres miembro del grupo.';
        END IF;
    END IF;

    v_nuevo_comentario := jsonb_build_object(
        'user_name', p_usuario_comentarista,
        'texto', p_texto_comentario,
        'fecha', TO_CHAR(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS')
    );

    UPDATE Publicacion
    SET comentarios = comentarios || v_nuevo_comentario
    WHERE id_publicacion = p_id_publicacion;

    IF v_autor_original <> p_usuario_comentarista THEN
        INSERT INTO Notificacion (contenido, tipo, usuario_emisor, usuario_receptor)
        VALUES (
            CONCAT(p_usuario_comentarista, ' ha comentado tu publicación.'),
            'comentario', 
            p_usuario_comentarista,
            v_autor_original
        );
    END IF;

    RETURN 'ÉXITO: Comentario agregado y notificación enviada.';

EXCEPTION WHEN OTHERS THEN
    RETURN CONCAT('ERROR SQL: ', SQLERRM);
END;
$$ LANGUAGE plpgsql;


/*
-- Buscamos una publicación de Juan Perez en el Grupo 1
SELECT id_publicacion, autor, comentarios 
FROM Publicacion 
WHERE autor = 'admin_ingenieria' AND id_grupo = 1 
LIMIT 1;

-- Carlos comenta en el post ID 1
SELECT SP_AGREGAR_COMENTARIO(
    1,                  
    'carlos_gonzalez',  
    '¡Excelente aporte Juan, gracias por compartir!' 
);

-- Verifica que el JSON cambió
SELECT id_publicacion, jsonb_pretty(comentarios) 
FROM Publicacion 
WHERE id_publicacion = 1;

-- Verifica que llegó la notificación a Juan
SELECT * FROM Notificacion 
WHERE usuario_receptor = 'admin_ingenieria' 
ORDER BY id_notificacion DESC LIMIT 1;


-- Ana Martinez NO es miembro del Grupo 1
SELECT SP_AGREGAR_COMENTARIO(
    1, 
    'ana_martinez', 
    'Intentando comentar sin permiso...'
);

*/