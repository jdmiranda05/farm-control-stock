export const Dashboard = () => {
  // Datos simulados (Mocks) listos para ser reemplazados por la Base de Datos
  const ventasRecientes = [
    { id: 1, hora: "14:32:05", cliente: "Maria S. Torres", producto: "Par...", pago: "Efectivo", total: "32.50", estado: "Pagado" },
    { id: 2, hora: "14:15:10", cliente: "Juan E. Castro", producto: "Ibu...", pago: "Tarjeta", total: "12.00", estado: "Pagado" },
    { id: 3, hora: "13:48:40", cliente: "Ana Maria Prado", producto: "Ome...", pago: "Yape", total: "48.20", estado: "Pagado" },
    { id: 4, hora: "13:20:15", cliente: "Carlos G. Ruiz", producto: "Lor...", pago: "Efectivo", total: "15.00", estado: "Pagado" },
    { id: 5, hora: "12:55:00", cliente: "Luis A. Mendez", producto: "Amb...", pago: "Yape", total: "18.50", estado: "Anulado" }
  ];

  const topMedicamentos = [
    { id: 1, nombre: "Paracetamol 500mg", cant: 64 },
    { id: 2, nombre: "Ibuprofeno 400mg", cant: 42 },
    { id: 3, nombre: "Amoxicilina 500mg", cant: 38 }
  ];

  const graficoBarras = [
    { hora: "08h", alto: "40%" }, { hora: "10h", alto: "50%" },
    { hora: "12h", alto: "80%" }, { hora: "14h", alto: "100%" },
    { hora: "16h", alto: "70%" }, { hora: "18h", alto: "45%" },
    { hora: "20h", alto: "35%" }
  ];

  return (
    <>
      <header className="d-flex justify-content-between align-items-start mb-4 pb-3 border-bottom border-custom">
        <div>
          <h3 className="mb-1 text-main fw-bold">Resumen de Ventas</h3>
          <p className="text-muted-custom small mb-0">Panel de control de ventas y métricas del punto de venta</p>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="input-group" style={{ width: '300px' }}>
            <span className="input-group-text bg-white border-end-0 border-custom"><i className="ph ph-magnifying-glass text-muted-custom"></i></span>
            <input type="text" className="form-control border-start-0 border-custom ps-0 bg-white" placeholder="Buscar por ticket, cliente..." />
          </div>
          <button className="btn btn-light border border-custom bg-white text-main rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
            <i className="ph ph-bell fs-5"></i>
          </button>
        </div>
      </header>

      {/* Tarjetas Superiores */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card p-4 h-100">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <h6 className="text-muted-custom fw-semibold mb-0" style={{ fontSize: '13px' }}>Ventas del Día</h6>
              <i className="ph ph-cube text-brand" style={{ fontSize: '20px', background: 'var(--c-brand-light)', padding: '4px', borderRadius: '4px' }}></i>
            </div>
            <h2 className="fw-bold mt-2 mb-1" style={{ color: 'var(--c-success-bold)' }}>S/. 3,450.00</h2>
            <small className="text-muted-custom" style={{ fontSize: '12px' }}>Meta diaria: S/. 4,000.00</small>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card p-4 h-100">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <h6 class="text-muted-custom fw-semibold mb-0" style={{ fontSize: '13px' }}>Tickets Hoy</h6>
              <i class="ph ph-house text-brand" style={{ fontSize: '20px', background: 'var(--c-brand-light)', padding: '4px', borderRadius: '4px' }}></i>
            </div>
            <h2 class="fw-bold text-main mt-2 mb-1">28</h2>
            <small class="text-muted-custom" style={{ fontSize: '12px' }}>Tickets procesados hoy</small>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card p-4 h-100">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <h6 class="text-muted-custom fw-semibold mb-0" style={{ fontSize: '13px' }}>Ticket Promedio</h6>
              <i class="ph ph-arrow-down-left text-brand" style={{ fontSize: '20px', background: 'var(--c-brand-light)', padding: '4px', borderRadius: '4px' }}></i>
            </div>
            <h2 class="fw-bold mt-2 mb-1" style={{ color: '#D97706' }}>S/. 123.21</h2>
            <small class="text-muted-custom" style={{ fontSize: '12px' }}>+4.2% vs. promedio ayer</small>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card p-4 h-100">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <h6 class="text-muted-custom fw-semibold mb-0" style={{ fontSize: '13px' }}>Productos Vendidos</h6>
              <i class="ph ph-warning-circle text-brand" style={{ fontSize: '20px', background: 'var(--c-brand-light)', padding: '4px', borderRadius: '4px' }}></i>
            </div>
            <h2 class="fw-bold text-brand mt-2 mb-1">156</h2>
            <small class="text-muted-custom" style={{ fontSize: '12px' }}>Unidades despachadas</small>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Tabla Dinámica */}
        <div className="col-lg-8">
          <div className="card h-100">
            <div className="p-4 d-flex justify-content-between align-items-center">
              <h6 className="fw-bold text-main mb-0 fs-5">Ventas Recientes (Punto de Venta)</h6>
              <a href="#" className="text-brand text-decoration-none fw-semibold" style={{ fontSize: '13px' }}>Ver historial completo</a>
            </div>
            <div className="table-responsive">
              <table className="table table-custom mb-0">
                <thead>
                  <tr><th>HORA</th><th>CLIENTE</th><th>PRODUCTOS</th><th>MÉTODO PAGO</th><th>TOTAL</th><th>ESTADO</th></tr>
                </thead>
                <tbody>
                  {ventasRecientes.map(venta => (
                    <tr key={venta.id}>
                      <td className="text-muted-custom">{venta.hora}</td>
                      <td className="fw-medium">{venta.cliente}</td>
                      <td className="text-muted-custom">{venta.producto}</td>
                      <td className="text-muted-custom">{venta.pago}</td>
                      <td className="fw-bold">S/. {venta.total}</td>
                      <td>
                        <span className={venta.estado === 'Pagado' ? 'badge-success-custom' : 'badge-danger-custom'}>
                          {venta.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Gráfico y Top Medicamentos Dinámico */}
        <div className="col-lg-4">
          <div className="card p-4 h-100">
            <h6 className="fw-bold text-main mb-4 fs-5">Ventas por Hora</h6>
            
            <div className="rounded p-3 mb-4" style={{ backgroundColor: 'var(--c-bg-app)' }}>
              <div className="bar-chart-container">
                {graficoBarras.map((bar, index) => (
                  <div key={index} className="d-flex flex-column align-items-center">
                    <div className="bar" style={{ height: bar.alto }}></div>
                    <div className="bar-label">{bar.hora}</div>
                  </div>
                ))}
              </div>
            </div>

            <h6 className="fw-bold text-main mb-3 fs-6 mt-2">Medicamentos Más Vendidos</h6>
            {topMedicamentos.map(med => (
              <div key={med.id} className="d-flex justify-content-between mb-2">
                <span className="text-muted-custom fs-6">{med.id}. {med.nombre}</span>
                <span className="text-main fw-bold">{med.cantidad} und.</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};