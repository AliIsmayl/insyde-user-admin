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

// ─── Trial Modal ──────────────────────────────────────────
function TrialModal({ onClose }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="trial-modal__overlay">
      <div className="trial-modal__panel">
        <button className="trial-modal__close" onClick={onClose} aria-label="Bağla">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="trial-modal__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>

        <h2 className="trial-modal__title">Siz sınaq versiyanı açdınız!</h2>
        <p className="trial-modal__subtitle">
          Sistemi kəşf edin — <strong>3 saat ərzində</strong> bütün imkanlara tam çıxışınız var.
        </p>

        <div className="trial-modal__info">
          <div className="trial-modal__info-item">
            <span className="trial-modal__info-dot" />
            <span>Profil məlumatlarınızı daxil edin, linklər əlavə edin, sistemin işləyişinə nəzər yetirin.</span>
          </div>
          <div className="trial-modal__info-item">
            <span className="trial-modal__info-dot" />
            <span>Məlumat panelinizi real vaxtda izləyin və kartınızın önizləməsini görün.</span>
          </div>
          <div className="trial-modal__info-item">
            <span className="trial-modal__info-dot" />
            <span><strong>Paketlər</strong> hissəsindən sizə uyğun paketi seçib sistemi daimi aktiv saxlaya bilərsiniz.</span>
          </div>
        </div>

        <button className="trial-modal__btn" onClick={onClose}>
          Kəşfə başla
        </button>
      </div>
    </div>
  );
}

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
  "#d3d3d3",
  "#5c6bc0",
  "#e74c3c",
  "#2980b9",
  "#87ceeb",
  "#27ae60",
  "#2ecc71",
  "#8e44ad",
  "#e91e8c",
  "#f1c40f",
  "#e67e22",
  "#d4a017",
];

const COLOR_ALLOWED_PACKAGES = ["premium", "pro" /*, "business" */];
const DEFAULT_COLOR = "#d4af37";

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
  const [cardStatus, setCardStatus] = useState("active");
  const [statusSms, setStatusSms] = useState("");
  const [showTrialModal, setShowTrialModal] = useState(false);

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
  const [hash_id, setHashId] = useState("");
  const [totalViews, setTotalViews] = useState(0);
  const [packageType, setPackageType] = useState("free");
  const [phoneTheme, setPhoneTheme] = useState("dark");
  const [phoneColor, setPhoneColor] = useState(DEFAULT_COLOR);

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

  const hasUnsaved = links.some((l) => l.isNew || l.isDirty || l.isDeleted);
  const isBlocked = cardStatus === "blocked";
  const canChangeColor = COLOR_ALLOWED_PACKAGES.includes(packageType);

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

      const cardSt = d.card?.status || "active";
      setCardStatus(cardSt);
      setStatusSms(d.card?.status_sms || "");

      const pkg = sub.version_type || sub.packet_type || "free";
      setPackageType(pkg);

      // Hər loginidə free hesab üçün trial modal göstər
      if (pkg === "free") {
        setShowTrialModal(true);
      }

      const allowColor = COLOR_ALLOWED_PACKAGES.includes(pkg);
      const backendColor = sys.color || DEFAULT_COLOR;
      setPhoneColor(allowColor ? backendColor : DEFAULT_COLOR);

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
      setHashId(info.hash_id || "");
      setTotalViews(info.look ?? 0);
      if (info.image) setProfileImage(info.image);
      if (sys.mode) setPhoneTheme(sys.mode);

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

  const handleRemoveLink = (globalIdx) => {
    setLinks((p) => {
      const link = p[globalIdx];
      if (link.isNew) return p.filter((_, i) => i !== globalIdx);
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

  const handleSave = useCallback(async () => {
    if (saving) return;
    if (!getToken()) {
      handleUnauthorized();
      return;
    }
    setSaving(true);

    try {
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

      const fd = new FormData();
      fd.append("name", formData.name);
      fd.append("email", formData.email);
      fd.append("work", formData.profession);
      fd.append("about", formData.about);
      [formData.skill1, formData.skill2, formData.skill3]
        .filter(Boolean)
        .forEach((s, i) => fd.append(`skills[${i}]`, s));

      const systemData = canChangeColor
        ? { color: phoneColor, mode: phoneTheme }
        : { mode: phoneTheme };
      fd.append("system", JSON.stringify(systemData));
      if (profileImageFile) fd.append("image", profileImageFile);

      const activeLinks = links.filter(
        (l) => !l.isDeleted && l.url.trim() !== "",
      );
      fd.append(
        "sosial_media",
        JSON.stringify(
          activeLinks.map((l) => ({
            platform_id: l.platform_id,
            url: l.url,
          })),
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
    canChangeColor,
  ]);

  const profileUrl =
    hash_id || CK.get("hash_id")
      ? `http://localhost:5174/person/${hash_id || CK.get("hash_id")}`
      : "#";
  const packageLabel =
    {
      free: "Free",
      standard: "Standard",
      premium: "Premium",
      pro: "Pro",
      // business: "Business",
    }[packageType] || packageType;

  if (loading)
    return (
      <div className="home-main-modern-split loading-state">
        <FaIcons.FaSpinner className="spin-icon" />
        <p>Məlumatlar yüklənir...</p>
      </div>
    );

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
      {showTrialModal && (
        <TrialModal onClose={() => setShowTrialModal(false)} />
      )}
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

        {/* ── Alt hərəkətlər ── */}
        <div className="bottom-actions">
          {/* Status badge — icon + başlıq + status_sms yan yana */}
          <div
            className={`status-badge ${
              isBlocked
                ? "status-badge--blocked"
                : hasUnsaved
                  ? "status-badge--unsaved"
                  : ""
            }`}
          >
            {isBlocked ? (
              <>
                <FaIcons.FaBan className="status-badge-icon" />
                <div className="status-badge-content">
                  <span className="status-badge-title">
                    Sizin hesab bloklanmışdır
                  </span>
                  {statusSms && (
                    <span className="status-badge-sms">{statusSms}</span>
                  )}
                </div>
              </>
            ) : hasUnsaved ? (
              <>
                <FaIcons.FaCheckCircle className="status-badge-icon" />
                <div className="status-badge-content">
                  <span className="status-badge-title">
                    Saxlanılmamış dəyişikliklər var
                  </span>
                </div>
              </>
            ) : packageType === "free" ? (
              <>
                <FaIcons.FaCheckCircle className="status-badge-icon" />
                <div className="status-badge-content">
                  <span className="status-badge-title">
                    3 saatlıq yoxlama hesabınız aktivdir
                  </span>
                </div>
              </>
            ) : (
              <>
                <FaIcons.FaCheckCircle className="status-badge-icon" />
                <div className="status-badge-content">
                  <span className="status-badge-title">
                    Məlumatlar işlək vəziyyətdədir
                  </span>
                </div>
              </>
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
            disabled={saving || isBlocked}
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

        {/* Rəng paneli: yalnız premium/pro/business */}
        {canChangeColor ? (
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
        ) : (
          <div className="theme-color-section theme-color-section--locked">
            <FaIcons.FaLock className="locked-icon" />
            <p className="locked-text">
              Rəng dəyişdirmə digər versiyalarda mövcuddur.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
