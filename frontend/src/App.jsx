import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Inventario from './pages/Inventario';

export default function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'Dashboard':
        return <Dashboard />;
      case 'Inventario':
        return <Inventario />;
      case 'Kardex Entrada':
        return <div style={{ padding: '30px' }}><h2>Pantalla de Kardex Entrada (En construcción)</h2></div>;
      case 'Kardex Salida':
        return <div style={{ padding: '30px' }}><h2>Pantalla de Kardex Salida (En construcción)</h2></div>;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main style={{ flex: 1, overflowY: 'auto' }}>
        {renderContent()}
      </main>
    </div>
  );
}