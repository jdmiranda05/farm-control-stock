-- ============================================================
-- MIGRACIÓN: baja lógica de categorías
-- ============================================================
-- Ejecútela UNA vez en Supabase → SQL Editor (es segura de repetir).
--
-- Antes, "eliminar" una categoría la borraba y sus productos quedaban
-- "sin categoría" para siempre. Ahora se DESHABILITA (activa = false):
--   * deja de ofrecerse al registrar productos,
--   * los productos conservan su categoría,
--   * el ADMIN puede reactivarla desde "Productos y Categorías".
-- ============================================================

alter table categorias
  add column if not exists activa boolean not null default true;

comment on column categorias.activa is
  'Baja lógica: false = deshabilitada. Solo un ADMIN puede deshabilitarla o reactivarla.';

-- Verificación: debe listar sus categorías con activa = true
select nombre, activa from categorias order by nombre;
