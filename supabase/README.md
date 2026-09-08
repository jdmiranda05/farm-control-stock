# Supabase

## Ejecucion del esquema

1. Abrir el proyecto en Supabase.
2. Ir a SQL Editor.
3. Copiar y ejecutar `schema.sql`.
4. Crear un usuario de prueba en Authentication.

## Variables del frontend

Crear `frontend/.env` con el mismo formato de `frontend/.env.example`:

```env
VITE_SUPABASE_URL=https://dwvkwawxmkxslyraafqc.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_ci_AKrT8R7J1DPVQS6ziwA__s2GRGbHm
```

## Evidencia de base de datos

Este directorio demuestra el aporte de base de datos y modelos:

- Esquema SQL de tablas, relaciones, restricciones, politicas RLS y datos semilla.
- Diccionario de datos.
- Conexion del frontend mediante variables de entorno.
- Modelos de datos para frontend y backend.
