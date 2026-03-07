import React, { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { FiSettings, FiChevronDown, FiMenu } from "react-icons/fi";
import { HiOutlineHome } from "react-icons/hi2";
import { LuSquareArrowOutDownLeft } from "react-icons/lu";
import { FaRegMessage } from "react-icons/fa6";
import { PiPackage } from "react-icons/pi";
import { TbBrandGoogleAnalytics } from "react-icons/tb";
import "./Sidebar.scss";

function Sidebar({ isOpen, setIsOpen }) {
  const [openMenus, setOpenMenus] = useState({});
  const sidebarRef = useRef(null);

  // Ekran ölçüsünü yoxlamaq üçün state (Masaüstü və ya Mobil)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Kənara klikləyəndə bağlansın (Xüsusilə mobil üçün faydalıdır)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, setIsOpen]);

  // Hover funksiyaları (Yalnız masaüstü üçün)
  const handleMouseEnter = () => {
    if (!isMobile) setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsOpen(false);
      setOpenMenus({}); // Bağlananda alt menyuları da bağlasın
    }
  };

  const toggleSubmenu = (e, menuName) => {
    e.stopPropagation();
    if (!isOpen) setIsOpen(true);
    setOpenMenus((prev) => ({ ...prev, [menuName]: !prev[menuName] }));
  };

  const menuItems = [
    {
      name: "Ana səhifə",
      path: "/",
      icon: <HiOutlineHome />,
    },

    { name: "Paketlər", path: "/packages", icon: <PiPackage /> },
    { name: "Analitika", path: "/analys", icon: <TbBrandGoogleAnalytics /> },
    {
      name: "Müraciətlər",
      path: "/applications",
      icon: <FaRegMessage />,
    },
  ];

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen(false)}
      ></div>

      <div
        className={`sidebar ${isOpen ? "open" : "closed"}`}
        ref={sidebarRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* LOGO HİSSƏSİ (DİNAMİK) */}
        <div className="sidebar-logo">
          <div className="logo-text-container">
            <span className="logo-small">insyde</span>
            <span className="logo-large">INSYDE</span>
          </div>

          <button
            className="mobile-close-btn"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          >
            ✖
          </button>
        </div>

        {/* MENYULAR */}
        <div className="sidebar-menu">
          {menuItems.map((item, index) => (
            <div key={index} className="menu-group">
              {item.submenu ? (
                <>
                  <div
                    className={`menu-item submenu-toggle ${openMenus[item.name] ? "open" : ""}`}
                    onClick={(e) => toggleSubmenu(e, item.name)}
                  >
                    <div className="icon-container">{item.icon}</div>
                    <span className="menu-text">{item.name}</span>
                    <FiChevronDown className="submenu-arrow" />
                  </div>
                  <div
                    className={`submenu-list ${openMenus[item.name] && isOpen ? "expanded" : ""}`}
                  >
                    {item.submenu.map((sub, subIndex) => (
                      <NavLink
                        to={sub.path}
                        key={subIndex}
                        className={({ isActive }) =>
                          `sub-menu-item ${isActive ? "active" : ""}`
                        }
                        onClick={() => isMobile && setIsOpen(false)}
                      >
                        <span className="sub-menu-dot"></span>
                        <span className="sub-menu-text">{sub.name}</span>
                      </NavLink>
                    ))}
                  </div>
                </>
              ) : (
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `menu-item ${isActive ? "active" : ""}`
                  }
                  onClick={() => isMobile && setIsOpen(false)}
                >
                  <div className="icon-container">{item.icon}</div>
                  <span className="menu-text">{item.name}</span>
                </NavLink>
              )}
            </div>
          ))}
        </div>

        {/* ALT HİSSƏ (FOOTER) */}
        <div className="sidebar-footer">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `menu-item ${isActive ? "active" : ""}`
            }
            onClick={() => isMobile && setIsOpen(false)}
          >
            <div className="icon-container">
              <FiSettings />
            </div>
            <span className="menu-text">Ayarlar</span>
          </NavLink>

          <NavLink
            to="/login"
            className={({ isActive }) =>
              `menu-item ${isActive ? "active" : ""}`
            }
            onClick={() => isMobile && setIsOpen(false)}
          >
            <div className="icon-container">
              <LuSquareArrowOutDownLeft />
            </div>
            <span className="menu-text">Çıxış</span>
          </NavLink>
        </div>
      </div>

      {/* MOBİLDƏ GÖRÜNƏN HAMBURGER DÜYMƏSİ */}
      <button className="mobile-hamburger" onClick={() => setIsOpen(true)}>
        <FiMenu />
      </button>
    </>
  );
}

export default Sidebar;
