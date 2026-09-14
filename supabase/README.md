# Supabase

## Ejecucion del esquema

1. Abrir el proyecto en Supabase.
2. Ir a SQL Editor.
3. Copiar y ejecutar `schema.sql`.
4. Crear los usuarios de prueba en Authentication.

## Variables del frontend

Crear `frontend/.env` con el mismo formato de `frontend/.env.example`:

```env
VITE_SUPABASE_URL=https://dwvkwawxmkxslyraafqc.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_ci_AKrT8R7J1DPVQS6ziwA__s2GRGbHm
```

## Usuarios de prueba

Crear estos usuarios en Supabase Authentication con email confirmado. El trigger
`handle_new_user` creara su perfil en `public.profiles` usando la metadata.

| Correo | Contrasena | Metadata `nombres` | Metadata `apellidos` | Metadata `rol` |
| --- | --- | --- | --- | --- |
| `admin@boticamll.com` | `Admin12345` | `Administrador` | `M&LL` | `administrador` |
| `almacen@boticamll.com` | `Almacen12345` | `Operador` | `Almacen` | `almacen` |

Tambien pueden sincronizarse los perfiles manualmente si los usuarios ya existen:

```sql
update public.profiles
set nombres = 'Administrador',
    apellidos = 'M&LL',
    rol = 'administrador',
    activo = true
where id = (
  select id from auth.users where email = 'admin@boticamll.com'
);

update public.profiles
set nombres = 'Operador',
    apellidos = 'Almacen',
    rol = 'almacen',
    activo = true
where id = (
  select id from auth.users where email = 'almacen@boticamll.com'
);
```

## Evidencia de base de datos

Este directorio demuestra el aporte de base de datos y modelos:

- Esquema SQL de tablas, relaciones, restricciones, politicas RLS y datos semilla.
- Diccionario de datos.
- Conexion del frontend mediante variables de entorno.
- Modelos de datos para frontend y backend.
