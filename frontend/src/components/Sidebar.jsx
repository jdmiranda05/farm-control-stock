const roleLabels = {
  administrador: 'Administrador',
  almacen: 'Almacen',
  ventas: 'Ventas',
}

export const Sidebar = ({ activeTab, setActiveTab, profile, onLogout }) => {
  const fullName = profile ? `${profile.nombres} ${profile.apellidos}`.trim() : 'Usuario M&LL'
  const role = roleLabels[profile?.rol] || profile?.rol || 'Usuario'

  return (
    <aside className="sidebar p-4 d-flex flex-column bg-white border-end shadow-sm" style={{ width: '260px', height: '100vh', position: 'fixed', borderColor: 'var(--c-border)', zIndex: 1000 }}>
      <div className="d-flex align-items-center mb-5">
        <div className="rounded d-flex justify-content-center align-items-center me-3" style={{ width: '36px', height: '36px', backgroundColor: 'var(--c-brand-base)', color: 'white' }}>
          <strong className="fs-5">M</strong>
        </div>
        <div>
          <h6 className="mb-0 fw-bold text-main" style={{ fontSize: '16px' }}>Botica M&LL</h6>
          <small className="fw-bold" style={{ color: 'var(--c-text-light)', fontSize: '10px', letterSpacing: '0.5px' }}>MÓDULO DE VENTAS</small>
        </div>
      </div>

      <div className="d-flex flex-column gap-1 mb-auto">
        <button onClick={() => setActiveTab('dashboard')} className={`btn nav-item-custom text-start ${activeTab === 'dashboard' ? 'active' : ''}`}>
          <i className="ph ph-house"></i> Dashboard
        </button>
        <button onClick={() => setActiveTab('pos')} className={`btn nav-item-custom text-start ${activeTab === 'pos' ? 'active' : ''}`}>
          <i className="ph ph-cube"></i> Punto de Venta
        </button>
        <button onClick={() => setActiveTab('historial')} className={`btn nav-item-custom text-start ${activeTab === 'historial' ? 'active' : ''}`}>
          <i className="ph ph-arrow-up-right"></i> Historial de Ventas
        </button>
        <button onClick={() => setActiveTab('clientes')} className={`btn nav-item-custom text-start ${activeTab === 'clientes' ? 'active' : ''}`}>
          <i className="ph ph-warning-circle"></i> Clientes
        </button>
      </div>

      <button type="button" onClick={onLogout} className="btn nav-item-custom text-start mt-3">
        <i className="ph ph-sign-out"></i> Cerrar sesion
      </button>

      <div className="mt-auto pt-4 d-flex align-items-center bg-white border-top border-custom" style={{ borderRadius: '12px', padding: '12px' }}>
        <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=E2E8F0&color=0F172A`} alt="Perfil" width="40" height="40" className="rounded-circle me-3" />
        <div>
          <h6 className="mb-0 fw-semibold text-main" style={{ fontSize: '13px' }}>{fullName}</h6>
          <small className="text-muted-custom" style={{ fontSize: '11px' }}>{role}</small>
        </div>
      </div>
    </aside>
  );
};
