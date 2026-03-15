import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiMail,
  FiArrowLeft,
  FiCreditCard,
  FiBriefcase,
  FiCheckCircle,
} from "react-icons/fi";
import "./LoginMain.scss";

// ─────────────────────────────────────────────
// NEW CARD SUB-COMPONENT
// ─────────────────────────────────────────────
function NewCardView({ onBack }) {
  const [email, setEmail] = useState("");
  const [cardType, setCardType] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [step, setStep] = useState("form"); // "form" | "otp" | "done"
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const otpRefs = useRef([]);

  const cardOptions = [
    {
      value: "personal",
      label: "Özəl Kart",
      desc: "Şəxsi istifadə üçün",
      icon: <FiCreditCard />,
    },
    {
      value: "business",
      label: "Biznes Kart",
      desc: "Korporativ istifadə üçün",
      icon: <FiBriefcase />,
    },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg("E-poçt ünvanını daxil edin!");
      return;
    }
    if (!cardType) {
      setErrorMsg("Kart növünü seçin!");
      return;
    }
    setErrorMsg("");
    setStep("otp");
  };

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setOtpError("");
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      const newOtp = [...otp];
      if (otp[index]) {
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        newOtp[index - 1] = "";
        setOtp(newOtp);
        otpRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0)
      otpRefs.current[index - 1]?.focus();
    else if (e.key === "ArrowRight" && index < 5)
      otpRefs.current[index + 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    const newOtp = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) newOtp[i] = pasted[i];
    setOtp(newOtp);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleOtpVerify = () => {
    const code = otp.join("");
    if (code.length < 6) {
      setOtpError("Zəhmət olmasa bütün 6 xananı doldurun.");
      return;
    }
    setStep("done");
  };

  if (step === "form")
    return (
      <>
        <div className="lm-header">
          <div className="lm-logo">Insyde</div>
          <h2>Yeni Kart Yarat</h2>
          <p>Kart növünü seçib e-poçtunuzu daxil edin.</p>
        </div>

        <form className="lm-form" onSubmit={handleSubmit} noValidate>
          {errorMsg && <div className="message error-msg">{errorMsg}</div>}

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
                  setErrorMsg("");
                }}
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
                    setCardType(opt.value);
                    setErrorMsg("");
                  }}
                >
                  <div className="card-type-icon">{opt.icon}</div>
                  <div className="card-type-info">
                    <span className="card-type-label">{opt.label}</span>
                    <span className="card-type-desc">{opt.desc}</span>
                  </div>
                  <div className="card-type-check">
                    <FiCheckCircle />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="submit-btn">
            Təsdiqlə
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
          <div className="otp-inputs">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (otpRefs.current[i] = el)}
                className={`otp-box ${digit ? "filled" : ""}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                onPaste={i === 0 ? handleOtpPaste : undefined}
                autoFocus={i === 0}
              />
            ))}
          </div>
          <button className="submit-btn" onClick={handleOtpVerify}>
            Doğrula
          </button>
          <button
            className="back-btn"
            onClick={() => {
              setStep("form");
              setOtp(["", "", "", "", "", ""]);
              setOtpError("");
            }}
          >
            <FiArrowLeft /> Geri qayıt
          </button>
        </div>
      </>
    );

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
      </div>
      <button className="submit-btn" onClick={onBack}>
        Daxil ol
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN LOGIN COMPONENT
// ─────────────────────────────────────────────
function LoginMain() {
  const navigate = useNavigate();

  const [view, setView] = useState("login"); // "login" | "newcard"
  const [step, setStep] = useState("email"); // "email" | "otp"
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const otpRefs = useRef([]);

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg("E-poçt ünvanını daxil edin!");
      return;
    }
    setErrorMsg("");
    setStep("otp");
  };

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setOtpError("");
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      const newOtp = [...otp];
      if (otp[index]) {
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        newOtp[index - 1] = "";
        setOtp(newOtp);
        otpRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0)
      otpRefs.current[index - 1]?.focus();
    else if (e.key === "ArrowRight" && index < 5)
      otpRefs.current[index + 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    const newOtp = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) newOtp[i] = pasted[i];
    setOtp(newOtp);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleOtpVerify = () => {
    const code = otp.join("");
    if (code.length < 6) {
      setOtpError("Zəhmət olmasa bütün 6 xananı doldurun.");
      return;
    }
    localStorage.setItem("isAuthenticated", "true");
    navigate("/home");
  };

  return (
    <div className="login-main">
      <div className="login-card">
        {/* ── NEW CARD VIEW ── */}
        {view === "newcard" && <NewCardView onBack={() => setView("login")} />}

        {/* ── LOGIN: EMAIL ── */}
        {view === "login" && step === "email" && (
          <>
            <div className="lm-header">
              <div className="lm-logo">Insyde</div>
              <h2>Xoş gəlmisiniz! 👋</h2>
              <p>Davam etmək üçün e-poçt ünvanınızı daxil edin.</p>
            </div>

            <form className="lm-form" onSubmit={handleEmailSubmit}>
              {errorMsg && <div className="message error-msg">{errorMsg}</div>}
              <div className="input-group">
                <label>E-poçt ünvanı</label>
                <div className="input-wrapper">
                  <FiMail className="input-icon" />
                  <input
                    type="email"
                    placeholder="example@insyde.az"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>
              <button type="submit" className="submit-btn">
                Davam et
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
              <div className="otp-inputs">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (otpRefs.current[i] = el)}
                    className={`otp-box ${digit ? "filled" : ""}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    onPaste={i === 0 ? handleOtpPaste : undefined}
                    autoFocus={i === 0}
                  />
                ))}
              </div>
              <button className="submit-btn" onClick={handleOtpVerify}>
                Doğrula
              </button>
              <button
                className="back-btn"
                onClick={() => {
                  setStep("email");
                  setOtp(["", "", "", "", "", ""]);
                  setOtpError("");
                }}
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
