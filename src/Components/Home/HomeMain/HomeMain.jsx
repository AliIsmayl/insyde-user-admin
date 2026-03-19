import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaCloudUploadAlt,
  FaInstagram,
  FaFacebook,
  FaLinkedin,
  FaWhatsapp,
  FaTelegram,
  FaTwitter,
  FaYoutube,
  FaTiktok,
  FaGlobe,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaLink,
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
import { API_BASE, getToken, CK } from "../../../Utils/authUtils";

const URL_PROFILE = `${API_BASE}/api/dash/auth/profile/me/`;
const URL_SOC_TYPES = (cat) =>
  `${API_BASE}/api/dash/auth/social-media-types/?category=${cat}`;
const URL_LINK_DEL = (pk) => `${API_BASE}/api/dash/auth/my-profile/link/${pk}/`;

const CATEGORIES = [
  { key: "social", label: "Sosial Şəbəkələr" },
  { key: "contact", label: "Əlaqə Məlumatları" },
  { key: "additional", label: "Əlavə Linklər" },
];

const ICON_MAP = {
  Instagram: <FaInstagram />,
  Facebook: <FaFacebook />,
  LinkedIn: <FaLinkedin />,
  Twitter: <FaTwitter />,
  YouTube: <FaYoutube />,
  TikTok: <FaTiktok />,
  Telegram: <FaTelegram />,
  WhatsApp: <FaWhatsapp />,
  Telefon: <FaPhone />,
  Email: <FaEnvelope />,
  Ünvan: <FaMapMarkerAlt />,
  "Web Sayt": <FaGlobe />,
  Link: <FaLink />,
};

function getIcon(name) {
  return ICON_MAP[name] || <FaGlobe />;
}

const COLORS = [
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

function apiFetch(url, token, options = {}) {
  const isFormData = options.body instanceof FormData;
  const headers = { Authorization: `Token ${token}` };
  if (!isFormData) headers["Content-Type"] = "application/json";
  const { headers: _h, ...rest } = options;
  return fetch(url, { ...rest, headers });
}

function parseLink(l) {
  return {
    id: l.id || null,
    social_type: l.social_type || null,
    name: l.name || "",
    icon: getIcon(l.name),
    category: l.category || "social",
    url: l.input || "",
    isNew: false,
    isDirty: false,
    isDeleted: false, // silmə üçün flag — backend-ə hələ getməyib
  };
}

// ─────────────────────────────────────────────────────────
export default function HomeMain() {
  const navigate = useNavigate();
  const didLoad = useRef(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [popup, setPopup] = useState({ isOpen: false });
  const [activeTab, setActiveTab] = useState("social");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    profession: "",
    skill1: "",
    skill2: "",
    skill3: "",
    about: "",
  });

  const [profileImage, setProfileImage] = useState(null);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [userCode, setUserCode] = useState("");
  const [totalViews, setTotalViews] = useState(0);
  const [packageType, setPackageType] = useState("standard");
  const [phoneTheme, setPhoneTheme] = useState("dark");
  const [phoneColor, setPhoneColor] = useState("#ff8b94");

  const [platformOptions, setPlatformOptions] = useState({
    social: [],
    contact: [],
    additional: [],
  });
  const [links, setLinks] = useState([]);

  // Saxlanılmamış dəyişiklik varmı?
  const hasUnsaved = links.some((l) => l.isNew || l.isDirty || l.isDeleted);

  const closePopup = () => setPopup((p) => ({ ...p, isOpen: false }));

  // ── loadData ──────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    const token = getToken();
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      const [rProfile, rSocial, rContact, rAdditional] = await Promise.all([
        apiFetch(URL_PROFILE, token),
        apiFetch(URL_SOC_TYPES("social"), token),
        apiFetch(URL_SOC_TYPES("contact"), token),
        apiFetch(URL_SOC_TYPES("additional"), token),
      ]);

      const grouped = { social: [], contact: [], additional: [] };
      const parseCat = async (res, cat) => {
        if (!res.ok) return;
        const sd = await res.json().catch(() => []);
        if (Array.isArray(sd)) {
          grouped[cat] = sd.map((t) => ({
            id: t.id,
            name: t.name,
            icon: getIcon(t.name),
            category: cat,
          }));
        }
      };
      await Promise.all([
        parseCat(rSocial, "social"),
        parseCat(rContact, "contact"),
        parseCat(rAdditional, "additional"),
      ]);
      setPlatformOptions({ ...grouped });

      if (rProfile.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      if (!rProfile.ok) {
        const body = await rProfile.json().catch(() => ({}));
        setError(body?.detail || `Server xətası: ${rProfile.status}`);
        return;
      }

      const d = await rProfile.json();
      const info = d.user_info || {};
      const sys = d.system || {};
      const card = d.card || {};

      setFormData({
        name: info.name || "",
        email: info.email || "",
        profession: info.work || "",
        skill1: info.skill_1 || "",
        skill2: info.skill_2 || "",
        skill3: info.skill_3 || "",
        about: info.about || "",
      });
      setUserCode(
        info.system_user_code || info.user_code || CK.get("user_code") || "",
      );
      setTotalViews(info.look ?? 0);
      if (info.image) setProfileImage(info.image);
      if (sys.color) setPhoneColor(sys.color);
      if (sys.mode) setPhoneTheme(sys.mode);
      setPackageType(card.package_type || "standard");

      const rawLinkSide = d.link_side || {};
      const allLinks = [];
      ["social", "contact", "additional"].forEach((cat) => {
        (rawLinkSide[cat] || []).forEach((l) => allLinks.push(parseLink(l)));
      });
      setLinks(allLinks);
    } catch {
      setError("Server ilə əlaqə kəsildi.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;
    loadData();
  }, [loadData]);

  // ── Helpers ───────────────────────────────────────────────
  const linksFor = (cat) =>
    links
      .map((l, globalIdx) => ({ ...l, globalIdx }))
      .filter((l) => l.category === cat && !l.isDeleted);

  // ── Form handlers ─────────────────────────────────────────
  const handleChange = (e) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProfileImageFile(file);
    setProfileImage(URL.createObjectURL(file));
  };

  const addNewLink = (cat) => {
    const platforms = platformOptions[cat] || [];
    if (platforms.length === 0) return;
    const first = platforms[0];
    setLinks((p) => [
      ...p,
      {
        id: null,
        social_type: first.id,
        name: first.name,
        icon: first.icon,
        category: cat,
        url: "",
        isNew: true,
        isDirty: false,
        isDeleted: false,
      },
    ]);
  };

  const handleLinkChange = (globalIdx, field, value) => {
    setLinks((p) => {
      const u = [...p];
      const link = { ...u[globalIdx], isDirty: true };
      if (field === "platform") {
        const cat = link.category;
        const platforms = platformOptions[cat] || [];
        const sel = platforms.find((o) => o.name === value);
        if (!sel) return p;
        link.social_type = sel.id;
        link.name = sel.name;
        link.icon = sel.icon;
      } else {
        link.url = value;
      }
      u[globalIdx] = link;
      return u;
    });
  };

  // Sil — sadəcə local flag qoy, backend-ə getmir
  const removeLink = (globalIdx) => {
    const link = links[globalIdx];
    // Yeni link (hələ saxlanılmayıb) — birbaşa array-dən çıxar
    if (link.isNew) {
      setLinks((p) => p.filter((_, i) => i !== globalIdx));
      return;
    }
    // Mövcud link — isDeleted flag-i qoy, saxlananda backend-ə gedəcək
    setLinks((p) => {
      const u = [...p];
      u[globalIdx] = { ...u[globalIdx], isDeleted: true };
      return u;
    });
  };

  const confirmRemove = (globalIdx) => {
    setPopup({
      isOpen: true,
      type: "delete",
      title: "Link silinsin?",
      message:
        "Bu dəyişiklik yalnız 'Yadda Saxla' düyməsi ilə tətbiq olunacaq.",
      confirmText: "Sil",
      onConfirm: () => removeLink(globalIdx),
    });
  };

  const togglePhoneTheme = () =>
    setPhoneTheme((p) => (p === "dark" ? "light" : "dark"));

  // ── Save — bütün pending dəyişiklikləri backend-ə göndər ──
  const handleSave = async () => {
    const token = getToken();
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    setSaving(true);
    try {
      // 1. Silinəcək linkləri DELETE et
      const toDelete = links.filter((l) => l.isDeleted && l.id);
      const deleteResults = await Promise.all(
        toDelete.map((l) =>
          apiFetch(URL_LINK_DEL(l.id), token, { method: "DELETE" })
            .then((r) => ({ id: l.id, ok: r.ok || r.status === 404 }))
            .catch(() => ({ id: l.id, ok: false })),
        ),
      );

      // Uğursuz silmə varsa xəbərdarlıq et, amma davam et
      const failedDeletes = deleteResults.filter((r) => !r.ok);
      if (failedDeletes.length > 0) {
        console.warn("Bəzi linklər silinə bilmədi:", failedDeletes);
      }

      // 2. Profil + yeni/dəyişmiş linkləri PATCH et
      const activeLinks = links.filter(
        (l) => !l.isDeleted && l.url && l.social_type !== null,
      );

      const payload = {
        user_info: {
          name: formData.name,
          email: formData.email,
          work: formData.profession,
          skill_1: formData.skill1,
          skill_2: formData.skill2,
          skill_3: formData.skill3,
          about: formData.about,
        },
        system: { color: phoneColor, mode: phoneTheme },
        link_side: activeLinks.map((l) => ({
          social_type: l.social_type,
          input: l.url,
        })),
      };

      const fd = new FormData();
      fd.append("data", JSON.stringify(payload));
      if (profileImageFile) fd.append("image", profileImageFile);

      const res = await apiFetch(URL_PROFILE, token, {
        method: "PATCH",
        body: fd,
      });
      if (res.status === 401) {
        navigate("/login", { replace: true });
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setPopup({
          isOpen: true,
          type: "error",
          title: "Xəta baş verdi",
          message: err?.detail || err?.error || "Məlumatlar saxlanılmadı.",
          confirmText: "Bağla",
          onConfirm: null,
        });
        return;
      }

      // 3. Uğurlu — state-i backend-dən refresh et
      setProfileImageFile(null);
      didLoad.current = false;
      await loadData();

      setPopup({
        isOpen: true,
        type: "success",
        title: "Uğurla saxlanıldı!",
        message: "Bütün dəyişikliklər tətbiq edildi.",
        confirmText: "Tamam",
        onConfirm: null,
      });
    } catch {
      setPopup({
        isOpen: true,
        type: "error",
        title: "Xəta",
        message: "Server ilə əlaqə qurula bilmədi.",
        confirmText: "Bağla",
        onConfirm: null,
      });
    } finally {
      setSaving(false);
    }
  };

  const profileUrl = userCode ? `/profile/${userCode}` : "#";
  const packageLabel =
    {
      standard: "Standard",
      premium: "Premium",
      pro: "Pro",
      business: "Business",
    }[packageType] || packageType;

  if (loading) {
    return (
      <div className="home-main-modern-split loading-state">
        <FaSpinner className="spin-icon" />
        <p>Məlumatlar yüklənir...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-main-modern-split loading-state">
        <p className="error-text">{error}</p>
        <button
          className="save-btn"
          onClick={() => {
            didLoad.current = false;
            loadData();
          }}
        >
          Yenidən cəhd et
        </button>
      </div>
    );
  }

  // ── Link paneli ───────────────────────────────────────────
  const renderLinkCategory = (cat) => {
    const catLinks = linksFor(cat.key);
    const catPlatforms = platformOptions[cat.key] || [];
    if (catPlatforms.length === 0) return null;

    return (
      <div className="link-category-block" key={cat.key}>
        <div className="link-category-header">
          <span className="link-category-title">{cat.label}</span>
          <span className="link-category-count">
            {catLinks.filter((l) => l.url).length} link
          </span>
        </div>

        <div className="links-list">
          {catLinks.length === 0 && (
            <div className="links-empty">Hələ link əlavə edilməyib.</div>
          )}

          {catLinks.map((link, localIdx) => (
            <div
              key={link.globalIdx}
              className={[
                "social-add-row",
                link.isNew ? "row-new" : "",
                link.isDirty && !link.isNew ? "row-dirty" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="row-top-mobile">
                <div className="order-num">{localIdx + 1}</div>
                <button
                  className="remove-link-btn"
                  onClick={() => confirmRemove(link.globalIdx)}
                >
                  <FaTrashAlt />
                </button>
              </div>

              <div className="social-select">
                <span className="select-icon">{link.icon}</span>
                <select
                  value={link.name}
                  onChange={(e) =>
                    handleLinkChange(link.globalIdx, "platform", e.target.value)
                  }
                >
                  {catPlatforms.map((opt) => (
                    <option key={opt.id} value={opt.name}>
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
                  handleLinkChange(link.globalIdx, "url", e.target.value)
                }
              />

              {link.isNew && <span className="new-badge">Yeni</span>}
              {link.isDirty && !link.isNew && (
                <span className="dirty-badge">●</span>
              )}
            </div>
          ))}
        </div>

        <button className="add-new-btn" onClick={() => addNewLink(cat.key)}>
          <FaPlus /> {cat.label} Əlavə Et
        </button>
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────
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

      {/* ── LEFT: FORM ── */}
      <div className="form-section">
        <div className="top-header">
          <div>
            <h2 className="page-title">İdarəetmə Sistemi</h2>
            <span className="badge premium">{packageLabel} Paket</span>
          </div>
        </div>

        <div className="modern-card form-card">
          {/* Row 1 */}
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
                <div className="val green">{totalViews}</div>
              </div>
              <div className="stat-box">
                <label>User Code</label>
                <div className="val code">{userCode || "—"}</div>
              </div>
            </div>
          </div>

          {/* Row 2 */}
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

          {/* About */}
          <div className="input-group full-width">
            <label>Haqqında məlumat</label>
            <textarea
              name="about"
              rows="3"
              value={formData.about}
              onChange={handleChange}
            />
          </div>

          {/* ── Link Tabs ── */}
          <div className="links-section">
            <div className="link-tabs">
              {CATEGORIES.map((cat) => {
                const count = links.filter(
                  (l) => l.category === cat.key && l.url && !l.isDeleted,
                ).length;
                return (
                  <button
                    key={cat.key}
                    className={`link-tab ${activeTab === cat.key ? "active" : ""}`}
                    onClick={() => setActiveTab(cat.key)}
                  >
                    {cat.label}
                    {count > 0 && <span className="tab-count">{count}</span>}
                  </button>
                );
              })}
            </div>

            {CATEGORIES.filter((c) => c.key === activeTab).map(
              renderLinkCategory,
            )}
          </div>
        </div>

        <div className="bottom-actions">
          <div className="status-badge">
            <FaCheckCircle />
            {hasUnsaved ? (
              <span style={{ color: "var(--badge-warning-text, #e1b12c)" }}>
                Saxlanılmamış dəyişikliklər var
              </span>
            ) : (
              "Məlumatlar işlək vəziyyətdədir"
            )}
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
            className={`save-btn ${hasUnsaved ? "save-btn--unsaved" : ""}`}
            disabled={saving}
            onClick={() =>
              setPopup({
                isOpen: true,
                type: "update",
                title: "Məlumat yadda saxlanılsın?",
                message:
                  "Bütün dəyişikliklər (yeni linklər, dəyişdirilmiş linklər, silinmiş linklər) tətbiq ediləcək.",
                confirmText: "Saxla",
                onConfirm: handleSave,
              })
            }
          >
            {saving ? <FaSpinner className="spin-icon-sm" /> : <FaSave />}
            {saving ? "Saxlanılır..." : "Yadda Saxla"}
          </button>
        </div>
      </div>

      {/* ── RIGHT: PHONE PREVIEW ── */}
      <div className="preview-section">
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

            {CATEGORIES.map((cat) => {
              const catLinks = links.filter(
                (l) => l.category === cat.key && l.url && !l.isDeleted,
              );
              if (catLinks.length === 0) return null;
              return (
                <div className="preview-link-group" key={cat.key}>
                  <h4 className="preview-group-title">{cat.label}</h4>
                  {catLinks.map((link, idx) => (
                    <div className="social-card" key={idx}>
                      <span style={{ color: phoneColor }}>{link.icon}</span>
                      <span>{link.url}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        <div className="theme-color-section">
          <label>Profil Rəngi / Tema Rəngi</label>
          <div className="color-palette">
            {COLORS.map((color, index) => (
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
