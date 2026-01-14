CREATE OR REPLACE FUNCTION FN_TRG_NOTIFICAR_NEXO()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.estado = 'pendiente' THEN
        INSERT INTO Notificacion (contenido, fecha, tipo, usuario_emisor, usuario_receptor)
        VALUES (
            CONCAT('Te ha enviado una solicitud de nexo'),
            CURRENT_TIMESTAMP,
            'relacion',            
            NEW.usuario_solicitante,
            NEW.usuario_solicitado
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS TRG_NOTIFICAR_NEXO ON nexo;

CREATE TRIGGER TRG_NOTIFICAR_NEXO
AFTER INSERT ON Nexo
FOR EACH ROW
EXECUTE FUNCTION FN_TRG_NOTIFICAR_NEXO();


/* codigo donde se probo el trigger

INSERT INTO Nexo (usuario_solicitante, usuario_solicitado, tipo, estado) 
VALUES ('sofia_rodriguez', 'luis_torres', 'simetrica', 'pendiente');
SELECT * FROM Notificacion ORDER BY id_notificacion DESC LIMIT 1;

 */