// Ejecutar con la API local iniciada. Crea y elimina una botica de prueba aislada.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { parseEnv } = require('node:util');
const { randomUUID } = require('node:crypto');
const root = path.resolve(__dirname, '..');
const env = { ...parseEnv(fs.readFileSync(path.join(root, 'backend/.env'), 'utf8')), ...process.env };
const url = env.SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const api = env.TEST_API_URL || `http://localhost:${env.PUERTO || 3000}/api`;
let token, usuarioId;
const boticaId = randomUUID();
const email = `integracion-${randomUUID()}@example.com`;
const password = randomUUID() + 'Aa1!';
let created = false;
let checks = 0;
async function request(base, route, method = 'GET', body, headers = {}) {
  const response = await fetch(base + route, {
    method, headers: { 'Content-Type': 'application/json', ...headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`${method} ${route}: HTTP ${response.status} ${JSON.stringify(data)}`);
  return data;
}
const db = (route, method, body) => request(url, '/rest/v1/' + route, method, body, {
  apikey: key, Authorization: `Bearer ${key}`, Prefer: 'return=representation',
});
const auth = (route, method, body) => request(url, '/auth/v1/' + route, method, body, { apikey: key, Authorization: `Bearer ${key}` });
async function call(route, method = 'GET', body) {
  const data = await request(api, route, method, body, token ? { Authorization: `Bearer ${token}` } : {});
  console.log(`OK ${method} ${route}`); checks++; return data;
}
async function main() {
  try {
    await call('/salud');
    const unauthenticated = await fetch(api + '/productos');
    assert.equal(unauthenticated.status, 401);
    console.log('OK rutas protegidas sin sesión'); checks++;
    const schema = fs.readFileSync(path.join(root, 'supabase/esquema.sql'), 'utf8');
    const tables = [...schema.matchAll(/create table (\w+)\s*\(/gi)].map(m => m[1]);
    for (const table of [...tables, 'vista_stock_productos', 'vista_merma_productos']) {
      await db(`${table}?select=*&limit=1`);
      console.log('OK acceso BD ' + table); checks++;
    }
    await db('boticas', 'POST', { id: boticaId, nombre: 'Prueba temporal de integración' });
    created = true;
    const user = await auth('/admin/users', 'POST', { email, password, email_confirm: true });
    usuarioId = user.id;
    await db('usuarios', 'POST', { id: usuarioId, botica_id: boticaId, nombre_completo: 'Prueba temporal', correo: email, rol: 'ADMIN' });
    const session = await auth('/token?grant_type=password', 'POST', { email, password });
    token = session.access_token;
    assert.equal((await call('/autenticacion/perfil')).botica_id, boticaId);
    await call('/boticas/mia');
    await call('/boticas/mia', 'PATCH', { diasAlertaVencimiento: 45 });
    const provider = await call('/proveedores', 'POST', { nombre: 'Proveedor temporal' });
    await call(`/proveedores/${provider.id}`, 'PATCH', { telefono: '999000000' });
    await call('/proveedores');
    const category = await call('/categorias', 'POST', { nombre: 'Categoría temporal' });
    await call('/categorias');
    const product = await call('/productos', 'POST', { nombre: 'Producto temporal', codigo: 'TEST', categoriaId: category.id, unidadesPorCaja: 10, precioCaja: 20, precioBlister: 2, stockMinimo: 100 });
    await call(`/productos/${product.id}`, 'PATCH', { nombre: 'Producto temporal actualizado' });
    await call('/productos');
    const expiration = new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10);
    const lot = await call('/inventario/entradas', 'POST', { productoId: product.id, proveedorId: provider.id, numeroLote: 'TEST-1', fechaVencimiento: expiration, cantidadCajas: 3, costoCaja: 10 });
    await call('/inventario/lotes');
    const sale = await call('/ventas', 'POST', { lineas: [{ productoId: product.id, modalidad: 'BLISTER', cantidad: 2 }] });
    assert.equal(sale.totalSoles, 4);
    await call('/ventas');
    const loss = await call('/inventario/mermas', 'POST', { loteId: lot.id, cantidad: 1, unidad: 'BLISTER', motivo: 'Prueba temporal' });
    assert.equal(loss.blistersRetirados, 1);
    const rows = await db(`lotes?id=eq.${lot.id}&select=*`);
    assert.equal(rows[0].cajas_completas * 10 + rows[0].blisters_sueltos, 27);
    console.log('OK persistencia: 30 unidades - 2 vendidas - 1 merma = 27'); checks++;
    await call('/kardex');
    const movements = await call(`/kardex/producto/${product.id}`);
    assert.equal(movements.length, 3);
    await call(`/kardex/${movements[0].id}`, 'PATCH', { motivo: 'Corrección de prueba temporal' });
    await call('/reportes/diario');
    await call('/reportes/merma');
    await call('/panel/resumen');
    await call('/alertas/generar', 'POST');
    const alerts = await call('/alertas');
    await call('/alertas/contador');
    assert.ok(alerts.length > 0);
    await call(`/alertas/${alerts[0].id}/leida`, 'PATCH');
    await call(`/alertas/${alerts[0].id}/resolver`, 'PATCH');
    // Permisos del vendedor y separación entre boticas.
    await db(`usuarios?id=eq.${usuarioId}`, 'PATCH', { rol: 'VENDEDOR' });
    const forbidden = await fetch(api + '/inventario/entradas', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal(forbidden.status, 403);
    console.log('OK permisos: vendedor no registra entradas'); checks++;
    await db(`usuarios?id=eq.${usuarioId}`, 'PATCH', { rol: 'ADMIN' });
    const visible = await call('/productos');
    assert.equal(visible.length, 1);
    assert.equal(visible[0].botica_id, boticaId);
    await call(`/productos/${product.id}`, 'DELETE');
    await call('/productos/inactivos');
    await call(`/productos/${product.id}/reactivar`, 'PATCH');
    const unused = await call('/categorias', 'POST', { nombre: 'Categoría descartable' });
    await call(`/categorias/${unused.id}`, 'DELETE');
    await call(`/proveedores/${provider.id}`, 'DELETE');
    console.log(`PASÓ: ${checks} comprobaciones de integración.`);
  } finally {
    // Solo elimina las entidades cuyo UUID se generó en esta ejecución.
    let cleanupError;
    if (created) {
      try {
        for (const table of ['alertas', 'movimientos_kardex', 'ventas', 'lotes', 'productos', 'proveedores', 'categorias', 'usuarios']) {
          await db(`${table}?botica_id=eq.${boticaId}`, 'DELETE');
        }
        await db(`boticas?id=eq.${boticaId}`, 'DELETE');
        assert.equal((await db(`boticas?id=eq.${boticaId}&select=id`)).length, 0);
      }
      catch (e) { cleanupError = e; console.error('No se pudo limpiar botica de prueba:', boticaId); }
    }
    if (usuarioId) {
      try { await auth(`/admin/users/${usuarioId}`, 'DELETE'); }
      catch (e) { cleanupError ||= e; console.error('No se pudo limpiar usuario de prueba:', usuarioId); }
    }
    if (cleanupError) throw cleanupError;
    if (created) console.log('OK datos temporales eliminados');
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
