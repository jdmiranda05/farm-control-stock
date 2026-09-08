# Diccionario de datos

## Alcance

La base de datos cubre el modulo de control de lotes para Botica M&LL. La entidad nucleo es `lotes`, porque permite registrar medicamentos por fecha de vencimiento, cantidad, proveedor y producto.

## Tablas

| Tabla | Proposito |
|---|---|
| `profiles` | Guarda el perfil del usuario autenticado con Supabase Auth. |
| `categorias` | Clasifica los productos del inventario. |
| `proveedores` | Registra los proveedores que abastecen los lotes. |
| `productos` | Guarda medicamentos e insumos disponibles. |
| `lotes` | Entidad nucleo; registra stock, vencimiento y costo. |
| `movimientos_kardex` | Registra entradas, salidas o ajustes relacionados con lotes. |
| `v_lotes_inventario` | Vista de consulta para inventario con estado calculado. |

## Relaciones principales

| Relacion | Cardinalidad |
|---|---|
| `categorias` a `productos` | Una categoria puede tener muchos productos. |
| `productos` a `lotes` | Un producto puede tener muchos lotes. |
| `proveedores` a `lotes` | Un proveedor puede abastecer muchos lotes. |
| `productos` a `movimientos_kardex` | Un producto puede tener muchos movimientos. |
| `lotes` a `movimientos_kardex` | Un lote puede tener muchos movimientos. |
| `profiles` a `movimientos_kardex` | Un usuario puede registrar muchos movimientos. |

## Reglas de validacion

| Campo | Regla |
|---|---|
| `productos.codigo` | Debe ser unico. |
| `lotes.codigo_lote` | Debe ser unico. |
| `lotes.cantidad` | No puede ser negativa. |
| `productos.stock_minimo` | No puede ser negativo. |
| `movimientos_kardex.cantidad` | Debe ser mayor que cero. |
| `movimientos_kardex.tipo` | Solo acepta `entrada`, `salida` o `ajuste`. |
| `precio_compra`, `precio_venta`, `costo_unitario` | No pueden ser negativos. |
