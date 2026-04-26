import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiMail,
  FiArrowLeft,
  FiCheckCircle,
} from "react-icons/fi";
import "./LoginMain.scss";
import { CK, API_BASE, saveTokens, getToken } from "../../../Utils/authUtils";

const URL_REGISTER = `${API_BASE}/api/dash/auth/register/`;
const URL_LOGIN = `${API_BASE}/api/dash/auth/login/`;
const URL_VERIFY_OTP = `${API_BASE}/api/dash/auth/verify_otp/`;

const REG_TOKEN_KEY = "insyde_reg_token";
const LOGIN_TOKEN_KEY = "insyde_login_token";
const TRIAL_MODAL_SESSION_KEY = "insyde_trial_modal_seen";

// ── OTP hook ────────────────────────────────────────────
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

// ── Resend timer hook ────────────────────────────────────
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
  const reset = () => {
    clearTimeout(ref.current);
    setTimer(0);
  };
  return { timer, start, reset };
}

// ── OTP qutuları ────────────────────────────────────────
function OtpBoxes({ ctrl, disabled }) {
  return (
    <div className="otp-inputs">
      {ctrl.otp.map((digit, i) => (
        <input
          key={i}
          ref={(el) => (ctrl.refs.current[i] = el)}
          className={`otp-box ${digit ? "filled" : ""}`}
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

// ── Verify sonrası cookie yazma + redirect (ortaq funksiya) ──
function saveSessionAndRedirect(data, tokenKey) {
  if (data.tokens?.access) saveTokens(data.tokens.access);
  CK.set("isAuthenticated", "true");
  CK.del(tokenKey);
  try {
    localStorage.setItem("isAuthenticated", "true");
  } catch {}

  const hashId = data.data?.hash_id || "";
  const userCode = data.data?.user_code || "";

  if (hashId) CK.set("hash_id", hashId);
  if (userCode) CK.set("user_code", userCode);
  try {
    sessionStorage.removeItem(TRIAL_MODAL_SESSION_KEY);
  } catch {}

  // hash_id varsa onunla get, yoxdursa sadə /home
  window.location.href = hashId ? `/home/${hashId}` : "/home";
}

// ═════════════════════════════════════════════════════════
// EmailChangeModal — Dəstək müraciəti
// ═════════════════════════════════════════════════════════
function EmailChangeModal({ onClose }) {
  const [fields, setFields] = useState({ name: "", email: "", phone: "", note: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const set = (key) => (e) => {
    setFields((f) => ({ ...f, [key]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fields.name.trim()) { setError("Ad soyad daxil edin."); return; }
    if (!fields.email.trim()) { setError("E-poçt ünvanı daxil edin."); return; }
    setLoading(true);
    setError("");
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/dash/contact/email-change/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          full_name:    fields.name.trim(),
          email:        fields.email.trim(),
          phone_number: fields.phone.trim() || undefined,
          note:         fields.note.trim()  || undefined,
        }),
      });
      if (res.ok || res.status === 201) {
        setDone(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.detail || data?.error || "Xəta baş verdi. Yenidən cəhd edin.");
      }
    } catch {
      setDone(true); // network xətasında da uğur göstər (template davranışı)
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ecm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ecm-modal">
        <button className="ecm-close" onClick={onClose} aria-label="Bağla">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {done ? (
          <div className="ecm-done">
            <div className="ecm-done-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="32" height="32">
                <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Müraciətiniz qəbul edildi</h3>
            <p>Ən qısa zamanda sizinlə əlaqə saxlanılacaq.</p>
            <button className="ecm-submit-btn" onClick={onClose}>Bağla</button>
          </div>
        ) : (
          <>
            <div className="ecm-header">
              <div className="ecm-header-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <div>
                <h3 className="ecm-title">Email dəyişib?</h3>
                <p className="ecm-subtitle">Məlumatlarınızı doldurun, komandamız sizinlə əlaqə saxlayacaq.</p>
              </div>
            </div>

            <form className="ecm-form" onSubmit={handleSubmit} noValidate>
              {error && <div className="ecm-error">{error}</div>}

              <div className="ecm-field">
                <label>Ad Soyad <span className="ecm-required">*</span></label>
                <input
                  type="text"
                  placeholder="Adınız və soyadınız"
                  value={fields.name}
                  onChange={set("name")}
                  disabled={loading}
                />
              </div>

              <div className="ecm-field">
                <label>E-poçt ünvanı <span className="ecm-required">*</span></label>
                <input
                  type="email"
                  placeholder="yeni@email.com"
                  value={fields.email}
                  onChange={set("email")}
                  disabled={loading}
                />
              </div>

              <div className="ecm-field">
                <label>Telefon nömrəsi</label>
                <div className="ecm-phone-wrap">
                  <span className="ecm-phone-prefix">+994</span>
                  <input
                    type="tel"
                    placeholder="50 123 45 67"
                    value={fields.phone}
                    onChange={(e) => setFields((f) => ({ ...f, phone: e.target.value.replace(/\D/g, "").slice(0, 9) }))}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="ecm-field">
                <label>Qeyd</label>
                <textarea
                  placeholder="Əlavə məlumat və ya izahat..."
                  value={fields.note}
                  onChange={set("note")}
                  disabled={loading}
                  rows={3}
                />
              </div>

              <button type="submit" className="ecm-submit-btn" disabled={loading}>
                {loading
                  ? <><span className="ecm-spinner" /> Göndərilir...</>
                  : "Müraciət et"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════
// NewCardView — Qeydiyyat
// ═════════════════════════════════════════════════════════
function NewCardView({ onBack }) {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState("form");
  const [formError, setFormError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);

  const otpCtrl = useOtp();
  const resend = useResendTimer();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!email) {
      setFormError("E-poçt ünvanını daxil edin!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(URL_REGISTER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, card_type: "Ozel" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(
          data?.error || data?.detail || data?.email?.[0] || "Xəta baş verdi.",
        );
        return;
      }
      CK.set(REG_TOKEN_KEY, data.registration_token || "");
      resend.start(data.resend_after_seconds);
      setStep("otp");
    } catch {
      setFormError("Serverə qoşulmaq mümkün olmadı.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resend.timer > 0) return;
    setOtpError("");
    setLoading(true);
    try {
      const res = await fetch(URL_REGISTER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, card_type: "Ozel" }),
      });
      const data = await res.json();
      if (res.ok) {
        CK.set(REG_TOKEN_KEY, data.registration_token || "");
        resend.start(data.resend_after_seconds);
        otpCtrl.reset();
        otpCtrl.refs.current[0]?.focus();
      } else {
        setOtpError(data?.error || data?.detail || "Kod yenidən göndərilmədi.");
      }
    } catch {
      setOtpError("Serverə qoşulmaq mümkün olmadı.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otpCtrl.code.length < 6) {
      setOtpError("Bütün 6 xananı doldurun.");
      return;
    }
    const token = CK.get(REG_TOKEN_KEY);
    if (!token) {
      setOtpError("Sessiya vaxtı bitib. Geri qayıdıb yenidən cəhd edin.");
      return;
    }

    setLoading(true);
    setOtpError("");
    try {
      const res = await fetch(URL_VERIFY_OTP, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          otp_code: otpCtrl.code,
          email,
          registration_token: token,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(
          data?.error ||
            data?.detail ||
            data?.otp_code?.[0] ||
            data?.non_field_errors?.[0] ||
            "Kod yanlışdır.",
        );
        return;
      }
      setUserData(data.data || null);
      setStep("done");
      setTimeout(() => saveSessionAndRedirect(data, REG_TOKEN_KEY), 2000);
    } catch {
      setOtpError("Serverə qoşulmaq mümkün olmadı.");
    } finally {
      setLoading(false);
    }
  };
  otpCtrl.onCompleteRef.current = handleVerify;

  const handleBack = () => {
    setStep("form");
    otpCtrl.reset();
    setOtpError("");
    setFormError("");
    resend.reset();
    CK.del(REG_TOKEN_KEY);
  };

  // ── FORM ──
  if (step === "form")
    return (
      <>
        <div className="lm-header">
          <div className="lm-logo">Insyde</div>
          <h2>Yeni Kart Yarat</h2>
          <p>Kart növünü seçib e-poçtunuzu daxil edin.</p>
        </div>
        <form className="lm-form" onSubmit={handleSubmit} noValidate>
          {formError && <div className="message error-msg">{formError}</div>}
          <div className="input-group">
            <label>E-poçt ünvanı</label>
            <div className="input-wrapper">
              <FiMail className="input-icon" />
              <input
                type="email"
                placeholder="example@insyde.az"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFormError("");
                }}
                disabled={loading}
                autoFocus
              />
            </div>
          </div>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              <span className="btn-loading">
                <span className="spinner" /> Göndərilir...
              </span>
            ) : (
              "Təsdiqlə"
            )}
          </button>
        </form>
        <div className="lm-footer">
          <p>
            Artıq hesabınız var?{" "}
            <span className="link-text" onClick={onBack}>
              Daxil olun
            </span>
          </p>
        </div>
      </>
    );

  // ── OTP ──
  if (step === "otp")
    return (
      <>
        <div className="lm-header">
          <div className="lm-logo">Insyde</div>
          <h2>Kodu Daxil Edin</h2>
          <p>
            <strong>{email}</strong> ünvanına göndərilən 6 rəqəmli kodu daxil
            edin.
          </p>
        </div>
        <div className="otp-section">
          {otpError && <div className="message error-msg">{otpError}</div>}
          <OtpBoxes ctrl={otpCtrl} disabled={loading} />
          <button
            className="submit-btn"
            onClick={handleVerify}
            disabled={loading || otpCtrl.code.length < 6}
          >
            {loading ? (
              <span className="btn-loading">
                <span className="spinner" /> Yoxlanılır...
              </span>
            ) : (
              "Doğrula"
            )}
          </button>
          <div className="resend-wrap">
            {resend.timer > 0 ? (
              <span className="resend-timer">
                Yenidən göndər — <strong>{resend.timer}s</strong>
              </span>
            ) : (
              <button
                className="resend-btn"
                onClick={handleResend}
                disabled={loading}
              >
                Kodu yenidən göndər
              </button>
            )}
          </div>
          <button className="back-btn" onClick={handleBack} disabled={loading}>
            <FiArrowLeft /> Geri qayıt
          </button>
        </div>
      </>
    );

  // ── DONE ──
  return (
    <div className="done-section">
      <div className="done-icon">
        <FiCheckCircle />
      </div>
      <div className="lm-header">
        <div className="lm-logo">Insyde</div>
        <h2>Kart Yaradıldı!</h2>
        <p>Özəl kartınız uğurla aktivləşdirildi.</p>
        <p className="done-email">{email}</p>
        {userData && (
          <div className="done-info">
            <span>
              İstifadəçi kodu: <strong>{userData.user_code}</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════
// LoginMain
// ═════════════════════════════════════════════════════════
function LoginMain() {
  const [view, setView] = useState("login");
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginDone, setLoginDone] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const otpCtrl = useOtp();
  const resend = useResendTimer();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setEmailError("");
    if (!email) {
      setEmailError("E-poçt ünvanını daxil edin!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(URL_LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEmailError(
          data?.error || data?.detail || data?.email?.[0] || "Xəta baş verdi.",
        );
        return;
      }
      CK.set(LOGIN_TOKEN_KEY, data.registration_token || "");
      resend.start(data.resend_after_seconds);
      setStep("otp");
    } catch {
      setEmailError("Serverə qoşulmaq mümkün olmadı.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resend.timer > 0) return;
    setOtpError("");
    setLoading(true);
    try {
      const res = await fetch(URL_LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        CK.set(LOGIN_TOKEN_KEY, data.registration_token || "");
        resend.start(data.resend_after_seconds);
        otpCtrl.reset();
        otpCtrl.refs.current[0]?.focus();
      } else {
        setOtpError(data?.error || data?.detail || "Kod yenidən göndərilmədi.");
      }
    } catch {
      setOtpError("Serverə qoşulmaq mümkün olmadı.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otpCtrl.code.length < 6) {
      setOtpError("Bütün 6 xananı doldurun.");
      return;
    }
    const token = CK.get(LOGIN_TOKEN_KEY);
    if (!token) {
      setOtpError("Sessiya vaxtı bitib. Geri qayıdıb yenidən cəhd edin.");
      return;
    }

    setLoading(true);
    setOtpError("");
    try {
      const res = await fetch(URL_VERIFY_OTP, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          otp_code: otpCtrl.code,
          email,
          registration_token: token,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(
          data?.error ||
            data?.detail ||
            data?.otp_code?.[0] ||
            data?.non_field_errors?.[0] ||
            "Kod yanlışdır.",
        );
        return;
      }
      setLoginDone(true);
      setTimeout(() => saveSessionAndRedirect(data, LOGIN_TOKEN_KEY), 2000);
    } catch {
      setOtpError("Serverə qoşulmaq mümkün olmadı.");
    } finally {
      setLoading(false);
    }
  };
  otpCtrl.onCompleteRef.current = handleVerify;

  const handleBackToEmail = () => {
    setStep("email");
    otpCtrl.reset();
    setOtpError("");
    resend.reset();
    CK.del(LOGIN_TOKEN_KEY);
  };

  return (
    <div className="login-main">
      {showEmailModal && <EmailChangeModal onClose={() => setShowEmailModal(false)} />}
      <div className="login-card">
        {view === "newcard" && <NewCardView onBack={() => setView("login")} />}

        {/* ── Uğur ekranı ── */}
        {view === "login" && loginDone && (
          <div className="done-section">
            <div className="done-icon">
              <FiCheckCircle />
            </div>
            <div className="lm-header">
              <div className="lm-logo">Insyde</div>
              <h2>Xoş gəldiniz! 🎉</h2>
              <p className="done-email">{email}</p>
            </div>
          </div>
        )}

        {/* ── E-poçt ── */}
        {view === "login" && !loginDone && step === "email" && (
          <>
            <div className="lm-header">
              <div className="lm-logo">Insyde</div>
              <h2>Xoş gəlmisiniz! 👋</h2>
              <p>Davam etmək üçün e-poçt ünvanınızı daxil edin.</p>
            </div>
            <form className="lm-form" onSubmit={handleEmailSubmit} noValidate>
              {emailError && (
                <div className="message error-msg">{emailError}</div>
              )}
              <div className="input-group">
                <label>E-poçt ünvanı</label>
                <div className="input-wrapper">
                  <FiMail className="input-icon" />
                  <input
                    type="email"
                    placeholder="example@insyde.az"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError("");
                    }}
                    disabled={loading}
                    autoFocus
                  />
                </div>
              </div>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? (
                  <span className="btn-loading">
                    <span className="spinner" /> Göndərilir...
                  </span>
                ) : (
                  "Davam et"
                )}
              </button>
            </form>
            <div className="lm-footer">
              <p>
                Hesabınız yoxdur?{" "}
                <span className="link-text" onClick={() => setView("newcard")}>
                  Qeydiyyatdan keçin
                </span>
              </p>
              <p className="lm-footer-divider">
                <span className="link-text link-text--muted" onClick={() => setShowEmailModal(true)}>
                  Email dəyişib?
                </span>
              </p>
            </div>
          </>
        )}

        {/* ── OTP ── */}
        {view === "login" && !loginDone && step === "otp" && (
          <>
            <div className="lm-header">
              <div className="lm-logo">Insyde</div>
              <h2>Kodu Daxil Edin</h2>
              <p>
                <strong>{email}</strong> ünvanına göndərilən 6 rəqəmli kodu
                daxil edin.
              </p>
            </div>
            <div className="otp-section">
              {otpError && <div className="message error-msg">{otpError}</div>}
              <OtpBoxes ctrl={otpCtrl} disabled={loading} />
              <button
                className="submit-btn"
                onClick={handleVerify}
                disabled={loading || otpCtrl.code.length < 6}
              >
                {loading ? (
                  <span className="btn-loading">
                    <span className="spinner" /> Yoxlanılır...
                  </span>
                ) : (
                  "Doğrula"
                )}
              </button>
              <div className="resend-wrap">
                {resend.timer > 0 ? (
                  <span className="resend-timer">
                    Yenidən göndər — <strong>{resend.timer}s</strong>
                  </span>
                ) : (
                  <button
                    className="resend-btn"
                    onClick={handleResend}
                    disabled={loading}
                  >
                    Kodu yenidən göndər
                  </button>
                )}
              </div>
              <button
                className="back-btn"
                onClick={handleBackToEmail}
                disabled={loading}
              >
                <FiArrowLeft /> Geri qayıt
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default LoginMain;

