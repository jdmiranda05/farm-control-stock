export const Sidebar = () => {
  return (
    <aside className="d-flex flex-column p-4 bg-white border-end shadow-sm" style={{ width: '260px', height: '100vh', position: 'fixed', borderColor: 'var(--c-border)' }}>
      
      {/* Logo y Título */}
      <div className="d-flex align-items-center mb-5">
        <div className="rounded d-flex justify-content-center align-items-center me-3" style={{ width: '36px', height: '36px', backgroundColor: 'var(--c-brand-base)', color: 'white' }}>
          <strong className="fs-5">M</strong>
        </div>
        <div>
          <h6 className="mb-0 fw-bold" style={{ color: 'var(--c-text-main)' }}>Botica M&LL</h6>
          <small className="fw-bold" style={{ color: 'var(--c-text-light)', fontSize: '10px', letterSpacing: '0.5px' }}>MÓDULO DE VENTAS</small>
        </div>
      </div>

      {/* Navegación (Luego le agregaremos React Router) */}
      <div className="d-flex flex-column gap-2 mb-auto">
        <a href="#" className="d-flex align-items-center p-2 rounded text-decoration-none fw-semibold" style={{ backgroundColor: 'var(--c-brand-light)', color: 'var(--c-brand-dark)' }}>
          <i className="ph ph-house fs-5 me-3"></i> Dashboard
        </a>
        <a href="#" className="d-flex align-items-center p-2 rounded text-decoration-none fw-medium" style={{ color: 'var(--c-text-muted)' }}>
          <i className="ph ph-cube fs-5 me-3"></i> Punto de Venta
        </a>
        <a href="#" className="d-flex align-items-center p-2 rounded text-decoration-none fw-medium" style={{ color: 'var(--c-text-muted)' }}>
          <i className="ph ph-arrow-up-right fs-5 me-3"></i> Historial de Ventas
        </a>
        <a href="#" className="d-flex align-items-center p-2 rounded text-decoration-none fw-medium" style={{ color: 'var(--c-text-muted)' }}>
          <i className="ph ph-warning-circle fs-5 me-3"></i> Clientes
        </a>
      </div>

      {/* Perfil del Vendedor (Datos listos para ser dinámicos) */}
      <div className="mt-auto pt-4 d-flex align-items-center">
        <img src="https://ui-avatars.com/api/?name=Carlos+Mendoza&background=E2E8F0&color=0F172A" alt="Perfil" width="40" height="40" className="rounded-circle me-3" />
        <div>
          <h6 className="mb-0 fw-semibold" style={{ color: 'var(--c-text-main)', fontSize: '13px' }}>Carlos Mendoza</h6>
          <small style={{ color: 'var(--c-text-muted)', fontSize: '11px' }}>Vendedor / Caja</small>
        </div>
      </div>

    </aside>
  );
};

