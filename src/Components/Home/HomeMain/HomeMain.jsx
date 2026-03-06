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
} from "react-icons/fa";
import "./HomeMain.scss";

function HomeMain() {
  const [formData, setFormData] = useState({
    name: "Elçin",
    email: "elcin@example.com",
    profession: "Frontend Developer",
    skill1: "React",
    skill2: "CSS",
    skill3: "UI/UX",
    about: "Minimalist və müasir interfeyslər qurmağı sevirəm.",
    themeColor: "#ff8b94",
  });

  const [profileImage, setProfileImage] = useState(null);

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
      const selectedPlatform = platformOptions.find((p) => p.name === value);
      updatedLinks[index].platform = value;
      updatedLinks[index].icon = selectedPlatform.icon;
    } else {
      updatedLinks[index].url = value;
    }
    setLinks(updatedLinks);
  };

  const removeLink = (index) => {
    const updatedLinks = links.filter((_, i) => i !== index);
    setLinks(updatedLinks);
  };

  return (
    <div className="home-main-modern-split">
      {/* ======================================= */}
      {/* SOL TƏRƏF: FORM VƏ MƏLUMAT GİRİŞİ */}
      {/* ======================================= */}
      <div className="form-section">
        {/* Üst Başlıq (Çıxış düyməsi silindi) */}
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

          {/* ======================================= */}
          {/* DİNAMİK LİNKLƏR HİSSƏSİ */}
          {/* ======================================= */}
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

                  {/* Select */}
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

                  {/* İnput */}
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

          {/* ======================================= */}
          {/* RƏNGLƏR (ORTALANDI) */}
          {/* ======================================= */}
          <div className="theme-color-section">
            <label>Profil Rəngi / Tema Rəngi</label>
            <div className="color-palette">
              {colors.map((color, index) => (
                <div
                  key={index}
                  className={`color-box ${formData.themeColor === color ? "active" : ""}`}
                  style={{ backgroundColor: color }}
                  onClick={() =>
                    setFormData({ ...formData, themeColor: color })
                  }
                ></div>
              ))}
            </div>
          </div>
        </div>

        <div className="bottom-actions">
          <div className="status-badge">
            <FaCheckCircle /> Məlumatlar işlək vəziyyətdədir
          </div>
          <button className="save-btn">
            <FaSave /> Yadda Saxla
          </button>
        </div>
      </div>

      {/* ======================================= */}
      {/* SAĞ TƏRƏF: TELEFON PREVIEW */}
      {/* ======================================= */}
      <div className="preview-section">
        <div className="phone-mockup">
          <div
            className="phone-header"
            style={{ backgroundColor: formData.themeColor }}
          >
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
              {formData.skill1 && (
                <span
                  className="skill-tag"
                  style={{
                    backgroundColor: `${formData.themeColor}20`,
                    color: formData.themeColor,
                  }}
                >
                  {formData.skill1}
                </span>
              )}
              {formData.skill2 && (
                <span
                  className="skill-tag"
                  style={{
                    backgroundColor: `${formData.themeColor}20`,
                    color: formData.themeColor,
                  }}
                >
                  {formData.skill2}
                </span>
              )}
              {formData.skill3 && (
                <span
                  className="skill-tag"
                  style={{
                    backgroundColor: `${formData.themeColor}20`,
                    color: formData.themeColor,
                  }}
                >
                  {formData.skill3}
                </span>
              )}
            </div>

            <div className="preview-socials">
              {links.map((link, index) =>
                link.url ? (
                  <div className="social-card" key={index}>
                    <span style={{ color: formData.themeColor }}>
                      {link.icon}
                    </span>
                    <span>{link.url}</span>
                  </div>
                ) : null,
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomeMain;
