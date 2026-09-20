import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import ProductMonitor from './pages/ProductMonitor';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default route redirects to /dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Main Application Routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route path="/products/:id/monitor" element={<ProductMonitor />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
