import React, { useEffect, useState } from "react";
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
import OrderPage from "./Pages/OrderPage";
import ScrollToTop from "./Components/ScroolToTop";
import { isAuthenticated, authFetch, API_BASE } from "./Utils/authUtils";
const ANALYS_ALLOWED_PLANS = ["pro", "premium"];

const PrivateRoutes = () => {
  return isAuthenticated() ? (
    <Layout>
      <Outlet />
    </Layout>
  ) : (
    <Navigate to="/login" replace />
  );
};

const PlanRoute = () => {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    authFetch(`${API_BASE}/api/v1/profile/me/`)
      .then((res) => (res?.ok ? res.json() : null))
      .then((data) => {
        if (!data) { setStatus("denied"); return; }
        const d = data?.data || data;
        const sub = d?.subscription || {};
        const pkg = (sub.version_type || sub.packet_type || "free").toLowerCase();
        setStatus(ANALYS_ALLOWED_PLANS.includes(pkg) ? "allowed" : "denied");
      })
      .catch(() => setStatus("denied"));
  }, []);

  if (status === "loading") return null;
  if (status === "allowed") return <Outlet />;
  return <Navigate to="/packages" replace />;
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
          <Route path="/home" element={<HomePage />} />
          <Route path="/home/:hash_id" element={<HomePage />} />
          <Route element={<PlanRoute />}>
            <Route path="/analys" element={<AnalysPage />} />
            <Route path="/analys/:hash_id" element={<AnalysPage />} />
          </Route>
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/applications/:hash_id" element={<ApplicationsPage />} />
          <Route path="/settings" element={<SettingPage />} />
          <Route path="/packages" element={<PackagePage />} />
          <Route path="/order" element={<OrderPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
