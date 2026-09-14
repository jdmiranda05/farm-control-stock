import { useEffect, useState } from 'react';
import { MainLayout } from './layouts/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { PuntoVenta } from './pages/PuntoVenta';
import { Historial } from './pages/Historial';
import { Clientes } from './pages/Clientes';
import { Login } from './pages/Login';
import { ModalVenta } from './components/ModalVenta';
import { ModalCliente } from './components/ModalCliente';
import { supabase } from './lib/supabaseClient';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const loadProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id,nombres,apellidos,rol,activo')
      .eq('id', userId)
      .single();

    if (error) throw error;
    if (!data.activo) throw new Error('El usuario se encuentra inactivo.');

    setProfile(data);
    return data;
  };

  useEffect(() => {
    let mounted = true;

    const hydrateSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (!mounted) return;
      setSession(data.session);

      if (data.session?.user?.id) {
        try {
          await loadProfile(data.session.user.id);
        } catch {
          await supabase.auth.signOut();
          setSession(null);
          setProfile(null);
        }
      }

      if (mounted) setIsCheckingSession(false);
    };

    hydrateSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) setProfile(null);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) throw error;

    await loadProfile(data.user.id);
    setSession(data.session);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setActiveTab('dashboard');
  };

  if (isCheckingSession) {
    return <div className="app-loading">Cargando sesion...</div>;
  }

  if (!session) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <MainLayout activeTab={activeTab} setActiveTab={setActiveTab} profile={profile} onLogout={handleLogout}>
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
