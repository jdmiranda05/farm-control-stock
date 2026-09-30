import { Search, Bell, SlidersHorizontal, Plus } from 'lucide-react';

const KardexEntrada = () => {
  const styles = {
    container: {
      backgroundColor: '#f9fafb',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#333',
    },
    topHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '30px 40px',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e5e7eb',
    },
    titleWrapper: {
      display: 'flex',
      flexDirection: 'column',
    },
    title: {
      fontSize: '24px',
      fontWeight: '700',
      margin: '0 0 8px 0',
      color: '#111827',
    },
    subtitle: {
      fontSize: '14px',
      color: '#6b7280',
      margin: 0,
    },
    actionsContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    },
    searchWrapper: {
      display: 'flex',
      alignItems: 'center',
      backgroundColor: '#f9fafb',
      border: '1px solid #f3f4f6',
      padding: '8px 16px',
      borderRadius: '24px',
      width: '320px',
    },
    searchInput: {
      border: 'none',
      outline: 'none',
      backgroundColor: 'transparent',
      marginLeft: '8px',
      width: '100%',
      fontSize: '14px',
      color: '#374151',
    },
    bellButton: {
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      cursor: 'pointer',
      color: '#4b5563',
    },
    mainContent: {
      padding: '30px 40px',
    },
    whiteCard: {
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    },
    // Toolbar de acciones (Buscar, Filtrar, Nueva Entrada)
    toolbarRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
    },
    leftToolbar: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    },
    filterInputWrapper: {
      display: 'flex',
      alignItems: 'center',
      border: '1px solid #e5e7eb',
      padding: '10px 16px',
      borderRadius: '8px',
      width: '320px',
    },
    filterInput: {
      border: 'none',
      outline: 'none',
      marginLeft: '8px',
      width: '100%',
      fontSize: '14px',
      color: '#374151',
    },
    filterButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      padding: '10px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      color: '#374151',
      cursor: 'pointer',
      fontWeight: '500',
    },
    newEntryButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      backgroundColor: '#008f7a', // Color verde teal del sidebar
      border: 'none',
      padding: '10px 20px',
      borderRadius: '8px',
      fontSize: '14px',
      color: '#ffffff',
      cursor: 'pointer',
      fontWeight: '600',
    },
    // Estilos de Tabla
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '14px',
    },
    th: {
      textAlign: 'left',
      color: '#6b7280',
      fontWeight: '600',
      fontSize: '12px',
      padding: '16px',
      borderBottom: '1px solid #e5e7eb',
      textTransform: 'uppercase',
    },
    td: {
      padding: '16px',
      borderBottom: '1px solid #e5e7eb',
      color: '#374151',
      verticalAlign: 'middle',
    },
    boldText: {
      fontWeight: '700',
      color: '#111827',
    },
    greenBoldText: {
      fontWeight: '700',
      color: '#059669', // Verde para la cantidad
    },
  };

  const kardexData = [
    { fecha: '15 Oct 2025', codigo: 'MED-001', producto: 'Paracetamol 500mg', lote: 'L-PCT500', cantidad: '2,000', proveedor: 'Droguería Alfa', precioUnit: 'S/. 0.10', total: 'S/. 200.00' },
    { fecha: '14 Oct 2025', codigo: 'MED-012', producto: 'Amoxicilina 500mg', lote: 'L-AMX500', cantidad: '1,500', proveedor: 'Droguería Alfa', precioUnit: 'S/. 0.40', total: 'S/. 600.00' },
    { fecha: '12 Oct 2025', codigo: 'MED-045', producto: 'Omeprazol 20mg', lote: 'L-OMP20', cantidad: '1,000', proveedor: 'Medifarma S.A.', precioUnit: 'S/. 0.25', total: 'S/. 250.00' },
    { fecha: '10 Oct 2025', codigo: 'CRE-009', producto: 'Clotrimazol Crema 1%', lote: 'L-CLO9', cantidad: '300', proveedor: 'Farmaindustria', precioUnit: 'S/. 1.80', total: 'S/. 540.00' },
    { fecha: '08 Oct 2025', codigo: 'JAR-011', producto: 'Ibuprofeno 100mg/5ml', lote: 'L-IBU100', cantidad: '400', proveedor: 'Medifarma S.A.', precioUnit: 'S/. 2.50', total: 'S/. 1,000.00' },
  ];

  return (
    <div style={styles.container}>
      {/* Cabecera Principal */}
      <header style={styles.topHeader}>
        <div style={styles.titleWrapper}>
          <h1 style={styles.title}>Kardex de Entrada</h1>
          <p style={styles.subtitle}>Registro histórico de entradas, compras y abastecimiento de medicamentos</p>
        </div>
        <div style={styles.actionsContainer}>
          <div style={styles.searchWrapper}>
            <Search size={18} color="#9ca3af" />
            <input 
              type="text" 
              placeholder="Buscar medicamentos, lotes..." 
              style={styles.searchInput} 
            />
          </div>
          <button style={styles.bellButton}>
            <Bell size={20} />
          </button>
        </div>
      </header>

      {/* Área Principal */}
      <main style={styles.mainContent}>
        <div style={styles.whiteCard}>
          
          {/* Barra de Herramientas (Buscador, Filtro, Botón Nuevo) */}
          <div style={styles.toolbarRow}>
            <div style={styles.leftToolbar}>
              <div style={styles.filterInputWrapper}>
                <Search size={18} color="#9ca3af" />
                <input 
                  type="text" 
                  placeholder="Buscar por producto o código..." 
                  style={styles.filterInput} 
                />
              </div>
              
              <button style={styles.filterButton}>
                <SlidersHorizontal size={16} color="#6b7280" />
                Filtrar
              </button>
            </div>

            <button style={styles.newEntryButton}>
              <Plus size={18} color="#ffffff" />
              Nueva Entrada
            </button>
          </div>

          {/* Tabla de Kardex */}
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>FECHA</th>
                <th style={styles.th}>CÓDIGO</th>
                <th style={styles.th}>PRODUCTO</th>
                <th style={styles.th}>LOTE</th>
                <th style={styles.th}>CANTIDAD</th>
                <th style={styles.th}>PROVEEDOR</th>
                <th style={styles.th}>PRECIO UNIT.</th>
                <th style={styles.th}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {kardexData.map((item, index) => (
                <tr key={index}>
                  <td style={styles.td}>{item.fecha}</td>
                  <td style={styles.td}>{item.codigo}</td>
                  <td style={{ ...styles.td, ...styles.boldText }}>{item.producto}</td>
                  <td style={styles.td}>{item.lote}</td>
                  <td style={{ ...styles.td, ...styles.greenBoldText }}>{item.cantidad}</td>
                  <td style={styles.td}>{item.proveedor}</td>
                  <td style={styles.td}>{item.precioUnit}</td>
                  <td style={{ ...styles.td, ...styles.boldText }}>{item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>
      </main>
    </div>
  );
};

export default KardexEntrada;