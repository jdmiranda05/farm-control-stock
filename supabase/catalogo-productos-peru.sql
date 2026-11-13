-- ============================================================
-- CATÁLOGO AMPLIADO: productos frecuentes en boticas del Perú
-- ============================================================
-- Ejecútelo en Supabase → SQL Editor. Es seguro repetirlo: no duplica
-- categorías ni productos (usa ON CONFLICT ... DO NOTHING por código).
--
-- Qué contiene (40 productos en 13 categorías):
--   * Principios activos de la Lista de Medicamentos Esenciales y de alta
--     rotación en boticas peruanas, con presentaciones comerciales reales
--     (caja x N blísters, frasco, tubo, sobre).
--   * Laboratorios con presencia en el mercado peruano (Portugal,
--     Medifarma, Genfar, Farmindustria, IQFarma, Hersil, Teva, Bayer).
--   * Condición de venta: los antibióticos, antihipertensivos,
--     antidiabéticos, corticoides e inhaladores se marcan "requiere receta".
--
-- IMPORTANTE sobre los PRECIOS:
--   Son precios REFERENCIALES de venta al público en soles, en el rango
--   habitual de boticas independientes (2025-2026). Antes de usarlos en
--   producción, contrástelos con el Observatorio Peruano de Productos
--   Farmacéuticos de DIGEMID (observatorio.digemid.minsa.gob.pe), que
--   publica los precios reales por establecimiento.
--
-- El STOCK no se carga aquí: registre las entradas desde "Lotes e
-- Inventario" para que cada ingreso quede en el kardex con su lote,
-- vencimiento, proveedor y costo.
--
-- Reglas de empaque que cumple cada fila (las mismas que valida el sistema):
--   * Con blísters: unidades_por_caja >= 2, precio_blister < precio_caja
--     y precio_blister * unidades_por_caja >= precio_caja.
--   * Sin blísters (frascos, tubos, sobres, cajas que no se fraccionan):
--     unidades_por_caja = 1 y precio_blister = precio_caja.
--   * stock_minimo se expresa en blísters (o unidades si no tiene blísters).
-- ============================================================

do $$
declare
  -- Botica destino: la primera botica activa. Si tiene varias, cámbielo por
  --   (select id from boticas where ruc = 'SU_RUC')
  v_botica uuid := (select id from boticas where activa order by creado_en limit 1);
begin
  if v_botica is null then
    raise exception 'No hay ninguna botica activa registrada';
  end if;

  -- ---------- Categorías ----------
  insert into categorias (botica_id, nombre, descripcion)
  select v_botica, c.nombre, c.descripcion
  from (values
    ('Analgésicos',            'Alivio del dolor y la fiebre'),
    ('Antiinflamatorios',      'AINEs de uso oral y pediátrico'),
    ('Antialérgicos',          'Antihistamínicos'),
    ('Antigripales',           'Combinaciones para síntomas de resfrío'),
    ('Respiratorio',           'Antitusivos, mucolíticos y broncodilatadores'),
    ('Antibióticos',           'Venta exclusiva con receta médica'),
    ('Cardiovascular',         'Antihipertensivos, hipolipemiantes y antiagregantes'),
    ('Antidiabéticos',         'Hipoglucemiantes orales'),
    ('Gastrointestinal',       'Antiácidos, antiespasmódicos, antidiarreicos y rehidratación'),
    ('Vitaminas y suplementos','Hierro, ácido fólico y multivitamínicos'),
    ('Dermatológicos',         'Cremas y ungüentos de uso tópico'),
    ('Antiparasitarios',       'Antihelmínticos'),
    ('Primeros auxilios',      'Antisépticos, curación y material médico')
  ) as c(nombre, descripcion)
  on conflict (botica_id, nombre) do nothing;

  -- ---------- Productos ----------
  insert into productos (
    botica_id, codigo, nombre, categoria_id, presentacion, laboratorio,
    requiere_receta, unidades_por_caja, precio_caja, precio_blister, stock_minimo
  )
  select
    v_botica, p.codigo, p.nombre, cat.id, p.presentacion, p.laboratorio,
    p.receta, p.unidades, p.precio_caja, p.precio_blister, p.minimo
  from (values
    -- codigo,    nombre,                                              categoría,                 presentación,                          laboratorio,           receta, blíst/caja, S/ caja, S/ blíster, mínimo
    -- Analgésicos y antiinflamatorios
    ('PAR-JBE',  'Paracetamol 120 mg/5 ml jarabe',                     'Analgésicos',             'Frasco x 60 ml',                      'Laboratorios Portugal', false, 1,  4.50,  4.50, 10),
    ('PAR-GOT',  'Paracetamol 100 mg/ml gotas',                        'Analgésicos',             'Frasco gotero x 15 ml',               'Medifarma',            false, 1,  5.50,  5.50,  8),
    ('NAP-550',  'Naproxeno sódico 550 mg',                            'Antiinflamatorios',       'Caja x 10 blísters de 10 tabletas',   'Genfar',               false, 10, 12.00, 1.50, 20),
    ('DIC-050',  'Diclofenaco sódico 50 mg',                           'Antiinflamatorios',       'Caja x 10 blísters de 10 tabletas',   'Farmindustria',        false, 10,  8.00, 1.00, 20),
    ('IBU-SUS',  'Ibuprofeno 100 mg/5 ml suspensión',                  'Antiinflamatorios',       'Frasco x 60 ml',                      'Laboratorios Portugal', false, 1,  6.50,  6.50, 10),
    ('KET-010',  'Ketorolaco trometamina 10 mg',                       'Antiinflamatorios',       'Caja x 10 blísters de 10 tabletas',   'Medifarma',            true,  10, 15.00, 1.80, 10),
    -- Antialérgicos y antigripales
    ('CET-010',  'Cetirizina 10 mg',                                   'Antialérgicos',           'Caja x 10 blísters de 10 tabletas',   'Genfar',               false, 10,  9.00, 1.10, 15),
    ('CLO-004',  'Clorfenamina maleato 4 mg',                          'Antialérgicos',           'Caja x 10 blísters de 10 tabletas',   'Laboratorios Portugal', false, 10, 5.00,  0.60, 15),
    ('DES-005',  'Desloratadina 5 mg',                                 'Antialérgicos',           'Caja x 3 blísters de 10 tabletas',    'Medifarma',            false, 3,  15.00, 5.50,  6),
    ('CLO-JBE',  'Clorfenamina maleato 2 mg/5 ml jarabe',              'Antialérgicos',           'Frasco x 120 ml',                     'Laboratorios Portugal', false, 1,  5.00,  5.00,  8),
    ('ANT-TAB',  'Paracetamol + Clorfenamina + Fenilefrina (antigripal)','Antigripales',          'Caja x 25 blísters de 4 tabletas',    'IQFarma',              false, 25, 25.00, 1.20, 30),
    -- Respiratorio
    ('AMB-JBE',  'Ambroxol 30 mg/5 ml jarabe',                         'Respiratorio',            'Frasco x 120 ml',                     'Laboratorios Portugal', false, 1,  7.80,  7.80, 10),
    ('DEX-JBE',  'Dextrometorfano 15 mg/5 ml jarabe',                  'Respiratorio',            'Frasco x 120 ml',                     'Medifarma',            false, 1,  9.50,  9.50,  8),
    ('SAL-INH',  'Salbutamol 100 mcg/dosis inhalador',                 'Respiratorio',            'Inhalador x 200 dosis',               'Teva',                 true,  1,  18.00, 18.00, 5),
    -- Antibióticos (con receta)
    ('AZI-500',  'Azitromicina 500 mg',                                'Antibióticos',            'Caja x 3 tabletas',                   'Genfar',               true,  1,  9.00,  9.00,  6),
    ('CIP-500',  'Ciprofloxacino 500 mg',                              'Antibióticos',            'Caja x 10 blísters de 10 tabletas',   'Genfar',               true,  10, 15.00, 1.80, 10),
    ('CFX-500',  'Cefalexina 500 mg',                                  'Antibióticos',            'Caja x 10 blísters de 10 cápsulas',   'Farmindustria',        true,  10, 28.00, 3.20, 10),
    ('AMC-875',  'Amoxicilina + Ácido clavulánico 875/125 mg',         'Antibióticos',            'Caja x 2 blísters de 7 tabletas',     'Medifarma',            true,  2,  32.00, 17.00, 4),
    ('AMX-SUS',  'Amoxicilina 250 mg/5 ml polvo para suspensión',      'Antibióticos',            'Frasco x 60 ml',                      'Laboratorios Portugal', true,  1,  6.90,  6.90,  8),
    ('SMX-800',  'Sulfametoxazol + Trimetoprima 800/160 mg',           'Antibióticos',            'Caja x 10 blísters de 10 tabletas',   'IQFarma',              true,  10, 12.00, 1.40, 10),
    -- Cardiovascular (con receta, salvo el ácido acetilsalicílico 100 mg)
    ('LOS-050',  'Losartán potásico 50 mg',                            'Cardiovascular',          'Caja x 10 blísters de 10 tabletas',   'Genfar',               true,  10, 10.00, 1.20, 20),
    ('ENA-010',  'Enalapril maleato 10 mg',                            'Cardiovascular',          'Caja x 10 blísters de 10 tabletas',   'Laboratorios Portugal', true, 10,  6.00, 0.70, 20),
    ('AML-005',  'Amlodipino 5 mg',                                    'Cardiovascular',          'Caja x 10 blísters de 10 tabletas',   'Medifarma',            true,  10,  8.00, 1.00, 20),
    ('ATO-020',  'Atorvastatina 20 mg',                                'Cardiovascular',          'Caja x 3 blísters de 10 tabletas',    'Genfar',               true,  3,  12.00, 4.50,  9),
    ('ASA-100',  'Ácido acetilsalicílico 100 mg',                      'Cardiovascular',          'Caja x 10 blísters de 10 tabletas',   'Bayer',                false, 10, 14.00, 1.60, 15),
    -- Antidiabéticos (con receta)
    ('MTF-850',  'Metformina clorhidrato 850 mg',                      'Antidiabéticos',          'Caja x 10 blísters de 10 tabletas',   'Farmindustria',        true,  10,  9.00, 1.10, 20),
    ('GLB-005',  'Glibenclamida 5 mg',                                 'Antidiabéticos',          'Caja x 10 blísters de 10 tabletas',   'Laboratorios Portugal', true, 10,  5.00, 0.60, 15),
    -- Gastrointestinal
    ('HIO-010',  'Hioscina butilbromuro 10 mg',                        'Gastrointestinal',        'Caja x 10 blísters de 10 tabletas',   'Medifarma',            false, 10, 14.00, 1.70, 15),
    ('LOP-002',  'Loperamida clorhidrato 2 mg',                        'Gastrointestinal',        'Caja x 10 blísters de 10 tabletas',   'Laboratorios Portugal', false, 10, 7.00, 0.90, 10),
    ('ANT-SUS',  'Hidróxido de aluminio + magnesio + simeticona suspensión','Gastrointestinal',   'Frasco x 150 ml',                     'Medifarma',            false, 1,  12.50, 12.50, 6),
    ('SRO-SOB',  'Sales de rehidratación oral',                        'Gastrointestinal',        'Sobre x 27.9 g (para 1 litro)',       'Laboratorios Portugal', false, 1,  1.50,  1.50, 30),
    -- Vitaminas y suplementos
    ('SFE-300',  'Sulfato ferroso 300 mg',                             'Vitaminas y suplementos', 'Caja x 10 blísters de 10 tabletas',   'Laboratorios Portugal', false, 10, 6.00, 0.70, 15),
    ('ACF-005',  'Ácido fólico 0.5 mg',                                'Vitaminas y suplementos', 'Caja x 10 blísters de 10 tabletas',   'IQFarma',              false, 10,  5.00, 0.60, 15),
    ('MUL-030',  'Multivitamínico con minerales',                      'Vitaminas y suplementos', 'Frasco x 30 tabletas',                'Hersil',               false, 1,  25.00, 25.00, 5),
    -- Dermatológicos
    ('CLT-CRM',  'Clotrimazol 1 % crema',                              'Dermatológicos',          'Tubo x 20 g',                         'Laboratorios Portugal', false, 1,  5.50,  5.50,  6),
    ('ACI-CRM',  'Aciclovir 5 % crema',                                'Dermatológicos',          'Tubo x 10 g',                         'Medifarma',            false, 1,  5.00,  5.00,  6),
    ('BET-CRM',  'Betametasona 0.05 % crema',                          'Dermatológicos',          'Tubo x 15 g',                         'Genfar',               true,  1,  6.00,  6.00,  5),
    -- Antiparasitarios
    ('ALB-400',  'Albendazol 400 mg',                                  'Antiparasitarios',        'Caja x 1 tableta',                    'Laboratorios Portugal', false, 1,  2.50,  2.50, 15),
    ('ALB-SUS',  'Albendazol 100 mg/5 ml suspensión',                  'Antiparasitarios',        'Frasco x 20 ml',                      'Laboratorios Portugal', false, 1,  4.00,  4.00,  8),
    -- Primeros auxilios (artículos sin laboratorio farmacéutico)
    ('ALC-070',  'Alcohol etílico 70°',                                'Primeros auxilios',       'Frasco x 250 ml',                     null,                   false, 1,  5.00,  5.00, 10)
  ) as p(codigo, nombre, categoria, presentacion, laboratorio, receta, unidades, precio_caja, precio_blister, minimo)
  join categorias cat on cat.botica_id = v_botica and cat.nombre = p.categoria
  on conflict (botica_id, codigo) do nothing;
end $$;

-- Verificación: productos por categoría
select c.nombre as categoria, count(p.id) as productos
from categorias c
left join productos p on p.categoria_id = c.id
group by c.nombre
order by c.nombre;
