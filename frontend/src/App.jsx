import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import Documents from './pages/Documents';

function Protected({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppLayout({ darkMode, toggleDark }) {
  const { isAuthenticated } = useAuth();
  return (
    <>
      {isAuthenticated && <Navbar darkMode={darkMode} toggleDark={toggleDark} />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/chat" element={<Protected><Chat /></Protected>} />
        <Route path="/documents" element={<Protected><Documents /></Protected>} />
        <Route path="*" element={<Navigate to="/chat" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  const [darkMode, setDarkMode] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const toggleDark = () => setDarkMode(d => !d);

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout darkMode={darkMode} toggleDark={toggleDark} />
      </AuthProvider>
    </BrowserRouter>
  );
}
