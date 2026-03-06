import React, { useState, useEffect } from "react";
import {
  FiLock,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiSun,
  FiMoon,
} from "react-icons/fi";
import "./SettingsMain.scss";

function SettingsMain() {
  // Mövzu dəyişdirmə (Dark / Light)
  const [theme, setTheme] = useState("dark"); // Default olaraq dark qoyuruq

  useEffect(() => {
    // Səhifə açılanda lokal yaddaşdan mövzunu oxu
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const handleThemeChange = (selectedTheme) => {
    setTheme(selectedTheme);
    localStorage.setItem("theme", selectedTheme);
    document.documentElement.setAttribute("data-theme", selectedTheme);
  };

  // Şifrə hissəsi üçün state-lər
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

  const handleChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const toggleVisibility = (field) => {
    setShowPassword({ ...showPassword, [field]: !showPassword[field] });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (passwords.newPassword === passwords.confirmPassword) {
      console.log("Şifrə yeniləndi:", passwords);
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
      {/* BAŞLIQ */}
      <div className="top-header">
        <div>
          <h2 className="page-title">Ayarlar</h2>
          <p className="page-subtitle">
            Hesab təhlükəsizliyi və platforma tənzimləmələri
          </p>
        </div>
      </div>

      <div className="settings-content">
        {/* ======================================= */}
        {/* MÖVZU DƏYİŞDİRMƏ KARTI (THEME TOGGLE) */}
        {/* ======================================= */}
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
                <div className="mock-sidebar"></div>
                <div className="mock-content">
                  <div className="mock-box"></div>
                  <div className="mock-box"></div>
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
                <div className="mock-sidebar"></div>
                <div className="mock-content">
                  <div className="mock-box"></div>
                  <div className="mock-box"></div>
                </div>
              </div>
              <div className="theme-info">
                <FiSun className="theme-icon" /> Açıq Mövzu
              </div>
            </div>
          </div>
        </div>

        {/* ======================================= */}
        {/* ŞİFRƏ YENİLƏMƏ KARTI */}
        {/* ======================================= */}
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
            {/* Mövcud Şifrə */}
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

            <div className="divider"></div>

            {/* Yeni Şifrə */}
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

            {/* Yeni Şifrə Təkrar */}
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

            {/* Düymələr və Bildiriş */}
            <div className="form-actions">
              {isSuccess && (
                <div className="success-msg">
                  <FiCheckCircle /> Şifrəniz uğurla yeniləndi!
                </div>
              )}
              <button type="submit" className="save-btn">
                Yadda Saxla
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SettingsMain;
