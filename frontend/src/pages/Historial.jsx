export const Historial = () => {
  // Datos simulados listos para conectar con la base de datos (Backend)
  const historialVentas = [
    { id: 1, fecha: "15 Oct 2025, 14:32", ticket: "TKT-100234", cliente: "Maria S. Torres", productos: "Paracetamol 500mg, Amoxicilina 250mg", pago: "Efectivo", total: "32.50", estado: "Completado" },
    { id: 2, fecha: "15 Oct 2025, 14:15", ticket: "TKT-100233", cliente: "Juan E. Castro", productos: "Ibuprofeno 400mg", pago: "Tarjeta", total: "12.00", estado: "Completado" },
    { id: 3, fecha: "15 Oct 2025, 13:48", ticket: "TKT-100232", cliente: "Ana Maria Prado", productos: "Omeprazol 20mg, Clotrimazol Crema", pago: "Yape", total: "48.20", estado: "Completado" },
    { id: 4, fecha: "15 Oct 2025, 13:20", ticket: "TKT-100231", cliente: "Carlos G. Ruiz", productos: "Loratadina 10mg", pago: "Efectivo", total: "15.00", estado: "Completado" },
    { id: 5, fecha: "15 Oct 2025, 12:55", ticket: "TKT-100230", cliente: "Luis A. Mendez", productos: "Ambroxol Jarabe Infantil", pago: "Yape", total: "18.50", estado: "Anulado" }
  ];

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h3 className="mb-1 fw-bold text-main">Historial de Ventas</h3>
          <p className="text-muted-custom small mb-0">Registro completo de ventas realizadas en el punto de venta</p>
        </div>
        <button className="btn btn-brand px-4 py-2 text-white">
          <i className="ph ph-plus fw-bold me-2"></i> Nueva Venta
        </button>
      </div>
      
      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-bottom border-custom d-flex justify-content-between">
          <div className="input-group w-50">
            <span className="input-group-text bg-white border-end-0 border-custom"><i className="ph ph-magnifying-glass text-muted-custom"></i></span>
            <input type="text" className="form-control border-start-0 border-custom ps-0 bg-white" placeholder="Buscar por cliente, ticket..." />
          </div>
          <button className="btn bg-white border border-custom text-main fw-medium d-flex align-items-center gap-2 text-nowrap">
            <i className="ph ph-arrows-down-up"></i> Filtro: Hoy
          </button>
        </div>
        
        <div className="table-responsive">
          <table className="table table-custom mb-0 align-middle">
            <thead>
              <tr><th>FECHA</th><th>N° TICKET</th><th>CLIENTE</th><th>PRODUCTOS</th><th>MÉTODO PAGO</th><th>TOTAL</th><th>ESTADO</th></tr>
            </thead>
            <tbody>
              {historialVentas.map((venta) => (
                <tr key={venta.id}>
                  <td className="text-muted-custom py-3">{venta.fecha}</td>
                  <td className="fw-semibold text-main">{venta.ticket}</td>
                  <td className="fw-medium text-main">{venta.cliente}</td>
                  <td className="text-muted-custom small">{venta.productos}</td>
                  <td className="text-muted-custom">{venta.pago}</td>
                  <td className="fw-semibold text-main">S/. {venta.total}</td>
                  <td>
                    <span className={venta.estado === 'Completado' ? 'badge-success-custom' : 'badge-danger-custom'}>
                      {venta.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};