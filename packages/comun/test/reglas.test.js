// Pruebas de las reglas compartidas (@botica/comun).
// Se ejecutan contra el código COMPILADO (dist/) con el test runner de Node:
//   pnpm build:comun && node --test packages/comun/test/reglas.test.js
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const {
  validarEmpaque,
  esCorreoValido,
  formatearStock,
  textoCantidad,
  pluralizar,
  tieneBlisters,
  desdeBlisters,
  aBlisters,
  UnidadEmpaque,
} = require('../dist');

describe('Reglas de empaque (blísters)', () => {
  test('producto sin blísters con precio válido', () => {
    assert.deepEqual(
      validarEmpaque({ tieneBlisters: false, unidadesPorCaja: 1, precioCaja: 12.5, precioBlister: 12.5 }),
      [],
    );
  });

  test('el precio debe ser mayor que cero', () => {
    const errores = validarEmpaque({ tieneBlisters: false, unidadesPorCaja: 1, precioCaja: 0, precioBlister: 0 });
    assert.equal(errores.length, 1);
  });

  test('una caja con blísters necesita al menos 2', () => {
    const errores = validarEmpaque({ tieneBlisters: true, unidadesPorCaja: 1, precioCaja: 10, precioBlister: 2 });
    assert.ok(errores.some((e) => e.includes('al menos 2 blísters')));
  });

  test('el blíster debe costar menos que la caja', () => {
    const errores = validarEmpaque({ tieneBlisters: true, unidadesPorCaja: 10, precioCaja: 5, precioBlister: 6 });
    assert.ok(errores.some((e) => e.includes('menor que el precio de la caja')));
  });

  test('vender los blísters sueltos no puede valer menos que la caja', () => {
    const errores = validarEmpaque({ tieneBlisters: true, unidadesPorCaja: 10, precioCaja: 20, precioBlister: 1 });
    assert.ok(errores.some((e) => e.includes('no puede costar menos')));
  });

  test('empaque correcto con blísters', () => {
    assert.deepEqual(
      validarEmpaque({ tieneBlisters: true, unidadesPorCaja: 10, precioCaja: 12, precioBlister: 1.5 }),
      [],
    );
  });

  test('tieneBlisters según unidades por caja', () => {
    assert.equal(tieneBlisters({ unidades_por_caja: 10 }), true);
    assert.equal(tieneBlisters({ unidades_por_caja: 1 }), false);
  });
});

describe('Conversión y textos de stock', () => {
  test('cajas a blísters y viceversa', () => {
    assert.equal(aBlisters(3, UnidadEmpaque.CAJA, 10), 30);
    assert.equal(aBlisters(7, UnidadEmpaque.BLISTER, 10), 7);
    assert.deepEqual(desdeBlisters(37, 10), { cajas: 3, blisters: 7 });
  });

  test('formatearStock', () => {
    assert.equal(formatearStock(37, 10), '3 cajas + 7 blísters (37)');
    assert.equal(formatearStock(30, 10), '3 cajas (30)');
    assert.equal(formatearStock(4, 10), '4 blísters');
    assert.equal(formatearStock(1, 1), '1 unidad');
    assert.equal(formatearStock(18, 1), '18 unidades');
  });

  test('textoCantidad usa "unidades" en productos sin blísters', () => {
    assert.equal(textoCantidad(3, UnidadEmpaque.CAJA, { unidades_por_caja: 1 }), '3 unidades');
    assert.equal(textoCantidad(1, UnidadEmpaque.CAJA, { unidades_por_caja: 10 }), '1 caja');
    assert.equal(textoCantidad(2, UnidadEmpaque.BLISTER, { unidades_por_caja: 10 }), '2 blísters');
  });

  test('pluralizar sin "(s)"', () => {
    assert.equal(pluralizar(1, 'unidad', 'unidades'), '1 unidad');
    assert.equal(pluralizar(87, 'unidad', 'unidades'), '87 unidades');
  });
});

describe('Validación de correo del inicio de sesión', () => {
  for (const correo of ['admin@botica.pe', 'a.b+c@sub.dominio.com', 'lucia.mendoza@vidasana.test']) {
    test(`acepta ${correo}`, () => assert.equal(esCorreoValido(correo), true));
  }
  for (const correo of ['adminbotica.pe', 'admin@botica', 'admin@@botica.pe', 'ad min@botica.pe', '@botica.pe', 'admin..x@botica.pe']) {
    test(`rechaza ${correo}`, () => assert.equal(esCorreoValido(correo), false));
  }
});
