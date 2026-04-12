import React, { useState, useEffect, useRef } from "react";
import { FiCheck, FiX, FiInfo, FiChevronRight, FiChevronLeft } from "react-icons/fi";
import { API_BASE, authFetch } from "../../../Utils/authUtils";
import "./PackageMain.scss";

// ─── Sabitlər ─────────────────────────────────────────────

// true = yalnız müddət seçimi + ödəniş (paket/kart addımları olmur)
const MANUAL_MODE = true;

// Fallback: API cavab verməsə bu data istifadə olunur
const FALLBACK_PACKAGES = [
  { key: "basic", name: "Sadə", cardPrice: "12.90₼", monthlyRate: 1.5, color: "#6b7280", badge: null       },
  { key: "pro",   name: "Pro",  cardPrice: "27.90₼", monthlyRate: 2.0, color: "#3b82f6", badge: "Populyar" },
  // { key: "premium", name: "Premium", cardPrice: "36.90₼", monthlyRate: 2.0, color: "#f59e0b", badge: "Tam" },
  // { key: "business", name: "Business", cardPrice: "—", monthlyRate: 0, color: "#10b981", badge: null },
];

// Hələlik yalnız sadə və pro görünür
const ALLOWED_PLANS = ["basic", "pro"];
// const ALLOWED_PLANS = ["basic", "pro", "premium"]; // premium hazır olanda

// API-dan gələn plan obyektini UI strukturuna çevir
const PKG_COLOR_MAP = { basic: "#6b7280", pro: "#3b82f6", premium: "#f59e0b" };
const PKG_BADGE_MAP = { basic: null, pro: "Populyar", premium: "Tam" };

// Backend-dən gələn features massivini normallaşdır
// [ "Feature adı", ... ]  yaxud  [ { name: "..." }, ... ]  yaxud
// [ { feature: "...", is_available: true }, ... ]
function parseFeatures(raw) {
  if (!raw || !Array.isArray(raw) || raw.length === 0) return null;
  return raw.map(f => {
    if (typeof f === "string") return { name: f, available: true };
    return {
      name:      f.name || f.feature || f.title || f.label || String(f),
      available: f.is_available ?? f.available ?? f.included ?? true,
    };
  });
}

function mapPlan(p, idx) {
  // Try explicit key fields first, then infer from name, then fallback to index
  const rawKey = p.key || p.slug || p.package_type || p.plan_type || "";
  let key = rawKey.toLowerCase();

  if (!key) {
    const nm = (p.name || p.display_name || "").toLowerCase();
    if      (nm.includes("business") || nm.includes("biznes"))                                          key = "business";
    else if (nm.includes("premium") || nm.includes("elit"))                                             key = "premium";
    else if (nm.includes("pro"))                                                                        key = "pro";
    else if (nm.includes("standart") || nm.includes("standard") || nm.includes("basic")
          || nm.includes("sadə")     || nm.includes("sade"))                                           key = "basic";
    else                                                                                                key = `plan-${idx}`;
  }

  return {
    key,
    id:          p.id ?? null,
    name:        p.name || p.display_name || key,
    cardPrice:   p.card_price         ? `${parseFloat(p.card_price).toFixed(2)}₼`
               : p.price              ? `${parseFloat(p.price).toFixed(2)}₼`
               : "—",
    monthlyRate: +(Math.round((
                   p.monthly_rate       ? parseFloat(p.monthly_rate)
                 : p.monthly_price      ? parseFloat(p.monthly_price)
                 : p.subscription_price ? parseFloat(p.subscription_price)
                 : 0) * 100) / 100).toFixed(2),
    color:       p.color   || PKG_COLOR_MAP[key] || "#6b7280",
    badge:       p.badge   || PKG_BADGE_MAP[key] || null,
    // Backend features (null = yoxdur, hardcoded istifadə et)
    features:    parseFeatures(p.features || p.plan_features || p.feature_list),
  };
}

// Endirim dərəcəsi: 1 aylıq → 0%, 6 aylıq → 8.5% off, 12 aylıq → 8.5% off
// (eyni % → məbləğ fərqi artır: 6 ayda 2₼, 12 ayda 4₼ qənaət)
const BILLING_OPTIONS = [
  { key: "monthly",  label: "1 Aylıq",  months: 1,  discountRate: 0      },
  { key: "biannual", label: "6 Aylıq",  months: 6,  discountRate: 0.0855 },
  { key: "annual",   label: "12 Aylıq", months: 12, discountRate: 0.0855 },
];

// Endirimli cəm qiyməti hesabla
function calcTotal(monthlyRate, months, discountRate) {
  const raw = monthlyRate * months;
  return +(raw * (1 - discountRate)).toFixed(2);
}
function calcRaw(monthlyRate, months) {
  return +(monthlyRate * months).toFixed(2);
}

const FEATURES = [
  { name: "Sosial şəbəkə",      basic: true,  pro: true,  premium: true  },
  { name: "Əlaqə məlumatları",  basic: true,  pro: true,  premium: true  },
  { name: "Portfel / Kataloq",  basic: true,  pro: true,  premium: true  },
  { name: "NFC + QR sistem",    basic: true,  pro: true,  premium: true  },
  { name: "Fiziki kart",        basic: true,  pro: true,  premium: true  },
  { name: "Sistem analitikası", basic: false, pro: true,  premium: true  },
  { name: "Xüsusi dizayn",     basic: false, pro: true,  premium: true  },
  { name: "Qablaşma",          basic: false, pro: true,  premium: true  },
  { name: "Digital kart",      basic: false, pro: false, premium: true  },
];

const STEP_LABELS_FULL  = ["Paket", "Müddət", "Kart", "Ödəniş"];
const STEP_LABELS_BASIC = ["Paket", "Müddət", "Ödəniş"];

// ─── QR Placeholder ───────────────────────────────────────
function QrPlaceholder({ color = "currentColor" }) {
  const cell = 8, gap = 2;
  const S = 7 * (cell + gap) - gap;
  const map = [
    [1,1,1,1,1,1,1],[1,0,0,0,0,0,1],[1,0,1,1,1,0,1],
    [1,0,1,0,1,0,1],[1,0,1,1,1,0,1],[1,0,0,0,0,0,1],[1,1,1,1,1,1,1],
  ];
  const inner = [[2,2],[2,4],[3,3],[4,2],[4,4],[5,3],[3,5],[5,5],[2,6],[6,2],[6,4]];
  return (
    <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
      {map.map((row, r) => row.map((on, c) => on ? (
        <rect key={`f-${r}-${c}`} x={c*(cell+gap)} y={r*(cell+gap)} width={cell} height={cell} rx={1} fill={color} />
      ) : null))}
      {inner.map(([r, c], i) => (
        <rect key={`d-${i}`} x={c*(cell+gap)} y={r*(cell+gap)} width={cell} height={cell} rx={1} fill={color} opacity={0.7} />
      ))}
    </svg>
  );
}

// ─── Kart Preview ─────────────────────────────────────────
function CardPreview({ theme, logo, name, title, flipped, onFlip }) {
  const isDark = theme !== "light";
  const gold   = isDark ? "#c9a84c" : "#b8942a";
  const bg     = isDark ? "#0b0b0b" : "#f5f2ec";
  const text2  = isDark ? "rgba(255,255,255,0.45)" : "rgba(17,17,17,0.5)";
  const wmClr  = isDark ? "rgba(201,168,76,0.07)"  : "rgba(184,148,42,0.09)";

  return (
    <div className={`pkg-scene ${flipped ? "is-flipped" : ""}`} onClick={onFlip}>
      <div className="pkg-card" style={{ "--card-bg": bg, "--card-gold": gold, "--card-text2": text2, "--card-wm": wmClr }}>

        {/* ── ÖN ÜZ ──────────────────────────── */}
        <div className="pkg-face pkg-front">
          {/* yuxarı sətir */}
          <div className="pkg-front-topbar">
            <span className="pkg-tagline">İlk təəssürat önəmlidir</span>
            <span className="pkg-site">İnsyde.info</span>
          </div>
          {/* böyük brand sözü */}
          <div className="pkg-brand-word">Insyde</div>
        </div>

        {/* ── ARXA ÜZ ────────────────────────── */}
        <div className="pkg-face pkg-back">
          {/* Watermark */}
          <div className="pkg-wm" aria-hidden>Insyde</div>

          {/* Sol yuxarı: Logo */}
          <div className="pkg-back-logo">
            {logo
              ? <img src={logo} alt="logo" className="pkg-logo-img" />
              : <span className="pkg-logo-placeholder">LOGO</span>}
          </div>

          {/* Sağ yuxarı: QR */}
          <div className="pkg-qr-wrap">
            <QrPlaceholder color={gold} />
          </div>

          {/* Sol aşağı: Ad + Vəzifə */}
          <div className="pkg-back-info">
            <span className="pkg-back-name">{name  || "Ad Soyad"}</span>
            <span className="pkg-back-title">{title || "Peşə / Vəzifə"}</span>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Basic Kart Preview (screenshota uyğun) ───────────────
function BasicCardPreview() {
  const gold = "#c9a84c";
  return (
    <div className="pkg-scene">
      <div className="pkg-card" style={{ "--card-bg": "#0b0b0b", "--card-gold": gold }}>
        <div className="pkg-face pkg-front">
          <div className="pkg-front-topbar">
            <span className="pkg-tagline">İlk təəssürat önəmlidir</span>
            <span className="pkg-site">İnsyde.info</span>
          </div>
          <div className="pkg-brand-word">Insyde</div>
        </div>
      </div>
    </div>
  );
}

// ─── Step Indicator ───────────────────────────────────────
function StepIndicator({ current, labels }) {
  return (
    <div className="step-indicator">
      {labels.map((label, i) => {
        const num = i + 1;
        const done = num < current;
        const active = num === current;
        return (
          <React.Fragment key={num}>
            <div className={`step-item ${active ? "active" : ""} ${done ? "done" : ""}`}>
              <div className="step-circle">
                {done ? <FiCheck /> : num}
              </div>
              <span className="step-label">{label}</span>
            </div>
            {i < labels.length - 1 && (
              <div className={`step-line ${done ? "done" : ""}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Ana Komponent ────────────────────────────────────────
function PackageMain() {
  const fileRef = useRef(null);

  const [step,            setStep]           = useState(MANUAL_MODE ? 2 : 1);
  const [selectedPkg,     setSelectedPkg]    = useState(null);
  const [selectedBilling, setSelectedBilling]= useState("monthly");
  const [cardTheme,       setCardTheme]      = useState("dark");
  const [cardLogo,        setCardLogo]       = useState(null);
  const [cardLogoFile,    setCardLogoFile]   = useState(null);
  const [cardName,        setCardName]       = useState("");
  const [cardTitle,       setCardTitle]      = useState("");
  const [flipped,         setFlipped]        = useState(false);

  const [packages,        setPackages]       = useState(FALLBACK_PACKAGES.filter(p => ALLOWED_PLANS.includes(p.key)));
  // MANUAL_MODE üçün: istifadəçinin mövcud paketinin tam məlumatı (API-dan)
  const [currentSubData,  setCurrentSubData] = useState(null);
  const [currentSub,      setCurrentSub]     = useState(null);
  const [loading,         setLoading]        = useState(true);
  const [submitting,      setSubmitting]     = useState(false);
  const [success,         setSuccess]        = useState(false);
  const [error,           setError]          = useState("");

  // Paralel: planları + profil məlumatlarını yüklə
  useEffect(() => {
    const plansReq   = authFetch(`${API_BASE}/api/plans/`);
    const profileReq = authFetch(`${API_BASE}/api/v1/profile/me/`);

    Promise.allSettled([plansReq, profileReq]).then(async ([plansRes, profileRes]) => {
      let allMappedPlans = null; // bütün planlar (filtersiz), MANUAL_MODE üçün lazım

      // ── Planlar ──────────────────────────────────────
      if (plansRes.status === "fulfilled" && plansRes.value?.ok) {
        try {
          const json = await plansRes.value.json();
          const arr = Array.isArray(json)
            ? json
            : Array.isArray(json.results)
              ? json.results
              : Array.isArray(json.plans)
                ? json.plans
                : null;
          if (arr && arr.length > 0) {
            // Bütün planları map et (filtersiz saxla — MANUAL_MODE üçün lazım)
            allMappedPlans = arr.map((p, i) => mapPlan(p, i));

            const PLAN_ORDER = { basic: 0, pro: 1, premium: 2 };
            const filtered = allMappedPlans
              .filter(p => ALLOWED_PLANS.includes(p.key));
            filtered.sort((a, b) => (PLAN_ORDER[a.key] ?? 99) - (PLAN_ORDER[b.key] ?? 99));
            setPackages(filtered);
          }
        } catch { /* fallback-i saxla */ }
      }

      // ── Profil ───────────────────────────────────────
      let detectedSubKey = null;
      if (profileRes.status === "fulfilled" && profileRes.value?.ok) {
        try {
          const data = await profileRes.value.json();
          const d    = data?.data || data;
          const info = d?.user_info || {};
          setCardName(info.name || "");
          setCardTitle(info.work || "");
          const sub = d?.subscription || {};
          detectedSubKey = (sub.version_type || sub.packet_type || "free").toLowerCase();
          setCurrentSub(detectedSubKey);
        } catch { /* ignore */ }
      }

      // ── MANUAL_MODE: mövcud paketi avtomatik seç ─────
      // Free istifadəçi üçün paket seçim addımını göstər (step=1)
      // Ödənişli istifadəçi üçün yalnız müddət+ödəniş (step=2)
      if (MANUAL_MODE) {
        if (!detectedSubKey || detectedSubKey === "free") {
          // Free: paket seçim addımına qayıt
          setStep(1);
        } else {
          const source = allMappedPlans || FALLBACK_PACKAGES;
          const found  = source.find(p => p.key === detectedSubKey)
                      || FALLBACK_PACKAGES.find(p => p.key === detectedSubKey);
          if (found) setCurrentSubData(found);
          setSelectedPkg(detectedSubKey);
        }
      }
    }).finally(() => setLoading(false));
  }, []);

  // ── Hesablama ─────────────────────────────────────────
  const isBasic    = selectedPkg === "basic";
  const isFreeUser = !currentSub || currentSub === "free";
  // MANUAL_MODE + ödənişli user: yalnız müddət+ödəniş göstər
  // MANUAL_MODE + free user (və ya normal mode): bütün addımları göstər
  const effectiveManual = MANUAL_MODE && !isFreeUser;
  const stepLabels = effectiveManual
    ? ["Müddət", "Ödəniş"]
    : (isBasic ? STEP_LABELS_BASIC : STEP_LABELS_FULL);
  const uiStep = effectiveManual
    ? (step === 4 ? 2 : 1)
    : (isBasic && step === 4 ? 3 : step);

  // MANUAL_MODE-da: paketlər siyahısından tap, yoxdursa currentSubData (backend-dən) istifadə et
  const pkgData = MANUAL_MODE
    ? (packages.find(p => p.key === selectedPkg) || currentSubData)
    : packages.find(p => p.key === selectedPkg);

  const billData    = BILLING_OPTIONS.find(b => b.key === selectedBilling);
  const rawPrice    = pkgData && billData ? calcRaw(pkgData.monthlyRate, billData.months)                        : 0;
  const totalPrice  = pkgData && billData ? calcTotal(pkgData.monthlyRate, billData.months, billData.discountRate) : 0;
  const savedAmount = +(rawPrice - totalPrice).toFixed(2);

  // ── Logo yüklə ────────────────────────────────────────
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCardLogoFile(file);
    const reader = new FileReader();
    reader.onload = ev => setCardLogo(ev.target.result);
    reader.readAsDataURL(file);
  };

  // ── Ödəniş ────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const form = new FormData();
      form.append("package_type",    selectedPkg);
      form.append("plan_id",         pkgData?.id ?? "");
      form.append("billing_period",  selectedBilling);
      form.append("months",          billData?.months ?? 1);
      form.append("card_theme",      cardTheme);
      form.append("card_name",       cardName);
      form.append("card_title",      cardTitle);
      if (cardLogoFile) form.append("card_logo", cardLogoFile);

      const res = await authFetch(`${API_BASE}/api/v1/subscription/purchase/`, {
        method: "POST",
        body: form,
      });

      if (!res) { setError("Sessiya bitib."); return; }

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(body?.detail || body?.error || `Xəta: ${res.status}`);
        return;
      }

      // Ödəniş URL-i varsa (payment gateway)
      if (body?.payment_url) {
        window.location.href = body.payment_url;
        return;
      }

      setSuccess(true);
    } catch {
      setError("Server ilə əlaqə kəsildi.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Uğur ekranı ───────────────────────────────────────
  if (success) {
    return (
      <div className="pkg-success-screen">
        <div className="pkg-success-icon">✓</div>
        <h2>Ödəniş tamamlandı!</h2>
        <p>
          {pkgData?.name && <strong>{pkgData.name}</strong>}{pkgData?.name ? " paketi" : "Paket"} uğurla aktivləşdirildi.
        </p>
        <button className="pkg-nav-btn primary" onClick={() => { setSuccess(false); setStep(1); setSelectedPkg(null); }}>
          Paketlərə qayıt
        </button>
      </div>
    );
  }

  // ── Yüklənir ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="pkg-loading">
        <div className="pkg-spinner" />
      </div>
    );
  }

  return (
    <div className="package-main-modern">
      {/* BAŞLIQ */}
      <div className="pkg-top-header">
        <div>
          <h2 className="pkg-page-title">Ödəniş Planı</h2>
          <p className="pkg-page-subtitle">
            Ehtiyaclarınıza uyğun paketi seçin
          </p>
        </div>
      </div>

      {/* ADDIM İNDİKATORU */}
      <StepIndicator current={uiStep} labels={stepLabels} />

      {/* ══════════ ADDIM 1: PAKET SEÇ ══════════ */}
      {(!MANUAL_MODE || isFreeUser) && step === 1 && (
        <div className="pkg-step-content">
          <h3 className="pkg-step-title">Paket seçin</h3>

          <div className="pkg-cards-grid">
            {packages.map(pkg => {
              const isCurrent = currentSub === pkg.key;
              const isSelected = selectedPkg === pkg.key;
              return (
                <div
                  key={pkg.key}
                  className={`pkg-option-card ${isSelected ? "selected" : ""} ${isCurrent ? "is-current" : ""}`}
                  style={{
                    "--pkg-color": pkg.color,
                    "--pkg-glow": `${pkg.color}30`,
                  }}
                  onClick={() => setSelectedPkg(pkg.key)}
                >
                  {pkg.badge && <span className="pkg-badge" style={{ background: pkg.color }}>{pkg.badge}</span>}
                  {isCurrent && <span className="pkg-current-badge">Hazırkı Paket</span>}

                  <div className="pkg-card-top">
                    <h3 className="pkg-card-name" style={{ color: pkg.color }}>{pkg.name}</h3>
                    <div className="pkg-card-price">{pkg.cardPrice}</div>
                    <div className="pkg-card-rate">{pkg.monthlyRate.toFixed(2)}₼ / ay</div>
                  </div>

                  <div className="pkg-features-list">
                    {(pkg.features
                      // Backend-dən gəlirsə → birbaşa göstər
                      ? pkg.features
                      // Gəlmirsə → hardcoded FEATURES-dən bu plana uyğunu seç
                      : FEATURES.map(f => ({ name: f.name, available: f[pkg.key] ?? true }))
                    ).map((feat, fi) => (
                      <div key={fi} className={`pkg-feat-row ${!feat.available ? "unavailable" : ""}`}>
                        {feat.available
                          ? <FiCheck className="feat-icon check" />
                          : <FiX    className="feat-icon cross" />}
                        <span>{feat.name}</span>
                      </div>
                    ))}
                  </div>

                  <div className={`pkg-select-indicator ${isSelected ? "on" : ""}`}>
                    {isSelected ? <FiCheck /> : null}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pkg-nav-row">
            <span />
            <button
              className="pkg-nav-btn primary"
              disabled={!selectedPkg}
              onClick={() => setStep(2)}
            >
              Təsdiq et <FiChevronRight />
            </button>
          </div>
        </div>
      )}

      {/* ══════════ ADDIM 2: MÜDDƏT SEÇ ══════════ */}
      {step === 2 && (
        <div className="pkg-step-content">
          <h3 className="pkg-step-title">Ödəniş müddətini seçin</h3>
          <p className="pkg-step-sub">
            {MANUAL_MODE && pkgData
              ? <>Mövcud paketiniz: <strong style={{ color: pkgData.color }}>{pkgData.name}</strong> · {pkgData.monthlyRate.toFixed(2)}₼/ay — daha uzun müddət seçdikdə qiymət aşağı düşür</>
              : "Daha uzun müddət seçdikdə qiymət aşağı düşür"
            }
          </p>

          <div className="billing-options">
            {BILLING_OPTIONS.map(opt => {
              const raw        = pkgData ? calcRaw(pkgData.monthlyRate, opt.months)                        : 0;
              const discounted = pkgData ? calcTotal(pkgData.monthlyRate, opt.months, opt.discountRate)    : 0;
              const saved      = +(raw - discounted).toFixed(2);
              const isSelected = selectedBilling === opt.key;
              return (
                <div
                  key={opt.key}
                  className={`billing-card ${isSelected ? "selected" : ""}`}
                  onClick={() => setSelectedBilling(opt.key)}
                >
                  <div className="billing-card-top">
                    <span className="billing-label">{opt.label}</span>
                    {opt.discountRate > 0 && (
                      <span className="billing-discount-badge">
                        -{Math.round(opt.discountRate * 100)}%
                      </span>
                    )}
                    {isSelected && <FiCheck className="billing-check" />}
                  </div>
                  <div className="billing-price-row">
                    <div className="billing-total">
                      {pkgData ? discounted : "—"}₼
                    </div>
                    {saved > 0 && <div className="billing-original">{raw}₼</div>}
                  </div>
                  <div className="billing-rate">
                    {pkgData ? pkgData.monthlyRate.toFixed(2) : "—"}₼ × {opt.months} ay
                    {saved > 0 && <span className="billing-save-note"> ({saved.toFixed(2)}₼ qənaət)</span>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pkg-nav-row">
            {(!MANUAL_MODE || isFreeUser) && (
              <button className="pkg-nav-btn ghost" onClick={() => setStep(1)}>
                <FiChevronLeft /> Geri
              </button>
            )}
            <button
              className="pkg-nav-btn primary"
              onClick={() => { setFlipped(false); setStep(effectiveManual ? 4 : (isBasic ? 4 : 3)); }}
            >
              Təsdiq et <FiChevronRight />
            </button>
          </div>
        </div>
      )}

      {/* ══════════ ADDIM 3: KART DİZAYNI (yalnız pro/premium) ══════════ */}
      {(!MANUAL_MODE || isFreeUser) && step === 3 && !isBasic && (
        <div className="pkg-step-content">
          <h3 className="pkg-step-title">Kart dizaynını seçin</h3>
          <p className="pkg-step-sub">Fiziki kartınızın görünüşünü fərdiləşdirin</p>

          <div className="card-design-workspace">
            {/* Preview */}
            <div className="card-preview-panel">
              <p className="card-preview-label">Kartın önü / arxası</p>
              <CardPreview
                theme={cardTheme}
                logo={cardLogo}
                name={cardName}
                title={cardTitle}
                flipped={flipped}
                onFlip={() => setFlipped(f => !f)}
              />
              <p className="card-preview-hint">Kartı çevirmək üçün klikləyin</p>
            </div>

            {/* Controls */}
            <div className="card-controls-panel">

              <div className="card-ctrl-field">
                <label>Tema</label>
                <div className="card-theme-toggle">
                  {["dark", "light"].map(t => (
                    <button
                      key={t}
                      className={cardTheme === t ? "active" : ""}
                      onClick={() => setCardTheme(t)}
                    >
                      <span className={`dot ${t}-dot`} />
                      {t === "dark" ? "Tünd" : "Açıq"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="card-ctrl-field">
                <label>Logo / Şəkil</label>
                <div className="card-upload-area" onClick={() => fileRef.current.click()}>
                  {cardLogo
                    ? <img src={cardLogo} alt="logo" className="card-upload-preview" />
                    : (
                      <div className="card-upload-placeholder">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="26">
                          <path d="M3 16.5V19a2 2 0 002 2h14a2 2 0 002-2v-2.5" strokeLinecap="round" />
                          <path d="M12 3v13M8 7l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>Logo yüklə</span>
                      </div>
                    )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogoUpload} />
                {cardLogo && (
                  <button className="card-remove-btn" onClick={() => { setCardLogo(null); setCardLogoFile(null); }}>
                    Sil
                  </button>
                )}
              </div>

              <div className="card-ctrl-field">
                <label>Ad Soyad</label>
                <input
                  className="card-ctrl-input"
                  value={cardName}
                  onChange={e => setCardName(e.target.value)}
                  placeholder="Ad Soyad"
                />
              </div>

              <div className="card-ctrl-field">
                <label>Peşə / Vəzifə</label>
                <input
                  className="card-ctrl-input"
                  value={cardTitle}
                  onChange={e => setCardTitle(e.target.value)}
                  placeholder="Peşəniz"
                />
              </div>

              <button className="card-flip-btn" onClick={() => setFlipped(f => !f)}>
                {flipped ? "Ön üzü göstər" : "Arxa üzü göstər"}
              </button>
            </div>
          </div>

          <div className="pkg-nav-row">
            <button className="pkg-nav-btn ghost" onClick={() => setStep(2)}>
              <FiChevronLeft /> Geri
            </button>
            <button className="pkg-nav-btn primary" onClick={() => setStep(4)}>
              Təsdiq et <FiChevronRight />
            </button>
          </div>
        </div>
      )}

      {/* ══════════ ADDIM 4: ÖDƏNİŞ ══════════ */}
      {step === 4 && (
        <div className="pkg-step-content">
          <h3 className="pkg-step-title">Sifarişi təsdiqləyin</h3>

          <div className="checkout-layout">
            {/* Sol: Xülasə */}
            <div className="checkout-summary">
              <div className="checkout-card">
                <p className="checkout-section-label">Paket məlumatları</p>

                {/* Paket adı — həmişə göstər */}
                <div className="checkout-row">
                  <span>Paket</span>
                  <strong style={{ color: pkgData?.color }}>{pkgData?.name ?? "—"}</strong>
                </div>
                <div className="checkout-row">
                  <span>Aylıq qiymət</span>
                  <strong>{pkgData?.monthlyRate?.toFixed(2) ?? "—"}₼</strong>
                </div>
                <div className="checkout-row">
                  <span>Ödəniş müddəti</span>
                  <strong>{billData?.label}</strong>
                </div>
                {savedAmount > 0 && (
                  <div className="checkout-row">
                    <span>Endirim ({Math.round((billData?.discountRate ?? 0) * 100)}%)</span>
                    <strong className="checkout-save">-{savedAmount.toFixed(2)}₼</strong>
                  </div>
                )}
                <div className="checkout-divider" />
                <div className="checkout-row total-row">
                  <span>Ümumi məbləğ</span>
                  <div className="total-price-stack">
                    {savedAmount > 0 && <span className="total-original">{rawPrice.toFixed(2)}₼</span>}
                    <strong className="total-amount">{totalPrice.toFixed(2)}₼</strong>
                  </div>
                </div>
              </div>

              {(!MANUAL_MODE || isFreeUser) && !isBasic && (
                <div className="checkout-card">
                  <p className="checkout-section-label">Kart məlumatları</p>
                  <div className="checkout-row">
                    <span>Tema</span>
                    <strong>{cardTheme === "dark" ? "Tünd" : "Açıq"}</strong>
                  </div>
                  <div className="checkout-row">
                    <span>Ad</span>
                    <strong>{cardName || "—"}</strong>
                  </div>
                  <div className="checkout-row">
                    <span>Peşə</span>
                    <strong>{cardTitle || "—"}</strong>
                  </div>
                  <div className="checkout-row">
                    <span>Logo</span>
                    <strong>{cardLogo ? "Yüklənib" : "Yoxdur"}</strong>
                  </div>
                </div>
              )}

              {error && <div className="checkout-error">{error}</div>}

              <button
                className="pkg-nav-btn primary full-width"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? <span className="pkg-spinner-sm" /> : null}
                {submitting ? "Emal olunur..." : `${totalPrice}₼ Ödənişə keç`}
              </button>
            </div>

            {/* Sağ: Kart preview */}
            {(!MANUAL_MODE || isFreeUser) && (
              <div className="checkout-preview">
                <p className="checkout-section-label">Kartınızın görünüşü</p>
                {isBasic ? (
                  <>
                    <BasicCardPreview />
                    <p className="checkout-upgrade-hint">
                      Digər paketləri seçərək kartınızı fərdiləşdirə bilərsiz.
                    </p>
                  </>
                ) : (
                  <>
                    <CardPreview
                      theme={cardTheme}
                      logo={cardLogo}
                      name={cardName}
                      title={cardTitle}
                      flipped={flipped}
                      onFlip={() => setFlipped(f => !f)}
                    />
                    <p className="card-preview-hint">Kartı çevirmək üçün klikləyin</p>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="pkg-nav-row">
            <button className="pkg-nav-btn ghost" onClick={() => setStep(effectiveManual ? 2 : (isBasic ? 2 : 3))}>
              <FiChevronLeft /> Geri
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PackageMain;
