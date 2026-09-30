import { Search, Bell, SlidersHorizontal, Plus } from 'lucide-react';

const KardexSalida = () => {
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
    // Toolbar de acciones (Buscar, Filtrar, Nueva Salida)
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
    redBoldText: {
      fontWeight: '700',
      color: '#ef4444', // Rojo para la cantidad de salida
    },
    // Función para el estilo de los badges de motivo
    getMotivoBadgeStyle: (motivo) => {
      const baseStyle = {
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '600',
        display: 'inline-block',
      };

      switch (motivo) {
        case 'Venta':
          return { ...baseStyle, backgroundColor: '#d1fae5', color: '#059669' };
        case 'Merma (Rotura)':
          return { ...baseStyle, backgroundColor: '#fee2e2', color: '#b91c1c' };
        case 'Devolución':
          return { ...baseStyle, backgroundColor: '#fef08a', color: '#9a3412' };
        default:
          return { ...baseStyle, backgroundColor: '#f3f4f6', color: '#374151' };
      }
    }
  };

  const kardexData = [
    { fecha: '15 Oct 2025', codigo: 'MED-012', producto: 'Amoxicilina 250mg/5ml', lote: 'L-AMX250', cantidad: '15', motivo: 'Venta', responsable: 'Elena Ramos' },
    { fecha: '15 Oct 2025', codigo: 'MED-003', producto: 'Ibuprofeno 400mg', lote: 'L-IBU400', cantidad: '120', motivo: 'Venta', responsable: 'Elena Ramos' },
    { fecha: '14 Oct 2025', codigo: 'JAR-088', producto: 'Ambroxol Jarabe Infantil', lote: 'L-AMB08', cantidad: '4', motivo: 'Merma (Rotura)', responsable: 'Elena Ramos' },
    { fecha: '13 Oct 2025', codigo: 'MED-001', producto: 'Paracetamol 500mg', lote: 'L-PCT500', cantidad: '200', motivo: 'Venta', responsable: 'Elena Ramos' },
    { fecha: '11 Oct 2025', codigo: 'MED-022', producto: 'Loratadina 10mg', lote: 'L-LRT10', cantidad: '30', motivo: 'Devolución', responsable: 'Elena Ramos' },
  ];

  return (
    <div style={styles.container}>
      {/* Cabecera Principal */}
      <header style={styles.topHeader}>
        <div style={styles.titleWrapper}>
          <h1 style={styles.title}>Kardex de Salida</h1>
          <p style={styles.subtitle}>Control de dispensación, dispensación por venta, devoluciones y mermas</p>
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
          
          {/* Barra de Herramientas (Buscador, Filtrar, Nueva Salida) */}
          <div style={styles.toolbarRow}>
            <div style={styles.leftToolbar}>
              <div style={styles.filterInputWrapper}>
                <Search size={18} color="#9ca3af" />
                <input 
                  type="text" 
                  placeholder="Buscar por producto..." 
                  style={styles.filterInput} 
                />
              </div>
              
              <button style={styles.filterButton}>
                <SlidersHorizontal size={16} color="#6b7280" />
                Motivo: Todos
              </button>
            </div>

            <button style={styles.newEntryButton}>
              <Plus size={18} color="#ffffff" />
              Nueva Salida
            </button>
          </div>

          {/* Tabla de Kardex de Salida */}
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>FECHA</th>
                <th style={styles.th}>CÓDIGO</th>
                <th style={styles.th}>PRODUCTO</th>
                <th style={styles.th}>LOTE</th>
                <th style={styles.th}>CANTIDAD</th>
                <th style={styles.th}>MOTIVO</th>
                <th style={styles.th}>RESPONSABLE</th>
              </tr>
            </thead>
            <tbody>
              {kardexData.map((item, index) => (
                <tr key={index}>
                  <td style={styles.td}>{item.fecha}</td>
                  <td style={styles.td}>{item.codigo}</td>
                  <td style={{ ...styles.td, ...styles.boldText }}>{item.producto}</td>
                  <td style={styles.td}>{item.lote}</td>
                  <td style={{ ...styles.td, ...styles.redBoldText }}>{item.cantidad}</td>
                  <td style={styles.td}>
                    <span style={styles.getMotivoBadgeStyle(item.motivo)}>
                      {item.motivo}
                    </span>
                  </td>
                  <td style={styles.td}>{item.responsable}</td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>
      </main>
    </div>
  );
};

export default KardexSalida;