DROP FUNCTION IF EXISTS SP_REGISTRAR_ASISTENCIA_EVENTO(INT, VARCHAR, TIMESTAMP);

CREATE OR REPLACE FUNCTION SP_REGISTRAR_ASISTENCIA_EVENTO(
    p_cedula_persona INT,
    p_nombre_evento VARCHAR,
    p_fecha_evento TIMESTAMP
)
RETURNS TEXT AS $$
DECLARE
    v_id_evento INT;
    v_fecha_fin TIMESTAMP;
BEGIN

    SELECT id_evento, fecha_fin INTO v_id_evento, v_fecha_fin
    FROM Evento
    WHERE nombre_evento = p_nombre_evento 
      AND fecha_evento = p_fecha_evento;

    IF v_id_evento IS NULL THEN
        RETURN 'ERROR: El evento no existe o la fecha no coincide.';
    END IF;


    IF v_fecha_fin < CURRENT_TIMESTAMP THEN
        RETURN 'ERROR: No se puede registrar. El evento ya ha finalizado.';
    END IF;

    INSERT INTO Asiste (cedula_persona, id_evento, check_in)
    VALUES (p_cedula_persona, v_id_evento, FALSE);

    RETURN 'ÉXITO: Inscripción realizada.';

EXCEPTION 
    WHEN unique_violation THEN
        RETURN 'ADVERTENCIA: La persona ya estaba inscrita.';
    WHEN OTHERS THEN
        RETURN CONCAT('ERROR: ', SQLERRM); 
END;
$$ LANGUAGE plpgsql;