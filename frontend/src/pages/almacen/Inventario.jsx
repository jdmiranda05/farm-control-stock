import { Search, Bell, ChevronDown } from 'lucide-react';

const Inventario = () => {
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
    filtersRow: {
      display: 'flex',
      gap: '16px',
      marginBottom: '24px',
      alignItems: 'center',
    },
    filterInputWrapper: {
      display: 'flex',
      alignItems: 'center',
      border: '1px solid #e5e7eb',
      padding: '10px 16px',
      borderRadius: '8px',
      width: '350px',
    },
    filterInput: {
      border: 'none',
      outline: 'none',
      marginLeft: '8px',
      width: '100%',
      fontSize: '14px',
      color: '#374151',
    },
    dropdownButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      padding: '10px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      color: '#374151',
      cursor: 'pointer',
      minWidth: '160px',
    },
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
      borderTop: '1px solid #e5e7eb',
      textTransform: 'uppercase',
    },
    td: {
      padding: '16px',
      borderBottom: '1px solid #e5e7eb',
      color: '#374151',
      verticalAlign: 'middle',
    },
    productName: {
      fontWeight: '700',
      color: '#111827',
    },
    stockValue: {
      fontWeight: '700',
      color: '#111827',
    },
    // Función corregida sin variables 'let', usando retornos directos de objetos
    getBadgeStyle: (estado) => {
      const baseStyle = {
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '600',
        display: 'inline-block',
      };

      switch (estado) {
        case 'Normal':
          return { ...baseStyle, backgroundColor: '#d1fae5', color: '#059669' };
        case 'Stock Bajo':
          return { ...baseStyle, backgroundColor: '#fef08a', color: '#9a3412' };
        case 'Agotado':
          return { ...baseStyle, backgroundColor: '#fee2e2', color: '#b91c1c' };
        default:
          return { ...baseStyle, backgroundColor: '#f3f4f6', color: '#374151' };
      }
    }
  };

  const inventoryData = [
    { codigo: 'MED-001', producto: 'Paracetamol 500mg (Tabletas)', categoria: 'Analgesicos', stockActual: '4,200', stockMin: '500', precio: 'S/. 0.10', estado: 'Normal' },
    { codigo: 'MED-012', producto: 'Amoxicilina 500mg (Cápsulas)', categoria: 'Antibióticos', stockActual: '1,500', stockMin: '300', precio: 'S/. 0.40', estado: 'Normal' },
    { codigo: 'JAR-011', producto: 'Ibuprofeno 100mg/5ml (Jarabe)', categoria: 'Pediatría / Antiinflam...', stockActual: '45', stockMin: '100', precio: 'S/. 2.50', estado: 'Stock Bajo' },
    { codigo: 'MED-045', producto: 'Omeprazol 20mg (Cápsulas)', categoria: 'Gastrointestinal', stockActual: '1,200', stockMin: '200', precio: 'S/. 0.25', estado: 'Normal' },
    { codigo: 'JAR-088', producto: 'Ambroxol Jarabe Infantil', categoria: 'Pediatría / Respirato...', stockActual: '0', stockMin: '50', precio: 'S/. 4.20', estado: 'Agotado' },
    { codigo: 'CRE-009', producto: 'Clotrimazol Crema 1%', categoria: 'Dermatológicos', stockActual: '12', stockMin: '30', precio: 'S/. 1.80', estado: 'Stock Bajo' },
    { codigo: 'MED-022', producto: 'Loratadina 10mg (Tabletas)', categoria: 'Antihistamínicos', stockActual: '800', stockMin: '150', precio: 'S/. 0.15', estado: 'Normal' },
  ];

  return (
    <div style={styles.container}>
      {/* Cabecera Principal */}
      <header style={styles.topHeader}>
        <div style={styles.titleWrapper}>
          <h1 style={styles.title}>Inventario de Productos</h1>
          <p style={styles.subtitle}>Niveles de stock en tiempo real, alertas de reabastecimiento y categorías</p>
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
          
          {/* Fila de Filtros */}
          <div style={styles.filtersRow}>
            <div style={styles.filterInputWrapper}>
              <Search size={18} color="#9ca3af" />
              <input 
                type="text" 
                placeholder="Buscar producto por nombre o código..." 
                style={styles.filterInput} 
              />
            </div>
            
            <button style={styles.dropdownButton}>
              Categoría: Todas
              <ChevronDown size={16} color="#6b7280" style={{ marginLeft: '8px' }} />
            </button>
            
            <button style={styles.dropdownButton}>
              Estado: Todos
              <ChevronDown size={16} color="#6b7280" style={{ marginLeft: '8px' }} />
            </button>
          </div>

          {/* Tabla de Inventario */}
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>CÓDIGO</th>
                <th style={styles.th}>PRODUCTO</th>
                <th style={styles.th}>CATEGORÍA</th>
                <th style={styles.th}>STOCK ACTUAL</th>
                <th style={styles.th}>STOCK MÍN.</th>
                <th style={styles.th}>PRECIO</th>
                <th style={styles.th}>ESTADO</th>
              </tr>
            </thead>
            <tbody>
              {inventoryData.map((item, index) => (
                <tr key={index}>
                  <td style={styles.td}>{item.codigo}</td>
                  <td style={{ ...styles.td, ...styles.productName }}>{item.producto}</td>
                  <td style={styles.td}>{item.categoria}</td>
                  <td style={{ ...styles.td, ...styles.stockValue }}>{item.stockActual}</td>
                  <td style={styles.td}>{item.stockMin}</td>
                  <td style={styles.td}>{item.precio}</td>
                  <td style={styles.td}>
                    <span style={styles.getBadgeStyle(item.estado)}>
                      {item.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>
      </main>
    </div>
  );
};

export default Inventario;