-- ============================================================================
--  SISTEMA SAAS MULTI-TENANT DE GESTIÓN PARA BOTICAS  —  ESQUEMA v2
--  Inventario · Kardex · Ventas (POS) · Reportes · Merma
--  Base de datos: Supabase (PostgreSQL 15+)
--
--  CÓMO EJECUTARLO: Supabase Studio → SQL Editor → pegar todo → Run.
--  Después ejecute supabase/semilla.sql.
--
--  IMPORTANTE: el bloque 0 BORRA las tablas de la versión anterior para
--  recrearlas con la estructura nueva. Es seguro durante el desarrollo
--  académico (los datos son de demostración). Si tuviera datos que desea
--  conservar, expórtelos antes desde Table Editor.
--
--  CONCEPTOS CLAVE DEL MODELO:
--   * Multi-inquilino: todas las boticas comparten tablas; cada fila lleva
--     `botica_id` y el backend filtra siempre por él (+ RLS como respaldo).
--   * Unidad base = BLISTER. Una caja contiene `unidades_por_caja` blísters.
--     El stock de un lote se guarda desglosado en cajas cerradas + blísters
--     sueltos, para poder representar la "apertura de caja" que hace el POS.
--   * Kardex: toda entrada/salida queda registrada en `movimientos_kardex`.
-- ============================================================================



-- ============================================================
-- 1) TIPOS ENUMERADOS
--    (deben coincidir con packages/comun/src/tipos/enumeraciones.ts)
-- ============================================================

-- Los TRES roles del sistema (RBAC):
--   ADMIN      -> control total: configuración, reactivar productos, corregir kardex
--   ALMACENERO -> entradas manuales de mercadería, lotes, proveedores y merma
--   VENDEDOR   -> solo el punto de venta (POS): consulta stock y vende
create type rol_usuario as enum ('ADMIN', 'ALMACENERO', 'VENDEDOR');

-- Tipos de movimiento del Kardex:
create type tipo_movimiento_kardex as enum (
  'ENTRADA_MANUAL',  -- recepción de compra a un proveedor (la registra el almacenero)
  'SALIDA_VENTA',    -- descuento AUTOMÁTICO generado por una venta del POS
  'SALIDA_MERMA',    -- pérdida por vencimiento o daño (se valoriza en soles)
  'AJUSTE_ADMIN'     -- corrección manual hecha por un ADMIN
);

-- Unidad en la que se expresa un movimiento o una línea de venta:
create type unidad_empaque as enum ('CAJA', 'BLISTER');

create type tipo_alerta   as enum ('STOCK_MINIMO', 'VENCIMIENTO_PROXIMO', 'VENCIDO');
create type estado_alerta as enum ('ACTIVA', 'RESUELTA');


-- ============================================================
-- 2) `boticas` — el inquilino (tenant) del SaaS
-- ============================================================
create table boticas (
  id                       uuid primary key default gen_random_uuid(),
  nombre                   text not null,
  ruc                      varchar(11),
  direccion                text,
  telefono                 text,
  -- Días de anticipación con los que se avisa un vencimiento próximo
  dias_alerta_vencimiento  integer not null default 30
                           check (dias_alerta_vencimiento between 1 and 365),
  activa                   boolean not null default true,
  creado_en                timestamptz not null default now(),
  actualizado_en           timestamptz not null default now()
);

comment on table boticas is 'Organizaciones (tenants) del SaaS. Cada botica es independiente.';


-- ============================================================
-- 3) `usuarios` — perfil de negocio ligado a Supabase Auth
-- ============================================================
-- El `id` es el MISMO UUID que Supabase Auth crea en auth.users.
create table usuarios (
  id               uuid primary key references auth.users (id) on delete cascade,
  botica_id        uuid not null references boticas (id) on delete cascade,
  nombre_completo  text not null,
  correo           text not null unique,
  rol              rol_usuario not null default 'VENDEDOR',
  activo           boolean not null default true,
  creado_en        timestamptz not null default now()
);

create index idx_usuarios_botica on usuarios (botica_id);


-- ============================================================
-- 4) `proveedores` — laboratorios y distribuidoras
-- ============================================================
create table proveedores (
  id         uuid primary key default gen_random_uuid(),
  botica_id  uuid not null references boticas (id) on delete cascade,
  nombre     text not null,
  ruc        varchar(11),
  telefono   text,
  contacto   text,                      -- nombre del ejecutivo de ventas asignado
  activo     boolean not null default true,
  creado_en  timestamptz not null default now(),
  constraint uq_proveedor_por_botica unique (botica_id, nombre)
);

create index idx_proveedores_botica on proveedores (botica_id);


-- ============================================================
-- 5) `categorias`
-- ============================================================
create table categorias (
  id           uuid primary key default gen_random_uuid(),
  botica_id    uuid not null references boticas (id) on delete cascade,
  nombre       text not null,
  descripcion  text,
  creado_en    timestamptz not null default now(),
  constraint uq_categoria_por_botica unique (botica_id, nombre)
);

create index idx_categorias_botica on categorias (botica_id);


-- ============================================================
-- 6) `productos` — catálogo (el stock vive en `lotes`)
-- ============================================================
create table productos (
  id               uuid primary key default gen_random_uuid(),
  botica_id        uuid not null references boticas (id) on delete cascade,
  categoria_id     uuid references categorias (id) on delete set null,
  codigo           text,                 -- código interno o de barras
  nombre           text not null,
  presentacion     text,
  laboratorio      text,
  requiere_receta  boolean not null default false,

  -- ---- Empaque y precios (requisito: venta por caja y por blíster) ----
  -- Cuántos blísters trae una caja. Ej.: 1 caja de Amoxicilina = 20 blísters.
  unidades_por_caja integer not null default 1 check (unidades_por_caja >= 1),
  precio_caja       numeric(10, 2) not null default 0 check (precio_caja >= 0),
  precio_blister    numeric(10, 2) not null default 0 check (precio_blister >= 0),

  -- Umbral de la alerta de stock, expresado en BLISTERS (unidad base).
  stock_minimo     integer not null default 10 check (stock_minimo >= 0),

  -- Baja lógica: `activo = false`. Solo un ADMIN puede reactivarlo.
  activo           boolean not null default true,
  creado_en        timestamptz not null default now(),
  actualizado_en   timestamptz not null default now(),
  constraint uq_producto_codigo_por_botica unique (botica_id, codigo)
);

create index idx_productos_botica        on productos (botica_id);
create index idx_productos_botica_nombre on productos (botica_id, nombre);

comment on column productos.stock_minimo is
  'Umbral mínimo expresado en BLISTERS (unidad base del sistema).';


-- ============================================================
-- 7) `lotes` — control de vencimientos (FEFO) y stock desglosado
-- ============================================================
-- El stock se guarda en DOS columnas para poder representar la apertura
-- automática de cajas que exige el punto de venta:
--    cajas_completas   -> cajas cerradas, sin abrir
--    blisters_sueltos  -> blísters de una caja que ya fue abierta
-- Stock total en blísters = cajas_completas * unidades_por_caja + blisters_sueltos
create table lotes (
  id                uuid primary key default gen_random_uuid(),
  botica_id         uuid not null references boticas (id) on delete cascade,
  producto_id       uuid not null references productos (id) on delete cascade,
  proveedor_id      uuid references proveedores (id) on delete set null,
  numero_lote       text not null,
  fecha_vencimiento date not null,

  cajas_iniciales   integer not null check (cajas_iniciales >= 0),
  cajas_completas   integer not null check (cajas_completas  >= 0),
  blisters_sueltos  integer not null default 0 check (blisters_sueltos >= 0),

  -- Costo de COMPRA de una caja: base del cálculo de merma en soles.
  costo_caja        numeric(10, 2) not null default 0 check (costo_caja >= 0),

  creado_en         timestamptz not null default now(),
  constraint uq_lote_por_producto unique (producto_id, numero_lote)
);

-- Índice clave para FEFO (primero en vencer, primero en salir):
create index idx_lotes_botica_vencimiento on lotes (botica_id, fecha_vencimiento);
create index idx_lotes_producto           on lotes (producto_id);


-- ============================================================
-- 8) `ventas` y `detalles_venta` — punto de venta (POS)
-- ============================================================
create table ventas (
  id                  uuid primary key default gen_random_uuid(),
  botica_id           uuid not null references boticas (id) on delete cascade,
  usuario_id          uuid references usuarios (id) on delete set null,
  numero_comprobante  text not null,          -- ej. "V-000012"
  total_soles         numeric(10, 2) not null check (total_soles >= 0),
  creado_en           timestamptz not null default now(),
  constraint uq_comprobante_por_botica unique (botica_id, numero_comprobante)
);

create index idx_ventas_botica_fecha on ventas (botica_id, creado_en desc);

create table detalles_venta (
  id               uuid primary key default gen_random_uuid(),
  venta_id         uuid not null references ventas (id) on delete cascade,
  producto_id      uuid not null references productos (id) on delete restrict,
  modalidad        unidad_empaque not null,            -- vendido por CAJA o por BLISTER
  cantidad         integer not null check (cantidad > 0),
  precio_unitario  numeric(10, 2) not null check (precio_unitario >= 0),
  subtotal         numeric(10, 2) not null check (subtotal >= 0)
);

create index idx_detalles_venta on detalles_venta (venta_id);


-- ============================================================
-- 9) `movimientos_kardex` — historial completo de existencias
-- ============================================================
create table movimientos_kardex (
  id           uuid primary key default gen_random_uuid(),
  botica_id    uuid not null references boticas (id) on delete cascade,
  producto_id  uuid not null references productos (id) on delete cascade,
  lote_id      uuid references lotes (id) on delete set null,
  proveedor_id uuid references proveedores (id) on delete set null,
  venta_id     uuid references ventas (id) on delete set null,
  usuario_id   uuid references usuarios (id) on delete set null,

  tipo         tipo_movimiento_kardex not null,
  -- Cantidad tal como la vio el usuario (ej. 3 CAJAS) ...
  cantidad     integer not null check (cantidad > 0),
  unidad       unidad_empaque not null,
  -- ... y la MISMA cantidad normalizada a blísters, para poder sumar y
  -- comparar movimientos heterogéneos sin recalcular conversiones.
  cantidad_blisters integer not null check (cantidad_blisters > 0),
  -- Valorización en soles (costo en entradas/merma, precio de venta en salidas)
  valor_soles  numeric(10, 2) not null default 0 check (valor_soles >= 0),
  motivo       text,

  -- Trazabilidad de correcciones administrativas (solo el rol ADMIN):
  editado      boolean not null default false,
  editado_por  uuid references usuarios (id) on delete set null,
  editado_en   timestamptz,

  creado_en    timestamptz not null default now()
);

-- El kardex se consulta por botica y fecha (reporte diario y paginación):
create index idx_kardex_botica_fecha on movimientos_kardex (botica_id, creado_en desc);
create index idx_kardex_producto     on movimientos_kardex (producto_id);
create index idx_kardex_tipo         on movimientos_kardex (botica_id, tipo);


-- ============================================================
-- 10) `alertas`
-- ============================================================
create table alertas (
  id           uuid primary key default gen_random_uuid(),
  botica_id    uuid not null references boticas (id) on delete cascade,
  tipo         tipo_alerta not null,
  producto_id  uuid references productos (id) on delete cascade,
  lote_id      uuid references lotes (id) on delete cascade,
  mensaje      text not null,
  estado       estado_alerta not null default 'ACTIVA',
  leida        boolean not null default false,
  creado_en    timestamptz not null default now(),
  resuelto_en  timestamptz
);

create index idx_alertas_botica_estado on alertas (botica_id, estado);

-- Evita alertas duplicadas: una sola ACTIVA por (botica, tipo, producto, lote).
create unique index uq_alerta_activa
  on alertas (botica_id, tipo, producto_id, lote_id)
  nulls not distinct
  where estado = 'ACTIVA';


-- ============================================================
-- 11) TRIGGER — mantener `actualizado_en`
-- ============================================================
create or replace function fn_actualizar_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

create trigger tg_boticas_actualizado
  before update on boticas
  for each row execute function fn_actualizar_timestamp();

create trigger tg_productos_actualizado
  before update on productos
  for each row execute function fn_actualizar_timestamp();


-- ============================================================
-- 12) VISTA `vista_stock_productos` — stock consolidado + semáforos
-- ============================================================
-- Entrega en una sola consulta todo lo que necesitan el catálogo y el panel:
--
--  A) ESTADO DE STOCK (regla del requisito 5, se muestra en "Productos"):
--       ROJO     -> stock = 0  o  stock <= stock_minimo / 2
--       AMARILLO -> stock <= stock_minimo  (pero mayor que la mitad)
--       VERDE    -> stock > stock_minimo
--
--  B) ESTADO DE VENCIMIENTO (alimenta las alertas y el panel):
--       ROJO -> hay unidades vencidas · AMARILLO -> vence dentro del
--       parámetro de la botica · VERDE -> en orden
--
-- `security_invoker = on` -> la vista respeta el RLS de quien consulta.
create view vista_stock_productos
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
  end as estado_vencimiento
from productos p
join boticas b            on b.id = p.botica_id
join stock_por_producto s on s.producto_id = p.id
left join categorias c    on c.id = p.categoria_id;


-- ============================================================
-- 13) VISTA `vista_merma_productos` — pérdidas económicas en soles
-- ============================================================
-- Distingue dos conceptos que se sustentan de forma distinta:
--   * merma_registrada_soles -> pérdidas YA declaradas (movimientos SALIDA_MERMA)
--   * merma_potencial_soles  -> stock vencido que sigue en almacén sin declarar
-- Fórmula base: cantidad_en_blisters * costo_del_blister,
-- donde costo_del_blister = costo_caja / unidades_por_caja.
create view vista_merma_productos
with (security_invoker = on)
as
select
  p.id as producto_id,
  p.botica_id,
  p.nombre as producto_nombre,
  p.codigo,

  -- Merma ya registrada en el kardex
  coalesce((
    select sum(k.valor_soles)
    from movimientos_kardex k
    where k.producto_id = p.id and k.tipo = 'SALIDA_MERMA'
  ), 0)::numeric(12, 2) as merma_registrada_soles,
  coalesce((
    select sum(k.cantidad_blisters)
    from movimientos_kardex k
    where k.producto_id = p.id and k.tipo = 'SALIDA_MERMA'
  ), 0)::integer as blisters_merma_registrada,

  -- Merma potencial: lo vencido que aún figura en los lotes
  coalesce(sum(
    (l.cajas_completas * p.unidades_por_caja + l.blisters_sueltos)
  ) filter (where l.fecha_vencimiento < current_date), 0)::integer
    as blisters_vencidos_sin_declarar,
  coalesce(sum(
    (l.cajas_completas * p.unidades_por_caja + l.blisters_sueltos)
    * (l.costo_caja / greatest(p.unidades_por_caja, 1))
  ) filter (where l.fecha_vencimiento < current_date), 0)::numeric(12, 2)
    as merma_potencial_soles
from productos p
left join lotes l on l.producto_id = p.id
group by p.id;


-- ============================================================
-- 14) ROW LEVEL SECURITY (aislamiento entre boticas)
-- ============================================================
-- El backend usa la clave `service_role` (omite RLS) y filtra por botica_id
-- en cada consulta. Estas políticas protegen el acceso directo con la clave
-- pública `anon` desde el navegador: defensa en profundidad.

create or replace function botica_usuario_actual()
returns uuid
language sql stable security definer set search_path = public
as $$
  select botica_id from usuarios where id = auth.uid();
$$;

create or replace function rol_usuario_actual()
returns rol_usuario
language sql stable security definer set search_path = public
as $$
  select rol from usuarios where id = auth.uid();
$$;

alter table boticas            enable row level security;
alter table usuarios           enable row level security;
alter table proveedores        enable row level security;
alter table categorias         enable row level security;
alter table productos          enable row level security;
alter table lotes              enable row level security;
alter table ventas             enable row level security;
alter table detalles_venta     enable row level security;
alter table movimientos_kardex enable row level security;
alter table alertas            enable row level security;

create policy "boticas_ver_propia" on boticas
  for select using (id = botica_usuario_actual());

create policy "boticas_editar_admin" on boticas
  for update using (id = botica_usuario_actual() and rol_usuario_actual() = 'ADMIN');

create policy "usuarios_ver_misma_botica" on usuarios
  for select using (id = auth.uid() or botica_id = botica_usuario_actual());

-- Regla única de aislamiento para las tablas operativas:
create policy "proveedores_aislamiento" on proveedores
  for all using (botica_id = botica_usuario_actual())
  with check (botica_id = botica_usuario_actual());

create policy "categorias_aislamiento" on categorias
  for all using (botica_id = botica_usuario_actual())
  with check (botica_id = botica_usuario_actual());

create policy "productos_aislamiento" on productos
  for all using (botica_id = botica_usuario_actual())
  with check (botica_id = botica_usuario_actual());

create policy "lotes_aislamiento" on lotes
  for all using (botica_id = botica_usuario_actual())
  with check (botica_id = botica_usuario_actual());

create policy "ventas_aislamiento" on ventas
  for all using (botica_id = botica_usuario_actual())
  with check (botica_id = botica_usuario_actual());

create policy "kardex_aislamiento" on movimientos_kardex
  for all using (botica_id = botica_usuario_actual())
  with check (botica_id = botica_usuario_actual());

create policy "alertas_aislamiento" on alertas
  for all using (botica_id = botica_usuario_actual())
  with check (botica_id = botica_usuario_actual());

-- Los detalles se filtran a través de su venta (no tienen botica_id propio):
create policy "detalles_venta_aislamiento" on detalles_venta
  for all using (
    exists (select 1 from ventas v
            where v.id = detalles_venta.venta_id
              and v.botica_id = botica_usuario_actual())
  )
  with check (
    exists (select 1 from ventas v
            where v.id = detalles_venta.venta_id
              and v.botica_id = botica_usuario_actual())
  );

-- ============================================================
-- FIN DEL ESQUEMA — continúe con supabase/semilla.sql
-- ============================================================
