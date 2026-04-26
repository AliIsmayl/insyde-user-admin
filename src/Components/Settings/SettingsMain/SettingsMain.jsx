import React, { useState, useEffect } from "react";
import {
  FiSun,
  FiMoon,
} from "react-icons/fi";
import "./SettingsMain.scss";
import Popup from "../../Popup/Popup";
import { CK } from "../../../Utils/authUtils";


const LANGUAGES = [
  { code: "az", label: "Azərbaycanca", flag: "🇦🇿", short: "AZ" },
  { code: "en", label: "English", flag: "🇬🇧", short: "EN" },
  { code: "ru", label: "Русский", flag: "🇷🇺", short: "RU" },
];

function SettingsMain() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "dark",
  );
  const [language, setLanguage] = useState(
    () => localStorage.getItem("language") || "az",
  );
  const [popup, setPopup] = useState({ isOpen: false, type: "success" });
  const [userCode, setUserCode] = useState(() => CK.get("user_code") || "");
  const closePopup = () => setPopup((p) => ({ ...p, isOpen: false }));

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    setUserCode(CK.get("user_code") || "");
  }, [theme]);

  const handleThemeChange = (selectedTheme) => {
    setTheme(selectedTheme);
    localStorage.setItem("theme", selectedTheme);
    document.documentElement.setAttribute("data-theme", selectedTheme);
  };

  const handleLanguageChange = (code) => {
    setLanguage(code);
    localStorage.setItem("language", code);
  };

  const handleLanguageSave = () => {
    setPopup({
      isOpen: true,
      type: "update",
      title: "Dil yeniləndi!",
      message: `İnterfeys dili "${LANGUAGES.find((l) => l.code === language)?.label}" olaraq tənzimləndi.`,
      confirmText: "Yenilə",
      onConfirm: null,
    });
  };

  return (
    <div className="settings-main-modern">
      <Popup
        isOpen={popup.isOpen}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        confirmText={popup.confirmText}
        cancelText="Ləğv et"
        onConfirm={() => {
          popup.onConfirm?.();
          closePopup();
        }}
        onCancel={closePopup}
      />

      <div className="top-header">
        <div>
          <h2 className="page-title">Ayarlar</h2>
          <p className="page-subtitle">
            Hesab təhlükəsizliyi və platforma tənzimləmələri
          </p>
        </div>
      </div>

      {/*
        LAYOUT:
        ┌─────────────┬─────────────┐
        │  Rəng       │             │
        ├─────────────┤   Parol     │
        │  Dil        │             │
        └─────────────┴─────────────┘
      */}
      <div className="settings-grid">
        {/* SOL SÜTUN */}
        <div className="settings-col left-col">
          {/* SOL YUXARI — RƏNG */}
          <div className="modern-card theme-card">
            <div className="card-header">
              <div>
                <h3>Platforma Görünüşü</h3>
                <p>İşləmək üçün sizə ən uyğun olan mövzunu seçin.</p>
              </div>
            </div>
            <div className="user-code-box">
              <span className="user-code-label">User Code</span>
              <strong className="user-code-value">{userCode || "—"}</strong>
            </div>
            <div className="theme-options">
              <div
                className={`theme-box ${theme === "dark" ? "active" : ""}`}
                onClick={() => handleThemeChange("dark")}
              >
                <div className="theme-preview dark-preview">
                  <div className="mock-sidebar" />
                  <div className="mock-content">
                    <div className="mock-box" />
                    <div className="mock-box" />
                  </div>
                </div>
                <div className="theme-info">
                  <FiMoon className="theme-icon" /> Tünd Mövzu
                </div>
              </div>
              <div
                className={`theme-box ${theme === "light" ? "active" : ""}`}
                onClick={() => handleThemeChange("light")}
              >
                <div className="theme-preview light-preview">
                  <div className="mock-sidebar" />
                  <div className="mock-content">
                    <div className="mock-box" />
                    <div className="mock-box" />
                  </div>
                </div>
                <div className="theme-info">
                  <FiSun className="theme-icon" /> Açıq Mövzu
                </div>
              </div>
            </div>
          </div>

          {/* SOL AŞAĞI — DİL (müvəqqəti deaktiv edilib) */}
          {/* <div className="modern-card language-card">
            <div className="card-header">
              <div className="header-icon">
                <FiGlobe />
              </div>
              <div>
                <h3>İnterfeys Dili</h3>
                <p>Platformanı istədiyiniz dildə istifadə edin.</p>
              </div>
            </div>
            <div className="language-options">
              {LANGUAGES.map((lang) => (
                <div
                  key={lang.code}
                  className={`language-box ${language === lang.code ? "active" : ""}`}
                  onClick={() => handleLanguageChange(lang.code)}
                >
                  <div className="lang-texts">
                    <span className="lang-label">{lang.label}</span>
                    <span className="lang-short">{lang.short}</span>
                  </div>
                  <div className="lang-radio">
                    {language === lang.code && (
                      <div className="lang-radio-dot" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div> */}
        </div>

        {/* SAĞ SÜTUN — EMAİL YENİLƏ (müvəqqəti deaktiv) */}
        {/* <div className="settings-col right-col">
          ...
        </div> */}
      </div>
    </div>
  );
}

export default SettingsMain;
