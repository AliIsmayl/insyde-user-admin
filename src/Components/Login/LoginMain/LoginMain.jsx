import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiUser,
  FiArrowLeft,
} from "react-icons/fi";
import "./LoginMain.scss";

function LoginMain() {
  const navigate = useNavigate();

  // Hansı formanın görünəcəyini idarə edən state ('login', 'register', 'forgot')
  const [activeTab, setActiveTab] = useState("login");

  // Input states
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Giriş Funksiyası
  const handleLogin = (e) => {
    e.preventDefault();
    if (email === "admin" && password === "admin") {
      setErrorMsg("");
      navigate("/");
    } else {
      setErrorMsg("E-poçt və ya şifrə yanlışdır! (Sınaq üçün: admin / admin)");
      setSuccessMsg("");
    }
  };

  // Qeydiyyat İstəyi Funksiyası
  const handleRegister = (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg(
      "Təsdiq üçün adminə göndərildi. Tezliklə sizinlə əlaqə saxlanılacaq.",
    );
    // Gələcəkdə burada backend-ə (API) məlumat göndərmək üçün kod yazılacaq.
    setTimeout(() => {
      setActiveTab("login");
      setSuccessMsg("");
      setEmail("");
      setFullName("");
    }, 3000); // 3 saniyə sonra təkrar login formasına qayıtsın
  };

  // Şifrəni Yeniləmə Funksiyası
  const handleForgot = (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg(
      "Şifrəni yeniləmək üçün təlimatlar e-poçt ünvanınıza göndərildi.",
    );
    setTimeout(() => {
      setActiveTab("login");
      setSuccessMsg("");
      setEmail("");
    }, 3000);
  };

  return (
    <div className="login-main-modern">
      <div className="login-card">
        {/* ========================================= */}
        {/* ============ 1. LOGİN FORMASI =========== */}
        {/* ========================================= */}
        {activeTab === "login" && (
          <>
            <div className="login-header">
              <div className="logo-text">Insyde</div>
              <h2>Xoş gəlmisiniz! 👋</h2>
              <p>Davam etmək üçün idarəetmə panelinə daxil olun.</p>
            </div>

            <form className="login-form" onSubmit={handleLogin}>
              {errorMsg && <div className="message error-msg">{errorMsg}</div>}

              <div className="input-group">
                <label>E-poçt ünvanı</label>
                <div className="input-wrapper">
                  <FiMail className="input-icon" />
                  <input
                    type="text"
                    placeholder="nümunə@mail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Şifrə</label>
                <div className="input-wrapper">
                  <FiLock className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div className="form-actions">
                <label className="remember-me">
                  <input type="checkbox" />
                  <span>Məni xatırla</span>
                </label>
                <span
                  className="forgot-password"
                  onClick={() => {
                    setActiveTab("forgot");
                    setErrorMsg("");
                  }}
                >
                  Parolu unutdum?
                </span>
              </div>

              <button type="submit" className="login-btn">
                Daxil ol
              </button>
            </form>

            <div className="login-footer">
              <p>
                Hesabınız yoxdur?{" "}
                <span
                  className="link-text"
                  onClick={() => {
                    setActiveTab("register");
                    setErrorMsg("");
                  }}
                >
                  Qeydiyyatdan keçin
                </span>
              </p>
            </div>
          </>
        )}

        {/* ========================================= */}
        {/* ============ 2. QEYDİYYAT FORMASI ======= */}
        {/* ========================================= */}
        {activeTab === "register" && (
          <>
            <div className="login-header">
              <div className="logo-text">Insyde</div>
              <h2>Hesab Yaradın 🚀</h2>
              <p>
                Məlumatlarınızı daxil edin. Müraciətiniz admin tərəfindən
                təsdiqlənəcək.
              </p>
            </div>

            <form className="login-form" onSubmit={handleRegister}>
              {successMsg && (
                <div className="message success-msg">{successMsg}</div>
              )}

              <div className="input-group">
                <label>Ad və Soyad</label>
                <div className="input-wrapper">
                  <FiUser className="input-icon" />
                  <input
                    type="text"
                    placeholder="Ad Soyad"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label>E-poçt ünvanı</label>
                <div className="input-wrapper">
                  <FiMail className="input-icon" />
                  <input
                    type="email"
                    placeholder="nümunə@mail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="login-btn">
                Təsdiq üçün göndər
              </button>
            </form>

            <div className="login-footer">
              <p>
                Artıq hesabınız var?{" "}
                <span
                  className="link-text"
                  onClick={() => {
                    setActiveTab("login");
                    setSuccessMsg("");
                  }}
                >
                  Daxil olun
                </span>
              </p>
            </div>
          </>
        )}

        {/* ========================================= */}
        {/* ========== 3. ŞİFRƏNİ UNUTDUM =========== */}
        {/* ========================================= */}
        {activeTab === "forgot" && (
          <>
            <div
              className="back-btn"
              onClick={() => {
                setActiveTab("login");
                setSuccessMsg("");
              }}
            >
              <FiArrowLeft /> Geri qayıt
            </div>

            <div className="login-header">
              <div className="logo-text">Insyde</div>
              <h2>Şifrəni bərpa et 🔒</h2>
              <p>Hesabınıza bağlı olan e-poçt ünvanını daxil edin.</p>
            </div>

            <form className="login-form" onSubmit={handleForgot}>
              {successMsg && (
                <div className="message success-msg">{successMsg}</div>
              )}

              <div className="input-group">
                <label>E-poçt ünvanı</label>
                <div className="input-wrapper">
                  <FiMail className="input-icon" />
                  <input
                    type="email"
                    placeholder="nümunə@mail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="login-btn">
                Yeniləmə linki göndər
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default LoginMain;
