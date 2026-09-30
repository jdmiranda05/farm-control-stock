-- ============================================================================
--  DATOS SEMILLA (DEMO) — Botica de prueba lista para sustentar
--
--  Ejecutar DESPUÉS de esquema.sql.
--
--  Las fechas de vencimiento son RELATIVAS a hoy (current_date + N), así la
--  demostración siempre muestra los tres estados, sin importar el día de la
--  sustentación. Los datos cubren a propósito todos los casos:
--
--   ESTADO DE STOCK (stock vs. stock_minimo)
--     VERDE    -> Paracetamol, Omeprazol, Complejo B, Vitamina C
--     AMARILLO -> Ibuprofeno, Amoxicilina
--     ROJO     -> Loratadina (sin stock), Diclofenaco (bajo la mitad)
--
--   ESTADO DE VENCIMIENTO
--     AMARILLO -> Paracetamol (25 días), Complejo B (12 días)
--     ROJO     -> Amoxicilina (lote vencido con mercadería sin declarar)
--
--   Además: un lote con blísters sueltos (caja ya abierta), dos ventas del
--   día y una merma registrada, para que los reportes no salgan vacíos.
-- ============================================================================

-- ============================================================
-- 1) BOTICA DE DEMOSTRACIÓN (el "tenant" de prueba)
-- ============================================================
insert into boticas (id, nombre, ruc, direccion, telefono, dias_alerta_vencimiento) values
  ('11111111-1111-4111-8111-111111111111',
   'Botica San Rafael',
   '20123456789',
   'Av. Los Próceres 456, San Juan de Lurigancho, Lima',
   '01-555-1234',
   30);

-- ============================================================
-- 2) PROVEEDORES
-- ============================================================
insert into proveedores (id, botica_id, nombre, ruc, telefono, contacto) values
  ('dddd0000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
   'Droguería Farmacéutica del Norte S.A.C.', '20456789123', '01-444-7788', 'Carlos Mendoza'),
  ('dddd0000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111',
   'Distribuidora Medifarma Perú', '20987654321', '01-333-5566', 'Lucía Vargas'),
  ('dddd0000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111',
   'Laboratorios Genfar Distribución', '20678901234', '01-222-9900', 'Jorge Ríos');

-- ============================================================
-- 3) CATEGORÍAS
-- ============================================================
insert into categorias (id, botica_id, nombre, descripcion) values
  ('aaaa0000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Analgésicos',             'Alivio del dolor y fiebre'),
  ('aaaa0000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'Antiinflamatorios',       'AINEs y afines'),
  ('aaaa0000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'Antibióticos',            'Venta bajo receta médica'),
  ('aaaa0000-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', 'Gastrointestinal',        'Protectores gástricos y digestivos'),
  ('aaaa0000-0000-4000-8000-000000000005', '11111111-1111-4111-8111-111111111111', 'Antialérgicos',           'Antihistamínicos'),
  ('aaaa0000-0000-4000-8000-000000000006', '11111111-1111-4111-8111-111111111111', 'Vitaminas y Suplementos', 'Multivitamínicos y minerales');

-- ============================================================
-- 4) PRODUCTOS
-- ============================================================
-- `unidades_por_caja` = cuántos blísters trae la caja.
-- Los productos que se venden solo por unidad (frascos, geles) llevan 1.
-- `stock_minimo` se expresa SIEMPRE en blísters (unidad base).
insert into productos (id, botica_id, categoria_id, codigo, nombre, presentacion, laboratorio,
                       unidades_por_caja, precio_caja, precio_blister, stock_minimo, requiere_receta) values
  -- VERDE en stock · AMARILLO en vencimiento (un lote vence en 25 días)
  ('bbbb0000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'aaaa0000-0000-4000-8000-000000000001',
   'PAR-500', 'Paracetamol 500 mg', 'Caja x 10 blísters de 10 tabletas', 'Farmindustria',
   10, 6.50, 0.80, 30, false),
  -- AMARILLO en stock (20 blísters con mínimo 25)
  ('bbbb0000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'aaaa0000-0000-4000-8000-000000000002',
   'IBU-400', 'Ibuprofeno 400 mg', 'Caja x 10 blísters de 10 tabletas', 'Genfar',
   10, 9.00, 1.10, 25, false),
  -- AMARILLO en stock · ROJO en vencimiento (lote vencido sin declarar)
  ('bbbb0000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'aaaa0000-0000-4000-8000-000000000003',
   'AMX-500', 'Amoxicilina 500 mg', 'Caja x 20 blísters de 5 cápsulas', 'Medifarma',
   20, 24.00, 1.50, 20, true),
  -- VERDE
  ('bbbb0000-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', 'aaaa0000-0000-4000-8000-000000000004',
   'OME-020', 'Omeprazol 20 mg', 'Caja x 6 blísters de 10 cápsulas', 'Portugal',
   6, 7.20, 1.40, 15, false),
  -- ROJO: producto sin lotes (stock 0)
  ('bbbb0000-0000-4000-8000-000000000005', '11111111-1111-4111-8111-111111111111', 'aaaa0000-0000-4000-8000-000000000005',
   'LOR-010', 'Loratadina 10 mg', 'Caja x 10 blísters de 10 tabletas', 'Genfar',
   10, 6.00, 0.90, 15, false),
  -- VERDE en stock · AMARILLO en vencimiento (12 días) · se vende por unidad
  ('bbbb0000-0000-4000-8000-000000000006', '11111111-1111-4111-8111-111111111111', 'aaaa0000-0000-4000-8000-000000000006',
   'CPB-120', 'Complejo B Jarabe 120 ml', 'Frasco 120 ml', 'Hersil',
   1, 12.50, 12.50, 10, false),
  -- VERDE
  ('bbbb0000-0000-4000-8000-000000000007', '11111111-1111-4111-8111-111111111111', 'aaaa0000-0000-4000-8000-000000000006',
   'VTC-500', 'Vitamina C 500 mg', 'Frasco x 100 tabletas', 'Induquímica',
   1, 18.00, 18.00, 8, false),
  -- ROJO: 4 unidades con mínimo 10 (por debajo de la mitad)
  ('bbbb0000-0000-4000-8000-000000000008', '11111111-1111-4111-8111-111111111111', 'aaaa0000-0000-4000-8000-000000000002',
   'DIC-GEL', 'Diclofenaco Gel 1 %', 'Tubo 50 g', 'Genfar',
   1, 9.90, 9.90, 10, false);

-- ============================================================
-- 5) LOTES (stock desglosado en cajas cerradas + blísters sueltos)
-- ============================================================
insert into lotes (id, botica_id, producto_id, proveedor_id, numero_lote, fecha_vencimiento,
                   cajas_iniciales, cajas_completas, blisters_sueltos, costo_caja) values
  -- Paracetamol: lote lejano (8 cajas = 80 blísters)
  ('cccc0000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
   'bbbb0000-0000-4000-8000-000000000001', 'dddd0000-0000-4000-8000-000000000001',
   'L-PAR-2601', current_date + 240, 10, 8, 0, 4.20),
  -- Paracetamol: lote que vence en 25 días, con una CAJA YA ABIERTA
  -- (3 cajas cerradas + 7 blísters sueltos = 37 blísters). Así se ve en la
  -- demo cómo queda un lote después de vender blísters sueltos.
  ('cccc0000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111',
   'bbbb0000-0000-4000-8000-000000000001', 'dddd0000-0000-4000-8000-000000000001',
   'L-PAR-2542', current_date + 25, 4, 3, 7, 4.10),
  -- Ibuprofeno: 2 cajas = 20 blísters (mínimo 25 -> AMARILLO)
  ('cccc0000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111',
   'bbbb0000-0000-4000-8000-000000000002', 'dddd0000-0000-4000-8000-000000000003',
   'L-IBU-2588', current_date + 120, 6, 2, 0, 6.30),
  -- Amoxicilina: lote VENCIDO hace 15 días con 2 cajas (40 blísters) sin declarar
  ('cccc0000-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111',
   'bbbb0000-0000-4000-8000-000000000003', 'dddd0000-0000-4000-8000-000000000002',
   'L-AMX-2410', current_date - 15, 3, 2, 0, 16.00),
  -- Amoxicilina: lote vigente con 1 caja = 20 blísters
  ('cccc0000-0000-4000-8000-000000000005', '11111111-1111-4111-8111-111111111111',
   'bbbb0000-0000-4000-8000-000000000003', 'dddd0000-0000-4000-8000-000000000002',
   'L-AMX-2603', current_date + 180, 2, 1, 0, 16.50),
  -- Omeprazol: 10 cajas = 60 blísters
  ('cccc0000-0000-4000-8000-000000000006', '11111111-1111-4111-8111-111111111111',
   'bbbb0000-0000-4000-8000-000000000004', 'dddd0000-0000-4000-8000-000000000002',
   'L-OME-2615', current_date + 300, 10, 10, 0, 5.00),
  -- Complejo B: vence en 12 días (18 frascos)
  ('cccc0000-0000-4000-8000-000000000007', '11111111-1111-4111-8111-111111111111',
   'bbbb0000-0000-4000-8000-000000000006', 'dddd0000-0000-4000-8000-000000000001',
   'L-CPB-2570', current_date + 12, 20, 18, 0, 8.00),
  -- Vitamina C: 90 frascos
  ('cccc0000-0000-4000-8000-000000000008', '11111111-1111-4111-8111-111111111111',
   'bbbb0000-0000-4000-8000-000000000007', 'dddd0000-0000-4000-8000-000000000001',
   'L-VTC-2640', current_date + 400, 90, 90, 0, 11.00),
  -- Diclofenaco gel: solo 4 tubos (mínimo 10 -> ROJO)
  ('cccc0000-0000-4000-8000-000000000009', '11111111-1111-4111-8111-111111111111',
   'bbbb0000-0000-4000-8000-000000000008', 'dddd0000-0000-4000-8000-000000000003',
   'L-DIC-2596', current_date + 60, 30, 4, 0, 6.20);

-- ============================================================
-- 6) KARDEX: entradas iniciales (recepción de cada lote)
-- ============================================================
-- Se genera una ENTRADA_MANUAL por lote, valorizada al costo de compra.
insert into movimientos_kardex (botica_id, producto_id, lote_id, proveedor_id, usuario_id,
                                tipo, cantidad, unidad, cantidad_blisters, valor_soles, motivo, creado_en)
select
  l.botica_id,
  l.producto_id,
  l.id,
  l.proveedor_id,
  null,                                            -- carga inicial del sistema
  'ENTRADA_MANUAL',
  l.cajas_iniciales,
  'CAJA',
  l.cajas_iniciales * p.unidades_por_caja,
  round(l.cajas_iniciales * l.costo_caja, 2),
  'Inventario inicial (datos de demostración)',
  now() - interval '2 days'
from lotes l
join productos p on p.id = l.producto_id
where l.cajas_iniciales > 0;

-- ============================================================
-- 7) VENTAS DE EJEMPLO (del día de hoy, para el reporte diario)
-- ============================================================
-- Nota académica: el stock de los lotes de arriba YA refleja estas ventas;
-- aquí solo se registra el histórico para que los reportes tengan datos.
insert into ventas (id, botica_id, usuario_id, numero_comprobante, total_soles, creado_en) values
  ('eeee0000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
   null, 'V-000001', 9.10, now() - interval '3 hours'),
  ('eeee0000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111',
   null, 'V-000002', 24.00, now() - interval '1 hour');

insert into detalles_venta (venta_id, producto_id, modalidad, cantidad, precio_unitario, subtotal) values
  -- Venta 1: 3 blísters de Paracetamol + 1 caja de Omeprazol
  ('eeee0000-0000-4000-8000-000000000001', 'bbbb0000-0000-4000-8000-000000000001', 'BLISTER', 3, 0.80, 2.40),
  ('eeee0000-0000-4000-8000-000000000001', 'bbbb0000-0000-4000-8000-000000000004', 'CAJA',    1, 7.20, 7.20),
  -- Venta 2: 1 caja de Amoxicilina
  ('eeee0000-0000-4000-8000-000000000002', 'bbbb0000-0000-4000-8000-000000000003', 'CAJA',    1, 24.00, 24.00);

insert into movimientos_kardex (botica_id, producto_id, lote_id, venta_id, usuario_id,
                                tipo, cantidad, unidad, cantidad_blisters, valor_soles, motivo, creado_en) values
  ('11111111-1111-4111-8111-111111111111', 'bbbb0000-0000-4000-8000-000000000001',
   'cccc0000-0000-4000-8000-000000000002', 'eeee0000-0000-4000-8000-000000000001', null,
   'SALIDA_VENTA', 3, 'BLISTER', 3, 2.40, 'Venta V-000001', now() - interval '3 hours'),
  ('11111111-1111-4111-8111-111111111111', 'bbbb0000-0000-4000-8000-000000000004',
   'cccc0000-0000-4000-8000-000000000006', 'eeee0000-0000-4000-8000-000000000001', null,
   'SALIDA_VENTA', 1, 'CAJA', 6, 7.20, 'Venta V-000001', now() - interval '3 hours'),
  ('11111111-1111-4111-8111-111111111111', 'bbbb0000-0000-4000-8000-000000000003',
   'cccc0000-0000-4000-8000-000000000005', 'eeee0000-0000-4000-8000-000000000002', null,
   'SALIDA_VENTA', 1, 'CAJA', 20, 24.00, 'Venta V-000002', now() - interval '1 hour');

-- ============================================================
-- 8) MERMA REGISTRADA DE EJEMPLO
-- ============================================================
-- Una caja de Amoxicilina del lote vencido, declarada como pérdida.
-- Valorizada al COSTO de compra: 1 caja * S/ 16.00 = S/ 16.00
insert into movimientos_kardex (botica_id, producto_id, lote_id, usuario_id,
                                tipo, cantidad, unidad, cantidad_blisters, valor_soles, motivo, creado_en) values
  ('11111111-1111-4111-8111-111111111111', 'bbbb0000-0000-4000-8000-000000000003',
   'cccc0000-0000-4000-8000-000000000004', null,
   'SALIDA_MERMA', 1, 'CAJA', 20, 16.00,
   'Retiro de mercadería vencida (lote L-AMX-2410)', now() - interval '5 hours');


-- ============================================================
-- 9) VINCULAR LOS USUARIOS DE PRUEBA  (último paso, léalo con calma)
-- ============================================================
-- ¿Por qué hace falta este paso?
--   * Supabase Auth guarda las CREDENCIALES (correo y contraseña) en su
--     tabla interna `auth.users`, que este script no puede llenar.
--   * La tabla `usuarios` guarda el PERFIL de negocio (rol y botica).
--   * Ambas se conectan porque comparten EL MISMO UUID.
--
-- PASO A) Cree cada usuario en el panel de Supabase:
--         Authentication -> Users -> "Add user" -> "Create new user"
--            Email:    admin@sanrafael.pe
--            Password: la que usará para entrar
--            Marque "Auto Confirm User"
--         Repita con almacen@sanrafael.pe y vendedor@sanrafael.pe si desea
--         demostrar los tres roles en la sustentación.
--
-- PASO B) Ejecute el bloque de abajo. No necesita copiar ningún UUID: el
--         SELECT lo busca solo por el correo. Si un usuario todavía no
--         existe en Auth, esa línea simplemente no inserta nada.
--
-- PASO C) Verifique con la consulta del final.

insert into usuarios (id, botica_id, nombre_completo, correo, rol)
select au.id, '11111111-1111-4111-8111-111111111111', datos.nombre, au.email, datos.rol::rol_usuario
from (values
  ('admin@botica.pe',    'Ana Quispe Ramos',      'ADMIN'),
  ('almacen@botica.pe',  'Luis Huamán Ccopa',     'ALMACENERO'),
  ('vendedor@botica.pe', 'María Flores Tineo',    'VENDEDOR')
) as datos(correo, nombre, rol)
join auth.users au on au.email = datos.correo
on conflict (id) do update
  set rol = excluded.rol,
      nombre_completo = excluded.nombre_completo,
      botica_id = excluded.botica_id;

-- VERIFICACIÓN: debe listar un usuario por cada correo que creó en Auth.
-- Si aparece vacío, el correo del paso A no coincide con el de arriba.
select u.correo, u.nombre_completo, u.rol, b.nombre as botica
from usuarios u
join boticas b on b.id = u.botica_id;
