# Verificación de la integración — 30 de septiembre de 2026

Proyecto: farm-control-stock. Rama: feat/importar-backend-bd-omarbenabidesss.
Autor: Omar Benavides Sanchez (omarbenabidesss).

## Resultado

- Instalación con lockfile: completada con pnpm 10.32.1. Se utilizó registry.yarnpkg.com porque el registro npm predeterminado presentó un error de certificado en este equipo.
- Compilación de tipos compartidos, backend y frontend: completada con `pnpm build`.
- API NestJS: arranque correcto, 33 rutas registradas.
- Integración real API/Supabase: 50 comprobaciones pasaron.
- Acceso verificado a las 10 tablas del esquema y sus 2 vistas de negocio.
- CRUD de categorías, productos y proveedores; configuración, perfil y permisos: comprobados.
- Persistencia: entrada de 30 unidades, venta de 2 y merma de 1; stock final confirmado en Supabase: 27.
- Kardex y correcciones, reportes, panel, generación y gestión de alertas: comprobados.
- Sesión requerida, restricción de entradas para vendedor y consultas limitadas a la botica del usuario: comprobadas.
- Botica temporal y cuenta Auth de prueba: eliminadas al finalizar.
- Navegador: pantalla de inicio de sesión visible, sin errores de consola; inventario redirige al inicio de sesión cuando no hay sesión. Las acciones de negocio se probaron a través de la API, no mediante cada formulario de la interfaz.

## Alcance de la copia de base de datos

Se incluyen el esquema SQL y la semilla de origen. La configuración local mantiene la conexión al mismo proyecto Supabase de origen; no se creó un proyecto de base de datos independiente. El respaldo `supabase/respaldo.local.json` exporta las tablas públicas mediante REST y queda fuera de Git. No incluye contraseñas, sesiones Auth ni una instantánea transaccional completa de PostgreSQL. Los archivos de configuración privados también quedan fuera del commit.

## Repetir las comprobaciones

Iniciar la API con `pnpm dev:backend` y ejecutar `pnpm test:integration`. La prueba usa una botica temporal y limpia las entidades en orden de dependencias.
