// src/components/Layout/Layout.jsx
import React, { useState, useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import Footer from "../Footer/Footer";
import Sidebar from "../Sidebar/Sidebar";
import "./Layout.scss";
import { API_BASE, authFetch } from "../../Utils/authUtils";

const URL_PROFILE = `${API_BASE}/api/v1/profile/me/`;

function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [packageType, setPackageType] = useState("free");
  const abortRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;

    authFetch(URL_PROFILE, { signal: controller.signal })
      .then((res) => {
        if (!res?.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        const d = data?.data || data;
        const sub = d?.subscription || {};
        const pkg = sub.version_type || sub.packet_type || "free";
        setPackageType(pkg);
      })
      .catch(() => {});

    return () => controller.abort();
  }, []);

  return (
    <div className="layout-container">
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        packageType={packageType}
      />

      <div className={`main-content ${isSidebarOpen ? "sidebar-open" : ""}`}>
        <div className="page-content">
          <Outlet />
        </div>

        <Footer />
      </div>
    </div>
  );
}

export default Layout;
