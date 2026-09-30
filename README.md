# Farm Control Stock

Integración de `saas-boticas`: backend NestJS, base PostgreSQL/Supabase y aplicación React conectada a la API. Autor de esta integración: Omar Benavides Sanchez (`omarbenabidesss`).

## Estructura

- `backend/`: autenticación, boticas, proveedores, categorías, productos, inventario, ventas, kardex, reportes, alertas y panel.
- `frontend/`: interfaz integrada, con sesión Supabase y permisos por rol.
- `packages/comun/`: tipos y reglas de empaque compartidos.
- `supabase/esquema.sql`: tablas, vistas, índices y políticas de acceso.
- `supabase/semilla.sql`: datos de demostración para una base nueva.
- `legacy/`: código del proyecto destino anterior a la integración, conservado como referencia.
- `scripts/verificar-integracion.cjs`: pruebas de API y persistencia real con datos temporales aislados.

## Ejecutar

Se requiere Node.js 20.12 o superior y pnpm 10.32.1.

```sh
corepack enable
pnpm install --frozen-lockfile
cp backend/.env.ejemplo backend/.env
cp frontend/.env.ejemplo frontend/.env
# Completar la configuración de Supabase en ambos archivos.
pnpm dev
```

La API se inicia en `http://localhost:3000/api` y la interfaz en `http://localhost:5173`.
La clave administrativa `SUPABASE_SERVICE_ROLE_KEY` pertenece exclusivamente al backend. Los archivos `.env` quedan fuera de Git.

En este equipo se conservó la configuración local del proyecto Supabase de origen. La integración usa esa misma base; crear una rama Git no crea una copia independiente de Supabase. Para una base nueva, ejecutar primero `supabase/esquema.sql` y después `supabase/semilla.sql`, crear las cuentas en Supabase Auth y vincular sus UUID a `usuarios`, siguiendo el bloque final de la semilla. No ejecutar la semilla sobre la base existente: sus UUID de demostración ya pueden estar presentes.

## Verificar

```sh
pnpm build
# Con la API iniciada en otra terminal:
pnpm test:integration
```

La prueba consulta todas las tablas y vistas usadas, crea una botica y un administrador temporales, comprueba operaciones CRUD, entradas, ventas, mermas, stock persistido, kardex, reportes, alertas, permisos y aislamiento de datos. Finalmente elimina las filas y la cuenta creadas por esa ejecución. Requiere la configuración administrativa local.

```sh
pnpm backup:database
```

Este comando exporta las tablas públicas del esquema a `supabase/respaldo.local.json`, excluido de Git. Es un respaldo de datos de la aplicación vía REST; no incluye contraseñas ni sesiones de Supabase Auth y no sustituye un respaldo transaccional de PostgreSQL. El esquema y la semilla sí se incluyen en la rama.

La [guía detallada](docs/manual-saas-boticas.md) describe las reglas de inventario y los endpoints.
