begin;

alter table public.productos add column if not exists imagen_url text;

create or replace view vista_stock_productos
with (security_invoker = on)
as
with stock_por_producto as (
  select
    p.id as producto_id,
    -- Stock DISPONIBLE (excluye lotes ya vencidos), en blísters:
    coalesce(sum(
      (l.cajas_completas * p.unidades_por_caja + l.blisters_sueltos)
    ) filter (where l.fecha_vencimiento >= current_date), 0)::integer as stock_blisters,
    coalesce(sum(l.cajas_completas)
      filter (where l.fecha_vencimiento >= current_date), 0)::integer as cajas_disponibles,
    coalesce(sum(l.blisters_sueltos)
      filter (where l.fecha_vencimiento >= current_date), 0)::integer as blisters_sueltos,
    -- Unidades atrapadas en lotes vencidos (merma potencial):
    coalesce(sum(
      (l.cajas_completas * p.unidades_por_caja + l.blisters_sueltos)
    ) filter (where l.fecha_vencimiento < current_date), 0)::integer as blisters_vencidos,
    min(l.fecha_vencimiento) filter (
      where l.fecha_vencimiento >= current_date
        and (l.cajas_completas > 0 or l.blisters_sueltos > 0)
    ) as proxima_fecha_vencimiento
  from productos p
  left join lotes l on l.producto_id = p.id
  group by p.id
)
select
  p.id,
  p.botica_id,
  p.codigo,
  p.nombre,
  p.presentacion,
  p.laboratorio,
  p.categoria_id,
  c.nombre as categoria_nombre,
  p.unidades_por_caja,
  p.precio_caja,
  p.precio_blister,
  p.stock_minimo,
  p.requiere_receta,
  p.activo,

  s.stock_blisters,
  s.cajas_disponibles,
  s.blisters_sueltos,
  s.blisters_vencidos,
  s.proxima_fecha_vencimiento,
  (s.proxima_fecha_vencimiento - current_date) as dias_para_vencer,

  -- A) Semáforo por STOCK (requisito 5)
  case
    when s.stock_blisters = 0
      or s.stock_blisters::numeric <= (p.stock_minimo::numeric / 2) then 'ROJO'
    when s.stock_blisters <= p.stock_minimo                          then 'AMARILLO'
    else 'VERDE'
  end as estado_stock,

  -- B) Semáforo por VENCIMIENTO
  case
    when s.blisters_vencidos > 0 then 'ROJO'
    when (s.proxima_fecha_vencimiento - current_date) <= b.dias_alerta_vencimiento
      then 'AMARILLO'
    else 'VERDE'
  end as estado_vencimiento,
  p.imagen_url
from productos p
join boticas b            on b.id = p.botica_id
join stock_por_producto s on s.producto_id = p.id
left join categorias c    on c.id = p.categoria_id;

commit;
