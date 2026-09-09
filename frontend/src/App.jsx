import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto' }}>
        <Dashboard />
      </main>
    </div>
  );
}