import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Reviews from './pages/Reviews';
import { useAuthGuard } from './auth/cognito';

export default function App() {
  useAuthGuard();
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/reviews" element={<Reviews />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
