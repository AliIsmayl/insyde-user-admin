import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as FaIcons from "react-icons/fa";
import * as MdIcons from "react-icons/md";
import * as BsIcons from "react-icons/bs";
import * as AiIcons from "react-icons/ai";
import * as BiIcons from "react-icons/bi";
import * as RiIcons from "react-icons/ri";
import "./HomeMain.scss";
import Popup from "../../Popup/Popup";
import { API_BASE, authFetch, getToken, CK } from "../../../Utils/authUtils";

const URL_PROFILE = `${API_BASE}/api/v1/profile/me/`;
const URL_PLATFORMS = `${API_BASE}/api/v1/platforms/`;
const URL_DELETE_LINK = (id) => `${API_BASE}/api/v1/social-link/${id}/delete/`;
const URL_CLICK_LINK = (id) => `${API_BASE}/api/v1/social-link/${id}/click/`;

const CATEGORIES = [
  { key: "social", label: "Sosial Şəbəkələr" },
  { key: "contact", label: "Əlaqə Məlumatları" },
  { key: "additional", label: "Əlavə Linklər" },
];

const COLORS = [
  "#d3d3d3", // Ağ
  "#1a1a1a", // Qara
  "#e74c3c", // Qırmızı
  "#2980b9", // Mavi
  "#87ceeb", // Göy (Sky Blue)
  "#27ae60", // Yaşıl
  "#2ecc71", // Açıq Yaşıl
  "#8e44ad", // Bənövşəyi
  "#e91e8c", // Şəhrayı
  "#f1c40f", // Sarı
  "#e67e22", // Narıncı
  "#d4a017", // Qızılı
];

function getIcon(icon_code) {
  if (!icon_code) return <FaIcons.FaLink />;
  const libraries = {
    Fa: FaIcons,
    Md: MdIcons,
    Bs: BsIcons,
    Ai: AiIcons,
    Bi: BiIcons,
    Ri: RiIcons,
  };
  const prefix = icon_code.slice(0, 2);
  const lib = libraries[prefix];
  if (!lib) return <FaIcons.FaLink />;
  const C = lib[icon_code];
  return C ? <C /> : <FaIcons.FaLink />;
}

function normalizeResponse(raw) {
  if (raw?.status === "success" && raw?.data) return raw.data;
  return raw;
}

function parseSkills(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === "string") {
    const t = raw.trim();
    if (t.startsWith("[")) {
      try {
        const p = JSON.parse(t);
        if (Array.isArray(p)) return p.map(String).filter(Boolean);
      } catch {}
      return t
        .replace(/^\[|\]$/g, "")
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    }
    return t
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export default function HomeMain() {
  const navigate = useNavigate();
  const isNavigating = useRef(false);
  const abortRef = useRef(null);

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
  const [packageType, setPackageType] = useState("free");
  const [phoneTheme, setPhoneTheme] = useState("dark");
  const [phoneColor, setPhoneColor] = useState("#ff8b94");

  const [platformOptions, setPlatformOptions] = useState({
    social: [],
    contact: [],
    additional: [],
  });
  const platformOptionsRef = useRef({
    social: [],
    contact: [],
    additional: [],
  });
  const [links, setLinks] = useState([]);

  // isDeleted olanlar UI-da görsənmir amma state-də qalır → Yadda Saxla-da DELETE olunur
  const hasUnsaved = links.some((l) => l.isNew || l.isDirty || l.isDeleted);
  const closePopup = () => setPopup((p) => ({ ...p, isOpen: false }));

  const handleUnauthorized = useCallback(() => {
    if (isNavigating.current) return;
    isNavigating.current = true;
    abortRef.current?.abort();
    navigate("/login", { replace: true });
  }, [navigate]);

  const parseLink = useCallback((l) => {
    const allPlatforms = [
      ...platformOptionsRef.current.social,
      ...platformOptionsRef.current.contact,
      ...platformOptionsRef.current.additional,
    ];
    const matched =
      allPlatforms.find((p) => p.id === l.platform_id) ||
      allPlatforms.find((p) => p.name?.toLowerCase() === l.name?.toLowerCase());

    const icon_code = matched?.icon_code || l.icon || l.icon_code || "";
    const name = l.name || matched?.name || "";
    const category =
      matched?.category || l.category || l.all_category || "social";

    return {
      id: l.id ?? null,
      platform_id: l.platform_id ?? matched?.id ?? null,
      category,
      url: l.link ?? l.url ?? "",
      name,
      icon_code,
      icon: getIcon(icon_code),
      clicks: l.clicks ?? 0,
      isNew: false,
      isDirty: false,
      isDeleted: false,
    };
  }, []);

  const applyProfileData = useCallback(
    (raw) => {
      const d = normalizeResponse(raw);
      if (!d) return;

      const info = d.user_info || {};
      const sys = d.system || {};
      const sub = d.subscription || {};
      const skills = parseSkills(info.skills);

      setFormData({
        name: info.name || "",
        email: info.email || "",
        profession: info.work || "",
        skill1: skills[0] || "",
        skill2: skills[1] || "",
        skill3: skills[2] || "",
        about: info.about || "",
      });

      setUserCode(info.user_code || CK.get("user_code") || "");
      setTotalViews(info.look ?? 0);
      if (info.image) setProfileImage(info.image);
      if (sys.color) setPhoneColor(sys.color);
      if (sys.mode) setPhoneTheme(sys.mode);
      setPackageType(sub.version_type || sub.packet_type || "free");

      const rawLinks = Array.isArray(d.link_side) ? d.link_side : [];
      setLinks(rawLinks.map((l) => parseLink(l)));
    },
    [parseLink],
  );

  const loadData = useCallback(
    async (signal) => {
      setLoading(true);
      setError("");
      if (!getToken()) {
        handleUnauthorized();
        return;
      }

      try {
        const [rProfile, rPlatforms] = await Promise.all([
          authFetch(URL_PROFILE, { signal }, navigate).catch(() => null),
          fetch(URL_PLATFORMS, { signal }).catch(() => null),
        ]);

        if (signal.aborted) return;
        if (!rProfile) {
          handleUnauthorized();
          return;
        }

        if (rPlatforms?.ok) {
          const data = await rPlatforms.json().catch(() => []);
          const list = Array.isArray(data) ? data : data?.results || [];
          const grouped = { social: [], contact: [], additional: [] };
          list.forEach((p) => {
            const cat = p.category?.toLowerCase().trim();
            if (grouped[cat] !== undefined) {
              grouped[cat].push({
                id: p.id,
                name: p.name,
                icon_code: p.icon_code || p.icon || "",
                icon: getIcon(p.icon_code || p.icon || ""),
                category: cat,
              });
            }
          });
          platformOptionsRef.current = grouped;
          setPlatformOptions({ ...grouped });
        }

        if (!rProfile.ok) {
          const body = await rProfile.json().catch(() => ({}));
          setError(body?.detail || `Server xətası: ${rProfile.status}`);
          return;
        }

        const d = await rProfile.json();
        if (!signal.aborted) applyProfileData(d);
      } catch (err) {
        if (err?.name === "AbortError" || signal?.aborted) return;
        setError("Server ilə əlaqə kəsildi.");
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [navigate, handleUnauthorized, applyProfileData],
  );

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;
    loadData(controller.signal);
    return () => {
      controller.abort();
    };
  }, [loadData]);

  // isDeleted olanlar UI-da göstərilmir
  const linksFor = (cat) =>
    links
      .map((l, i) => ({ ...l, globalIdx: i }))
      .filter((l) => l.category === cat && !l.isDeleted);

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
    if (!platforms.length) return;
    const first = platforms[0];
    setLinks((p) => [
      ...p,
      {
        id: null,
        platform_id: first.id,
        category: cat,
        url: "",
        name: first.name,
        icon_code: first.icon_code,
        icon: first.icon,
        clicks: 0,
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
        const sel = (platformOptions[link.category] || []).find(
          (o) => o.name === value,
        );
        if (!sel) return p;
        link.name = sel.name;
        link.icon_code = sel.icon_code;
        link.icon = sel.icon;
        link.platform_id = sel.id;
      } else {
        link.url = value;
      }
      u[globalIdx] = link;
      return u;
    });
  };

  // ✅ Zibil qutusuna bassın → dərhal UI-dan yox olur, state-də isDeleted: true qalır
  // Yadda Saxla basılanda backend-ə DELETE göndərilir
  const handleRemoveLink = (globalIdx) => {
    setLinks((p) => {
      const link = p[globalIdx];
      // Heç saxlanılmamış yeni link → state-dən tamamilə çıxar
      if (link.isNew) return p.filter((_, i) => i !== globalIdx);
      // Köhnə link → işarələ, Yadda Saxla-da silinəcək
      return p.map((l, i) => (i === globalIdx ? { ...l, isDeleted: true } : l));
    });
  };

  const handleLinkClick = useCallback(async (linkId) => {
    if (!linkId) return;
    try {
      await fetch(URL_CLICK_LINK(linkId), { method: "POST" });
    } catch {}
  }, []);

  const togglePhoneTheme = () =>
    setPhoneTheme((p) => (p === "dark" ? "light" : "dark"));

  // ✅ Yadda Saxla:
  //   1. isDeleted && id olan linkləri → DELETE /social-link/{id}/delete/
  //   2. Aktiv linkləri               → PATCH /profile/me/
  const handleSave = useCallback(async () => {
    if (saving) return;
    if (!getToken()) {
      handleUnauthorized();
      return;
    }
    setSaving(true);

    try {
      // ── Addım 1: Silinəcək köhnə linkləri backend-dən sil ──
      const deletedLinks = links.filter((l) => l.isDeleted && l.id && !l.isNew);
      if (deletedLinks.length > 0) {
        await Promise.all(
          deletedLinks.map((l) =>
            authFetch(
              URL_DELETE_LINK(l.id),
              { method: "DELETE" },
              navigate,
            ).catch(() => null),
          ),
        );
      }

      // ── Addım 2: Profil + aktiv linklər PATCH ──
      const fd = new FormData();
      fd.append("name", formData.name);
      fd.append("email", formData.email);
      fd.append("work", formData.profession);
      fd.append("about", formData.about);
      [formData.skill1, formData.skill2, formData.skill3]
        .filter(Boolean)
        .forEach((s, i) => fd.append(`skills[${i}]`, s));
      fd.append(
        "system",
        JSON.stringify({ color: phoneColor, mode: phoneTheme }),
      );
      if (profileImageFile) fd.append("image", profileImageFile);

      const activeLinks = links.filter(
        (l) => !l.isDeleted && l.url.trim() !== "",
      );
      fd.append(
        "sosial_media",
        JSON.stringify(
          activeLinks.map((l) => ({ platform_id: l.platform_id, url: l.url })),
        ),
      );

      const res = await authFetch(
        URL_PROFILE,
        { method: "PATCH", body: fd },
        navigate,
      );

      if (!res?.ok) {
        const err = await res?.json().catch(() => ({}));
        setPopup({
          isOpen: true,
          type: "error",
          title: "Xəta",
          message: err?.detail || err?.error || "Məlumatlar saxlanılmadı.",
          confirmText: "Bağla",
          onConfirm: null,
        });
        return;
      }

      // ── Addım 3: Cavabı state-ə tətbiq et ──
      const fresh = await res.json().catch(() => null);
      if (fresh) applyProfileData(fresh);

      setProfileImageFile(null);
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
  }, [
    saving,
    navigate,
    handleUnauthorized,
    applyProfileData,
    formData,
    links,
    profileImageFile,
    phoneColor,
    phoneTheme,
  ]);

  const profileUrl = userCode ? `/profile/${userCode}` : "#";
  const packageLabel =
    {
      free: "Free",
      standard: "Standard",
      premium: "Premium",
      pro: "Pro",
      business: "Business",
    }[packageType] || packageType;

  // ── Loading
  if (loading)
    return (
      <div className="home-main-modern-split loading-state">
        <FaIcons.FaSpinner className="spin-icon" />
        <p>Məlumatlar yüklənir...</p>
      </div>
    );

  // ── Error
  if (error)
    return (
      <div className="home-main-modern-split loading-state">
        <p className="error-text">{error}</p>
        <button
          className="save-btn"
          onClick={() => {
            isNavigating.current = false;
            const c = new AbortController();
            abortRef.current = c;
            loadData(c.signal);
          }}
        >
          Yenidən cəhd et
        </button>
      </div>
    );

  // ── Link kateqoriya render
  const renderLinkCategory = (cat) => {
    const catLinks = linksFor(cat.key);
    const catPlatforms = platformOptions[cat.key] || [];

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
                {/* ✅ Popup yoxdur — birbaşa handleRemoveLink çağırılır */}
                <button
                  className="remove-link-btn"
                  onClick={() => handleRemoveLink(link.globalIdx)}
                  title="Linki sil"
                >
                  <FaIcons.FaTrashAlt />
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

              {link.clicks > 0 && (
                <span className="click-count">
                  <FaIcons.FaMousePointer /> {link.clicks}
                </span>
              )}
              {link.isNew && <span className="new-badge">Yeni</span>}
              {link.isDirty && !link.isNew && (
                <span className="dirty-badge">●</span>
              )}
            </div>
          ))}
        </div>

        <button
          className="add-new-btn"
          onClick={() => addNewLink(cat.key)}
          disabled={!catPlatforms.length}
          title={!catPlatforms.length ? "Platformlar yüklənir..." : ""}
        >
          <FaIcons.FaPlus /> {cat.label} Əlavə Et
        </button>
      </div>
    );
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
          const fn = popup.onConfirm;
          closePopup();
          if (fn) fn();
        }}
        onCancel={closePopup}
      />

      {/* ══════════════════════════════
          LEFT — FORM
      ══════════════════════════════ */}
      <div className="form-section">
        <div className="top-header">
          <div>
            <h2 className="page-title">İdarəetmə Sistemi</h2>
            <span className="badge premium">{packageLabel} Paket</span>
          </div>
        </div>

        <div className="modern-card form-card">
          {/* Şəkil + Ad + Stats */}
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
                    <FaIcons.FaCloudUploadAlt className="upload-icon" />
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

          {/* Peşə + Bacarıqlar */}
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

          {/* Haqqında */}
          <div className="input-group full-width">
            <label>Haqqında məlumat</label>
            <textarea
              name="about"
              rows="3"
              value={formData.about}
              onChange={handleChange}
            />
          </div>

          {/* Linklər */}
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

        {/* Alt hərəkətlər */}
        <div className="bottom-actions">
          <div className="status-badge">
            <FaIcons.FaCheckCircle />
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
            <FaIcons.FaExternalLinkAlt /> Səhifəmə Keçid
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
                  "Bütün dəyişikliklər (yeni linklər, silinənlər, redaktələr) tətbiq ediləcək.",
                confirmText: "Saxla",
                onConfirm: handleSave,
              })
            }
          >
            {saving ? (
              <>
                <FaIcons.FaSpinner className="spin-icon-sm" /> Saxlanılır...
              </>
            ) : (
              <>
                <FaIcons.FaSave /> Yadda Saxla
              </>
            )}
          </button>
        </div>
      </div>

      {/* ══════════════════════════════
          RIGHT — PHONE PREVIEW
      ══════════════════════════════ */}
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
              <FaIcons.FaSun /> <span>Light</span>
            </span>
            <span
              className={`toggle-label right ${phoneTheme === "dark" ? "active" : ""}`}
            >
              <FaIcons.FaMoon /> <span>Dark</span>
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
              if (!catLinks.length) return null;
              return (
                <div className="preview-link-group" key={cat.key}>
                  <h4 className="preview-group-title">{cat.label}</h4>
                  {catLinks.map((link, idx) => (
                    <div
                      className="social-card"
                      key={idx}
                      onClick={() => handleLinkClick(link.id)}
                    >
                      <span style={{ color: phoneColor }}>{link.icon}</span>
                      <span>
                        {link.name} — {link.url}
                      </span>
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
            {COLORS.map((color, i) => (
              <div
                key={i}
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
