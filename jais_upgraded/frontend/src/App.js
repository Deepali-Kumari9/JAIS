import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage     from './pages/LoginPage';
import UploadPage    from './pages/UploadPage';
import AnalysisPage  from './pages/AnalysisPage';
import InsightsPage  from './pages/InsightsPage';
import DashboardPage from './pages/DashboardPage';
import CCMSPage      from './pages/CCMSPage';

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('jais_user') || 'null'); } catch { return null; }
  });

  const login  = (u) => { setUser(u); sessionStorage.setItem('jais_user', JSON.stringify(u)); };
  const logout = ()  => { setUser(null); sessionStorage.removeItem('jais_user'); };

  if (!user) return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<LoginPage onLogin={login}/>}/>
      </Routes>
    </BrowserRouter>
  );

  const isAdmin = user.role === 'Admin' || user.perms?.includes('all');

  return (
    <BrowserRouter>
      <Routes>
        {/* All logged-in roles can upload and view everything */}
        <Route path="/"              element={<UploadPage    user={user} onLogout={logout}/>}/>
        <Route path="/analysis/:id"  element={<AnalysisPage  user={user} onLogout={logout}/>}/>
        <Route path="/insights/:id"  element={<InsightsPage  user={user} onLogout={logout}/>}/>
        <Route path="/dashboard/:id" element={<DashboardPage user={user} onLogout={logout}/>}/>

        {/* CCMS page: Admin only */}
        <Route path="/ccms" element={
          isAdmin
            ? <CCMSPage user={user} onLogout={logout}/>
            : <Navigate to="/" replace/>
        }/>

        <Route path="*" element={<Navigate to="/" replace/>}/>
      </Routes>
    </BrowserRouter>
  );
}
