import { Sidebar } from '../components/Sidebar';

export const MainLayout = ({ children }) => {
  return (
    <div className="d-flex" style={{ backgroundColor: 'var(--c-bg-app)', minHeight: '100vh' }}>
      <Sidebar />
      <main className="flex-grow-1" style={{ marginLeft: '260px', padding: '32px 40px' }}>
        {children}
      </main>
    </div>
  );
};

