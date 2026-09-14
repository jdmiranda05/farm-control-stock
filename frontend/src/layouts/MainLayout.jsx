import { Sidebar } from '../components/Sidebar';

export const MainLayout = ({ children, activeTab, setActiveTab, profile, onLogout }) => {
  return (
    <div className="d-flex" style={{ backgroundColor: 'var(--c-bg-app)', minHeight: '100vh' }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} profile={profile} onLogout={onLogout} />
      <main className="flex-grow-1" style={{ marginLeft: '260px', padding: '32px 40px' }}>
        {children}
      </main>
    </div>
  );
};
