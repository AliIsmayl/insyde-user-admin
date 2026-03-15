import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiMail,
  FiArrowLeft,
  FiCreditCard,
  FiBriefcase,
  FiCheckCircle,
} from "react-icons/fi";
import "./LoginMain.scss";

// ─────────────────────────────────────────────────────────
// API URLs
// ─────────────────────────────────────────────────────────
const AUTH_BASE =
  "https://corn-strengthening-acc-bathroom.trycloudflare.com/api/dash/auth";
const URL_REGISTER = `${AUTH_BASE}/register/`;
const URL_LOGIN = `${AUTH_BASE}/login/`;
const URL_VERIFY_OTP = `${AUTH_BASE}/verify_otp/`;

// ─────────────────────────────────────────────────────────
// localStorage helpers
// ─────────────────────────────────────────────────────────
const LS = {
  set: (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch {}
  },
  get: (k) => {
    try {
      return localStorage.getItem(k) || "";
    } catch {
      return "";
    }
  },
  del: (k) => {
    try {
      localStorage.removeItem(k);
    } catch {}
  },
};

const REG_TOKEN_KEY = "insyde_reg_token";
const LOGIN_TOKEN_KEY = "insyde_login_token";

// ─────────────────────────────────────────────────────────
// useOtp — paylaşılan hook
// ─────────────────────────────────────────────────────────
function useOtp() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const refs = useRef([]);

  const onChange = (i, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const n = [...otp];
    n[i] = digit;
    setOtp(n);
    if (digit && i < 5) refs.current[i + 1]?.focus();
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
  };

  const reset = () => setOtp(["", "", "", "", "", ""]);
  const code = otp.join("");

  return { otp, refs, onChange, onKeyDown, onPaste, reset, code };
}

// ─────────────────────────────────────────────────────────
// useResendTimer — paylaşılan hook
// ─────────────────────────────────────────────────────────
function useResendTimer() {
  const [timer, setTimer] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    if (timer > 0) {
      ref.current = setTimeout(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearTimeout(ref.current);
  }, [timer]);

  const start = (s) => setTimer(s ?? 30);
  const reset = () => {
    clearTimeout(ref.current);
    setTimer(0);
  };

  return { timer, start, reset };
}

// ─────────────────────────────────────────────────────────
// OTP BOXES — paylaşılan UI komponenti
// ─────────────────────────────────────────────────────────
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

// ═════════════════════════════════════════════════════════
// NEW CARD VIEW  (qeydiyyat)
// ═════════════════════════════════════════════════════════
function NewCardView({ onBack }) {
  const [email, setEmail] = useState("");
  const [cardType, setCardType] = useState("");
  const [step, setStep] = useState("form"); // form | otp | done
  const [formError, setFormError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);

  const otpCtrl = useOtp();
  const resend = useResendTimer();

  const cardOptions = [
    {
      value: "personal",
      apiValue: "Ozel",
      label: "Özəl Kart",
      desc: "Şəxsi istifadə üçün",
      icon: <FiCreditCard />,
    },
    {
      value: "business",
      apiValue: "Business",
      label: "Biznes Kart",
      desc: "Korporativ istifadə üçün",
      icon: <FiBriefcase />,
    },
  ];

  // ── REGISTER → /register/ ───────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!email) {
      setFormError("E-poçt ünvanını daxil edin!");
      return;
    }
    if (!cardType) {
      setFormError("Kart növünü seçin!");
      return;
    }

    const selected = cardOptions.find((o) => o.value === cardType);
    setLoading(true);
    try {
      const res = await fetch(URL_REGISTER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, card_type: selected.apiValue }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFormError(
          data?.error ||
            data?.detail ||
            data?.email?.[0] ||
            "Xəta baş verdi. Yenidən cəhd edin.",
        );
        return;
      }

      // Token localStorage-ə saxlanılır, API-a göndərilmir
      LS.set(REG_TOKEN_KEY, data.registration_token || "");
      resend.start(data.resend_after_seconds);
      setStep("otp");
    } catch {
      setFormError(
        "Serverə qoşulmaq mümkün olmadı. İnternet bağlantınızı yoxlayın.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ── RESEND → /register/ ─────────────────────────────────
  const handleResend = async () => {
    if (resend.timer > 0) return;
    const selected = cardOptions.find((o) => o.value === cardType);
    setOtpError("");
    setLoading(true);
    try {
      const res = await fetch(URL_REGISTER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, card_type: selected.apiValue }),
      });
      const data = await res.json();
      if (res.ok) {
        LS.set(REG_TOKEN_KEY, data.registration_token || "");
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

  // ── VERIFY OTP → /verify_otp/ ───────────────────────────
  // Token body-də göndərilir — backend request.data.get('registration_token') oxuyur
  const handleVerify = async () => {
    if (otpCtrl.code.length < 6) {
      setOtpError("Zəhmət olmasa bütün 6 xananı doldurun.");
      return;
    }
    const token = LS.get(REG_TOKEN_KEY);
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
          email: email,
          registration_token: token, // ✅ body-də göndərilir
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setOtpError(
          data?.error ||
            data?.detail ||
            data?.otp_code?.[0] ||
            data?.non_field_errors?.[0] ||
            "Kod yanlışdır. Yenidən cəhd edin.",
        );
        return;
      }

      // JWT tokenləri saxla
      if (data.tokens?.access) LS.set("access_token", data.tokens.access);
      if (data.tokens?.refresh) LS.set("refresh_token", data.tokens.refresh);
      LS.set("isAuthenticated", "true");

      // Qeydiyyat tokenini sil
      LS.del(REG_TOKEN_KEY);

      setUserData(data.data || null);
      setStep("done");
    } catch {
      setOtpError("Serverə qoşulmaq mümkün olmadı.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep("form");
    otpCtrl.reset();
    setOtpError("");
    setFormError("");
    resend.reset();
    LS.del(REG_TOKEN_KEY);
  };

  // ── FORM ────────────────────────────────────────────────
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

          <div className="input-group">
            <label>Kart növü</label>
            <div className="card-type-group">
              {cardOptions.map((opt) => (
                <div
                  key={opt.value}
                  className={`card-type-option ${cardType === opt.value ? "selected" : ""}`}
                  onClick={() => {
                    if (!loading) {
                      setCardType(opt.value);
                      setFormError("");
                    }
                  }}
                >
                  <div className="card-type-icon">{opt.icon}</div>
                  <div className="card-type-info">
                    <span className="card-type-label">{opt.label}</span>
                    <span className="card-type-desc">{opt.desc}</span>
                  </div>
                  <div className="card-type-check">
                    {cardType === opt.value && <FiCheckCircle />}
                  </div>
                </div>
              ))}
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

  // ── OTP ─────────────────────────────────────────────────
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

  // ── DONE ────────────────────────────────────────────────
  return (
    <div className="done-section">
      <div className="done-icon">
        <FiCheckCircle />
      </div>
      <div className="lm-header">
        <div className="lm-logo">Insyde</div>
        <h2>Kart Yaradıldı!</h2>
        <p>
          <strong>{cardType === "personal" ? "Özəl" : "Biznes"}</strong>{" "}
          kartınız uğurla aktivləşdirildi.
        </p>
        <p className="done-email">{email}</p>
        {userData && (
          <div className="done-info">
            <span>
              İstifadəçi kodu: <strong>{userData.user_code}</strong>
            </span>
          </div>
        )}
      </div>
      <button className="submit-btn" onClick={onBack}>
        Daxil ol
      </button>
    </div>
  );
}

// ═════════════════════════════════════════════════════════
// LOGIN VIEW
// ═════════════════════════════════════════════════════════
function LoginMain() {
  const navigate = useNavigate();

  const [view, setView] = useState("login"); // login | newcard
  const [step, setStep] = useState("email"); // email | otp
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [loading, setLoading] = useState(false);

  const otpCtrl = useOtp();
  const resend = useResendTimer();

  // ── E-poçt göndər → /login/ ──────────────────────────
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
          data?.error ||
            data?.detail ||
            data?.email?.[0] ||
            "Xəta baş verdi. Yenidən cəhd edin.",
        );
        return;
      }

      // Token localStorage-ə saxlanılır, API-a göndərilmir
      LS.set(LOGIN_TOKEN_KEY, data.registration_token || "");
      resend.start(data.resend_after_seconds);
      setStep("otp");
    } catch {
      setEmailError(
        "Serverə qoşulmaq mümkün olmadı. İnternet bağlantınızı yoxlayın.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Kodu yenidən göndər → /login/ ────────────────────
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
        LS.set(LOGIN_TOKEN_KEY, data.registration_token || "");
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

  // ── OTP doğrula → /verify_otp/ ───────────────────────
  // Token body-də göndərilir — backend request.data.get('registration_token') oxuyur
  const handleVerify = async () => {
    if (otpCtrl.code.length < 6) {
      setOtpError("Zəhmət olmasa bütün 6 xananı doldurun.");
      return;
    }
    const token = LS.get(LOGIN_TOKEN_KEY);
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
          email: email,
          registration_token: token, // ✅ body-də göndərilir
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setOtpError(
          data?.error ||
            data?.detail ||
            data?.otp_code?.[0] ||
            data?.non_field_errors?.[0] ||
            "Kod yanlışdır. Yenidən cəhd edin.",
        );
        return;
      }

      // JWT tokenləri saxla və login token-i sil
      if (data.tokens?.access) LS.set("access_token", data.tokens.access);
      if (data.tokens?.refresh) LS.set("refresh_token", data.tokens.refresh);
      LS.set("isAuthenticated", "true");
      LS.del(LOGIN_TOKEN_KEY);

      navigate("/home");
    } catch {
      setOtpError("Serverə qoşulmaq mümkün olmadı.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep("email");
    otpCtrl.reset();
    setOtpError("");
    resend.reset();
    LS.del(LOGIN_TOKEN_KEY);
  };

  return (
    <div className="login-main">
      <div className="login-card">
        {/* ── QEYDIYYAT VIEW ── */}
        {view === "newcard" && <NewCardView onBack={() => setView("login")} />}

        {/* ── LOGIN: E-POÇT ── */}
        {view === "login" && step === "email" && (
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
            </div>
          </>
        )}

        {/* ── LOGIN: OTP ── */}
        {view === "login" && step === "otp" && (
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
