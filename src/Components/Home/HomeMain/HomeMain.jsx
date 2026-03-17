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
  FaExternalLinkAlt,
  FaMoon,
  FaSun,
} from "react-icons/fa";
import "./HomeMain.scss";
import Popup from "../../Popup/Popup";
function HomeMain() {
  // Yalnız telefonun öz dark/light state-i
  const [phoneTheme, setPhoneTheme] = useState("dark");
  const [popup, setPopup] = useState({ isOpen: false, type: "success" });
  const closePopup = () => setPopup((p) => ({ ...p, isOpen: false }));

  const togglePhoneTheme = () => {
    setPhoneTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const [formData, setFormData] = useState({
    name: "Elçin",
    email: "elcin@example.com",
    profession: "Frontend Developer",
    skill1: "React",
    skill2: "CSS",
    skill3: "UI/UX",
    about: "Minimalist və müasir interfeyslər qurmağı sevirəm.",
  });

  const [phoneColor, setPhoneColor] = useState("#ff8b94");
  const [profileImage, setProfileImage] = useState(null);

  const userCode = "SYD4568";
  const profileUrl = `/profile/${userCode}`;

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
    "#e1b12c",
    "#1a1a1a",
    "#ff8b94",
    "#10b981",
    "#6c5ce7",
    "#0984e3",
    "#00b894",
    "#fd79a8",
    "#f1c40f",
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) setProfileImage(URL.createObjectURL(file));
  };

  const addNewLink = () => {
    setLinks([
      ...links,
      { platform: "Instagram", url: "", icon: <FaInstagram /> },
    ]);
  };

  const handleLinkChange = (index, field, value) => {
    const updatedLinks = [...links];
    if (field === "platform") {
      const selected = platformOptions.find((p) => p.name === value);
      updatedLinks[index].platform = value;
      updatedLinks[index].icon = selected.icon;
    } else {
      updatedLinks[index].url = value;
    }
    setLinks(updatedLinks);
  };

  const removeLink = (index) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  return (
    <div className="home-main-modern-split">
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
      <div className="form-section">
        <div className="top-header">
          <div>
            <h2 className="page-title">İdarəetmə Sistemi</h2>
            <span className="badge premium">... Paket</span>
          </div>
          <div className="header-actions">
            <span className="time-left">... ... qalıb</span>
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
                      onClick={() =>
                        setPopup({
                          isOpen: true,
                          type: "delete",
                          title: "Məlumat silinsin?",
                          message: "Məlumatları sistemdəm sil.",
                          confirmText: "Sil",
                          onConfirm: () => removeLink(index),
                        })
                      }
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
          <button
            className="save-btn"
            onClick={() =>
              setPopup({
                isOpen: true,
                type: "update",
                title: "Məlumat yadda saxlanılsın?",
                message: "Məlumatları sistemə əlavə et.",
                confirmText: "Saxla",
                onConfirm: null,
              })
            }
          >
            <FaSave /> Yadda Saxla
          </button>
        </div>
      </div>

      {/* SAĞ TƏRƏF: TELEFON PREVIEW */}
      <div className="preview-section">
        {/* Telefonun öz toggle-u */}
        <button
          className="phone-theme-toggle"
          onClick={togglePhoneTheme}
          aria-label="Telefon temasını dəyiş"
        >
          <div className="toggle-track">
            <span
              className={`toggle-label left ${phoneTheme === "light" ? "active" : ""}`}
            >
              <FaSun /> <span>Light</span>
            </span>
            <span
              className={`toggle-label right ${phoneTheme === "dark" ? "active" : ""}`}
            >
              <FaMoon /> <span>Dark</span>
            </span>
            <div
              className={`toggle-thumb ${phoneTheme === "dark" ? "thumb-right" : "thumb-left"}`}
            ></div>
          </div>
        </button>

        {/* phone-dark veya phone-light class-ı alır */}
        <div className={`phone-mockup phone-${phoneTheme}`}>
          <div className="phone-header" style={{ backgroundColor: phoneColor }}>
            {profileImage ? (
              <img
                src={profileImage}
                alt="Preview"
                className="preview-avatar"
              />
            ) : (
              <div className="preview-avatar-placeholder"></div>
            )}
            <h3 className="preview-name">{formData.name || "Ad Soyad"}</h3>
            <p className="preview-profession">
              {formData.profession || "Peşə"}
            </p>
          </div>

          <div className="phone-body">
            <div className="preview-about">
              <h4>Haqqında</h4>
              <p>
                {formData.about ||
                  "Sizin haqqınızda məlumat burda görünəcək..."}
              </p>
            </div>

            <div className="preview-skills">
              {[formData.skill1, formData.skill2, formData.skill3]
                .filter(Boolean)
                .map((skill, i) => (
                  <span
                    key={i}
                    className="skill-tag"
                    style={{
                      backgroundColor: `${phoneColor}25`,
                      color: phoneColor,
                    }}
                  >
                    {skill}
                  </span>
                ))}
            </div>

            <div className="preview-socials">
              {links.map((link, index) =>
                link.url ? (
                  <div className="social-card" key={index}>
                    <span style={{ color: phoneColor }}>{link.icon}</span>
                    <span>{link.url}</span>
                  </div>
                ) : null,
              )}
            </div>
          </div>
        </div>

        <div className="theme-color-section">
          <label>Profil Rəngi / Tema Rəngi</label>
          <div className="color-palette">
            {colors.map((color, index) => (
              <div
                key={index}
                className={`color-box ${phoneColor === color ? "active" : ""}`}
                style={{ backgroundColor: color }}
                onClick={() => setPhoneColor(color)}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomeMain;
