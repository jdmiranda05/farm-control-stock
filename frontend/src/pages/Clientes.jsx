export const Clientes = () => {
  // Datos simulados de clientes
  const listaClientes = [
    { id: 1, doc: "10748392", nombre: "Maria S. Torres Prado", telefono: "987 654 321", email: "maria.torres@gmail.com", tipo: "VIP", ultimaCompra: "Hoy, 14:32", totalCompras: "1,420.50" },
    { id: 2, doc: "45892015", nombre: "Juan E. Castro Velasquez", telefono: "912 345 678", email: "j.castro@outlook.com", tipo: "Frecuente", ultimaCompra: "Ayer, 18:15", totalCompras: "845.20" },
    { id: 3, doc: "08472911", nombre: "Ana Maria Prado Ruiz", telefono: "998 877 665", email: "am.prado@yahoo.com", tipo: "VIP", ultimaCompra: "13 Oct 2025", totalCompras: "2,110.00" },
    { id: 4, doc: "20473911", nombre: "Carlos G. Ruiz Jimenez", telefono: "945 382 192", email: "cruiz@gmail.com", tipo: "Regular", ultimaCompra: "12 Oct 2025", totalCompras: "320.00" },
    { id: 5, doc: "44728190", nombre: "Luis A. Mendez Castro", telefono: "951 842 637", email: "luis.mendez@outlook.com", tipo: "Regular", ultimaCompra: "08 Oct 2025", totalCompras: "150.00" }
  ];

  // Función para asignar el color del badge según el tipo de cliente
  const getBadgeClass = (tipo) => {
    switch(tipo) {
      case 'VIP': return 'badge-warning-custom';
      case 'Frecuente': return 'badge-info-custom';
      default: return 'badge-regular-custom';
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h3 className="mb-1 fw-bold text-main">Gestión de Clientes</h3>
          <p className="text-muted-custom small mb-0">Directorio de clientes registrados en el punto de venta</p>
        </div>
        <button className="btn btn-brand px-4 py-2 text-white">
          <i className="ph ph-plus fw-bold me-2"></i> Nuevo Cliente
        </button>
      </div>
      
      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-bottom border-custom d-flex justify-content-between">
          <div className="input-group w-50">
            <span className="input-group-text bg-white border-end-0 border-custom"><i className="ph ph-magnifying-glass text-muted-custom"></i></span>
            <input type="text" className="form-control border-start-0 border-custom ps-0 bg-white" placeholder="Buscar por nombre, DNI o teléfono..." />
          </div>
          <select className="form-select border-custom fw-medium text-main w-auto px-4">
            <option>Tipo: Todos</option>
            <option>VIP</option>
            <option>Frecuente</option>
            <option>Regular</option>
          </select>
        </div>
        
        <div className="table-responsive">
          <table className="table table-custom mb-0 align-middle">
            <thead>
              <tr><th>DNI/RUC</th><th>NOMBRE</th><th>TELÉFONO</th><th>EMAIL</th><th>TIPO</th><th>ÚLTIMA COMPRA</th><th>TOTAL COMPRAS</th></tr>
            </thead>
            <tbody>
              {listaClientes.map((cliente) => (
                <tr key={cliente.id}>
                  <td className="fw-semibold text-main py-3">{cliente.doc}</td>
                  <td className="fw-medium text-main">{cliente.nombre}</td>
                  <td className="text-muted-custom">{cliente.telefono}</td>
                  <td className="text-muted-custom">{cliente.email}</td>
                  <td><span className={getBadgeClass(cliente.tipo)}>{cliente.tipo}</span></td>
                  <td className="text-muted-custom">{cliente.ultimaCompra}</td>
                  <td className="fw-semibold text-main">S/. {cliente.totalCompras}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};