import React, { useState, useEffect } from 'react';
import { CustomerOrderPage } from './pages/CustomerOrderPage';
import { KDSView } from './components/kds/KDSView';
import { AdminDashboard } from './components/admin/AdminDashboard';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (currentPath.startsWith('/kds')) {
    return <KDSView />;
  }

  if (currentPath.startsWith('/admin')) {
    return <AdminDashboard />;
  }

  // Default to customer order page
  return <CustomerOrderPage />;
}
