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
import "./App.css";

import ApplicationsPage from "./Pages/ApplicationsPage";
import SettingPage from "./Pages/SettingPage";
import PackagePage from "./Pages/PackagePage";
import AnalysPage from "./Pages/AnalysPage";
import LoginPage from "./Pages/LoginPage";
import ScrollToTop from "./Components/ScroolToTop";
import { isAuthenticated } from "./Utils/authUtils";

const PrivateRoutes = () => {
  return isAuthenticated() ? (
    <Layout>
      <Outlet />
    </Layout>
  ) : (
    <Navigate to="/login" replace />
  );
};

const LoginPageGuard = () => {
  return isAuthenticated() ? <Navigate to="/home" replace /> : <LoginPage />;
};

function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    localStorage.setItem("theme", savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/login" element={<LoginPageGuard />} />

        <Route element={<PrivateRoutes />}>
          {/* user_code olan və olmayan hər iki halı tutur */}
          <Route path="/home" element={<HomePage />} />
          <Route path="/home/:user_code" element={<HomePage />} />
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/settings" element={<SettingPage />} />
          <Route path="/packages" element={<PackagePage />} />
          <Route path="/analys" element={<AnalysPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
