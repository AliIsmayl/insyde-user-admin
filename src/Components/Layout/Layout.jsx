import React, { useState, useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import Footer from "../Footer/Footer";
import Sidebar from "../Sidebar/Sidebar";
import "./Layout.scss";
import { API_BASE, authFetch, CK } from "../../Utils/authUtils";

const URL_PROFILE = `${API_BASE}/api/v1/profile/me/`;

function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [packageType, setPackageType] = useState("free");
  const [userCode, setUserCode] = useState(CK.get("user_code") || "");
  const [hashId, setHashId] = useState(CK.get("hash_id") || "");
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

        const code =
          d?.user_info?.user_code || d?.user_code || CK.get("user_code") || "";
        if (code) {
          setUserCode(code);
          CK.set("user_code", code);
        }

        const hid =
          d?.user_info?.hash_id || d?.hash_id || CK.get("hash_id") || "";
        if (hid) {
          setHashId(hid);
          CK.set("hash_id", hid);
        }
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
        userCode={userCode}
        hashId={hashId}
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
