import React, { useState, useEffect } from "react";
import {
  FiLock,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiSun,
  FiMoon,
  FiGlobe,
} from "react-icons/fi";
import "./SettingsMain.scss";
import Popup from "../../Popup/Popup";

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
  const closePopup = () => setPopup((p) => ({ ...p, isOpen: false }));

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
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

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e) =>
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  const toggleVisibility = (field) =>
    setShowPassword({ ...showPassword, [field]: !showPassword[field] });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (passwords.newPassword === passwords.confirmPassword) {
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } else {
      alert("Yeni şifrələr uyğun gəlmir!");
    }
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

          {/* SOL AŞAĞI — DİL */}
          <div className="modern-card language-card">
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
        
          </div>
        </div>

        {/* SAĞ SÜTUN — PAROL */}
        <div className="settings-col right-col">
          <div className="modern-card password-card">
            <div className="card-header">
              <div className="header-icon">
                <FiLock />
              </div>
              <div>
                <h3>Şifrəni Yenilə</h3>
                <p>
                  Hesabınızın təhlükəsizliyini qorumaq üçün güclü şifrə istifadə
                  edin.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="password-form">
              <div className="input-group">
                <label>Mövcud Şifrə</label>
                <div className="input-wrapper">
                  <input
                    type={showPassword.current ? "text" : "password"}
                    name="currentPassword"
                    placeholder="Hazırkı şifrənizi daxil edin"
                    value={passwords.currentPassword}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => toggleVisibility("current")}
                  >
                    {showPassword.current ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div className="divider" />

              <div className="input-group">
                <label>Yeni Şifrə</label>
                <div className="input-wrapper">
                  <input
                    type={showPassword.new ? "text" : "password"}
                    name="newPassword"
                    placeholder="Yeni şifrə yaradın"
                    value={passwords.newPassword}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => toggleVisibility("new")}
                  >
                    {showPassword.new ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                <ul className="password-rules">
                  <li>Ən azı 8 simvol</li>
                  <li>Böyük və kiçik hərflər</li>
                  <li>Rəqəm və ya xüsusi simvol</li>
                </ul>
              </div>

              <div className="input-group">
                <label>Yeni Şifrə (Təkrar)</label>
                <div className="input-wrapper">
                  <input
                    type={showPassword.confirm ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Yeni şifrəni təsdiqləyin"
                    value={passwords.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => toggleVisibility("confirm")}
                  >
                    {showPassword.confirm ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div className="form-actions">
                {isSuccess && (
                  <div className="success-msg">
                    <FiCheckCircle /> Şifrəniz uğurla yeniləndi!
                  </div>
                )}
                <button
                  type="submit"
                  className="save-btn"
                  onClick={() =>
                    setPopup({
                      isOpen: true,
                      type: "success",
                      title: "Uğurlu!",
                      message: "Məlumatlarınız yeniləndi.",
                      confirmText: "Əla",
                      onConfirm: null,
                    })
                  }
                >
                  Yadda Saxla
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsMain;
