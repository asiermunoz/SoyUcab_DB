# SoyUcab_DB

Esta es una red social que utiliza una base de datos PostgreSQL.

## Requisitos Previos

- Node.js (versión 14 o superior)
- PostgreSQL (instalado y ejecutándose)

## Instalación

1. Clona este repositorio:
   ```
   git clone <url-del-repositorio>
   cd SoyUcab_DB
   ```

2. Instala las dependencias del backend:
   ```
   cd backend
   npm install
   ```

## Configuración

1. Crea un archivo `.env` en la carpeta `backend/` con las siguientes variables de entorno:

   ```
   PORT=3000
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=soyucab_db
   DB_USER=tu_usuario_postgres
   DB_PASSWORD=tu_contraseña_postgres
   JWT_SECRET=tu_clave_secreta_para_jwt
   ```

   - Reemplaza `tu_usuario_postgres` y `tu_contraseña_postgres` con tus credenciales de PostgreSQL.
   - Elige una clave secreta segura para `JWT_SECRET`.

2. Asegúrate de que la base de datos PostgreSQL esté creada y ejecutándose. Puedes usar los scripts SQL en la carpeta `Entrega3-SQL/` para crear las tablas e insertar datos iniciales.

## Ejecutar el Proyecto

1. Desde la carpeta `backend/`, ejecuta:
   ```
   npm start
   ```

2. El servidor se iniciará en el puerto especificado en `.env` (por defecto 3000).

3. Abre tu navegador y ve a `http://localhost:3000` para acceder a la aplicación. El frontend se sirve automáticamente desde el backend.

## Ejecutar jsreport

Para generar reportes, necesitas ejecutar jsreport por separado:

1. Abre una nueva terminal y navega a la carpeta `backend/`.

2. Ejecuta:
   ```
   npx jsreport start
   ```

3. jsreport estará disponible en `http://localhost:5488` y se usará para generar reportes desde la aplicación.

## Notas Adicionales

- El backend utiliza jsreport para generar reportes, que se ejecuta en el puerto 5488.
- Los archivos del frontend están en la carpeta `frontend/` y se sirven como archivos estáticos.
