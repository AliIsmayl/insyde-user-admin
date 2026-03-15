import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiMail, FiArrowLeft } from "react-icons/fi";
import "./LoginMain.scss";

function LoginMain() {
  const navigate = useNavigate();

  const [step, setStep] = useState("email"); // "email" | "otp"
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const otpRefs = useRef([]);

  // ── STEP 1: Email submit ──
  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg("E-poçt ünvanını daxil edin!");
      return;
    }
    setErrorMsg("");
    setStep("otp");
  };

  // ── OTP handlers ──
  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setOtpError("");
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
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
    } else if (e.key === "ArrowLeft" && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
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
        {/* ── EMAIL STEP ── */}
        {step === "email" && (
          <>
            <div className="login-header">
              <div className="logo-text">Insyde</div>
              <h2>Xoş gəlmisiniz! 👋</h2>
              <p>Davam etmək üçün e-poçt ünvanınızı daxil edin.</p>
            </div>

            <form className="login-form" onSubmit={handleEmailSubmit}>
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

            <div className="login-footer">
              <p>
                Hesabınız yoxdur?{" "}
                <a
                  className="link-text"
                  href="https://insyde.info/new-card"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Qeydiyyatdan keçin
                </a>
              </p>
            </div>
          </>
        )}

        {/* ── OTP STEP ── */}
        {step === "otp" && (
          <>
            <div className="login-header">
              <div className="logo-text">Insyde</div>
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
                <FiArrowLeft />
                Geri qayıt
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default LoginMain;
