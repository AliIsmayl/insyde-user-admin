// src/components/Layout/Layout.jsx
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Footer from "../Footer/Footer";
import Sidebar from "../Sidebar/Sidebar";
import "./Layout.scss";

function Layout() {
  // Sidebar-ın açıq və ya qapalı vəziyyətini burda idarə edirik
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="layout-container">
      {/* Sidebar öz vəziyyətini idarə edə bilsin deyə props göndəririk */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Sidebar açıqdırsa xüsusi '.sidebar-open' class-ı əlavə edilir */}
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
