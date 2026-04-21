import React, { useState, useEffect, useRef } from "react";
import {
  FiMail,
  FiArrowLeft,
  FiCheckCircle,
  FiSun,
  FiMoon,
} from "react-icons/fi";
import "./SettingsMain.scss";
import Popup from "../../Popup/Popup";
import { CK, API_BASE, authFetch } from "../../../Utils/authUtils";

const URL_REQUEST_EMAIL_CHANGE = `${API_BASE}/api/dash/auth/update_email/`;
const URL_CONFIRM_EMAIL_CHANGE = `${API_BASE}/api/dash/auth/verify_update_email/`;

function useOtp() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const refs = useRef([]);
  const onCompleteRef = useRef(null);

  const onChange = (i, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const n = [...otp];
    n[i] = digit;
    setOtp(n);
    if (digit && i < 5) {
      refs.current[i + 1]?.focus();
    } else if (digit && i === 5) {
      const fullCode = n.join("");
      if (fullCode.length === 6) setTimeout(() => onCompleteRef.current?.(), 0);
    }
  };

  const onKeyDown = (i, e) => {
    if (e.key === "Backspace") {
      const n = [...otp];
      if (otp[i]) {
        n[i] = "";
        setOtp(n);
      } else if (i > 0) {
        n[i - 1] = "";
        setOtp(n);
        refs.current[i - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === "ArrowRight" && i < 5) refs.current[i + 1]?.focus();
  };

  const onPaste = (e) => {
    e.preventDefault();
    const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const n = ["", "", "", "", "", ""];
    for (let i = 0; i < p.length; i++) n[i] = p[i];
    setOtp(n);
    refs.current[Math.min(p.length, 5)]?.focus();
    if (p.length === 6) setTimeout(() => onCompleteRef.current?.(), 0);
  };

  const reset = () => setOtp(["", "", "", "", "", ""]);
  const code = otp.join("");
  return { otp, refs, onChange, onKeyDown, onPaste, reset, code, onCompleteRef };
}

function useResendTimer() {
  const [timer, setTimer] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    if (timer > 0) {
      ref.current = setTimeout(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearTimeout(ref.current);
  }, [timer]);

  const start = (seconds = 45) => setTimer(seconds);
  const reset = () => { clearTimeout(ref.current); setTimer(0); };
  return { timer, start, reset };
}

function OtpBoxes({ ctrl, disabled }) {
  return (
    <div className="email-otp-inputs">
      {ctrl.otp.map((digit, i) => (
        <input
          key={i}
          ref={(el) => (ctrl.refs.current[i] = el)}
          className={`email-otp-box ${digit ? "filled" : ""}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => ctrl.onChange(i, e.target.value)}
          onKeyDown={(e) => ctrl.onKeyDown(i, e)}
          onPaste={i === 0 ? ctrl.onPaste : undefined}
          autoFocus={i === 0}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

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

  const [emailStep, setEmailStep] = useState("form");
  const [newEmail, setNewEmail] = useState("");
  const [emailFormError, setEmailFormError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [changeToken, setChangeToken] = useState("");

  const otpCtrl = useOtp();
  const resend = useResendTimer();

  const handleEmailRequest = async (e) => {
    e.preventDefault();
    setEmailFormError("");
    if (!newEmail) { setEmailFormError("E-poçt ünvanını daxil edin!"); return; }
    setEmailLoading(true);
    try {
      const res = await authFetch(URL_REQUEST_EMAIL_CHANGE, {
        method: "POST",
        body: JSON.stringify({ new_email: newEmail }),
      });
      if (!res) return;
      const data = await res.json();
      if (!res.ok) {
        setEmailFormError(data?.error || data?.detail || data?.new_email?.[0] || "Xəta baş verdi.");
        return;
      }
      setChangeToken(data.change_token || data.registration_token || "");
      resend.start(data.resend_after_seconds || 45);
      setEmailStep("otp");
    } catch {
      setEmailFormError("Serverə qoşulmaq mümkün olmadı.");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleEmailResend = async () => {
    if (resend.timer > 0) return;
    setOtpError("");
    setEmailLoading(true);
    try {
      const res = await authFetch(URL_REQUEST_EMAIL_CHANGE, {
        method: "POST",
        body: JSON.stringify({ new_email: newEmail }),
      });
      if (!res) return;
      const data = await res.json();
      if (res.ok) {
        setChangeToken(data.change_token || data.registration_token || "");
        resend.start(data.resend_after_seconds || 45);
        otpCtrl.reset();
        otpCtrl.refs.current[0]?.focus();
      } else {
        setOtpError(data?.error || data?.detail || "Kod yenidən göndərilmədi.");
      }
    } catch {
      setOtpError("Serverə qoşulmaq mümkün olmadı.");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleEmailVerify = async () => {
    if (otpCtrl.code.length < 6) { setOtpError("Bütün 6 xananı doldurun."); return; }
    setEmailLoading(true);
    setOtpError("");
    try {
      const res = await authFetch(URL_CONFIRM_EMAIL_CHANGE, {
        method: "POST",
        body: JSON.stringify({
          otp_code: otpCtrl.code,
          new_email: newEmail,
          change_token: changeToken,
        }),
      });
      if (!res) return;
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data?.error || data?.detail || data?.otp_code?.[0] || data?.non_field_errors?.[0] || "Kod yanlışdır.");
        return;
      }
      setEmailStep("done");
    } catch {
      setOtpError("Serverə qoşulmaq mümkün olmadı.");
    } finally {
      setEmailLoading(false);
    }
  };
  otpCtrl.onCompleteRef.current = handleEmailVerify;

  const handleEmailBack = () => {
    setEmailStep("form");
    otpCtrl.reset();
    setOtpError("");
    resend.reset();
    setChangeToken("");
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

        {/* SAĞ SÜTUN — EMAİL YENİLƏ */}
        <div className="settings-col right-col">
          <div className="modern-card email-update-card">
            <div className="card-header">
              <div className="header-icon">
                <FiMail />
              </div>
              <div>
                <h3>E-poçtu Yenilə</h3>
                <p>Hesabınıza bağlı e-poçt ünvanını dəyişin.</p>
              </div>
            </div>

            {/* FORM ADDIMI */}
            {emailStep === "form" && (
              <form onSubmit={handleEmailRequest} className="email-update-form">
                <div className="input-group">
                  <label>Yeni E-poçt Ünvanı</label>
                  <div className="input-wrapper">
                    <FiMail className="input-icon-left" />
                    <input
                      type="email"
                      placeholder="yeni@email.com"
                      value={newEmail}
                      onChange={(e) => { setNewEmail(e.target.value); setEmailFormError(""); }}
                      disabled={emailLoading}
                      autoComplete="email"
                    />
                  </div>
                  {emailFormError && (
                    <div className="email-error-msg">{emailFormError}</div>
                  )}
                </div>
                <div className="form-actions">
                  <button type="submit" className="save-btn" disabled={emailLoading}>
                    {emailLoading ? (
                      <span className="btn-loading"><span className="spinner" /> Göndərilir...</span>
                    ) : "OTP Göndər"}
                  </button>
                </div>
              </form>
            )}

            {/* OTP ADDIMI */}
            {emailStep === "otp" && (
              <div className="email-otp-section">
                <p className="otp-desc">
                  <strong>{newEmail}</strong> ünvanına göndərilən 6 rəqəmli kodu daxil edin.
                </p>
                {otpError && <div className="email-error-msg">{otpError}</div>}
                <OtpBoxes ctrl={otpCtrl} disabled={emailLoading} />
                <button
                  className="save-btn"
                  onClick={handleEmailVerify}
                  disabled={emailLoading || otpCtrl.code.length < 6}
                >
                  {emailLoading ? (
                    <span className="btn-loading"><span className="spinner" /> Yoxlanılır...</span>
                  ) : "Təsdiqlə"}
                </button>
                <div className="email-resend-wrap">
                  {resend.timer > 0 ? (
                    <span className="email-resend-timer">Yenidən göndər — <strong>{resend.timer}s</strong></span>
                  ) : (
                    <button className="email-resend-btn" onClick={handleEmailResend} disabled={emailLoading}>
                      Kodu yenidən göndər
                    </button>
                  )}
                </div>
                <button className="email-back-btn" onClick={handleEmailBack} disabled={emailLoading}>
                  <FiArrowLeft /> Geri qayıt
                </button>
              </div>
            )}

            {/* UĞUR ADDIMI */}
            {emailStep === "done" && (
              <div className="email-done-section">
                <div className="email-done-icon"><FiCheckCircle /></div>
                <h4>E-poçt uğurla yeniləndi!</h4>
                <p className="email-done-addr">{newEmail}</p>
                <button
                  className="save-btn"
                  onClick={() => { setEmailStep("form"); setNewEmail(""); otpCtrl.reset(); }}
                >
                  Bağla
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsMain;
