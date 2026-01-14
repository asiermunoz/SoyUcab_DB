CREATE OR REPLACE FUNCTION FN_Calcular_Prestigio_Social(usuario_consultado VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    cantidad_nexos INT;
    puntaje_total INT := 0;
    tiene_ubicacion BOOLEAN;
    resultado VARCHAR(50);
BEGIN
    SELECT COUNT(*) INTO cantidad_nexos
    FROM Nexo
    WHERE (usuario_solicitante = usuario_consultado OR usuario_solicitado = usuario_consultado)
      AND estado = 'aceptada';

    puntaje_total := cantidad_nexos * 10;

    SELECT (id_lugar IS NOT NULL) INTO tiene_ubicacion
    FROM Persona
    WHERE username = usuario_consultado;

    IF tiene_ubicacion IS TRUE THEN
        puntaje_total := puntaje_total + 50;
    END IF;

    IF puntaje_total < 100 THEN
        resultado := 'Usuario Nuevo';
    ELSIF puntaje_total BETWEEN 100 AND 500 THEN
        resultado := 'Miembro Activo';
    ELSE
        resultado := 'Líder de Comunidad';
    END IF;

    RETURN resultado;
END;
$$ LANGUAGE plpgsql;


/* 
SELECT username, FN_Calcular_Prestigio_Social(username) as Estatus_Social 
FROM Usuario 
WHERE username = 'juan_perez';
 */