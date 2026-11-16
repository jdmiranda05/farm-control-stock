// Pruebas de las reglas del backend sobre el código COMPILADO (dist/).
//   pnpm --filter @botica/backend build && node --test apps/backend/test/negocio.test.js
// No usan la base de datos: prueban funciones puras y un cliente simulado.
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { descontarDeLote } = require('../dist/inventario/fefo.service');
const { inicioDelDia, finDelDia, fechaParaExcel } = require('../dist/comun/fechas-peru');
const { obtenerTodos } = require('../dist/comun/consultas');
const { GuardiaRoles } = require('../dist/autenticacion/guardias/guardia-roles.guard');
const { Reflector } = require('@nestjs/core');

describe('FEFO: descuento de un lote y apertura de cajas', () => {
  test('venta por caja descuenta cajas cerradas', () => {
    const r = descontarDeLote({ cajas_completas: 5, blisters_sueltos: 0 }, 2, 'CAJA', 10);
    assert.deepEqual(
      { cajas: r.cajas_completas, sueltos: r.blisters_sueltos, tomados: r.blistersTomados },
      { cajas: 3, sueltos: 0, tomados: 20 },
    );
  });

  test('venta por caja falla si no hay cajas cerradas suficientes', () => {
    assert.equal(descontarDeLote({ cajas_completas: 1, blisters_sueltos: 9 }, 2, 'CAJA', 10), null);
  });

  test('venta por blíster usa primero los sueltos', () => {
    const r = descontarDeLote({ cajas_completas: 2, blisters_sueltos: 3 }, 2, 'BLISTER', 10);
    assert.deepEqual([r.cajas_completas, r.blisters_sueltos, r.cajasAbiertas], [2, 1, 0]);
  });

  test('si faltan blísters sueltos se abre una caja', () => {
    const r = descontarDeLote({ cajas_completas: 2, blisters_sueltos: 1 }, 4, 'BLISTER', 10);
    assert.deepEqual([r.cajas_completas, r.blisters_sueltos, r.cajasAbiertas], [1, 7, 1]);
  });

  test('nunca quedan blísters sueltos >= blísters por caja', () => {
    for (let pedido = 1; pedido <= 25; pedido++) {
      const r = descontarDeLote({ cajas_completas: 3, blisters_sueltos: 0 }, pedido, 'BLISTER', 10);
      assert.ok(r.blisters_sueltos < 10, `pedido ${pedido}`);
      assert.equal(r.cajas_completas * 10 + r.blisters_sueltos, 30 - pedido);
    }
  });

  test('no se puede retirar más de lo que tiene el lote', () => {
    assert.equal(descontarDeLote({ cajas_completas: 1, blisters_sueltos: 2 }, 13, 'BLISTER', 10), null);
  });
});

describe('Fechas en hora de Perú', () => {
  test('el rango de un día usa el desfase de Lima', () => {
    assert.equal(inicioDelDia('2026-11-15'), '2026-11-15T00:00:00-05:00');
    assert.equal(finDelDia('2026-11-15'), '2026-11-15T23:59:59.999-05:00');
  });

  test('una venta de las 8 p. m. en Lima pertenece a ese día', () => {
    const venta = new Date('2026-11-16T01:00:00Z'); // 8:00 p. m. del 15/11 en Lima
    assert.ok(venta >= new Date(inicioDelDia('2026-11-15')));
    assert.ok(venta <= new Date(finDelDia('2026-11-15')));
  });

  test('Excel muestra la hora de Lima', () => {
    assert.equal(fechaParaExcel('2026-11-16T01:00:00Z').toISOString(), '2026-11-15T20:00:00.000Z');
  });
});

describe('Lectura por bloques (límite de 1 000 filas de Supabase)', () => {
  test('junta todos los bloques', async () => {
    const datos = Array.from({ length: 2350 }, (_, i) => i);
    const filas = await obtenerTodos((desde, hasta) =>
      Promise.resolve({ data: datos.slice(desde, hasta + 1), error: null }),
    );
    assert.equal(filas.length, 2350);
  });

  test('avisa si el periodo es demasiado grande', async () => {
    await assert.rejects(
      obtenerTodos(
        (desde, hasta) => Promise.resolve({ data: Array.from({ length: hasta - desde + 1 }, () => 1), error: null }),
        { maximo: 3000 },
      ),
      /rango de fechas más corto/,
    );
  });
});

describe('Permisos por rol (el ADMIN ya no tiene pase libre)', () => {
  const guardia = new GuardiaRoles(new Reflector());
  const contexto = (controlador, metodo, rol) => ({
    getHandler: () => controlador.prototype[metodo],
    getClass: () => controlador,
    switchToHttp: () => ({ getRequest: () => ({ usuario: { rol } }) }),
  });
  const puede = (controlador, metodo, rol) => {
    try {
      return guardia.canActivate(contexto(controlador, metodo, rol));
    } catch {
      return false;
    }
  };
  const { VentasController } = require('../dist/ventas/ventas.controller');
  const { InventarioController } = require('../dist/inventario/inventario.controller');
  const { ProductosController } = require('../dist/productos/productos.controller');
  const { UsuariosController } = require('../dist/usuarios/usuarios.controller');

  test('solo el vendedor registra ventas', () => {
    assert.deepEqual(['ADMIN', 'ALMACENERO', 'VENDEDOR'].map((r) => puede(VentasController, 'registrar', r)), [false, false, true]);
  });
  test('solo el almacenero registra entradas', () => {
    assert.deepEqual(['ADMIN', 'ALMACENERO', 'VENDEDOR'].map((r) => puede(InventarioController, 'registrarEntrada', r)), [false, true, false]);
  });
  test('solo el administrador crea y edita productos', () => {
    for (const metodo of ['crear', 'actualizar', 'desactivar']) {
      assert.deepEqual(['ADMIN', 'ALMACENERO', 'VENDEDOR'].map((r) => puede(ProductosController, metodo, r)), [true, false, false], metodo);
    }
  });
  test('solo el administrador gestiona usuarios', () => {
    assert.deepEqual(['ADMIN', 'ALMACENERO', 'VENDEDOR'].map((r) => puede(UsuariosController, 'crear', r)), [true, false, false]);
  });
});
