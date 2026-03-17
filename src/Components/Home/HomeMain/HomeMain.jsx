import React, { useState, useEffect } from "react";
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
  FaSpinner,
} from "react-icons/fa";
import "./HomeMain.scss";
import Popup from "../../Popup/Popup";
import { authFetch, API_BASE } from "../../../Utils/authUtils";
import { useNavigate } from "react-router-dom";

const URL_PROFILE = `${API_BASE}/api/dash/profile/me/`;
const URL_SOCIAL_TYPES = `${API_BASE}/api/dash/social-media-types/`;

function HomeMain() {
  const navigate = useNavigate();

  const [phoneTheme, setPhoneTheme] = useState("dark");
  const [popup, setPopup] = useState({ isOpen: false, type: "success" });
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const closePopup = () => setPopup((p) => ({ ...p, isOpen: false }));
  const togglePhoneTheme = () =>
    setPhoneTheme((prev) => (prev === "dark" ? "light" : "dark"));

  // ── Form data ──────────────────────────────────────────
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    work: "",
    skill_1: "",
    skill_2: "",
    skill_3: "",
    about: "",
  });

  const [phoneColor, setPhoneColor] = useState("#ff8b94");
  const [phoneMode, setPhoneMode] = useState("dark");
  const [profileImage, setProfileImage] = useState(null); // URL string
  const [imageFile, setImageFile] = useState(null); // File object
  const [userCode, setUserCode] = useState("");
  const [links, setLinks] = useState([]);
  const [socialTypes, setSocialTypes] = useState([]);
  const [cardInfo, setCardInfo] = useState(null);

  const profileUrl = userCode
    ? `${window.location.origin}/profile/${userCode}`
    : "#";

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

  // ── İlk yükləmə: profil + sosial tiplər ───────────────
  useEffect(() => {
    async function load() {
      setPageLoading(true);
      try {
        const [profileRes, typesRes] = await Promise.all([
          authFetch(URL_PROFILE, { method: "GET" }, navigate),
          authFetch(URL_SOCIAL_TYPES, { method: "GET" }, navigate),
        ]);

        if (profileRes) {
          const d = await profileRes.json();

          // user_info
          const info = d.user_info || {};
          setFormData({
            name: info.name || "",
            email: info.email || "",
            work: info.work || "",
            skill_1: info.skill_1 || "",
            skill_2: info.skill_2 || "",
            skill_3: info.skill_3 || "",
            about: info.about || "",
          });
          setUserCode(info.user_code || "");
          if (info.image) setProfileImage(info.image);

          // system
          const sys = d.system || {};
          if (sys.color) setPhoneColor(sys.color);
          if (sys.mode) setPhoneMode(sys.mode);

          // links
          setLinks(d.link_side || []);

          // card
          setCardInfo(d.card || null);
        }

        if (typesRes) {
          const types = await typesRes.json();
          setSocialTypes(types);
        }
      } catch (err) {
        console.error("Yükləmə xətası:", err);
      } finally {
        setPageLoading(false);
      }
    }
    load();
  }, []);

  // ── Form dəyişikliyi ───────────────────────────────────
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ── Şəkil yükləmə ─────────────────────────────────────
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setProfileImage(URL.createObjectURL(file));
    }
  };

  // ── Link əməliyyatları ─────────────────────────────────
  const addNewLink = () => {
    const firstType = socialTypes[0] || null;
    setLinks([
      ...links,
      {
        social_type: firstType || {
          id: null,
          name: "Instagram",
          icon_code: "",
        },
        social_type_id: firstType?.id || null,
        link: "",
        preview_count: 0,
      },
    ]);
  };

  const handleLinkChange = (index, field, value) => {
    const updated = [...links];
    if (field === "social_type_id") {
      const found = socialTypes.find((t) => t.id === Number(value));
      updated[index].social_type_id = Number(value);
      if (found) updated[index].social_type = found;
    } else {
      updated[index][field] = value;
    }
    setLinks(updated);
  };

  const removeLink = (index) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  // ── Saxla → PATCH /profile/me/ ────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    try {
      // Şəkil varsa multipart göndər
      let body;
      let headers = {};

      const payload = {
        user_info: {
          name: formData.name,
          email: formData.email,
          work: formData.work,
          skill_1: formData.skill_1,
          skill_2: formData.skill_2,
          skill_3: formData.skill_3,
          about: formData.about,
        },
        system: {
          color: phoneColor,
          mode: phoneMode,
        },
        link_side: links.map((l) => ({
          social_type_id: l.social_type_id || l.social_type?.id,
          link: l.link,
        })),
      };

      if (imageFile) {
        const fd = new FormData();
        fd.append("image", imageFile);
        // JSON hissələri ayrıca field kimi göndər
        fd.append("user_info", JSON.stringify(payload.user_info));
        fd.append("system", JSON.stringify(payload.system));
        fd.append("link_side", JSON.stringify(payload.link_side));
        body = fd;
        // Content-Type header-i FormData üçün qoyma — browser özü qoyacaq
        headers = {};
      } else {
        body = JSON.stringify(payload);
        headers = { "Content-Type": "application/json" };
      }

      const res = await authFetch(
        URL_PROFILE,
        { method: "PATCH", headers, body },
        navigate,
      );

      if (!res) return;

      if (res.ok) {
        setPopup({
          isOpen: true,
          type: "success",
          title: "Uğurlu!",
          message: "Məlumatlar yadda saxlanıldı.",
          confirmText: "OK",
          onConfirm: null,
        });
        setImageFile(null);
      } else {
        const err = await res.json();
        setSaveError(err?.detail || err?.error || "Xəta baş verdi.");
      }
    } catch {
      setSaveError("Serverə qoşulmaq mümkün olmadı.");
    } finally {
      setSaving(false);
    }
  };

  // ── Platform icon köməkçisi ────────────────────────────
  const getPlatformIcon = (typeName) => {
    const n = (typeName || "").toLowerCase();
    if (n.includes("instagram")) return <FaInstagram />;
    if (n.includes("facebook")) return <FaFacebook />;
    if (n.includes("linkedin")) return <FaLinkedin />;
    if (n.includes("whatsapp")) return <FaWhatsapp />;
    return <FaGlobe />;
  };

  // ── Yüklənirsə ────────────────────────────────────────
  if (pageLoading) {
    return (
      <div className="page-loading">
        <FaSpinner className="spin" />
        <span>Yüklənir...</span>
      </div>
    );
  }

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

      {/* ── SOL: FORM ── */}
      <div className="form-section">
        <div className="top-header">
          <div>
            <h2 className="page-title">İdarəetmə Sistemi</h2>
            <span className="badge premium">
              {cardInfo?.package_type || "..."} Paket
            </span>
          </div>
          <div className="header-actions">
            <span className="time-left">{cardInfo?.status || "..."}</span>
          </div>
        </div>

        <div className="modern-card form-card">
          {/* ROW 1 */}
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
                <div className="val code">{userCode || "—"}</div>
              </div>
            </div>
          </div>

          {/* ROW 2 */}
          <div className="row-2">
            <div className="input-group flex-1">
              <label>Peşə</label>
              <input
                type="text"
                name="work"
                value={formData.work}
                onChange={handleChange}
              />
            </div>
            <div className="skills-group">
              <label>Bacarıqlar (Max 3)</label>
              <div className="skills-inputs">
                <input
                  type="text"
                  name="skill_1"
                  value={formData.skill_1}
                  onChange={handleChange}
                  placeholder="Bacarıq 1"
                />
                <input
                  type="text"
                  name="skill_2"
                  value={formData.skill_2}
                  onChange={handleChange}
                  placeholder="Bacarıq 2"
                />
                <input
                  type="text"
                  name="skill_3"
                  value={formData.skill_3}
                  onChange={handleChange}
                  placeholder="Bacarıq 3"
                />
              </div>
            </div>
          </div>

          {/* HAQQINDA */}
          <div className="input-group full-width">
            <label>Haqqında məlumat</label>
            <textarea
              name="about"
              rows="3"
              value={formData.about}
              onChange={handleChange}
            />
          </div>

          {/* LİNKLƏR */}
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
                          message: "Məlumatları sistemdən sil.",
                          confirmText: "Sil",
                          onConfirm: () => removeLink(index),
                        })
                      }
                    >
                      <FaTrashAlt />
                    </button>
                  </div>
                  <div className="social-select">
                    <span className="select-icon">
                      {getPlatformIcon(link.social_type?.name)}
                    </span>
                    <select
                      value={link.social_type_id || link.social_type?.id || ""}
                      onChange={(e) =>
                        handleLinkChange(
                          index,
                          "social_type_id",
                          e.target.value,
                        )
                      }
                    >
                      {socialTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="text"
                    placeholder="Linkinizi bura yapışdırın"
                    value={link.link || ""}
                    onChange={(e) =>
                      handleLinkChange(index, "link", e.target.value)
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

        {/* ALT AKSİYALAR */}
        <div className="bottom-actions">
          {saveError && <span className="save-error">{saveError}</span>}
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
                onConfirm: handleSave,
              })
            }
            disabled={saving}
          >
            {saving ? (
              <>
                <FaSpinner className="spin" /> Saxlanılır...
              </>
            ) : (
              <>
                <FaSave /> Yadda Saxla
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── SAĞ: TELEFON PREVİEW ── */}
      <div className="preview-section">
        <button className="phone-theme-toggle" onClick={togglePhoneTheme}>
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
            />
          </div>
        </button>

        <div className={`phone-mockup phone-${phoneTheme}`}>
          <div className="phone-header" style={{ backgroundColor: phoneColor }}>
            {profileImage ? (
              <img
                src={profileImage}
                alt="Preview"
                className="preview-avatar"
              />
            ) : (
              <div className="preview-avatar-placeholder" />
            )}
            <h3 className="preview-name">{formData.name || "Ad Soyad"}</h3>
            <p className="preview-profession">{formData.work || "Peşə"}</p>
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
              {[formData.skill_1, formData.skill_2, formData.skill_3]
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
                link.link ? (
                  <div className="social-card" key={index}>
                    <span style={{ color: phoneColor }}>
                      {getPlatformIcon(link.social_type?.name)}
                    </span>
                    <span>{link.link}</span>
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
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomeMain;
