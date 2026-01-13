DROP OWNED BY "Rol_Admin_Comunidad";
DROP OWNED BY "Rol_Gestor_Contenido";
DROP OWNED BY "Rol_Gestor_Institucional";


DROP OWNED BY usuario_asier;
DROP OWNED BY usuario_emiliany;
DROP OWNED BY usuario_jose;


DROP USER IF EXISTS usuario_asier;
DROP USER IF EXISTS usuario_emiliany;
DROP USER IF EXISTS usuario_jose;

DROP ROLE IF EXISTS "Rol_Admin_Comunidad";
DROP ROLE IF EXISTS "Rol_Gestor_Contenido";
DROP ROLE IF EXISTS "Rol_Gestor_Institucional";



-- ROL 1: ASIER MUÑOZ (Comunidad)
CREATE ROLE "Rol_Admin_Comunidad" WITH NOLOGIN;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.Usuario TO "Rol_Admin_Comunidad";
GRANT SELECT, INSERT, UPDATE, DELETE ON public.Persona TO "Rol_Admin_Comunidad";
GRANT SELECT, INSERT, UPDATE, DELETE ON public.Nexo TO "Rol_Admin_Comunidad";
GRANT SELECT, INSERT, UPDATE, DELETE ON public.Lugar TO "Rol_Admin_Comunidad";
GRANT USAGE ON SCHEMA public TO "Rol_Admin_Comunidad";
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO "Rol_Admin_Comunidad";


-- ROL 2: EMILIANY CARMONA (Contenido)
CREATE ROLE "Rol_Gestor_Contenido" WITH NOLOGIN;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.Publicacion TO "Rol_Gestor_Contenido";
GRANT SELECT, INSERT, UPDATE, DELETE ON public.Mensaje TO "Rol_Gestor_Contenido";
GRANT SELECT, INSERT, UPDATE, DELETE ON public.Notificacion TO "Rol_Gestor_Contenido";
GRANT SELECT, INSERT, UPDATE, DELETE ON public.Grupo TO "Rol_Gestor_Contenido";
GRANT SELECT, INSERT, UPDATE, DELETE ON public.Es_Miembro TO "Rol_Gestor_Contenido";
GRANT USAGE ON SCHEMA public TO "Rol_Gestor_Contenido";
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO "Rol_Gestor_Contenido";


-- ROL 3: JOSÉ GUEDES (Institucional)
CREATE ROLE "Rol_Gestor_Institucional" WITH NOLOGIN;


GRANT SELECT, INSERT, UPDATE, DELETE ON public.Evento TO "Rol_Gestor_Institucional";
GRANT SELECT, INSERT, UPDATE, DELETE ON public.Asiste TO "Rol_Gestor_Institucional";
GRANT SELECT, INSERT, UPDATE, DELETE ON public.Dependencia_UCAB TO "Rol_Gestor_Institucional";
GRANT SELECT, INSERT, UPDATE, DELETE ON public.Organizacion_Asociada TO "Rol_Gestor_Institucional";
GRANT SELECT, INSERT, UPDATE, DELETE ON public.Carrera TO "Rol_Gestor_Institucional"; 
GRANT SELECT, INSERT, UPDATE, DELETE ON public.Rol TO "Rol_Gestor_Institucional"; 
GRANT SELECT, INSERT, UPDATE, DELETE ON public.Desempena TO "Rol_Gestor_Institucional";
GRANT SELECT, INSERT, UPDATE, DELETE ON public.Cursa TO "Rol_Gestor_Institucional";
GRANT USAGE ON SCHEMA public TO "Rol_Gestor_Institucional";
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO "Rol_Gestor_Institucional";


-- USUARIOS

CREATE USER usuario_asier WITH PASSWORD 'Asier2025';
GRANT "Rol_Admin_Comunidad" TO usuario_asier;

CREATE USER usuario_emiliany WITH PASSWORD 'Emi2025';
GRANT "Rol_Gestor_Contenido" TO usuario_emiliany;

CREATE USER usuario_jose WITH PASSWORD 'Jose2025';
GRANT "Rol_Gestor_Institucional" TO usuario_jose;