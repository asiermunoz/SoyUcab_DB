CREATE OR REPLACE FUNCTION FN_TRG_VALIDAR_AGENDA()
RETURNS TRIGGER AS $$
DECLARE
    v_nuevo_inicio TIMESTAMP;
    v_nuevo_fin TIMESTAMP;
    v_conflicto_detectado BOOLEAN;
    v_nombre_evento_conflicto VARCHAR;
BEGIN

    SELECT fecha_evento, fecha_fin 
    INTO v_nuevo_inicio, v_nuevo_fin
    FROM Evento
    WHERE id_evento = NEW.id_evento;

    SELECT EXISTS (
        SELECT 1
        FROM Asiste a
        JOIN Evento e ON a.id_evento = e.id_evento
        WHERE a.cedula_persona = NEW.cedula_persona 
          AND (e.fecha_evento < v_nuevo_fin AND e.fecha_fin > v_nuevo_inicio) 
    ) INTO v_conflicto_detectado;


    IF v_conflicto_detectado THEN

        SELECT e.nombre_evento INTO v_nombre_evento_conflicto
        FROM Asiste a
        JOIN Evento e ON a.id_evento = e.id_evento
        WHERE a.cedula_persona = NEW.cedula_persona
          AND (e.fecha_evento < v_nuevo_fin AND e.fecha_fin > v_nuevo_inicio)
        LIMIT 1;

        RAISE EXCEPTION 'CONFLICTO DE AGENDA: La persona % ya tiene ocupado el horario con el evento "%".', 
            NEW.cedula_persona, v_nombre_evento_conflicto;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS TRG_VALIDAR_AGENDA ON Asiste;

CREATE TRIGGER TRG_VALIDAR_AGENDA
BEFORE INSERT ON Asiste
FOR EACH ROW
EXECUTE FUNCTION FN_TRG_VALIDAR_AGENDA();



/* codigo donde se probo el trigger

INSERT INTO Evento (nombre_evento, fecha_evento, fecha_fin, organizador_responsable)
VALUES ('Clase A', '2025-01-01 08:00:00', '2025-01-01 10:00:00', 'admin_ingenieria');

INSERT INTO Evento (nombre_evento, fecha_evento, fecha_fin, organizador_responsable)
VALUES ('Clase B', '2025-01-01 09:00:00', '2025-01-01 11:00:00', 'admin_ingenieria');


Inscribirse en Evento A
INSERT INTO Asiste (cedula_persona, id_evento, check_in) 
VALUES (20000100, (SELECT id_evento FROM Evento WHERE nombre_evento = 'Clase A'), FALSE);

Inscribirse en B 
INSERT INTO Asiste (cedula_persona, id_evento, check_in) 
VALUES (20000100, (SELECT id_evento FROM Evento WHERE nombre_evento = 'Clase B'), FALSE);


 */