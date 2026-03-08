import React, { useState } from "react";
import {
  FaCloudUploadAlt,
  FaInstagram,
  FaFacebook,
  FaLinkedin,
  FaWhatsapp,
  FaGlobe,
  FaPlus,
  FaCheckCircle,
  FaSave,
  FaTrashAlt,
  FaSun,
  FaMoon,
  FaExternalLinkAlt,
  FaPhone,
  FaEnvelope,
  FaCommentDots,
} from "react-icons/fa";
import "./HomeMain.scss";

const platformIconMap = {
  Instagram: <FaInstagram />,
  Facebook: <FaFacebook />,
  LinkedIn: <FaLinkedin />,
  WhatsApp: <FaWhatsapp />,
  "Web Sayt": <FaGlobe />,
};

const hexToRgb = (hex) => {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r
    ? `${parseInt(r[1], 16)}, ${parseInt(r[2], 16)}, ${parseInt(r[3], 16)}`
    : "184, 134, 11";
};

function HomeMain() {
  const [formData, setFormData] = useState({
    name: "Elçin",
    email: "elcin@example.com",
    profession: "Frontend Developer",
    skill1: "React",
    skill2: "CSS",
    skill3: "UI/UX",
    about: "Minimalist və müasir interfeyslər qurmağı sevirəm.",
    themeColor: "#b8860b",
  });

  const [profileImage, setProfileImage] = useState(null);
  const [phoneMode, setPhoneMode] = useState("dark");

  const [links, setLinks] = useState([
    {
      platform: "Instagram",
      url: "instagram.com/elcin",
      icon: <FaInstagram />,
    },
  ]);

  const platformOptions = [
    { name: "Instagram", icon: <FaInstagram /> },
    { name: "Facebook", icon: <FaFacebook /> },
    { name: "LinkedIn", icon: <FaLinkedin /> },
    { name: "WhatsApp", icon: <FaWhatsapp /> },
    { name: "Web Sayt", icon: <FaGlobe /> },
  ];

  const colors = [
    "#b8860b",
    "#1a1a1a",
    "#ff8b94",
    "#10b981",
    "#6c5ce7",
    "#0984e3",
    "#00b894",
    "#fd79a8",
    "#f1c40f",
  ];

  const userCode = "SYD4568";
  const profileUrl = `/profile/${userCode}`;
  const themeRgb = hexToRgb(formData.themeColor);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) setProfileImage(URL.createObjectURL(file));
  };

  const addNewLink = () =>
    setLinks([
      ...links,
      { platform: "Instagram", url: "", icon: <FaInstagram /> },
    ]);

  const handleLinkChange = (index, field, value) => {
    const updated = [...links];
    if (field === "platform") {
      const p = platformOptions.find((p) => p.name === value);
      updated[index].platform = value;
      updated[index].icon = p.icon;
    } else {
      updated[index].url = value;
    }
    setLinks(updated);
  };

  const removeLink = (index) => setLinks(links.filter((_, i) => i !== index));

  return (
    <div className="home-main-modern-split">
      {/* ========== SOL TƏRƏF ========== */}
      <div className="form-section">
        <div className="top-header">
          <div>
            <h2 className="page-title">İdarəetmə Sistemi</h2>
            <span className="badge premium">Premium Paket</span>
          </div>
          <div className="header-actions">
            <span className="time-left">3 gün qalıb</span>
          </div>
        </div>

        <div className="modern-card form-card">
          <div className="row-1">
            <div className="upload-box">
              <input
                type="file"
                id="file-upload"
                accept="image/*"
                onChange={handleImageUpload}
              />
              <label htmlFor="file-upload">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="preview-img-small"
                  />
                ) : (
                  <>
                    <FaCloudUploadAlt className="upload-icon" />
                    <span>Yüklə</span>
                  </>
                )}
              </label>
            </div>

            <div className="inputs-grid">
              <div className="input-group">
                <label>Ad Soyad</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              <div className="input-group">
                <label>Email</label>
                <input
                  type="text"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="stats-boxes">
              <div className="stat-box">
                <label>Ümumi Baxış</label>
                <div className="val green">0</div>
              </div>
              <div className="stat-box">
                <label>User Code</label>
                <div className="val code">SYD4568</div>
              </div>
            </div>
          </div>

          <div className="row-2">
            <div className="input-group flex-1">
              <label>Peşə</label>
              <input
                type="text"
                name="profession"
                value={formData.profession}
                onChange={handleChange}
              />
            </div>
            <div className="skills-group">
              <label>Bacarıqlar (Max 3)</label>
              <div className="skills-inputs">
                <input
                  type="text"
                  name="skill1"
                  value={formData.skill1}
                  onChange={handleChange}
                  placeholder="Bacarıq 1"
                />
                <input
                  type="text"
                  name="skill2"
                  value={formData.skill2}
                  onChange={handleChange}
                  placeholder="Bacarıq 2"
                />
                <input
                  type="text"
                  name="skill3"
                  value={formData.skill3}
                  onChange={handleChange}
                  placeholder="Bacarıq 3"
                />
              </div>
            </div>
          </div>

          <div className="input-group full-width">
            <label>Haqqında məlumat</label>
            <textarea
              name="about"
              rows="3"
              value={formData.about}
              onChange={handleChange}
            ></textarea>
          </div>

          <div className="links-wrapper">
            <label>Sosial Şəbəkə / Əlaqə Linkləri</label>
            <div className="links-list">
              {links.map((link, index) => (
                <div className="social-add-row" key={index}>
                  <div className="row-top-mobile">
                    <div className="order-num">{index + 1}</div>
                    <button
                      className="remove-link-btn"
                      onClick={() => removeLink(index)}
                    >
                      <FaTrashAlt />
                    </button>
                  </div>
                  <div className="social-select">
                    <span className="select-icon">{link.icon}</span>
                    <select
                      value={link.platform}
                      onChange={(e) =>
                        handleLinkChange(index, "platform", e.target.value)
                      }
                    >
                      {platformOptions.map((opt, i) => (
                        <option key={i} value={opt.name}>
                          {opt.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="text"
                    placeholder="Linkinizi bura yapışdırın"
                    value={link.url}
                    onChange={(e) =>
                      handleLinkChange(index, "url", e.target.value)
                    }
                  />
                </div>
              ))}
            </div>
            <button className="add-new-btn" onClick={addNewLink}>
              <FaPlus /> Yeni Link Əlavə Et
            </button>
          </div>
        </div>

        <div className="bottom-actions">
          <div className="status-badge">
            <FaCheckCircle /> Məlumatlar işlək vəziyyətdədir
          </div>
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="view-profile-btn"
          >
            <FaExternalLinkAlt /> Səhifəmə Keçid
          </a>
          <button className="save-btn">
            <FaSave /> Yadda Saxla
          </button>
        </div>
      </div>

      {/* ========== SAĞ TƏRƏF: PREVIEW ========== */}
      <div className="preview-section">
        <div className="mockup-mode-switcher">
          <button
            className={`mode-btn ${phoneMode === "light" ? "active" : ""}`}
            onClick={() => setPhoneMode("light")}
          >
            <FaSun /> Light
          </button>
          <button
            className={`mode-btn ${phoneMode === "dark" ? "active" : ""}`}
            onClick={() => setPhoneMode("dark")}
          >
            <FaMoon /> Dark
          </button>
        </div>

        {/* TELEFON */}
        <div className={`phone-mockup mode-${phoneMode}`}>
          <div className="phone-notch" />

          <div className="phone-scroll-area">
            {/* ── HEADER BÖLMƏSİ ── */}
            <div className="profile-header">
              {/* Geri oxu */}
              <div className="ph-back-btn">‹</div>

              {/* Stats sırası */}
              <div className="ph-stats-row">
                <div className="ph-stat">
                  <span className="ph-stat-num">1.2 K</span>
                  <span className="ph-stat-label">İzləyici</span>
                </div>
                {/* Avatar mərkəzdə */}
                <div className="ph-avatar-wrap">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="avatar"
                      className="ph-avatar"
                    />
                  ) : (
                    <div
                      className="ph-avatar-placeholder"
                      style={{
                        background: `linear-gradient(135deg, rgba(${themeRgb},0.6), rgba(${themeRgb},0.2))`,
                      }}
                    />
                  )}
                  {/* Aktiv göstərici */}
                  <span
                    className="ph-online-dot"
                    style={{ backgroundColor: formData.themeColor }}
                  />
                </div>
                <div className="ph-stat ph-stat-right">
                  <span className="ph-stat-num">4.5 K</span>
                  <span className="ph-stat-label">İzlənilən</span>
                </div>
              </div>

              {/* Ad + peşə */}
              <div className="ph-name-block">
                <span className="ph-name">
                  {formData.name || "Ad Soyad"}
                  <span
                    className="ph-verified"
                    style={{ color: formData.themeColor }}
                  >
                    ✦
                  </span>
                </span>
                <span className="ph-profession">
                  {formData.profession || "Peşə"}
                </span>
              </div>

              {/* 2 düymə */}
              <div className="ph-action-btns">
                <button
                  className="ph-btn ph-btn-primary"
                  style={{ borderColor: `rgba(${themeRgb},0.6)` }}
                >
                  Əlaqə
                </button>
                <button
                  className="ph-btn ph-btn-fill"
                  style={{ backgroundColor: formData.themeColor }}
                >
                  Mesaj
                </button>
              </div>
            </div>

            {/* ── SOSİAL LİNKLƏR ── */}
            <div className="preview-links-list">
              {/* Sabit linkler */}
              <div className="preview-link-card">
                <div
                  className="link-icon-wrap"
                  style={{ backgroundColor: formData.themeColor }}
                >
                  <FaPhone />
                </div>
                <div className="link-text">
                  <span className="link-label">Call</span>
                  {formData.email && (
                    <span className="link-sub">{formData.email}</span>
                  )}
                </div>
                <span className="link-arrow">↗</span>
              </div>

              <div className="preview-link-card">
                <div
                  className="link-icon-wrap"
                  style={{ backgroundColor: formData.themeColor }}
                >
                  <FaCommentDots />
                </div>
                <div className="link-text">
                  <span className="link-label">Message</span>
                </div>
                <span className="link-arrow">↗</span>
              </div>

              <div className="preview-link-card">
                <div
                  className="link-icon-wrap"
                  style={{ backgroundColor: formData.themeColor }}
                >
                  <FaEnvelope />
                </div>
                <div className="link-text">
                  <span className="link-label">E-mail</span>
                  {formData.email && (
                    <span className="link-sub">{formData.email}</span>
                  )}
                </div>
                <span className="link-arrow">↗</span>
              </div>

              {/* Dinamik linklər */}
              {links.map((link, i) =>
                link.url ? (
                  <div className="preview-link-card" key={i}>
                    <div
                      className="link-icon-wrap"
                      style={{ backgroundColor: formData.themeColor }}
                    >
                      {platformIconMap[link.platform] || <FaGlobe />}
                    </div>
                    <div className="link-text">
                      <span className="link-label">{link.platform}</span>
                      <span className="link-sub">{link.url}</span>
                    </div>
                    <span className="link-arrow">↗</span>
                  </div>
                ) : null,
              )}
            </div>

            {/* Bacarıqlar */}
            {(formData.skill1 || formData.skill2 || formData.skill3) && (
              <div className="preview-skills-section">
                {formData.skill1 && (
                  <span
                    className="skill-chip"
                    style={{
                      borderColor: `rgba(${themeRgb},0.5)`,
                      color: formData.themeColor,
                    }}
                  >
                    {formData.skill1}
                  </span>
                )}
                {formData.skill2 && (
                  <span
                    className="skill-chip"
                    style={{
                      borderColor: `rgba(${themeRgb},0.5)`,
                      color: formData.themeColor,
                    }}
                  >
                    {formData.skill2}
                  </span>
                )}
                {formData.skill3 && (
                  <span
                    className="skill-chip"
                    style={{
                      borderColor: `rgba(${themeRgb},0.5)`,
                      color: formData.themeColor,
                    }}
                  >
                    {formData.skill3}
                  </span>
                )}
              </div>
            )}

            {/* Footer nav bar */}
            <div className="phone-nav-bar">
              <span>✉</span>
              <span>⌕</span>
              <span>♡</span>
              <span>≡</span>
            </div>
          </div>
        </div>

        {/* Rənglər */}
        <div className="theme-color-section">
          <label>Profil Rəngi / Tema Rəngi</label>
          <div className="color-palette">
            {colors.map((color, index) => (
              <div
                key={index}
                className={`color-box ${formData.themeColor === color ? "active" : ""}`}
                style={{ backgroundColor: color }}
                onClick={() => setFormData({ ...formData, themeColor: color })}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomeMain;
