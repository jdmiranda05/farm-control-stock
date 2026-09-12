import { useState } from 'react';
import { MainLayout } from './layouts/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { PuntoVenta } from './pages/PuntoVenta';
import { Historial } from './pages/Historial';
import { Clientes } from './pages/Clientes';
import { ModalVenta } from './components/ModalVenta';
import { ModalCliente } from './components/ModalCliente';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <MainLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {/* Vistas Dinámicas */}
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'pos' && <PuntoVenta />}
      {activeTab === 'historial' && <Historial />}
      {activeTab === 'clientes' && <Clientes />}
      
      {/* Modales globales */}
      <ModalVenta />
      <ModalCliente />
    </MainLayout>
  );
}

export default App;