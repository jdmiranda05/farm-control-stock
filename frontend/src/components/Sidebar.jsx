import { Home, ArrowDownLeft, ArrowUpRight, Package } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  
  const getMenuItemStyle = (itemName) => {
    const isActive = activeTab === itemName;
    return {
      display: 'flex',
      alignItems: 'center',
      padding: '12px 16px',
      backgroundColor: isActive ? '#d1fae5' : 'transparent',
      borderRadius: '8px',
      cursor: 'pointer',
      color: isActive ? '#008f7a' : '#374151',
      fontWeight: isActive ? '600' : '500'
    };
  };

  return (
    <aside style={{ 
      width: '260px', 
      height: '100vh', 
      borderRight: '1px solid #eaeaea', 
      padding: '20px', 
      display: 'flex', 
      flexDirection: 'column',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#ffffff'
    }}>
      
      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
        <div style={{ 
          width: '40px', height: '40px', backgroundColor: '#008f7a',
          borderRadius: '8px', display: 'flex', justifyContent: 'center',
          alignItems: 'center', color: 'white', fontWeight: 'bold', fontSize: '20px',
          marginRight: '12px'
        }}>
          M
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#111827' }}>Botica M&LL</h2>
          <span style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Almacén Central</span>
        </div>
      </div>

      {/* Navegación */}
      <nav style={{ flex: 1 }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          <li 
            style={getMenuItemStyle('Dashboard')}
            onClick={() => setActiveTab('Dashboard')}
          >
            <Home size={20} style={{ marginRight: '12px' }} />
            Dashboard
          </li>

          <li 
            style={getMenuItemStyle('Kardex Entrada')}
            onClick={() => setActiveTab('Kardex Entrada')}
          >
            <ArrowDownLeft size={20} style={{ marginRight: '12px' }} />
            Kardex Entrada
          </li>
          
          <li 
            style={getMenuItemStyle('Kardex Salida')}
            onClick={() => setActiveTab('Kardex Salida')}
          >
            <ArrowUpRight size={20} style={{ marginRight: '12px' }} />
            Kardex Salida
          </li>
          
          <li 
            style={getMenuItemStyle('Inventario')}
            onClick={() => setActiveTab('Inventario')}
          >
            <Package size={20} style={{ marginRight: '12px' }} />
            Inventario
          </li>

        </ul>
      </nav>

      {/* Perfil Inferior */}
      <div style={{ 
        display: 'flex', alignItems: 'center', padding: '12px', 
        backgroundColor: '#f9fafb', borderRadius: '12px', marginTop: 'auto'
      }}>
        <div style={{ 
          width: '36px', height: '36px', borderRadius: '50%', 
          backgroundColor: '#ccc', marginRight: '12px',
          backgroundImage: 'url(https://ui-avatars.com/api/?name=Elena+Ramos&background=e5e7eb&color=374151)',
          backgroundSize: 'cover'
        }}></div>
        <div>
          <h4 style={{ margin: 0, fontSize: '14px', color: '#111827' }}>Dra. Elena Ramos</h4>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>Química Farmacéutica</span>
        </div>
      </div>

    </aside>
  );
}