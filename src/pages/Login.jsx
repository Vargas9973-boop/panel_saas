import { supabase } from '../supabase';

// Requiere el provider de Google habilitado en Supabase Auth (Dashboard ->
// Authentication -> Providers -> Google, con el Client ID/Secret de Google
// Cloud) y esta URL agregada a "Redirect URLs" ahí mismo -- no se puede
// configurar desde código, es un paso manual en el dashboard.
export default function Login() {
  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-xl text-center">
        <h1 className="text-xl font-semibold text-white mb-1">Da de alta tu negocio</h1>
        <p className="text-sm text-neutral-400 mb-6">
          Sistema de punto de venta para restaurantes -- ventas, cocina (KDS), inventario y más.
        </p>
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 rounded-lg bg-white text-neutral-900 font-medium px-4 py-2.5 hover:bg-neutral-100 transition-colors"
        >
          <GoogleIcon />
          Continuar con Google
        </button>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.61z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.19l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.35 0-4.34-1.58-5.05-3.71H.95v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.16 6.65 3.58 9 3.58z" />
    </svg>
  );
}
