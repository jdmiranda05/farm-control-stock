export interface Profile {
  id: string;
  nombres: string;
  apellidos: string;
  rol: 'almacen' | 'administrador' | 'ventas';
  activo: boolean;
  creado_en: string;
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
  creado_en: string;
}

export interface Proveedor {
  id: number;
  nombre: string;
  ruc?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  activo: boolean;
  creado_en: string;
}

export interface Producto {
  id: number;
  categoria_id?: number | null;
  codigo: string;
  nombre: string;
  principio_activo?: string | null;
  concentracion?: string | null;
  presentacion: string;
  unidad_medida: string;
  stock_minimo: number;
  precio_venta: number;
  requiere_receta: boolean;
  activo: boolean;
  creado_en: string;
}

export interface Lote {
  id: number;
  producto_id: number;
  proveedor_id?: number | null;
  codigo_lote: string;
  cantidad: number;
  fecha_vencimiento: string;
  precio_compra: number;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

export interface MovimientoKardex {
  id: number;
  producto_id?: number | null;
  lote_id?: number | null;
  usuario_id?: string | null;
  tipo: 'entrada' | 'salida' | 'ajuste';
  cantidad: number;
  motivo: string;
  costo_unitario: number;
  fecha: string;
}
