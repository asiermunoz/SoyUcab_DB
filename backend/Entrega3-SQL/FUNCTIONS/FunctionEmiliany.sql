CREATE OR REPLACE FUNCTION FN_Obtener_Engagement_Grupo(id_grupo_target INT)
RETURNS DECIMAL AS $$
DECLARE
    total_miembros INT;
    total_posts_recientes INT;
    engagement DECIMAL(5,2);
BEGIN

    SELECT COUNT(*) INTO total_miembros
    FROM Es_Miembro
    WHERE id_grupo = id_grupo_target;

    IF total_miembros = 0 THEN
        RETURN 0.00;
    END IF;


    SELECT COUNT(*) INTO total_posts_recientes
    FROM Publicacion
    WHERE id_grupo = id_grupo_target; 

    engagement := (total_posts_recientes::DECIMAL / total_miembros) * 100;

    RETURN engagement;
END;
$$ LANGUAGE plpgsql;


/* 
SELECT nombre, FN_Obtener_Engagement_Grupo(id_grupo) as Porcentaje_Engagement 
FROM Grupo 
WHERE id_grupo = 1;
*/