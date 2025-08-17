import { createBrowserRouter } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Reviews from './pages/Reviews';

export const router = createBrowserRouter([
  { path: '/', element: <Dashboard /> },
  { path: '/reviews', element: <Reviews /> }
]);
