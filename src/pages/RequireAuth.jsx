import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabase';

// Equivalente simplificado de RequireSuperadmin.jsx (panel /admin): aquí
// cualquier cuenta de Google autenticada pasa -- no hay is_superadmin() de
// por medio, este panel es de alta abierta para dueños de negocio nuevos.
export default function RequireAuth({ children }) {
  const [status, setStatus] = useState('checking'); // checking | anon | authed

  useEffect(() => {
    let active = true;

    async function check() {
      const { data: { session } } = await supabase.auth.getSession();
      if (active) setStatus(session ? 'authed' : 'anon');
    }

    check();

    const { data: sub } = supabase.auth.onAuthStateChange(() => check());
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (status === 'checking') return null;
  if (status === 'anon') return <Navigate to="/login" replace />;
  return children;
}
