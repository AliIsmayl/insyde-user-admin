import React, { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import Layout from "./Components/Layout/Layout";
import HomePage from "./Pages/HomePage";
import './App.css'

import ApplicationsPage from "./Pages/ApplicationsPage";
import SettingPage from "./Pages/SettingPage";
import PackagePage from "./Pages/PackagePage";
import AnalysPage from "./Pages/AnalysPage";
import LoginPage from "./Pages/LoginPage";

// --- YENİ ƏLAVƏ ---
// Bu komponent yoxlayır ki, istifadəçi login olub ya yox.
const PrivateRoutes = () => {
  const isAuthenticated = localStorage.getItem("isAuthenticated");

  // Əgər login olubsa, Layout-u (və içindəki səhifələri) göstər
  // Əgər olmayıbsa, məcburi /login səhifəsinə at
  return isAuthenticated ? <Layout /> : <Navigate to="/login" replace />;
};

function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    localStorage.setItem("theme", savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />

        {/* LOGİN SƏHİFƏSİ */}
        <Route path="/login" element={<LoginPage />} />

        {/* YALNIZ LOGİN OLANLARIN GÖRƏ BİLƏCƏYİ SƏHİFƏLƏR */}
        <Route element={<PrivateRoutes />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/settings" element={<SettingPage />} />
          <Route path="/packages" element={<PackagePage />} />
          <Route path="/analys" element={<AnalysPage />} />
        </Route>

        {/* Yanlış link */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
