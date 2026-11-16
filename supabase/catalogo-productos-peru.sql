-- ============================================================
-- CATÁLOGO AMPLIADO: productos frecuentes en boticas del Perú
-- ============================================================
-- Ejecútelo en Supabase → SQL Editor. Es seguro repetirlo: no duplica
-- categorías ni productos (usa ON CONFLICT ... DO NOTHING por código).
--
-- Qué contiene (102 productos en 13 categorías):
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
  -- Botica destino: escriba su RUC aquí, o déjelo en null para usar la
  -- primera botica activa que NO sea la de demostración (RUC 20611548732).
  v_ruc    text := null;
  v_botica uuid := (
    select id from boticas
    where activa
      and (v_ruc is null or ruc = v_ruc)
      and ruc is distinct from '20611548732'
    order by creado_en
    limit 1
  );
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
    ('ALC-070',  'Alcohol etílico 70°',                                'Primeros auxilios',       'Frasco x 250 ml',                     null,                   false, 1,  5.00,  5.00, 10),
    -- ---------- Ampliación: 62 productos más ----------
    ('ASA-500', 'Ácido acetilsalicílico 500 mg', 'Analgésicos', 'Caja x 10 blísters de 10 tabletas', 'Bayer', false, 10, 15.00, 1.70, 15),
    ('PAR-1GR', 'Paracetamol 1 g', 'Analgésicos', 'Caja x 10 blísters de 10 tabletas', 'Medifarma', false, 10, 11.00, 1.30, 15),
    ('MEL-015', 'Meloxicam 15 mg', 'Antiinflamatorios', 'Caja x 10 blísters de 10 tabletas', 'Genfar', true, 10, 12.00, 1.50, 10),
    ('CEL-200', 'Celecoxib 200 mg', 'Antiinflamatorios', 'Caja x 3 blísters de 10 cápsulas', 'Medifarma', true, 3, 18.00, 6.50, 6),
    ('DIC-AMP', 'Diclofenaco sódico 75 mg/3 ml inyectable', 'Antiinflamatorios', 'Ampolla x 3 ml', 'Farmindustria', true, 1, 2.50, 2.50, 10),
    ('DEX-AMP', 'Dexametasona 4 mg/ml inyectable', 'Antiinflamatorios', 'Ampolla x 2 ml', 'Medifarma', true, 1, 3.00, 3.00, 10),
    ('PRE-020', 'Prednisona 20 mg', 'Antiinflamatorios', 'Caja x 10 blísters de 10 tabletas', 'Laboratorios Portugal', true, 10, 9.00, 1.10, 10),
    ('PRE-005', 'Prednisona 5 mg', 'Antiinflamatorios', 'Caja x 10 blísters de 10 tabletas', 'Laboratorios Portugal', true, 10, 6.00, 0.70, 10),
    ('LOR-JBE', 'Loratadina 5 mg/5 ml jarabe', 'Antialérgicos', 'Frasco x 60 ml', 'Laboratorios Portugal', false, 1, 6.00, 6.00, 8),
    ('CET-JBE', 'Cetirizina 5 mg/5 ml jarabe', 'Antialérgicos', 'Frasco x 60 ml', 'Genfar', false, 1, 7.50, 7.50, 8),
    ('FEX-180', 'Fexofenadina 180 mg', 'Antialérgicos', 'Caja x 10 tabletas', 'Medifarma', false, 1, 22.00, 22.00, 4),
    ('ANT-JBE', 'Antigripal jarabe (paracetamol + clorfenamina + fenilefrina)', 'Antigripales', 'Frasco x 60 ml', 'IQFarma', false, 1, 8.50, 8.50, 8),
    ('ANT-SOB', 'Antigripal en polvo para solución oral', 'Antigripales', 'Sobre x 5 g', 'IQFarma', false, 1, 1.50, 1.50, 30),
    ('OXI-SPR', 'Oximetazolina 0.05 % spray nasal', 'Respiratorio', 'Frasco spray x 15 ml', 'Medifarma', false, 1, 9.00, 9.00, 6),
    ('BRO-JBE', 'Bromhexina 4 mg/5 ml jarabe', 'Respiratorio', 'Frasco x 120 ml', 'Medifarma', false, 1, 6.50, 6.50, 8),
    ('ACC-600', 'Acetilcisteína 600 mg', 'Respiratorio', 'Sobre efervescente x 3 g', 'Farmindustria', false, 1, 2.20, 2.20, 20),
    ('BUD-INH', 'Budesonida 200 mcg/dosis inhalador', 'Respiratorio', 'Inhalador x 200 dosis', 'Teva', true, 1, 35.00, 35.00, 3),
    ('SAL-JBE', 'Salbutamol 2 mg/5 ml jarabe', 'Respiratorio', 'Frasco x 120 ml', 'Laboratorios Portugal', true, 1, 6.00, 6.00, 6),
    ('MON-010', 'Montelukast 10 mg', 'Respiratorio', 'Caja x 3 blísters de 10 tabletas', 'Genfar', true, 3, 18.00, 6.50, 6),
    ('CLA-500', 'Claritromicina 500 mg', 'Antibióticos', 'Caja x 3 blísters de 10 tabletas', 'Genfar', true, 3, 45.00, 16.00, 3),
    ('DOX-100', 'Doxiciclina 100 mg', 'Antibióticos', 'Caja x 10 blísters de 10 cápsulas', 'Laboratorios Portugal', true, 10, 15.00, 1.80, 10),
    ('NIF-100', 'Nitrofurantoína 100 mg', 'Antibióticos', 'Caja x 10 blísters de 10 cápsulas', 'Medifarma', true, 10, 18.00, 2.00, 10),
    ('MTZ-500', 'Metronidazol 500 mg', 'Antibióticos', 'Caja x 10 blísters de 10 tabletas', 'Genfar', true, 10, 8.00, 1.00, 10),
    ('CFX-SUS', 'Cefalexina 250 mg/5 ml polvo para suspensión', 'Antibióticos', 'Frasco x 60 ml', 'Farmindustria', true, 1, 9.50, 9.50, 6),
    ('AZI-SUS', 'Azitromicina 200 mg/5 ml polvo para suspensión', 'Antibióticos', 'Frasco x 15 ml', 'Genfar', true, 1, 12.00, 12.00, 5),
    ('CTX-1GR', 'Ceftriaxona 1 g inyectable', 'Antibióticos', 'Vial + ampolla de diluyente', 'Medifarma', true, 1, 6.50, 6.50, 10),
    ('LOS-100', 'Losartán potásico 100 mg', 'Cardiovascular', 'Caja x 3 blísters de 10 tabletas', 'Genfar', true, 3, 15.00, 5.50, 9),
    ('CAP-025', 'Captopril 25 mg', 'Cardiovascular', 'Caja x 10 blísters de 10 tabletas', 'Laboratorios Portugal', true, 10, 6.00, 0.70, 15),
    ('HCT-025', 'Hidroclorotiazida 25 mg', 'Cardiovascular', 'Caja x 10 blísters de 10 tabletas', 'Farmindustria', true, 10, 5.00, 0.60, 15),
    ('FUR-040', 'Furosemida 40 mg', 'Cardiovascular', 'Caja x 10 blísters de 10 tabletas', 'Laboratorios Portugal', true, 10, 6.00, 0.70, 10),
    ('SIM-020', 'Simvastatina 20 mg', 'Cardiovascular', 'Caja x 10 blísters de 10 tabletas', 'Genfar', true, 10, 9.00, 1.10, 10),
    ('CLP-075', 'Clopidogrel 75 mg', 'Cardiovascular', 'Caja x 3 blísters de 10 tabletas', 'Medifarma', true, 3, 21.00, 7.50, 6),
    ('VAL-160', 'Valsartán 160 mg', 'Cardiovascular', 'Caja x 3 blísters de 10 tabletas', 'Teva', true, 3, 24.00, 8.50, 6),
    ('PRO-040', 'Propranolol 40 mg', 'Cardiovascular', 'Caja x 10 blísters de 10 tabletas', 'Laboratorios Portugal', true, 10, 7.00, 0.80, 10),
    ('MTF-500', 'Metformina clorhidrato 500 mg', 'Antidiabéticos', 'Caja x 10 blísters de 10 tabletas', 'Laboratorios Portugal', true, 10, 7.00, 0.85, 15),
    ('MTF-1GR', 'Metformina clorhidrato 1 g', 'Antidiabéticos', 'Caja x 3 blísters de 10 tabletas', 'Genfar', true, 3, 12.00, 4.50, 6),
    ('GLZ-030', 'Gliclazida 30 mg liberación modificada', 'Antidiabéticos', 'Caja x 3 blísters de 10 tabletas', 'Medifarma', true, 3, 16.00, 6.00, 6),
    ('OME-040', 'Omeprazol 40 mg', 'Gastrointestinal', 'Caja x 3 blísters de 10 cápsulas', 'Genfar', true, 3, 15.00, 5.50, 6),
    ('PAN-040', 'Pantoprazol 40 mg', 'Gastrointestinal', 'Caja x 3 blísters de 10 tabletas', 'Medifarma', true, 3, 24.00, 8.50, 6),
    ('DOM-010', 'Domperidona 10 mg', 'Gastrointestinal', 'Caja x 10 blísters de 10 tabletas', 'Medifarma', true, 10, 12.00, 1.40, 10),
    ('MCP-010', 'Metoclopramida 10 mg', 'Gastrointestinal', 'Caja x 10 blísters de 10 tabletas', 'Laboratorios Portugal', true, 10, 6.00, 0.70, 10),
    ('SMT-080', 'Simeticona 80 mg', 'Gastrointestinal', 'Caja x 10 blísters de 10 tabletas masticables', 'IQFarma', false, 10, 10.00, 1.20, 10),
    ('BIS-SUS', 'Subsalicilato de bismuto suspensión', 'Gastrointestinal', 'Frasco x 120 ml', 'Medifarma', false, 1, 11.50, 11.50, 5),
    ('LAC-JBE', 'Lactulosa 3.3 g/5 ml jarabe', 'Gastrointestinal', 'Frasco x 120 ml', 'Laboratorios Portugal', false, 1, 14.00, 14.00, 5),
    ('ZNC-JBE', 'Sulfato de zinc 20 mg/5 ml jarabe', 'Vitaminas y suplementos', 'Frasco x 100 ml', 'Laboratorios Portugal', false, 1, 7.00, 7.00, 6),
    ('CAL-600', 'Carbonato de calcio 600 mg + vitamina D3', 'Vitaminas y suplementos', 'Frasco x 60 tabletas', 'Hersil', false, 1, 28.00, 28.00, 4),
    ('VTE-400', 'Vitamina E 400 UI', 'Vitaminas y suplementos', 'Frasco x 30 cápsulas blandas', 'Hersil', false, 1, 15.00, 15.00, 4),
    ('HIE-JBE', 'Hierro polimaltosado 50 mg/5 ml jarabe', 'Vitaminas y suplementos', 'Frasco x 120 ml', 'Medifarma', false, 1, 16.00, 16.00, 5),
    ('KET-CRM', 'Ketoconazol 2 % crema', 'Dermatológicos', 'Tubo x 20 g', 'Genfar', false, 1, 7.00, 7.00, 5),
    ('MUP-UNG', 'Mupirocina 2 % ungüento', 'Dermatológicos', 'Tubo x 15 g', 'Medifarma', true, 1, 12.00, 12.00, 4),
    ('HDC-CRM', 'Hidrocortisona 1 % crema', 'Dermatológicos', 'Tubo x 20 g', 'Laboratorios Portugal', false, 1, 6.00, 6.00, 5),
    ('SDP-CRM', 'Sulfadiazina de plata 1 % crema', 'Dermatológicos', 'Pote x 50 g', 'Farmindustria', true, 1, 14.00, 14.00, 4),
    ('OXZ-PAS', 'Óxido de zinc pasta', 'Dermatológicos', 'Pote x 60 g', 'Laboratorios Portugal', false, 1, 8.50, 8.50, 5),
    ('PER-LOC', 'Permetrina 5 % loción', 'Antiparasitarios', 'Frasco x 60 ml', 'Medifarma', false, 1, 12.00, 12.00, 4),
    ('MBZ-100', 'Mebendazol 100 mg', 'Antiparasitarios', 'Caja x 6 tabletas', 'Laboratorios Portugal', false, 1, 3.50, 3.50, 10),
    ('NTZ-SUS', 'Nitazoxanida 100 mg/5 ml polvo para suspensión', 'Antiparasitarios', 'Frasco x 30 ml', 'Medifarma', true, 1, 15.00, 15.00, 4),
    ('AGU-OXI', 'Agua oxigenada 10 volúmenes', 'Primeros auxilios', 'Frasco x 120 ml', null, false, 1, 2.50, 2.50, 10),
    ('YOD-POV', 'Yodopovidona 10 % solución tópica', 'Primeros auxilios', 'Frasco x 120 ml', null, false, 1, 9.50, 9.50, 6),
    ('GAS-EST', 'Gasa estéril 10 x 10 cm', 'Primeros auxilios', 'Sobre x 1 unidad', null, false, 1, 0.80, 0.80, 30),
    ('ESP-HIP', 'Esparadrapo hipoalergénico 2.5 cm x 5 m', 'Primeros auxilios', 'Rollo', null, false, 1, 4.50, 4.50, 6),
    ('VEN-ELA', 'Venda elástica 4" x 5 yardas', 'Primeros auxilios', 'Unidad', null, false, 1, 4.00, 4.00, 6),
    ('SUE-FIS', 'Cloruro de sodio 0.9 % solución', 'Primeros auxilios', 'Frasco x 1 L', 'Medifarma', false, 1, 6.50, 6.50, 6)
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
