# Farm Control Stock

Sistema web para la gestion de stock, lotes y vencimientos de medicamentos en la Botica M&LL.

## Descripcion tecnica

El proyecto esta organizado como un monorepo simple con tres partes principales:

- `frontend`: aplicacion web desarrollada con React y Vite.
- `backend`: API desarrollada con NestJS.
- `supabase`: scripts y documentacion de base de datos para Supabase/PostgreSQL.

La base de datos se gestiona en Supabase y el sistema usa PostgreSQL como motor relacional.

## Estructura del proyecto

```text
farm-control-stock/
+-- backend/
+-- frontend/
+-- supabase/
+-- package.json
+-- package-lock.json
+-- README.md
+-- .gitignore
```

## Frontend

El frontend esta construido con React y Vite. Su codigo principal se encuentra en `frontend/src`.

```text
frontend/src/
+-- assets/
+-- components/
|   +-- ModalCliente.jsx
|   +-- ModalVenta.jsx
|   +-- Sidebar.jsx
+-- layouts/
|   +-- MainLayout.jsx
+-- lib/
|   +-- supabaseClient.js
+-- models/
|   +-- database.js
+-- pages/
|   +-- Clientes.jsx
|   +-- Dashboard.jsx
|   +-- Historial.jsx
|   +-- Login.jsx
|   +-- PuntoVenta.jsx
+-- App.jsx
+-- App.css
+-- index.css
+-- main.jsx
```

### Componentes principales

- `pages/Login.jsx`: pantalla de autenticacion.
- `pages/Dashboard.jsx`: panel principal del sistema.
- `pages/PuntoVenta.jsx`: pantalla para flujo de venta.
- `pages/Historial.jsx`: vista de historial.
- `pages/Clientes.jsx`: gestion visual de clientes.
- `components/Sidebar.jsx`: menu lateral de navegacion.
- `components/ModalVenta.jsx`: modal de detalle o confirmacion de venta.
- `components/ModalCliente.jsx`: modal de datos del cliente.
- `layouts/MainLayout.jsx`: estructura comun de las pantallas internas.

### Conexion con Supabase en frontend

La conexion del frontend con Supabase esta centralizada en:

```text
frontend/src/lib/supabaseClient.js
```

Este archivo usa las variables de entorno de Vite:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

El archivo de referencia para configurar el entorno local es:

```text
frontend/.env.example
```

## Backend

El backend esta construido con NestJS. Su codigo principal se encuentra en `backend/src`.

```text
backend/src/
+-- categorias/
|   +-- dto/
|   +-- entities/
|   +-- categorias.controller.ts
|   +-- categorias.module.ts
|   +-- categorias.service.ts
+-- config/
|   +-- configuration.ts
|   +-- configuration.spec.ts
+-- supabase/
|   +-- supabase.module.ts
|   +-- supabase.service.ts
+-- app.controller.ts
+-- app.controller.spec.ts
+-- app.module.ts
+-- app.service.ts
+-- database.models.ts
+-- main.ts
```

### Modulos backend

- `SupabaseModule`: registra el cliente de Supabase como proveedor global.
- `SupabaseService`: contiene operaciones reutilizables sobre Supabase.
- `CategoriasModule`: modulo CRUD para categorias.
- `CategoriasController`: expone endpoints HTTP para categorias.
- `CategoriasService`: implementa la logica de consulta y persistencia de categorias.

### Configuracion del backend

La configuracion se carga desde:

```text
backend/src/config/configuration.ts
```

Variables necesarias:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

La clave `SUPABASE_SERVICE_ROLE_KEY` debe manejarse solo en el backend y no debe exponerse en el frontend.

## Base de datos

La carpeta `supabase` contiene el esquema y la documentacion de la base de datos.

```text
supabase/
+-- schema.sql
+-- diccionario_datos.md
+-- README.md
```

### Archivo principal

```text
supabase/schema.sql
```

Este archivo define:

- Extension `pgcrypto`.
- Tablas principales.
- Claves primarias.
- Claves foraneas.
- Restricciones `not null`, `unique` y `check`.
- Trigger para actualizar la fecha de modificacion de lotes.
- Trigger para crear perfiles desde usuarios autenticados.
- Politicas RLS.
- Vista de inventario.
- Datos iniciales de prueba.

### Tablas principales

```text
profiles
categorias
proveedores
productos
lotes
movimientos_kardex
```

### Vista principal

```text
v_lotes_inventario
```

Esta vista consolida informacion de lotes, productos, categorias y proveedores. Tambien calcula el estado del lote:

- `Disponible`
- `Stock bajo`
- `Por vencer`

### Relaciones principales

```text
categorias 1 -- N productos
productos 1 -- N lotes
proveedores 1 -- N lotes
productos 1 -- N movimientos_kardex
lotes 1 -- N movimientos_kardex
profiles 1 -- N movimientos_kardex
```

## Instalacion

Desde la raiz del proyecto:

```bash
npm install
npm run install:all
```

Tambien se puede instalar por separado:

```bash
npm install --prefix frontend
npm install --prefix backend
```

## Variables de entorno

### Frontend

Crear `frontend/.env` tomando como base `frontend/.env.example`:

```env
VITE_SUPABASE_URL=https://dwvkwawxmkxslyraafqc.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_ci_AKrT8R7J1DPVQS6ziwA__s2GRGbHm
```

### Backend

Crear `backend/.env`:

```env
SUPABASE_URL=https://dwvkwawxmkxslyraafqc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=
```

No se debe subir ningun archivo `.env` al repositorio.

## Ejecucion del proyecto

Ejecutar frontend y backend al mismo tiempo:

```bash
npm run dev
```

Ejecutar solo frontend:

```bash
npm run dev:frontend
```

Ejecutar solo backend:

```bash
npm run dev:backend
```

## Scripts disponibles

### Raiz

```bash
npm run dev
npm run dev:frontend
npm run dev:backend
npm run install:all
```

### Frontend

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

### Backend

```bash
npm run start:dev
npm run build
npm run test
npm run test:e2e
npm run lint
```

## Ejecucion del esquema en Supabase

1. Abrir el proyecto en Supabase.
2. Ir a SQL Editor.
3. Copiar el contenido de `supabase/schema.sql`.
4. Ejecutar el script completo.
5. Crear los usuarios de prueba desde Authentication.

## Seguridad

- Las credenciales sensibles deben estar en archivos `.env`.
- Los archivos `.env` estan excluidos mediante `.gitignore`.
- La clave publica de Supabase se usa en frontend.
- La clave `service role` solo debe usarse en backend.
- Las tablas tienen RLS habilitado.
- Las operaciones del frontend deben usar usuarios autenticados cuando aplique.

## Versionamiento

El repositorio utiliza Git como sistema de control de versiones. La estructura recomendada de trabajo es:

```text
main
develop
feature/nombre-funcionalidad
```

Los commits deben ser atomicos y describir claramente el cambio realizado.

Ejemplos:

```text
feat: crear esquema para lotes
feat: agregar modelos de datos
feat: configurar conexion supabase
docs: documentar base de datos
fix: corregir validacion de categoria
```

## Entidad principal

La entidad central del sistema es `lotes`, porque permite controlar:

- Producto asociado.
- Proveedor.
- Codigo de lote.
- Cantidad disponible.
- Fecha de vencimiento.
- Precio de compra.
- Estado del lote.

Esta entidad se relaciona con `productos`, `proveedores` y `movimientos_kardex`.

## Documentacion relacionada

- `supabase/README.md`: guia especifica de Supabase.
- `supabase/diccionario_datos.md`: detalle de tablas, campos y reglas.
- `supabase/schema.sql`: script SQL de la base de datos.
