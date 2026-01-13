CREATE OR REPLACE FUNCTION FN_Calcular_Horas_Acreditadas(cedula_estudiante INT)
RETURNS INT AS $$
DECLARE
    total_horas INT;
BEGIN

    SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (Evento.fecha_fin - Evento.fecha_evento)) / 3600), 0)
    INTO total_horas
    FROM Asiste
    JOIN Evento ON Asiste.id_evento = Evento.id_evento
    WHERE Asiste.cedula_persona = cedula_estudiante
      AND Evento.fecha_fin < NOW();


    RETURN total_horas;
END;
$$ LANGUAGE plpgsql;


/* 
SELECT nombre, apellido, FN_Calcular_Horas_Acreditadas(cedula) as Horas_Totales 
FROM Persona 
WHERE cedula = 20000104;
 */