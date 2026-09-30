import { Package, ArrowDownLeft, ArrowUpRight, AlertCircle, Search, Bell } from 'lucide-react';

const AlmacenDashboard = () => {
  const styles = {
    container: {
      backgroundColor: '#f8f9fa',
      minHeight: '100vh',
      padding: '30px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#333',
    },
    headerContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '30px',
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
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      padding: '8px 16px',
      borderRadius: '24px',
      width: '300px',
    },
    searchInput: {
      border: 'none',
      outline: 'none',
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
    row: {
      display: 'flex',
      gap: '20px',
      marginBottom: '20px',
    },
    card: {
      backgroundColor: '#fff',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    },
    cardTitle: {
      fontSize: '14px',
      color: '#4b5563',
      fontWeight: '600',
      marginBottom: '16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    iconBox: {
      backgroundColor: '#f0fdfa', 
      padding: '8px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#0d9488', 
    },
    cardValue: {
      fontSize: '32px',
      fontWeight: '700',
      margin: '0 0 4px 0',
      color: '#111827',
    },
    cardSubtitle: {
      fontSize: '13px',
      color: '#9ca3af',
      margin: 0,
    },
    bottomRow: {
      display: 'flex',
      gap: '20px',
    },
    leftColumn: {
      flex: '0 0 68%',
      backgroundColor: '#fff',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    },
    rightColumn: {
      flex: '1',
      backgroundColor: '#fff',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    },
    sectionTitle: {
      fontSize: '16px',
      fontWeight: '700',
      marginBottom: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      color: '#111827',
    },
    linkText: {
      fontSize: '14px',
      color: '#0d9488',
      cursor: 'pointer',
      fontWeight: '600',
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
      paddingBottom: '16px',
      borderBottom: '1px solid #f3f4f6',
      textTransform: 'uppercase',
    },
    td: {
      padding: '16px 0',
      borderBottom: '1px solid #f3f4f6',
      color: '#374151',
    },
    badge: (type) => ({
      padding: '4px 12px',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: '600',
      backgroundColor: type === 'Entrada' ? '#d1fae5' : '#ffedd5',
      color: type === 'Entrada' ? '#059669' : '#d97706',
    }),
    barChartContainer: {
      height: '160px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      padding: '20px 24px 0 24px',
      marginBottom: '15px',
    },
    bar: (height) => ({
      width: '24px',
      backgroundColor: '#0d9488',
      height: height,
      borderRadius: '0', 
    }),
    chartLabels: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '30px',
      fontSize: '12px',
      color: '#6b7280',
      padding: '0 30px',
    },
    indicatorRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '12px 0',
      fontSize: '14px',
      borderBottom: '1px solid #f3f4f6',
    }
  };

  const tableData = [
    { fecha: '15 Oct, 09:30', tipo: 'Entrada', producto: 'Paracetamol', lote: 'L-PCT500', cant: '+2,000', cantColor: '#059669', responsable: 'Elena Ramos' },
    { fecha: '15 Oct, 10:15', tipo: 'Salida', producto: 'Amoxicilina', lote: 'L-AMX250', cant: '-15', cantColor: '#111827', responsable: 'Elena Ramos' },
    { fecha: '15 Oct, 11:00', tipo: 'Salida', producto: 'Ibuprofeno', lote: 'L-IBU400', cant: '-120', cantColor: '#111827', responsable: 'Elena Ramos' },
    { fecha: '15 Oct, 11:45', tipo: 'Entrada', producto: 'Omeprazol', lote: 'L-OMP20', cant: '+500', cantColor: '#059669', responsable: 'Elena Ramos' },
    { fecha: '15 Oct, 12:30', tipo: 'Salida', producto: 'Loratadina', lote: 'L-LRT10', cant: '-30', cantColor: '#111827', responsable: 'Elena Ramos' },
  ];

  return (
    <div style={styles.container}>
      {/* Cabecera Superior */}
      <div style={styles.headerContainer}>
        <div>
          <h1 style={styles.title}>Resumen de Operaciones</h1>
          <p style={styles.subtitle}>Panel de control y estado de inventario para Botica M&LL</p>
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
      </div>

      {/* Fila Superior: Tarjetas */}
      <div style={styles.row}>
        <div style={styles.card}>
          <div style={styles.cardTitle}>
            Total de Productos 
            <div style={styles.iconBox}><Package size={20} /></div>
          </div>
          <p style={styles.cardValue}>342</p>
          <p style={styles.cardSubtitle}>Medicamentos registrados</p>
        </div>
        
        <div style={styles.card}>
          <div style={styles.cardTitle}>
            Entradas Hoy 
            <div style={styles.iconBox}><ArrowDownLeft size={20} /></div>
          </div>
          <p style={{ ...styles.cardValue, color: '#059669' }}>+2,500</p>
          <p style={styles.cardSubtitle}>Unidades recibidas</p>
        </div>
        
        <div style={styles.card}>
          <div style={styles.cardTitle}>
            Salidas Hoy 
            <div style={styles.iconBox}><ArrowUpRight size={20} /></div>
          </div>
          <p style={{ ...styles.cardValue, color: '#d97706' }}>-165</p>
          <p style={styles.cardSubtitle}>Unidades dispensadas</p>
        </div>
        
        <div style={styles.card}>
          <div style={styles.cardTitle}>
            Alertas de Stock 
            <div style={styles.iconBox}><AlertCircle size={20} /></div>
          </div>
          <p style={{ ...styles.cardValue, color: '#dc2626' }}>8</p>
          <p style={styles.cardSubtitle}>Productos en estado crítico</p>
        </div>
      </div>

      {/* Fila Inferior */}
      <div style={styles.bottomRow}>
        
        {/* Columna Izquierda */}
        <div style={styles.leftColumn}>
          <div style={styles.sectionTitle}>
            <span>Movimientos Recientes (Kardex)</span>
            <span style={styles.linkText}>Ver todo el historial</span>
          </div>
          
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>FECHA</th>
                <th style={styles.th}>TIPO</th>
                <th style={styles.th}>PRODUCTO</th>
                <th style={styles.th}>LOTE</th>
                <th style={styles.th}>CANT.</th>
                <th style={styles.th}>RESPONSABLE</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, index) => (
                <tr key={index}>
                  <td style={styles.td}>{row.fecha}</td>
                  <td style={styles.td}><span style={styles.badge(row.tipo)}>{row.tipo}</span></td>
                  <td style={styles.td}>{row.producto}</td>
                  <td style={styles.td}>{row.lote}</td>
                  <td style={{ ...styles.td, fontWeight: '700', color: row.cantColor }}>{row.cant}</td>
                  <td style={styles.td}>{row.responsable}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Columna Derecha */}
        <div style={styles.rightColumn}>
          <div style={styles.sectionTitle}>
            <span>Tendencia Semanal</span>
          </div>
          
          {/* Gráfico de barras modificado */}
          <div style={styles.barChartContainer}>
            <div style={styles.bar('35%')}></div>
            <div style={styles.bar('50%')}></div>
            <div style={styles.bar('80%')}></div>
            <div style={styles.bar('40%')}></div>
            <div style={styles.bar('70%')}></div>
            <div style={styles.bar('95%')}></div>
            <div style={styles.bar('75%')}></div>
          </div>
          
          <div style={styles.chartLabels}>
            <span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span>
          </div>

          {/* Indicadores */}
          <div>
            <div style={styles.indicatorRow}>
              <span style={{color: '#6b7280'}}>Capacidad Utilizada</span>
              <span style={{fontWeight: '700', color: '#111827'}}>68%</span>
            </div>
            <div style={{ ...styles.indicatorRow, borderBottom: 'none' }}>
              <span style={{color: '#6b7280'}}>Vencimiento Próximo (30d)</span>
              <span style={{fontWeight: '700', color: '#dc2626'}}>3 Lotes</span>
            </div>
          </div>
          
        </div>
        
      </div>
    </div>
  );
};

export default AlmacenDashboard;