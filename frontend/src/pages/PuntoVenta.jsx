export const PuntoVenta = () => {
  // Datos simulados de la canasta de compras
  const carrito = [
    { id: 1, nombre: "Paracetamol 500mg (Tableta)", detalle: "Caja x 100 tab. - Vence: Nov 2026", precio: 0.15, cantidad: 20 },
    { id: 2, nombre: "Amoxicilina 500mg (Cápsulas)", detalle: "Blister x 10 cap. - Vence: Ago 2026", precio: 1.20, cantidad: 15 },
    { id: 3, nombre: "Omeprazol 20mg (Cápsulas)", detalle: "Frasco x 30 cap. - Vence: En 2027", precio: 0.50, cantidad: 10 }
  ];

  // Cálculos dinámicos (Simulados para el frontend)
  const subtotal = 22.03;
  const igv = 3.97;
  const total = 26.00;

  return (
    <>
      <div className="mb-4">
        <h3 className="fw-bold text-main mb-1">Punto de Venta</h3>
        <p className="text-muted-custom small">Registro de ventas y dispensación de medicamentos</p>
      </div>
      
      <div className="row g-4">
        {/* Lado Izquierdo: Canasta */}
        <div className="col-xl-8">
          <div className="card p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold text-main mb-0">Canasta de Venta</h5>
              <span className="badge px-3 py-2 fw-medium rounded-pill" style={{ backgroundColor: 'var(--c-brand-light)', color: 'var(--c-brand-dark)' }}>
                {carrito.length} Items seleccionados
              </span>
            </div>
            
            <div className="row mb-4">
              <div className="col-md-7 mb-2">
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0 border-custom"><i className="ph ph-magnifying-glass" style={{ color: 'var(--c-text-light)' }}></i></span>
                  <input type="text" className="form-control border-start-0 border-custom ps-0" placeholder="Buscar medicamento por nombre, lote o código..." />
                </div>
              </div>
              <div className="col-md-5 mb-2">
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0 border-custom"><i className="ph ph-user" style={{ color: 'var(--c-text-main)' }}></i></span>
                  <select className="form-select border-start-0 border-custom ps-0 fw-medium text-main">
                    <option>73829102 - Maria S. Torres</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="table-responsive mt-2">
              <table className="table table-custom align-middle">
                <thead>
                  <tr><th>PRODUCTO</th><th>PRECIO UNIT.</th><th style={{ width: '130px' }}>CANTIDAD</th><th>SUBTOTAL</th><th className="text-center">ELIMINAR</th></tr>
                </thead>
                <tbody>
                  {carrito.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong className="text-main fw-bold d-block" style={{ fontSize: '14px' }}>{item.nombre}</strong>
                        <small className="text-muted-custom" style={{ fontSize: '12px' }}>{item.detalle}</small>
                      </td>
                      <td className="text-muted-custom">S/. {item.precio.toFixed(2)}</td>
                      <td>
                        <div className="input-group input-group-sm bg-white rounded border border-custom">
                          <button className="btn btn-sm border-0 text-muted-custom fw-bold px-2">-</button>
                          <input type="text" className="form-control border-0 text-center text-main fw-bold p-0 bg-white" value={item.cantidad} readOnly style={{ width: '30px' }} />
                          <button className="btn btn-sm border-0 text-muted-custom fw-bold px-2">+</button>
                        </div>
                      </td>
                      <td className="fw-bold text-main">S/. {(item.precio * item.cantidad).toFixed(2)}</td>
                      <td className="text-center">
                        <button className="btn btn-sm text-danger"><i className="ph ph-trash" style={{ color: 'var(--c-danger-bold)', fontSize: '18px' }}></i></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Lado Derecho: Totales y Cobro */}
        <div className="col-xl-4">
          <div className="d-flex flex-column gap-3 h-100">
            <div className="card p-4 flex-grow-1">
              <div className="d-flex justify-content-between mb-3"><span className="text-muted-custom" style={{ fontSize: '14px' }}>Subtotal</span><span className="fw-semibold text-main">S/. {subtotal.toFixed(2)}</span></div>
              <div className="d-flex justify-content-between mb-3"><span className="text-muted-custom" style={{ fontSize: '14px' }}>Descuento</span><span className="fw-semibold" style={{ color: 'var(--c-danger-bold)' }}>-S/. 0.00</span></div>
              <div className="d-flex justify-content-between mb-4"><span className="text-muted-custom" style={{ fontSize: '14px' }}>IGV (18%)</span><span className="fw-semibold text-main">S/. {igv.toFixed(2)}</span></div>
              
              <div className="d-flex justify-content-between align-items-center mb-4 pb-4 border-bottom border-custom">
                <h5 className="fw-bold text-main mb-0">Total a Pagar</h5>
                <h2 className="fw-bold text-brand mb-0">S/. {total.toFixed(2)}</h2>
              </div>
              
              <div className="mb-3">
                <label className="form-label text-main fw-semibold" style={{ fontSize: '13px' }}>Método de Pago</label>
                <select className="form-select bg-white border-custom fw-medium text-main py-2">
                  <option>Efectivo</option>
                  <option>Tarjeta</option>
                  <option>Yape / Plin</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="form-label text-main fw-semibold" style={{ fontSize: '13px' }}>Monto Recibido</label>
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0 border-custom fw-bold text-main py-2">S/.</span>
                  <input type="text" className="form-control bg-white border-start-0 border-custom fw-bold text-main py-2" defaultValue="50.00" style={{ borderColor: 'var(--c-brand-dark)' }} />
                </div>
              </div>
              <div className="d-flex justify-content-between mb-5 px-1">
                <span className="text-muted-custom" style={{ fontSize: '14px' }}>Vuelto Estimado</span>
                <span className="fw-bold text-brand" style={{ fontSize: '16px' }}>S/. 24.00</span>
              </div>
              
              <div className="mt-auto d-flex flex-column gap-2">
                <button className="btn btn-brand py-3 fs-6">Cobrar e Imprimir</button>
                <button className="btn bg-white border border-custom py-3 fw-bold" style={{ color: 'var(--c-danger-bold)' }}>Cancelar Venta</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};