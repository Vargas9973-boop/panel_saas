import { Routes, Route, Navigate } from 'react-router-dom';
import RequireAuth from './pages/RequireAuth';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Onboarding />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
