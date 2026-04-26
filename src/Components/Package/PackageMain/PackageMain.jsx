import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiCheck, FiX, FiChevronRight, FiChevronLeft, FiRefreshCw } from "react-icons/fi";
import { API_BASE, authFetch, CK } from "../../../Utils/authUtils";
import "./PackageMain.scss";

const FLIP_HINT_SESSION_KEY = "insyde_package_flip_hint_seen";
const CARD_DRAFT_KEY        = "insyde_card_draft";
const STEP_DRAFT_KEY        = "insyde_step_draft";

function readCardDraft()      { try { const r = localStorage.getItem(CARD_DRAFT_KEY); return r ? JSON.parse(r) : null; } catch { return null; } }
function writeCardDraft(data) { try { localStorage.setItem(CARD_DRAFT_KEY, JSON.stringify(data)); } catch { } }
function readStepDraft()      { try { const r = localStorage.getItem(STEP_DRAFT_KEY); return r ? JSON.parse(r) : null; } catch { return null; } }
function writeStepDraft(data) { try { localStorage.setItem(STEP_DRAFT_KEY, JSON.stringify(data)); } catch { } }
function clearStepDraft()     { try { localStorage.removeItem(STEP_DRAFT_KEY); } catch { } }

const FALLBACK_PACKAGES = [
  { key: "basic", name: "Sadə", cardPrice: "12.90₼", monthlyRate: 1.5, color: "#6b7280", badge: null },
  { key: "pro",   name: "Pro",  cardPrice: "27.90₼", monthlyRate: 2.0, color: "#3b82f6", badge: "Populyar" },
];
const ALLOWED_PLANS  = ["basic", "pro"];
const PKG_COLOR_MAP  = { basic: "#6b7280", pro: "#3b82f6" };
const PKG_BADGE_MAP  = { basic: null, pro: "Populyar" };

function normalizePlanKey(raw) {
  const value = String(raw || "").trim().toLowerCase();
  if (!value) return "free";
  if (
    value.includes("pro") ||
    value.includes("premium") ||
    value.includes("business")
  ) return "pro";
  if (
    value.includes("basic") ||
    value.includes("standart") ||
    value.includes("standard") ||
    value.includes("sadə") ||
    value.includes("sade")
  ) return "basic";
  if (value === "free") return "free";
  return value;
}

function parseFeatures(raw) {
  if (!raw || !Array.isArray(raw) || raw.length === 0) return null;
  return raw.map((f) => {
    if (typeof f === "string") return { name: f, available: true };
    return { name: f.name || String(f), available: f.is_available ?? f.available ?? f.included ?? true };
  });
}
function mapPlan(p, idx) {
  const rawKey = normalizePlanKey(p.key || p.slug || p.package_type || p.plan_type || p.name || "");
  let key = rawKey;
  if (!key) {
    const nm = (p.name || "").toLowerCase();
    if (nm.includes("pro")) key = "pro";
    else if (nm.includes("standart") || nm.includes("standard") || nm.includes("basic") || nm.includes("sadə")) key = "basic";
    else key = `plan-${idx}`;
  }
  return {
    key,
    id:          p.id ?? null,
    name:        p.name || key,
    cardPrice:   p.card_price ? `${parseFloat(p.card_price).toFixed(2)}₼` : "—",
    monthlyRate: +(parseFloat(p.monthly_price || p.monthly_rate || 0) * 100 / 100).toFixed(2),
    color:       PKG_COLOR_MAP[key] || "#6b7280",
    badge:       PKG_BADGE_MAP[key] || null,
    features:    parseFeatures(p.features),
  };
}

const BILLING_OPTIONS = [
  { key: "monthly",  label: "1 Aylıq",  months: 1,  discountRate: 0 },
  { key: "biannual", label: "6 Aylıq",  months: 6,  discountRate: 0.0855 },
  { key: "annual",   label: "12 Aylıq", months: 12, discountRate: 0.0855 },
];
function calcTotal(rate, months, disc) { return +(rate * months * (1 - disc)).toFixed(2); }
function calcRaw(rate, months)         { return +(rate * months).toFixed(2); }

const FEATURES = [
  { name: "Sosial şəbəkə",       basic: true,  pro: true  },
  { name: "Əlaqə məlumatları",   basic: true,  pro: true  },
  { name: "Portfel / Kataloq",   basic: true,  pro: true  },
  { name: "NFC + QR sistem",     basic: true,  pro: true  },
  { name: "Fiziki kart",         basic: true,  pro: true  },
  { name: "Sistem analitikası",  basic: false, pro: true  },
  { name: "Xüsusi dizayn",       basic: false, pro: true  },
  { name: "Qablaşma",            basic: false, pro: true  },
  { name: "Digital kart",        basic: false, pro: false },
];

// Free: 4 addım | Subscribed: 3 addım
const FREE_STEP_LABELS_BASIC = ["Paket", "Müddət", "Rəng",  "Ödəniş"];
const FREE_STEP_LABELS_PRO   = ["Paket", "Müddət", "Kart",  "Ödəniş"];
const SUB_STEP_LABELS        = ["Paket", "Aylıqlar", "Ödəniş"];

const MONTHS_AZ = ["yanvar","fevral","mart","aprel","may","iyun","iyul","avqust","sentyabr","oktyabr","noyabr","dekabr"];
function fmtDate(raw) {
  if (!raw) return null;
  try { const d = new Date(raw); return `${d.getDate()} ${MONTHS_AZ[d.getMonth()]} ${d.getFullYear()}`; } catch { return null; }
}
function addMonthsToDate(raw, months) {
  if (!raw || !months) return null;
  try {
    const base = new Date(raw);
    if (Number.isNaN(base.getTime())) return null;
    const next = new Date(base);
    next.setMonth(next.getMonth() + Number(months));
    return `${next.getDate()} ${MONTHS_AZ[next.getMonth()]} ${next.getFullYear()}`;
  } catch {
    return null;
  }
}

// ── QR placeholder ───────────────────────────────────────────
function QrPlaceholder({ color = "currentColor" }) {
  const cell = 8; const gap = 2;
  const S = 7 * (cell + gap) - gap;
  const map = [
    [1,1,1,1,1,1,1],[1,0,0,0,0,0,1],[1,0,1,1,1,0,1],
    [1,0,1,0,1,0,1],[1,0,1,1,1,0,1],[1,0,0,0,0,0,1],[1,1,1,1,1,1,1],
  ];
  const inner = [[2,2],[2,4],[3,3],[4,2],[4,4],[5,3],[3,5],[5,5],[2,6],[6,2],[6,4]];
  return (
    <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
      {map.map((row,r) => row.map((on,c) => on ? (
        <rect key={`f-${r}-${c}`} x={c*(cell+gap)} y={r*(cell+gap)} width={cell} height={cell} rx={1} fill={color}/>
      ) : null))}
      {inner.map(([r,c],i) => (
        <rect key={`d-${i}`} x={c*(cell+gap)} y={r*(cell+gap)} width={cell} height={cell} rx={1} fill={color} opacity={0.7}/>
      ))}
    </svg>
  );
}

// ── Pro kart önizləmə (3D flip) ──────────────────────────────
function CardPreview({ theme, logo, name, title, slogan, brandMode, brandName, flipped, onFlip }) {
  const isDark   = theme !== "light";
  const gold     = isDark ? "#c9a84c" : "#b8942a";
  const bg       = isDark ? "#0b0b0b" : "#f5f2ec";
  const text2    = isDark ? "rgba(255,255,255,0.45)" : "rgba(17,17,17,0.5)";
  const wmClr    = isDark ? "rgba(201,168,76,0.07)" : "rgba(184,148,42,0.09)";
  const isQelib  = brandMode !== "ferdi";
  const isFerdi  = brandMode === "ferdi";
  const frontSlogan   = isQelib ? "İlk təəssürat önəmlidir" : slogan?.trim() || "Öz şüarınız";
  const displayBrand  = isFerdi && brandName?.trim() ? brandName.trim() : "Insyde";
  const isBrandCustom = isFerdi && brandName?.trim();

  return (
    <div className={`pkg-scene ${flipped ? "is-flipped" : ""}`} onClick={onFlip}>
      <div className="pkg-card" style={{ "--card-bg": bg, "--card-gold": gold, "--card-text2": text2, "--card-wm": wmClr }}>
        <div className="pkg-face pkg-front">
          <div className="pkg-front-topbar">
            <span className="pkg-tagline">{frontSlogan}</span>
            {isQelib && <span className="pkg-site">İnsyde.info</span>}
          </div>
          <div className={`pkg-brand-word${isBrandCustom ? " pkg-brand-custom" : ""}`}>{displayBrand}</div>
        </div>
        <div className="pkg-face pkg-back">
          <div className="pkg-wm" aria-hidden>Insyde</div>
          <div className="pkg-back-logo">
            {logo ? <img src={logo} alt="logo" className="pkg-logo-img" /> : <span className="pkg-logo-placeholder">LOGO</span>}
          </div>
          <div className="pkg-qr-wrap"><QrPlaceholder color={gold} /></div>
          <div className="pkg-back-info">
            <span className="pkg-back-name">{name || "Ad Soyad"}</span>
            <span className="pkg-back-title">{title || "Peşə / Vəzifə"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sadə kart önizləmə ───────────────────────────────────────
function BasicCardPreview({ theme = "dark" }) {
  const isDark = theme !== "light";
  const gold   = isDark ? "#c9a84c" : "#b8942a";
  const bg     = isDark ? "#0b0b0b" : "#f5f2ec";
  return (
    <div className="pkg-scene">
      <div className="pkg-card" style={{ "--card-bg": bg, "--card-gold": gold }}>
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

function StepIndicator({ current, labels }) {
  return (
    <div className="step-indicator">
      {labels.map((label, i) => {
        const num = i + 1; const done = num < current; const active = num === current;
        return (
          <React.Fragment key={num}>
            <div className={`step-item ${active ? "active" : ""} ${done ? "done" : ""}`}>
              <div className="step-circle">{done ? <FiCheck /> : num}</div>
              <span className="step-label">{label}</span>
            </div>
            {i < labels.length - 1 && <div className={`step-line ${done ? "done" : ""}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function PackageMain() {
  const navigate  = useNavigate();
  const fileRef   = useRef(null);
  const cardDraft = readCardDraft();
  const stepDraft = readStepDraft();

  const [step, setStep]               = useState(() => stepDraft?.step ?? 1);
  const [selectedPkg, setSelectedPkg] = useState(() => stepDraft?.selectedPkg ?? null);
  const [selectedBilling, setSelectedBilling] = useState(() => stepDraft?.selectedBilling ?? "monthly");

  // Kart dizayn state-ləri
  const [cardTheme,     setCardTheme]     = useState(() => cardDraft?.cardTheme     ?? "dark");
  const [cardLogo,      setCardLogo]      = useState(null);
  const [cardLogoFile,  setCardLogoFile]  = useState(null);
  const [cardName,      setCardName]      = useState(() => cardDraft?.cardName      ?? "");
  const [cardTitle,     setCardTitle]     = useState(() => cardDraft?.cardTitle     ?? "");
  const [cardSlogan,    setCardSlogan]    = useState(() => cardDraft?.cardSlogan    ?? "");
  const [cardBrandMode, setCardBrandMode] = useState(() => cardDraft?.cardBrandMode ?? "qelib");
  const [cardBrandName, setCardBrandName] = useState(() => cardDraft?.cardBrandName ?? "");
  const [flipped,       setFlipped]       = useState(false);
  const [showFlipHint,  setShowFlipHint]  = useState(false);

  const [packages, setPackages]           = useState(FALLBACK_PACKAGES.filter(p => ALLOWED_PLANS.includes(p.key)));
  const [currentSubData, setCurrentSubData] = useState(null);
  const [currentSub, setCurrentSub]       = useState(null);
  const [hasExistingOrder, setHasExistingOrder] = useState(false);
  const [isPaid, setIsPaid]               = useState(false);
  const [lastPayDate, setLastPayDate]     = useState(null);
  const [nextRenewDate, setNextRenewDate] = useState(null);
  const [currentDurationMonths, setCurrentDurationMonths] = useState(null);
  const [loading, setLoading]             = useState(true);
  const [submitting, setSubmitting]       = useState(false);
  const [error, setError]                 = useState("");
  const [profilePath, setProfilePath]     = useState("");
  const [userHashId, setUserHashId]       = useState("");

  // Promo kod
  const [promoInput, setPromoInput]       = useState("");
  const [promoApplied, setPromoApplied]   = useState(null);
  const [promoLoading, setPromoLoading]   = useState(false);
  const [promoError, setPromoError]       = useState("");

  // Downgrade modal
  const [rawExpirationDate, setRawExpirationDate]       = useState(null);
  const [showDowngradeModal, setShowDowngradeModal]     = useState(false);
  const [remainingMonthsModal, setRemainingMonthsModal] = useState(0);

  // Sifariş mövcuddursa → 3-addımlı uzatma axını; yoxdursa → 4-addımlı ilk alış axını
  const isFreeUser      = !hasExistingOrder;
  const effectiveManual = hasExistingOrder;
  const isBasic         = selectedPkg === "basic";
  const freeStepLabels  = isBasic ? FREE_STEP_LABELS_BASIC : FREE_STEP_LABELS_PRO;

  // Draft sync
  useEffect(() => { writeStepDraft({ step, selectedPkg, selectedBilling }); }, [step, selectedPkg, selectedBilling]);
  useEffect(() => { writeCardDraft({ cardTheme, cardName, cardTitle, cardSlogan, cardBrandMode, cardBrandName }); },
    [cardTheme, cardName, cardTitle, cardSlogan, cardBrandMode, cardBrandName]);

  // Flip hint — Pro kart step-ə girdikdə bir dəfə göstər
  useEffect(() => {
    if (isFreeUser && step === 3 && !isBasic) {
      const seen = sessionStorage.getItem(FLIP_HINT_SESSION_KEY);
      if (!seen) { sessionStorage.setItem(FLIP_HINT_SESSION_KEY, "true"); setShowFlipHint(true); }
    }
  }, [step, isFreeUser, isBasic]);
  useEffect(() => {
    if (!showFlipHint) return;
    const t = setTimeout(() => setShowFlipHint(false), 5000);
    return () => clearTimeout(t);
  }, [showFlipHint]);

  useEffect(() => {
    Promise.allSettled([
      authFetch(`${API_BASE}/api/v1/plans/`),
      authFetch(`${API_BASE}/api/v1/profile/me/`),
      authFetch(`${API_BASE}/api/v1/orders/my/`),
    ]).then(async ([plansRes, profileRes, orderRes]) => {
      let resolvedPackages = FALLBACK_PACKAGES.filter(p => ALLOWED_PLANS.includes(p.key));

      if (plansRes.status === "fulfilled" && plansRes.value?.ok) {
        try {
          const json = await plansRes.value.json();
          const arr  = Array.isArray(json) ? json : json.results ?? json.plans ?? null;
          if (arr?.length) {
            const PLAN_ORDER = { basic: 0, pro: 1 };
            const seen = new Set();
            const mapped = arr
              .map((p, i) => mapPlan(p, i))
              .filter(p => {
                if (!ALLOWED_PLANS.includes(p.key)) return false;
                if (seen.has(p.key)) return false;
                seen.add(p.key);
                return true;
              });
            mapped.sort((a, b) => (PLAN_ORDER[a.key] ?? 99) - (PLAN_ORDER[b.key] ?? 99));
            resolvedPackages = mapped;
            setPackages(mapped);
          }
        } catch { }
      }

      // Paket məlumatı
      let paid = false;
      let orderDerivedPlanKey = "free";
      let orderPaidAt = null;
      let orderDurationMonths = null;
      let orderExpirationDate = null;
      if (orderRes.status === "fulfilled" && orderRes.value?.ok) {
        try {
          const orderData = await orderRes.value.json();
          setHasExistingOrder(true);
          paid = orderData?.payment_info?.payment_status === "paid";
          setIsPaid(paid);
          orderPaidAt =
            orderData?.payment_info?.update_time ||
            orderData?.payment_info?.create_time ||
            orderData?.update_time ||
            orderData?.create_time ||
            null;
          orderExpirationDate = orderData?.payment_info?.expiration_date ?? null;
          if (orderExpirationDate) setRawExpirationDate(orderExpirationDate);
          orderDerivedPlanKey = normalizePlanKey(
            orderData?.payment_info?.plan_name ||
            orderData?.payment_info?.plan_type ||
            orderData?.package_info?.package_type ||
            "free"
          );
          if (orderDerivedPlanKey && orderDerivedPlanKey !== "free") {
            setCurrentSub(orderDerivedPlanKey);
            const source = resolvedPackages.length ? resolvedPackages : FALLBACK_PACKAGES;
            const found = source.find((p) => p.key === orderDerivedPlanKey);
            if (found) {
              setCurrentSubData(found);
              setSelectedPkg(orderDerivedPlanKey);
            }
          }
          orderDurationMonths = orderData?.payment_info?.duration_months ?? null;
          setCurrentDurationMonths(orderDurationMonths);
          if (orderPaidAt) setLastPayDate(fmtDate(orderPaidAt));
          if (orderExpirationDate) setNextRenewDate(fmtDate(orderExpirationDate));
        } catch { }
      }

      if (profileRes.status === "fulfilled" && profileRes.value?.ok) {
        try {
          const data   = await profileRes.value.json();
          const d      = data?.data || data;
          const info   = d?.user_info || {};
          const draft  = readCardDraft();

          if (!draft?.cardName)  setCardName(info.name || "");
          if (!draft?.cardTitle) setCardTitle(info.work || "");
          if (info.profile_path) setProfilePath(info.profile_path);
          if (info.hash_id) setUserHashId(info.hash_id);

          const sub    = d?.subscription || {};
          const subKey = normalizePlanKey(sub.version_type || sub.packet_type || sub.plan?.name || "free");
          const resolvedSubKey = orderDerivedPlanKey !== "free" ? orderDerivedPlanKey : subKey;
          setCurrentSub(resolvedSubKey);
          const fallbackPaidAt = sub.update_time || sub.create_time || orderPaidAt || null;
          const durationMonths = orderDurationMonths ?? currentDurationMonths;
          if (fallbackPaidAt) setLastPayDate(fmtDate(fallbackPaidAt));
          // Növbəti ödəniş: order expiration_date prioritetlidir
          if (!orderExpirationDate) {
            setNextRenewDate(
              fmtDate(sub.end_time || sub.end_date || sub.expires_at || null) ||
              addMonthsToDate(fallbackPaidAt, durationMonths)
            );
          }

          if (resolvedSubKey && resolvedSubKey !== "free") {
            const source = resolvedPackages.length ? resolvedPackages : FALLBACK_PACKAGES;
            const found  = source.find(p => p.key === resolvedSubKey);
            if (found) {
              setCurrentSubData(found);
              setSelectedPkg(resolvedSubKey);
            }
          }
        } catch { }
      }
    }).finally(() => setLoading(false));
  }, []);

  const pkgData    = packages.find(p => p.key === selectedPkg)
    || (effectiveManual ? currentSubData : null)
    || null;
  const billData   = BILLING_OPTIONS.find(b => b.key === selectedBilling);
  const rawPrice      = pkgData && billData ? calcRaw(pkgData.monthlyRate, billData.months) : 0;
  const baseTotal     = pkgData && billData ? calcTotal(pkgData.monthlyRate, billData.months, billData.discountRate) : 0;
  const promoDiscount = promoApplied ? +(baseTotal * (promoApplied.discount / 100)).toFixed(2) : 0;
  const totalPrice    = +(baseTotal - promoDiscount).toFixed(2);
  const savedAmount   = +(rawPrice - baseTotal).toFixed(2);

  useEffect(() => {
    if (effectiveManual && step > 3) setStep(1);
  }, [effectiveManual, step]);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCardLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setCardLogo(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handlePromoApply = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    setPromoLoading(true);
    setPromoError("");
    setPromoApplied(null);
    try {
      const res = await authFetch(`${API_BASE}/api/v1/promo/check/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const body = await res?.json().catch(() => ({}));
      if (res?.ok && body?.valid) {
        setPromoApplied({ code: body.code, discount: 10 });
      } else {
        setPromoError(body?.detail || "Bu promo kod mövcud deyil.");
      }
    } catch {
      setPromoError("Serverə qoşulmaq mümkün olmadı.");
    } finally {
      setPromoLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!pkgData) return;
    setSubmitting(true);
    setError("");
    try {
      const form = new FormData();
      form.append("plan_id",         pkgData.id ?? "");
      form.append("duration_months", billData?.months ?? 1);
      form.append("card_color",      cardTheme === "light" ? "white" : "black");

      if (!effectiveManual && !isBasic) {
        form.append("theme", cardTheme);
        form.append("card_full_name", cardName);
        form.append("card_position",  cardTitle);
        const isTemplate = cardBrandMode === "qelib";
        form.append("is_template", isTemplate);
        if (!isTemplate) {
          form.append("slogan",    cardSlogan || "");
          form.append("card_text", cardBrandName || "");
          if (cardLogoFile) form.append("card_logo", cardLogoFile);
        }
      }

      const res  = await authFetch(`${API_BASE}/api/v1/orders/my/create/`, { method: "POST", body: form });
      if (!res) { setError("Sessiya bitib."); return; }
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setError(body?.detail || body?.error || `Xəta: ${res.status}`); return; }

      clearStepDraft();
      localStorage.removeItem(CARD_DRAFT_KEY);
      if (effectiveManual) {
        const nextProfileUrl =
          profilePath ||
          (userHashId || CK.get("hash_id")
            ? `http://localhost:5174/profile/${userHashId || CK.get("hash_id")}/`
            : "");

        if (nextProfileUrl) {
          window.location.href = nextProfileUrl;
        } else {
          navigate("/home", { replace: true });
        }
        return;
      }
      navigate("/order", {
        state: {
          isNew:          true,
          order_number:   body?.unique_id || "",
          package_name:   pkgData.name    || "",
          package_color:  pkgData.color   || "#d4af37",
          billing_label:  billData?.label  || "",
          billing_months: billData?.months || 1,
          card_total:     body?.payment_info?.card_price    ?? null,
          monthly_total:  body?.payment_info?.monthly_price ?? totalPrice,
        },
      });
    } catch {
      setError("Server ilə əlaqə kəsildi.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckAndSubmit = () => {
    if (rawExpirationDate && billData) {
      const now = new Date();
      const expiry = new Date(rawExpirationDate);
      const diffMs = expiry - now;
      if (diffMs > 0) {
        const remaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30));
        if (billData.months < remaining) {
          setRemainingMonthsModal(remaining);
          setShowDowngradeModal(true);
          return;
        }
      }
    }
    handleSubmit();
  };

  if (loading) return <div className="pkg-loading"><div className="pkg-spinner" /></div>;

  // ─────────────────────────────────────────────────────────────
  // SUBSCRIBED USER — 3 ADDIM: Paket → Aylıqlar → Ödəniş
  // ─────────────────────────────────────────────────────────────
  if (effectiveManual) {
    return (
      <div className="package-main-modern">
        {showDowngradeModal && (
          <div className="pkg-modal-overlay" onClick={() => setShowDowngradeModal(false)}>
            <div className="pkg-modal" onClick={e => e.stopPropagation()}>
              <h4 className="pkg-modal-title">Diqqət!</h4>
              <p className="pkg-modal-body">
                Sizin hal-hazırda <strong>{remainingMonthsModal} aylıq</strong> abunəliyiniz qalıb.
                Daha qısa müddətli abunəlik almaq istədiyinizə əminsiniz?
              </p>
              <div className="pkg-modal-btns">
                <button className="pkg-modal-btn ghost" onClick={() => setShowDowngradeModal(false)}>Bağla</button>
                <button className="pkg-modal-btn primary" onClick={() => { setShowDowngradeModal(false); handleSubmit(); }}>Davam et</button>
              </div>
            </div>
          </div>
        )}
        <div className="pkg-top-header">
          <div>
            <h2 className="pkg-page-title">Ödəniş Planı</h2>
            <p className="pkg-page-subtitle">Abunəliyinizi uzadın</p>
          </div>
        </div>

        <div className="pkg-current-banner" style={{ "--pkg-color": pkgData?.color || "#d4af37" }}>
          <div className="pkg-current-banner-left">
            <span className="pkg-is-badge">Aktiv paket</span>
            <strong className="pkg-current-name" style={{ color: pkgData?.color }}>{pkgData?.name || "—"}</strong>
          </div>
          <div className="pkg-current-banner-right">
            {lastPayDate && <span>Ödəniş tarixi: <strong>{lastPayDate}</strong></span>}
            {currentDurationMonths && <span>Müddət: <strong>{currentDurationMonths} ay</strong></span>}
            {nextRenewDate && <span>Növbəti ödəniş: <strong>{nextRenewDate}</strong></span>}
          </div>
        </div>

        <StepIndicator current={step} labels={SUB_STEP_LABELS} />

        {/* ADDIM 1 — Paket */}
        {step === 1 && (
          <div className="pkg-step-content">
            <h3 className="pkg-step-title">Paket seçin</h3>
            <p className="pkg-step-sub">Mövcud abunəliyiniz üçün uyğun paketi yenidən seçə bilərsiniz</p>
            <div className="pkg-cards-grid">
              {packages.map(pkg => {
                const isSel = selectedPkg === pkg.key;
                const isCurrent = currentSub === pkg.key;
                return (
                  <div
                    key={pkg.key}
                    className={`pkg-option-card ${isSel ? "selected" : ""} ${isCurrent ? "is-current" : ""}`}
                    style={{ "--pkg-color": pkg.color, "--pkg-glow": `${pkg.color}30` }}
                    onClick={() => setSelectedPkg(pkg.key)}
                  >
                    {pkg.badge && <span className="pkg-badge" style={{ background: pkg.color }}>{pkg.badge}</span>}
                    {isCurrent && <span className="pkg-current-badge">Hazırkı paket</span>}
                    <div className="pkg-card-top">
                      <h3 className="pkg-card-name" style={{ color: pkg.color }}>{pkg.name}</h3>
                      <div className="pkg-card-price">{pkg.cardPrice}</div>
                      <div className="pkg-card-rate">{pkg.monthlyRate.toFixed(2)}₼ / ay</div>
                    </div>
                    <div className="pkg-features-list">
                      {(pkg.features ?? FEATURES.map(f => ({ name: f.name, available: f[pkg.key] ?? true }))).map((feat, fi) => (
                        <div key={fi} className={`pkg-feat-row ${!feat.available ? "unavailable" : ""}`}>
                          {feat.available ? <FiCheck className="feat-icon check" /> : <FiX className="feat-icon cross" />}
                          <span>{feat.name}</span>
                        </div>
                      ))}
                    </div>
                    <div className={`pkg-select-indicator ${isSel ? "on" : ""}`}>{isSel ? <FiCheck /> : null}</div>
                  </div>
                );
              })}
            </div>
            <div className="pkg-nav-row">
              <span />
              <button className="pkg-nav-btn primary" disabled={!selectedPkg} onClick={() => setStep(2)}>
                Növbəti <FiChevronRight />
              </button>
            </div>
          </div>
        )}

        {/* ADDIM 2 — Aylıqlar */}
        {step === 2 && (
          <div className="pkg-step-content">
            <h3 className="pkg-step-title">Aylıq müddəti seçin</h3>
            <p className="pkg-step-sub">Daha uzun müddət seçdikdə qiymət aşağı düşür</p>
            <div className="billing-options">
              {BILLING_OPTIONS.map(opt => {
                const raw = pkgData ? calcRaw(pkgData.monthlyRate, opt.months) : 0;
                const disc = pkgData ? calcTotal(pkgData.monthlyRate, opt.months, opt.discountRate) : 0;
                const saved = +(raw - disc).toFixed(2);
                const isSel = selectedBilling === opt.key;
                return (
                  <div key={opt.key} className={`billing-card ${isSel ? "selected" : ""}`}
                    onClick={() => setSelectedBilling(opt.key)}>
                    <div className="billing-card-top">
                      <span className="billing-label">{opt.label}</span>
                      {opt.discountRate > 0 && <span className="billing-discount-badge">-{Math.round(opt.discountRate * 100)}%</span>}
                      {isSel && <FiCheck className="billing-check" />}
                    </div>
                    <div className="billing-price-row">
                      <div className="billing-total">{pkgData ? disc : "—"}₼</div>
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
              <button className="pkg-nav-btn ghost" onClick={() => setStep(1)}><FiChevronLeft /> Geri</button>
              <button className="pkg-nav-btn primary" onClick={() => setStep(3)}>Növbəti <FiChevronRight /></button>
            </div>
          </div>
        )}

        {/* ADDIM 3 — Ödəniş (abunəlik yeniləmə — promo kod yoxdur) */}
        {step === 3 && (
          <div className="pkg-step-content">
            <h3 className="pkg-step-title">Ödənişi təsdiqləyin</h3>
            <div className="checkout-layout">
              <div className="checkout-summary">
                <div className="checkout-card">
                  <p className="checkout-section-label">Ödəniş xülasəsi</p>
                  <div className="checkout-row">
                    <span>Paket</span>
                    <strong style={{ color: pkgData?.color }}>{pkgData?.name}</strong>
                  </div>
                  <div className="checkout-row">
                    <span>Müddət</span>
                    <strong>{billData?.label}</strong>
                  </div>
                  {savedAmount > 0 && (
                    <div className="checkout-row">
                      <span>Endirim</span>
                      <strong className="checkout-save">-{savedAmount.toFixed(2)}₼</strong>
                    </div>
                  )}
                  <div className="checkout-divider" />
                  <div className="checkout-row total-row">
                    <span>Ödəniləcək</span>
                    <div className="total-price-stack">
                      {savedAmount > 0 && <span className="total-original">{rawPrice.toFixed(2)}₼</span>}
                      <strong className="total-amount">{totalPrice.toFixed(2)}₼</strong>
                    </div>
                  </div>
                </div>
                {error && <div className="checkout-error">{error}</div>}

                <button className="pkg-nav-btn primary full-width" onClick={handleCheckAndSubmit} disabled={submitting}>
                  {submitting ? <span className="pkg-spinner-sm" /> : null}
                  {submitting ? "Emal olunur..." : `${totalPrice.toFixed(2)}₼ Ödə`}
                </button>
              </div>
            </div>
            <div className="pkg-nav-row">
              <button className="pkg-nav-btn ghost" onClick={() => setStep(2)}><FiChevronLeft /> Geri</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // FREE USER — 4 ADDIM: Paket → Müddət → Kart/Rəng → Ödəniş
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="package-main-modern">
      <div className="pkg-top-header">
        <div>
          <h2 className="pkg-page-title">Ödəniş Planı</h2>
          <p className="pkg-page-subtitle">Ehtiyaclarınıza uyğun paketi seçin</p>
        </div>
      </div>

      <StepIndicator current={step} labels={freeStepLabels} />

      {/* ADDIM 1 — Paket seç */}
      {step === 1 && (
        <div className="pkg-step-content">
          <h3 className="pkg-step-title">Paket seçin</h3>
          <div className="pkg-cards-grid">
            {packages.map(pkg => {
              const isSel = selectedPkg === pkg.key;
              return (
                <div key={pkg.key}
                  className={`pkg-option-card ${isSel ? "selected" : ""}`}
                  style={{ "--pkg-color": pkg.color, "--pkg-glow": `${pkg.color}30` }}
                  onClick={() => setSelectedPkg(pkg.key)}>
                  {pkg.badge && <span className="pkg-badge" style={{ background: pkg.color }}>{pkg.badge}</span>}
                  <div className="pkg-card-top">
                    <h3 className="pkg-card-name" style={{ color: pkg.color }}>{pkg.name}</h3>
                    <div className="pkg-card-price">{pkg.cardPrice}</div>
                    <div className="pkg-card-rate">{pkg.monthlyRate.toFixed(2)}₼ / ay</div>
                  </div>
                  <div className="pkg-features-list">
                    {(pkg.features ?? FEATURES.map(f => ({ name: f.name, available: f[pkg.key] ?? true }))).map((feat, fi) => (
                      <div key={fi} className={`pkg-feat-row ${!feat.available ? "unavailable" : ""}`}>
                        {feat.available ? <FiCheck className="feat-icon check" /> : <FiX className="feat-icon cross" />}
                        <span>{feat.name}</span>
                      </div>
                    ))}
                  </div>
                  <div className={`pkg-select-indicator ${isSel ? "on" : ""}`}>{isSel ? <FiCheck /> : null}</div>
                </div>
              );
            })}
          </div>
          <div className="pkg-nav-row">
            <span />
            <button className="pkg-nav-btn primary" disabled={!selectedPkg} onClick={() => setStep(2)}>
              Növbəti <FiChevronRight />
            </button>
          </div>
        </div>
      )}

      {/* ADDIM 2 — Müddət */}
      {step === 2 && (
        <div className="pkg-step-content">
          <h3 className="pkg-step-title">Ödəniş müddətini seçin</h3>
          <p className="pkg-step-sub">Daha uzun müddət seçdikdə qiymət aşağı düşür</p>
          <div className="billing-options">
            {BILLING_OPTIONS.map(opt => {
              const raw   = pkgData ? calcRaw(pkgData.monthlyRate, opt.months) : 0;
              const disc  = pkgData ? calcTotal(pkgData.monthlyRate, opt.months, opt.discountRate) : 0;
              const saved = +(raw - disc).toFixed(2);
              const isSel = selectedBilling === opt.key;
              return (
                <div key={opt.key} className={`billing-card ${isSel ? "selected" : ""}`}
                  onClick={() => setSelectedBilling(opt.key)}>
                  <div className="billing-card-top">
                    <span className="billing-label">{opt.label}</span>
                    {opt.discountRate > 0 && <span className="billing-discount-badge">-{Math.round(opt.discountRate * 100)}%</span>}
                    {isSel && <FiCheck className="billing-check" />}
                  </div>
                  <div className="billing-price-row">
                    <div className="billing-total">{pkgData ? disc : "—"}₼</div>
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
            <button className="pkg-nav-btn ghost" onClick={() => setStep(1)}><FiChevronLeft /> Geri</button>
            <button className="pkg-nav-btn primary" onClick={() => { setFlipped(false); setStep(3); }}>
              Növbəti <FiChevronRight />
            </button>
          </div>
        </div>
      )}

      {/* ADDIM 3 — Rəng seç (Sadə paket) */}
      {step === 3 && isBasic && (
        <div className="pkg-step-content">
          <h3 className="pkg-step-title">Kart rəngini seçin</h3>
          <p className="pkg-step-sub">Sadə paketdə kartınız qara və ya ağ rəngdə olacaq</p>

          <div className="basic-color-layout">
            <div className="basic-color-preview">
              <BasicCardPreview theme={cardTheme} />
              <p className="card-preview-hint">Seçilmiş rəng</p>
            </div>

            <div className="basic-color-options">
              <button
                className={`basic-color-btn ${cardTheme === "dark" ? "active" : ""}`}
                onClick={() => setCardTheme("dark")}>
                <div className="basic-color-swatch basic-swatch-dark" />
                <div className="basic-color-text">
                  <span className="basic-color-name">Qara</span>
                  <span className="basic-color-desc">Tünd fon, qızılı detal</span>
                </div>
                {cardTheme === "dark" && <FiCheck className="basic-color-check" />}
              </button>

              <button
                className={`basic-color-btn ${cardTheme === "light" ? "active" : ""}`}
                onClick={() => setCardTheme("light")}>
                <div className="basic-color-swatch basic-swatch-light" />
                <div className="basic-color-text">
                  <span className="basic-color-name">Ağ</span>
                  <span className="basic-color-desc">Açıq fon, qızılı detal</span>
                </div>
                {cardTheme === "light" && <FiCheck className="basic-color-check" />}
              </button>
            </div>
          </div>

          <div className="pkg-nav-row">
            <button className="pkg-nav-btn ghost" onClick={() => setStep(2)}><FiChevronLeft /> Geri</button>
            <button className="pkg-nav-btn primary" onClick={() => setStep(4)}>Növbəti <FiChevronRight /></button>
          </div>
        </div>
      )}

      {/* ADDIM 3 — Kart dizayn (Pro paket) */}
      {step === 3 && !isBasic && (
        <div className="pkg-step-content">
          <div className="pkg-step-heading">
            <h3 className="pkg-step-title">Kart dizaynı</h3>
          </div>
          <p className="pkg-step-sub">Kart görünüşünü qısa və rahat formada tənzimlə</p>

          <div className="card-design-workspace">
            <div className="card-preview-panel">
              <button className="card-flip-icon-btn" onClick={() => setFlipped(f => !f)}
                aria-label="Kartı fırla" title="Kartı fırla" type="button">
                <FiRefreshCw />
              </button>
              <p className="card-preview-label">Ön / arxa</p>
              <CardPreview
                theme={cardTheme} logo={cardLogo} name={cardName}
                title={cardTitle} slogan={cardSlogan}
                brandMode={cardBrandMode} brandName={cardBrandName}
                flipped={flipped} onFlip={() => setFlipped(f => !f)}
              />
              <p className="card-preview-hint">İkona və ya karta klik edin</p>
            </div>

            <div className="card-controls-panel">
              <div className="card-controls-grid">
                <div className="card-ctrl-field">
                  <label>Tema</label>
                  <div className="card-theme-toggle">
                    {["dark", "light"].map(t => (
                      <button key={t} type="button"
                        className={cardTheme === t ? "active" : ""}
                        onClick={() => setCardTheme(t)}>
                        <span className={`dot ${t}-dot`} />
                        {t === "dark" ? "Tünd" : "Açıq"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="card-ctrl-field">
                  <label>Rejim</label>
                  <div className="card-brand-toggle">
                    <button type="button" className={cardBrandMode === "qelib" ? "active" : ""}
                      onClick={() => setCardBrandMode("qelib")}>Qəlib</button>
                    <button type="button" className={cardBrandMode === "ferdi" ? "active" : ""}
                      onClick={() => setCardBrandMode("ferdi")}>Fərdi</button>
                  </div>
                </div>

                {cardBrandMode === "ferdi" && (
                  <>
                    <div className="card-ctrl-field">
                      <label>Şüar</label>
                      <input className="card-ctrl-input" value={cardSlogan}
                        onChange={e => setCardSlogan(e.target.value)}
                        placeholder="Şüar" maxLength={40} />
                    </div>
                    <div className="card-ctrl-field">
                      <label>Yazı</label>
                      <input className="card-ctrl-input" value={cardBrandName}
                        onChange={e => setCardBrandName(e.target.value)}
                        placeholder="Kart yazısı" maxLength={20} />
                    </div>
                  </>
                )}

                <div className="card-ctrl-field full-width">
                  <label>Logo</label>
                  <div className="card-upload-area" onClick={() => fileRef.current?.click()}>
                    {cardLogo
                      ? <img src={cardLogo} alt="logo" className="card-upload-preview" />
                      : (
                        <div className="card-upload-placeholder">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="24">
                            <path d="M3 16.5V19a2 2 0 002 2h14a2 2 0 002-2v-2.5" strokeLinecap="round"/>
                            <path d="M12 3v13M8 7l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span>Logo yüklə</span>
                        </div>
                      )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*"
                    style={{ display: "none" }} onChange={handleLogoUpload} />
                  {cardLogo && (
                    <button type="button" className="card-remove-btn"
                      onClick={() => { setCardLogo(null); setCardLogoFile(null); }}>Sil</button>
                  )}
                </div>

                <div className="card-ctrl-field">
                  <label>Ad soyad</label>
                  <input className="card-ctrl-input" value={cardName}
                    onChange={e => setCardName(e.target.value)} placeholder="Ad soyad" />
                </div>

                <div className="card-ctrl-field">
                  <label>Vəzifə</label>
                  <input className="card-ctrl-input" value={cardTitle}
                    onChange={e => setCardTitle(e.target.value)} placeholder="Vəzifə" />
                </div>
              </div>

              <button type="button" className="card-flip-btn" onClick={() => setFlipped(f => !f)}>
                {flipped ? "Ön üzü göstər" : "Arxa üzü göstər"}
              </button>
            </div>
          </div>

          <div className="pkg-nav-row">
            <button className="pkg-nav-btn ghost" onClick={() => setStep(2)}><FiChevronLeft /> Geri</button>
            <button className="pkg-nav-btn primary" onClick={() => setStep(4)}>Növbəti <FiChevronRight /></button>
          </div>
        </div>
      )}

      {/* ADDIM 4 — Ödəniş */}
      {step === 4 && (
        <div className="pkg-step-content">
          <h3 className="pkg-step-title">Sifarişi təsdiqləyin</h3>
          <div className="checkout-layout checkout-layout-with-card">
            <div className="checkout-summary">
              <div className="checkout-card">
                <p className="checkout-section-label">Paket məlumatları</p>
                <div className="checkout-row">
                  <span>Paket</span>
                  <strong style={{ color: pkgData?.color }}>{pkgData?.name ?? "—"}</strong>
                </div>
                {!isBasic && cardName && (
                  <div className="checkout-row">
                    <span>Ad soyad</span>
                    <strong>{cardName}</strong>
                  </div>
                )}
                <div className="checkout-row">
                  <span>Kart rəngi</span>
                  <strong>{cardTheme === "dark" ? "Qara" : "Ağ"}</strong>
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

              {promoApplied && (
                <div className="checkout-row">
                  <span>Promo endirim ({promoApplied.discount}%)</span>
                  <strong className="checkout-save">-{promoDiscount.toFixed(2)}₼</strong>
                </div>
              )}
              {error && <div className="checkout-error">{error}</div>}

              <div className="checkout-promo-wrap">
                <div className="checkout-promo-row">
                  <input
                    className="checkout-promo-input"
                    placeholder="Promo kodu daxil edin"
                    value={promoInput}
                    onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError(""); setPromoApplied(null); }}
                    disabled={promoLoading}
                  />
                  <button className="checkout-promo-btn" onClick={handlePromoApply} disabled={promoLoading || !promoInput.trim()}>
                    {promoLoading ? <span className="pkg-spinner-sm" /> : "Tətbiq et"}
                  </button>
                </div>
                {promoError && <p className="checkout-promo-error">{promoError}</p>}
                {promoApplied && (
                  <p className="checkout-promo-success">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13"><polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    "{promoApplied.code}" kodu tətbiq edildi — {promoApplied.discount}% endirim
                  </p>
                )}
              </div>

              <button className="pkg-nav-btn primary full-width" onClick={handleSubmit} disabled={submitting || !pkgData}>
                {submitting ? <span className="pkg-spinner-sm" /> : null}
                {submitting ? "Emal olunur..." : `${totalPrice.toFixed(2)}₼ Ödənişə keç`}
              </button>
            </div>

            {/* Kart önizləməsi */}
            <div className="checkout-card-preview">
              <div className="checkout-preview-card">
                <div className="checkout-preview-head">
                  <p className="checkout-section-label">Kart dizaynı</p>
                {!isBasic && (
                  <button
                    type="button"
                    className="card-flip-btn checkout-flip-btn"
                    aria-label={flipped ? "Ön üzü göstər" : "Arxa üzü göstər"}
                    title={flipped ? "Ön üzü göstər" : "Arxa üzü göstər"}
                    onClick={() => setFlipped(f => !f)}
                  >
                    <FiRefreshCw />
                  </button>
                )}
                </div>

                {isBasic
                  ? <BasicCardPreview theme={cardTheme} />
                  : (
                    <CardPreview
                      theme={cardTheme} logo={cardLogo} name={cardName}
                      title={cardTitle} slogan={cardSlogan}
                      brandMode={cardBrandMode} brandName={cardBrandName}
                      flipped={flipped} onFlip={() => setFlipped(f => !f)}
                    />
                  )
                }
              </div>
            </div>
          </div>
          <div className="pkg-nav-row">
            <button className="pkg-nav-btn ghost" onClick={() => setStep(3)}><FiChevronLeft /> Geri</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PackageMain;
