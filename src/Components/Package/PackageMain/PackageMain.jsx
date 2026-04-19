import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiCheck, FiX, FiChevronRight, FiChevronLeft, FiRefreshCw } from "react-icons/fi";
import { API_BASE, authFetch } from "../../../Utils/authUtils";
import "./PackageMain.scss";

const FLIP_HINT_SESSION_KEY = "insyde_package_flip_hint_seen";
const CARD_DRAFT_KEY = "insyde_card_draft";
const STEP_DRAFT_KEY = "insyde_step_draft";

function readCardDraft() {
  try {
    const r = localStorage.getItem(CARD_DRAFT_KEY);
    return r ? JSON.parse(r) : null;
  } catch {
    return null;
  }
}
function writeCardDraft(data) {
  try {
    localStorage.setItem(CARD_DRAFT_KEY, JSON.stringify(data));
  } catch { }
}

function readStepDraft() {
  try {
    const r = localStorage.getItem(STEP_DRAFT_KEY);
    return r ? JSON.parse(r) : null;
  } catch {
    return null;
  }
}
function writeStepDraft(data) {
  try {
    localStorage.setItem(STEP_DRAFT_KEY, JSON.stringify(data));
  } catch { }
}
function clearStepDraft() {
  try {
    localStorage.removeItem(STEP_DRAFT_KEY);
  } catch { }
}

const MANUAL_MODE = true;

const FALLBACK_PACKAGES = [
  { key: "basic", name: "Sadə", cardPrice: "12.90₼", monthlyRate: 1.5, color: "#6b7280", badge: null },
  { key: "pro", name: "Pro", cardPrice: "27.90₼", monthlyRate: 2.0, color: "#3b82f6", badge: "Populyar" },
];

const ALLOWED_PLANS = ["basic", "pro"];

const PKG_COLOR_MAP = { basic: "#6b7280", pro: "#3b82f6", premium: "#f59e0b" };
const PKG_BADGE_MAP = { basic: null, pro: "Populyar", premium: "Tam" };

function parseFeatures(raw) {
  if (!raw || !Array.isArray(raw) || raw.length === 0) return null;
  return raw.map((f) => {
    if (typeof f === "string") return { name: f, available: true };
    return {
      name: f.name || f.feature || f.title || f.label || String(f),
      available: f.is_available ?? f.available ?? f.included ?? true,
    };
  });
}

function mapPlan(p, idx) {
  const rawKey = p.key || p.slug || p.package_type || p.plan_type || "";
  let key = rawKey.toLowerCase();

  if (!key) {
    const nm = (p.name || p.display_name || "").toLowerCase();
    if (nm.includes("business") || nm.includes("biznes")) key = "business";
    else if (nm.includes("premium") || nm.includes("elit")) key = "premium";
    else if (nm.includes("pro")) key = "pro";
    else if (
      nm.includes("standart") ||
      nm.includes("standard") ||
      nm.includes("basic") ||
      nm.includes("sadə") ||
      nm.includes("sade")
    ) {
      key = "basic";
    } else {
      key = `plan-${idx}`;
    }
  }

  return {
    key,
    id: p.id ?? null,
    name: p.name || p.display_name || key,
    cardPrice: p.card_price
      ? `${parseFloat(p.card_price).toFixed(2)}₼`
      : p.price
        ? `${parseFloat(p.price).toFixed(2)}₼`
        : "—",
    monthlyRate: +(
      Math.round(
        (
          p.monthly_rate
            ? parseFloat(p.monthly_rate)
            : p.monthly_price
              ? parseFloat(p.monthly_price)
              : p.subscription_price
                ? parseFloat(p.subscription_price)
                : 0
        ) * 100
      ) / 100
    ).toFixed(2),
    color: p.color || PKG_COLOR_MAP[key] || "#6b7280",
    badge: p.badge || PKG_BADGE_MAP[key] || null,
    features: parseFeatures(p.features || p.plan_features || p.feature_list),
  };
}

const BILLING_OPTIONS = [
  { key: "monthly", label: "1 Aylıq", months: 1, discountRate: 0 },
  { key: "biannual", label: "6 Aylıq", months: 6, discountRate: 0.0855 },
  { key: "annual", label: "12 Aylıq", months: 12, discountRate: 0.0855 },
];

function calcTotal(monthlyRate, months, discountRate) {
  const raw = monthlyRate * months;
  return +(raw * (1 - discountRate)).toFixed(2);
}
function calcRaw(monthlyRate, months) {
  return +(monthlyRate * months).toFixed(2);
}

const FEATURES = [
  { name: "Sosial şəbəkə", basic: true, pro: true, premium: true },
  { name: "Əlaqə məlumatları", basic: true, pro: true, premium: true },
  { name: "Portfel / Kataloq", basic: true, pro: true, premium: true },
  { name: "NFC + QR sistem", basic: true, pro: true, premium: true },
  { name: "Fiziki kart", basic: true, pro: true, premium: true },
  { name: "Sistem analitikası", basic: false, pro: true, premium: true },
  { name: "Xüsusi dizayn", basic: false, pro: true, premium: true },
  { name: "Qablaşma", basic: false, pro: true, premium: true },
  { name: "Digital kart", basic: false, pro: false, premium: true },
];

const STEP_LABELS_FULL = ["Paket", "Müddət", "Kart", "Ödəniş"];
const STEP_LABELS_BASIC = ["Paket", "Müddət", "Rəng", "Ödəniş"];

function QrPlaceholder({ color = "currentColor" }) {
  const cell = 8;
  const gap = 2;
  const S = 7 * (cell + gap) - gap;
  const map = [
    [1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1],
  ];
  const inner = [
    [2, 2],
    [2, 4],
    [3, 3],
    [4, 2],
    [4, 4],
    [5, 3],
    [3, 5],
    [5, 5],
    [2, 6],
    [6, 2],
    [6, 4],
  ];

  return (
    <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
      {map.map((row, r) =>
        row.map((on, c) =>
          on ? (
            <rect
              key={`f-${r}-${c}`}
              x={c * (cell + gap)}
              y={r * (cell + gap)}
              width={cell}
              height={cell}
              rx={1}
              fill={color}
            />
          ) : null
        )
      )}
      {inner.map(([r, c], i) => (
        <rect
          key={`d-${i}`}
          x={c * (cell + gap)}
          y={r * (cell + gap)}
          width={cell}
          height={cell}
          rx={1}
          fill={color}
          opacity={0.7}
        />
      ))}
    </svg>
  );
}

function CardPreview({ theme, logo, name, title, slogan, brandMode, brandName, flipped, onFlip }) {
  const isDark = theme !== "light";
  const gold = isDark ? "#c9a84c" : "#b8942a";
  const bg = isDark ? "#0b0b0b" : "#f5f2ec";
  const text2 = isDark ? "rgba(255,255,255,0.45)" : "rgba(17,17,17,0.5)";
  const wmClr = isDark ? "rgba(201,168,76,0.07)" : "rgba(184,148,42,0.09)";

  const isQelib = brandMode !== "ferdi";
  const isFerdi = brandMode === "ferdi";
  const frontSlogan = isQelib ? "İlk təəssürat önəmlidir" : slogan?.trim() || "Öz şüarınız";
  const displayBrand = isFerdi && brandName?.trim() ? brandName.trim() : "Insyde";
  const isBrandCustom = isFerdi && brandName?.trim();

  return (
    <div className={`pkg-scene ${flipped ? "is-flipped" : ""}`} onClick={onFlip}>
      <div
        className="pkg-card"
        style={{
          "--card-bg": bg,
          "--card-gold": gold,
          "--card-text2": text2,
          "--card-wm": wmClr,
        }}
      >
        <div className="pkg-face pkg-front">
          <div className="pkg-front-topbar">
            <span className="pkg-tagline">{frontSlogan}</span>
            {isQelib && <span className="pkg-site">İnsyde.info</span>}
          </div>
          <div className={`pkg-brand-word${isBrandCustom ? " pkg-brand-custom" : ""}`}>{displayBrand}</div>
        </div>

        <div className="pkg-face pkg-back">
          <div className="pkg-wm" aria-hidden>
            Insyde
          </div>

          <div className="pkg-back-logo">
            {logo ? (
              <img src={logo} alt="logo" className="pkg-logo-img" />
            ) : (
              <span className="pkg-logo-placeholder">LOGO</span>
            )}
          </div>

          <div className="pkg-qr-wrap">
            <QrPlaceholder color={gold} />
          </div>

          <div className="pkg-back-info">
            <span className="pkg-back-name">{name || "Ad Soyad"}</span>
            <span className="pkg-back-title">{title || "Peşə / Vəzifə"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function BasicCardPreview({ theme = "dark" }) {
  const isDark = theme !== "light";
  const gold = isDark ? "#c9a84c" : "#b8942a";
  const bg = isDark ? "#0b0b0b" : "#f5f2ec";
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
        const num = i + 1;
        const done = num < current;
        const active = num === current;

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
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const cardDraft = readCardDraft();
  const stepDraft = readStepDraft();

  const [step, setStep] = useState(() => {
    if (stepDraft?.step) return stepDraft.step;
    return MANUAL_MODE ? 2 : 1;
  });

  const [selectedPkg, setSelectedPkg] = useState(() => stepDraft?.selectedPkg ?? null);
  const [selectedBilling, setSelectedBilling] = useState(() => stepDraft?.selectedBilling ?? "monthly");
  const [cardTheme, setCardTheme] = useState(() => cardDraft?.cardTheme ?? "dark");
  const [cardLogo, setCardLogo] = useState(null);
  const [cardLogoFile, setCardLogoFile] = useState(null);
  const [cardName, setCardName] = useState(() => cardDraft?.cardName ?? "");
  const [cardTitle, setCardTitle] = useState(() => cardDraft?.cardTitle ?? "");
  const [cardSlogan, setCardSlogan] = useState(() => cardDraft?.cardSlogan ?? "");
  const [cardBrandMode, setCardBrandMode] = useState(() => cardDraft?.cardBrandMode ?? "qelib");
  const [cardBrandName, setCardBrandName] = useState(() => cardDraft?.cardBrandName ?? "");
  const [flipped, setFlipped] = useState(false);
  const [showFlipHint, setShowFlipHint] = useState(false);

  const [packages, setPackages] = useState(FALLBACK_PACKAGES.filter((p) => ALLOWED_PLANS.includes(p.key)));
  const [currentSubData, setCurrentSubData] = useState(null);
  const [currentSub, setCurrentSub] = useState(null);
  const [nextPaymentDate, setNextPaymentDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successState, setSuccessState] = useState(null);
  const [redirectCount, setRedirectCount] = useState(3);
  const [error, setError] = useState("");

  useEffect(() => {
    const plansReq = authFetch(`${API_BASE}/api/plans/`);
    const profileReq = authFetch(`${API_BASE}/api/v1/profile/me/`);

    Promise.allSettled([plansReq, profileReq])
      .then(async ([plansRes, profileRes]) => {
        let allMappedPlans = null;

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
              allMappedPlans = arr.map((p, i) => mapPlan(p, i));
              const PLAN_ORDER = { basic: 0, pro: 1, premium: 2 };
              const filtered = allMappedPlans.filter((p) => ALLOWED_PLANS.includes(p.key));
              filtered.sort((a, b) => (PLAN_ORDER[a.key] ?? 99) - (PLAN_ORDER[b.key] ?? 99));
              setPackages(filtered);
            }
          } catch { }
        }

        let detectedSubKey = null;
        if (profileRes.status === "fulfilled" && profileRes.value?.ok) {
          try {
            const data = await profileRes.value.json();
            const d = data?.data || data;
            const info = d?.user_info || {};
            const draft = readCardDraft();

            if (!draft?.cardName) setCardName(info.name || "");
            if (!draft?.cardTitle) setCardTitle(info.work || "");

            const sub = d?.subscription || {};
            detectedSubKey = (sub.version_type || sub.packet_type || "free").toLowerCase();
            setCurrentSub(detectedSubKey);

            // Next payment date — try common field names
            const rawDate = sub.next_billing_date || sub.end_date || sub.expires_at
              || sub.renewal_date || sub.next_payment || sub.valid_until || null;
            if (rawDate) {
              try {
                const dt = new Date(rawDate);
                const MONTHS = ["yanvar","fevral","mart","aprel","may","iyun",
                                "iyul","avqust","sentyabr","oktyabr","noyabr","dekabr"];
                setNextPaymentDate(`${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`);
              } catch { /* ignore */ }
            }
          } catch { }
        }

        if (MANUAL_MODE) {
          if (!detectedSubKey || detectedSubKey === "free") {
            if (!stepDraft?.step) setStep(1);
          } else {
            const source = allMappedPlans || FALLBACK_PACKAGES;
            const found =
              source.find((p) => p.key === detectedSubKey) ||
              FALLBACK_PACKAGES.find((p) => p.key === detectedSubKey);

            if (found) setCurrentSubData(found);
            if (!stepDraft?.selectedPkg) setSelectedPkg(detectedSubKey);
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    writeStepDraft({ step, selectedPkg, selectedBilling });
  }, [step, selectedPkg, selectedBilling]);

  useEffect(() => {
    writeCardDraft({ cardTheme, cardName, cardTitle, cardSlogan, cardBrandMode, cardBrandName });
  }, [cardTheme, cardName, cardTitle, cardSlogan, cardBrandMode, cardBrandName]);

  useEffect(() => {
    if (!success || !successState) return;
    if (redirectCount <= 0) {
      navigate("/order", { state: successState });
      return;
    }
    const t = setTimeout(() => setRedirectCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [success, redirectCount, successState, navigate]);

  const isBasic = selectedPkg === "basic";
  const isFreeUser = !currentSub || currentSub === "free";
  const effectiveManual = MANUAL_MODE && !isFreeUser;
  const stepLabels = effectiveManual ? ["Müddət", "Ödəniş"] : isBasic ? STEP_LABELS_BASIC : STEP_LABELS_FULL;
  const uiStep = effectiveManual ? (step === 4 ? 2 : 1) : step;

  useEffect(() => {
    if ((!MANUAL_MODE || isFreeUser) && step === 3 && !isBasic) {
      const seen = sessionStorage.getItem(FLIP_HINT_SESSION_KEY);
      if (!seen) {
        sessionStorage.setItem(FLIP_HINT_SESSION_KEY, "true");
        setShowFlipHint(true);
      }
    }
  }, [step, isFreeUser, isBasic]);

  useEffect(() => {
    if (!showFlipHint) return undefined;
    const timer = setTimeout(() => setShowFlipHint(false), 5000);
    return () => clearTimeout(timer);
  }, [showFlipHint]);

  const pkgData = MANUAL_MODE
    ? packages.find((p) => p.key === selectedPkg) || currentSubData
    : packages.find((p) => p.key === selectedPkg);

  const billData = BILLING_OPTIONS.find((b) => b.key === selectedBilling);
  const rawPrice = pkgData && billData ? calcRaw(pkgData.monthlyRate, billData.months) : 0;
  const totalPrice = pkgData && billData ? calcTotal(pkgData.monthlyRate, billData.months, billData.discountRate) : 0;
  const savedAmount = +(rawPrice - totalPrice).toFixed(2);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCardLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setCardLogo(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");

    try {
      const form = new FormData();
      form.append("plan_id", pkgData?.id ?? "");
      form.append("duration_months", billData?.months ?? 1);
      form.append("card_color", cardTheme === "light" ? "white" : "black");

      if (!isBasic) {
        form.append("theme", cardTheme);
        form.append("card_full_name", cardName);
        form.append("card_position", cardTitle);
        const isTemplate = cardBrandMode === "qelib";
        form.append("is_template", isTemplate);
        if (!isTemplate) {
          form.append("slogan", cardSlogan || "");
          form.append("card_text", cardBrandName || "");
          if (cardLogoFile) form.append("card_logo", cardLogoFile);
        }
      }

      const res = await authFetch(`${API_BASE}/api/v1/orders/my/create/`, {
        method: "POST",
        body: form,
      });

      if (!res) {
        setError("Sessiya bitib.");
        return;
      }

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(body?.detail || body?.error || `Xəta: ${res.status}`);
        return;
      }

      clearStepDraft();
      localStorage.removeItem(CARD_DRAFT_KEY);
      setSuccessState({
        isNew: true,
        order_number: body?.order_number || body?.number || "",
        package_name: pkgData?.name || "",
        package_color: pkgData?.color || "#d4af37",
        billing_label: billData?.label || "",
        billing_months: billData?.months || 1,
        card_total: body?.card_price ?? body?.card_total ?? 0,
        monthly_total: totalPrice,
      });
      setSuccess(true);
    } catch {
      setError("Server ilə əlaqə kəsildi.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    clearStepDraft();
    localStorage.removeItem(CARD_DRAFT_KEY);
    setSuccess(false);
    setStep(1);
    setSelectedPkg(null);
    setSelectedBilling("monthly");
    setCardTheme("dark");
    setCardName("");
    setCardTitle("");
    setCardSlogan("");
    setCardBrandMode("qelib");
    setCardBrandName("");
    setCardLogo(null);
    setCardLogoFile(null);
  };

  if (success) {
    return (
      <div className="pkg-success-screen">
        <div className="pkg-success-card">
          <div className="pkg-success-glow" />

          <div className="pkg-success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="34" height="34">
              <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div className="pkg-success-badge">Sifariş qəbul edildi</div>

          <div className="pkg-success-heading">
            <h2>Ödəniş tamamlandı!</h2>
            <p className="pkg-success-sub">
              {successState?.package_name
                ? <><strong>{successState.package_name}</strong> paketi uğurla aktivləşdirildi.</>
                : "Paket uğurla aktivləşdirildi."}
            </p>
          </div>

          {successState?.order_number && (
            <div className="pkg-success-order-num">
              <span>Sifariş №</span>
              <strong>{successState.order_number}</strong>
            </div>
          )}

          <div className="pkg-success-details">
            {successState?.billing_label && (
              <div className="pkg-success-detail-row">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
                <span>Müddət</span>
                <strong>{successState.billing_label}</strong>
              </div>
            )}
            {successState?.monthly_total > 0 && (
              <div className="pkg-success-detail-row">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                </svg>
                <span>Ödənildi</span>
                <strong>{parseFloat(successState.monthly_total).toFixed(2)}₼</strong>
              </div>
            )}
          </div>

          <div className="pkg-success-divider" />

          <p className="pkg-success-redirect">
            {redirectCount} saniyə sonra sifarişlərinizə yönləndirilirsiniz...
          </p>

          <button
            className="pkg-success-btn"
            onClick={() => navigate("/order", { state: successState })}
          >
            Sifarişlərimə keç
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pkg-loading">
        <div className="pkg-spinner" />
      </div>
    );
  }

  // ── SUBSCRIBED USER LAYOUT ────────────────────────────────
  if (effectiveManual) {
    const currentPkg = currentSubData || packages.find((p) => p.key === currentSub);
    const otherPackages = packages.filter((p) => p.key !== currentSub);
    const currentFeatures = currentPkg?.features
      ? currentPkg.features
      : FEATURES.map((f) => ({ name: f.name, available: f[currentPkg?.key] ?? true }));

    // next payment date: selected billing months * 30 + 3 buffer days
    const calcNextPayDate = (months) => {
      const d = new Date();
      d.setDate(d.getDate() + months * 30 + 3);
      const MO = ["yanvar","fevral","mart","aprel","may","iyun","iyul","avqust","sentyabr","oktyabr","noyabr","dekabr"];
      return `${d.getDate()} ${MO[d.getMonth()]} ${d.getFullYear()}`;
    };

    const renewBillData = BILLING_OPTIONS.find((b) => b.key === selectedBilling);
    const renewRaw      = currentPkg ? calcRaw(currentPkg.monthlyRate, renewBillData?.months ?? 1) : 0;
    const renewTotal    = currentPkg ? calcTotal(currentPkg.monthlyRate, renewBillData?.months ?? 1, renewBillData?.discountRate ?? 0) : 0;
    const renewSaved    = +(renewRaw - renewTotal).toFixed(2);
    const nextPayDate   = calcNextPayDate(renewBillData?.months ?? 1);

    return (
      <div className="package-main-modern">
        <div className="pkg-top-header">
          <div>
            <h2 className="pkg-page-title">Ödəniş Planı</h2>
            <p className="pkg-page-subtitle">Abunəlik məlumatlarınız</p>
          </div>
        </div>

        <div className="pkg-subscribed-layout">
          {/* ── Sol: cari paket məlumatları ── */}
          <div className="pkg-subscribed-left">
            <div className="pkg-section">
              <h3 className="pkg-section-title">Sizin Paketiniz</h3>
              <div className="pkg-active-card" style={{ "--pkg-color": currentPkg?.color || "#d4af37" }}>
                <div className="pkg-active-header">
                  <div className="pkg-active-header-left">
                    <span className="pkg-is-badge">Aktiv paket</span>
                    <h2 className="pkg-active-name" style={{ color: currentPkg?.color }}>
                      {currentPkg?.name || "—"}
                    </h2>
                  </div>
                  <div className="pkg-active-price">
                    <span className="pkg-active-rate">{currentPkg?.monthlyRate?.toFixed(2) ?? "—"}₼</span>
                    <span className="pkg-active-rate-label">/ ay</span>
                  </div>
                </div>

                {nextPaymentDate && (
                  <div className="pkg-next-payment">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                    </svg>
                    Növbəti ödəniş: <strong>{nextPaymentDate}</strong>
                  </div>
                )}

                <div className="pkg-active-divider" />

                <div className="pkg-features-list">
                  {currentFeatures.map((feat, fi) => (
                    <div key={fi} className={`pkg-feat-row ${!feat.available ? "unavailable" : ""}`}>
                      {feat.available
                        ? <FiCheck className="feat-icon check" />
                        : <FiX className="feat-icon cross" />}
                      <span>{feat.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Digər paketlər */}
            {otherPackages.length > 0 && (
              <div className="pkg-section">
                <h3 className="pkg-section-title">Digər Paketlər</h3>
                <div className="pkg-cards-grid">
                  {otherPackages.map((pkg) => (
                    <div key={pkg.key} className="pkg-option-card pkg-info-only"
                      style={{ "--pkg-color": pkg.color, "--pkg-glow": `${pkg.color}30` }}>
                      {pkg.badge && <span className="pkg-badge" style={{ background: pkg.color }}>{pkg.badge}</span>}
                      <div className="pkg-card-top">
                        <h3 className="pkg-card-name" style={{ color: pkg.color }}>{pkg.name}</h3>
                        <div className="pkg-card-price">{pkg.cardPrice}</div>
                        <div className="pkg-card-rate">{pkg.monthlyRate.toFixed(2)}₼ / ay</div>
                      </div>
                      <div className="pkg-features-list">
                        {(pkg.features
                          ? pkg.features
                          : FEATURES.map((f) => ({ name: f.name, available: f[pkg.key] ?? true }))
                        ).map((feat, fi) => (
                          <div key={fi} className={`pkg-feat-row ${!feat.available ? "unavailable" : ""}`}>
                            {feat.available ? <FiCheck className="feat-icon check" /> : <FiX className="feat-icon cross" />}
                            <span>{feat.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Sağ: ödənişi uzat ── */}
          <div className="pkg-subscribed-right">
            <div className="pkg-renew-card">
              <h3 className="pkg-renew-title">Ödənişi Uzat</h3>
              <p className="pkg-renew-sub">
                Müddət seçin — ödəniş aktivliyin üzərinə əlavə olunur
              </p>

              <div className="billing-options">
                {BILLING_OPTIONS.map((opt) => {
                  const raw        = currentPkg ? calcRaw(currentPkg.monthlyRate, opt.months) : 0;
                  const discounted = currentPkg ? calcTotal(currentPkg.monthlyRate, opt.months, opt.discountRate) : 0;
                  const saved      = +(raw - discounted).toFixed(2);
                  const isSelected = selectedBilling === opt.key;
                  return (
                    <div key={opt.key} className={`billing-card ${isSelected ? "selected" : ""}`}
                      onClick={() => setSelectedBilling(opt.key)}>
                      <div className="billing-card-top">
                        <span className="billing-label">{opt.label}</span>
                        {opt.discountRate > 0 && (
                          <span className="billing-discount-badge">-{Math.round(opt.discountRate * 100)}%</span>
                        )}
                        {isSelected && <FiCheck className="billing-check" />}
                      </div>
                      <div className="billing-price-row">
                        <div className="billing-total">{currentPkg ? discounted : "—"}₼</div>
                        {saved > 0 && <div className="billing-original">{raw}₼</div>}
                      </div>
                      <div className="billing-rate">
                        {currentPkg ? currentPkg.monthlyRate.toFixed(2) : "—"}₼ × {opt.months} ay
                        {saved > 0 && <span className="billing-save-note"> ({saved.toFixed(2)}₼ qənaət)</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div className="pkg-renew-summary">
                <div className="pkg-renew-summary-row">
                  <span>Müddət</span>
                  <strong>{renewBillData?.label}</strong>
                </div>
                {renewSaved > 0 && (
                  <div className="pkg-renew-summary-row">
                    <span>Endirim</span>
                    <strong className="pkg-renew-save">-{renewSaved.toFixed(2)}₼</strong>
                  </div>
                )}
                <div className="pkg-renew-summary-row">
                  <span>Ödəniləcək məbləğ</span>
                  <strong className="pkg-renew-total">{renewTotal.toFixed(2)}₼</strong>
                </div>
                <div className="pkg-renew-divider" />
                <div className="pkg-renew-date-row">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                  </svg>
                  <span>Son ödəniş tarixi</span>
                  <strong>{nextPayDate}</strong>
                </div>
              </div>

              {error && <div className="checkout-error">{error}</div>}

              <button className="pkg-nav-btn primary full-width" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <span className="pkg-spinner-sm" /> : null}
                {submitting ? "Emal olunur..." : `${renewTotal.toFixed(2)}₼ Ödə`}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── FREE USER LAYOUT (unchanged) ──────────────────────────
  return (
    <div className="package-main-modern">
      <div className="pkg-top-header">
        <div>
          <h2 className="pkg-page-title">Ödəniş Planı</h2>
          <p className="pkg-page-subtitle">Ehtiyaclarınıza uyğun paketi seçin</p>
        </div>
      </div>

      <StepIndicator current={uiStep} labels={stepLabels} />

      {(!MANUAL_MODE || isFreeUser) && step === 1 && (
        <div className="pkg-step-content">
          <h3 className="pkg-step-title">Paket seçin</h3>

          <div className="pkg-cards-grid">
            {packages.map((pkg) => {
              const isCurrent = currentSub === pkg.key;
              const isSelected = selectedPkg === pkg.key;

              return (
                <div
                  key={pkg.key}
                  className={`pkg-option-card ${isSelected ? "selected" : ""} ${isCurrent ? "is-current" : ""}`}
                  style={{ "--pkg-color": pkg.color, "--pkg-glow": `${pkg.color}30` }}
                  onClick={() => setSelectedPkg(pkg.key)}
                >
                  {pkg.badge && (
                    <span className="pkg-badge" style={{ background: pkg.color }}>
                      {pkg.badge}
                    </span>
                  )}
                  {isCurrent && <span className="pkg-current-badge">Hazırkı Paket</span>}

                  <div className="pkg-card-top">
                    <h3 className="pkg-card-name" style={{ color: pkg.color }}>
                      {pkg.name}
                    </h3>
                    <div className="pkg-card-price">{pkg.cardPrice}</div>
                    <div className="pkg-card-rate">{pkg.monthlyRate.toFixed(2)}₼ / ay</div>
                  </div>

                  <div className="pkg-features-list">
                    {(pkg.features
                      ? pkg.features
                      : FEATURES.map((f) => ({ name: f.name, available: f[pkg.key] ?? true }))
                    ).map((feat, fi) => (
                      <div key={fi} className={`pkg-feat-row ${!feat.available ? "unavailable" : ""}`}>
                        {feat.available ? <FiCheck className="feat-icon check" /> : <FiX className="feat-icon cross" />}
                        <span>{feat.name}</span>
                      </div>
                    ))}
                  </div>

                  <div className={`pkg-select-indicator ${isSelected ? "on" : ""}`}>{isSelected ? <FiCheck /> : null}</div>
                </div>
              );
            })}
          </div>

          <div className="pkg-nav-row">
            <span />
            <button className="pkg-nav-btn primary" disabled={!selectedPkg} onClick={() => setStep(2)}>
              Təsdiq et <FiChevronRight />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="pkg-step-content">
          <h3 className="pkg-step-title">Ödəniş müddətini seçin</h3>
          <p className="pkg-step-sub">
            {MANUAL_MODE && pkgData ? (
              <>
                Mövcud paketiniz: <strong style={{ color: pkgData.color }}>{pkgData.name}</strong> ·{" "}
                {pkgData.monthlyRate.toFixed(2)}₼/ay — daha uzun müddət seçdikdə qiymət aşağı düşür
              </>
            ) : (
              "Daha uzun müddət seçdikdə qiymət aşağı düşür"
            )}
          </p>

          <div className="billing-options">
            {BILLING_OPTIONS.map((opt) => {
              const raw = pkgData ? calcRaw(pkgData.monthlyRate, opt.months) : 0;
              const discounted = pkgData ? calcTotal(pkgData.monthlyRate, opt.months, opt.discountRate) : 0;
              const saved = +(raw - discounted).toFixed(2);
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
                      <span className="billing-discount-badge">-{Math.round(opt.discountRate * 100)}%</span>
                    )}
                    {isSelected && <FiCheck className="billing-check" />}
                  </div>

                  <div className="billing-price-row">
                    <div className="billing-total">{pkgData ? discounted : "—"}₼</div>
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
              onClick={() => {
                setFlipped(false);
                setStep(effectiveManual ? 4 : 3);
              }}
            >
              Təsdiq et <FiChevronRight />
            </button>
          </div>
        </div>
      )}

      {(!MANUAL_MODE || isFreeUser) && step === 3 && isBasic && (
        <div className="pkg-step-content">
          <h3 className="pkg-step-title">Kart rəngini seçin</h3>
          <p className="pkg-step-sub">Standart paketdə kartınız qara və ya ağ rəngdə olacaq</p>

          <div className="basic-color-layout">
            <div className="basic-color-preview">
              <BasicCardPreview theme={cardTheme} />
              <p className="card-preview-hint">Seçilmiş rəng</p>
            </div>

            <div className="basic-color-options">
              <button
                className={`basic-color-btn ${cardTheme === "dark" ? "active" : ""}`}
                onClick={() => setCardTheme("dark")}
              >
                <div className="basic-color-swatch basic-swatch-dark" />
                <div className="basic-color-text">
                  <span className="basic-color-name">Qara</span>
                  <span className="basic-color-desc">Tünd fon, qızılı detal</span>
                </div>
                {cardTheme === "dark" && <FiCheck className="basic-color-check" />}
              </button>

              <button
                className={`basic-color-btn ${cardTheme === "light" ? "active" : ""}`}
                onClick={() => setCardTheme("light")}
              >
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
            <button className="pkg-nav-btn ghost" onClick={() => setStep(2)}>
              <FiChevronLeft /> Geri
            </button>
            <button className="pkg-nav-btn primary" onClick={() => setStep(4)}>
              Təsdiq et <FiChevronRight />
            </button>
          </div>
        </div>
      )}

      {(!MANUAL_MODE || isFreeUser) && step === 3 && !isBasic && (
        <div className="pkg-step-content">
          <div className="pkg-step-heading">
            <h3 className="pkg-step-title">Kart dizaynı</h3>
          </div>
          <p className="pkg-step-sub">Kart görünüşünü qısa və rahat formada tənzimlə</p>

          <div className="card-design-workspace">
            <div className="card-preview-panel">
              <button
                className="card-flip-icon-btn"
                onClick={() => setFlipped((f) => !f)}
                aria-label="Kartı fırla"
                title="Kartı fırla"
                type="button"
              >
                <FiRefreshCw />
              </button>

              <p className="card-preview-label">Ön / arxa</p>

              <CardPreview
                theme={cardTheme}
                logo={cardLogo}
                name={cardName}
                title={cardTitle}
                slogan={cardSlogan}
                brandMode={cardBrandMode}
                brandName={cardBrandName}
                flipped={flipped}
                onFlip={() => setFlipped((f) => !f)}
              />

              <p className="card-preview-hint">İkona və ya karta klik edin</p>
            </div>

            <div className="card-controls-panel">
              <div className="card-controls-grid">
                <div className="card-ctrl-field">
                  <label>Tema</label>
                  <div className="card-theme-toggle">
                    {["dark", "light"].map((t) => (
                      <button
                        key={t}
                        type="button"
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
                  <label>Rejim</label>
                  <div className="card-brand-toggle">
                    <button
                      type="button"
                      className={cardBrandMode === "qelib" ? "active" : ""}
                      onClick={() => setCardBrandMode("qelib")}
                    >
                      Qəlib
                    </button>
                    <button
                      type="button"
                      className={cardBrandMode === "ferdi" ? "active" : ""}
                      onClick={() => setCardBrandMode("ferdi")}
                    >
                      Fərdi
                    </button>
                  </div>
                </div>

                {cardBrandMode === "ferdi" && (
                  <>
                    <div className="card-ctrl-field">
                      <label>Şüar</label>
                      <input
                        className="card-ctrl-input"
                        value={cardSlogan}
                        onChange={(e) => setCardSlogan(e.target.value)}
                        placeholder="Şüar"
                        maxLength={40}
                      />
                    </div>

                    <div className="card-ctrl-field">
                      <label>Yazı</label>
                      <input
                        className="card-ctrl-input"
                        value={cardBrandName}
                        onChange={(e) => setCardBrandName(e.target.value)}
                        placeholder="Kart yazısı"
                        maxLength={20}
                      />
                    </div>
                  </>
                )}

                <div className="card-ctrl-field full-width">
                  <label>Logo</label>
                  <div className="card-upload-area" onClick={() => fileRef.current?.click()}>
                    {cardLogo ? (
                      <img src={cardLogo} alt="logo" className="card-upload-preview" />
                    ) : (
                      <div className="card-upload-placeholder">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="24">
                          <path d="M3 16.5V19a2 2 0 002 2h14a2 2 0 002-2v-2.5" strokeLinecap="round" />
                          <path d="M12 3v13M8 7l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>Logo yüklə</span>
                      </div>
                    )}
                  </div>

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleLogoUpload}
                  />

                  {cardLogo && (
                    <button
                      type="button"
                      className="card-remove-btn"
                      onClick={() => {
                        setCardLogo(null);
                        setCardLogoFile(null);
                      }}
                    >
                      Sil
                    </button>
                  )}
                </div>

                <div className="card-ctrl-field">
                  <label>Ad soyad</label>
                  <input
                    className="card-ctrl-input"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Ad soyad"
                  />
                </div>

                <div className="card-ctrl-field">
                  <label>Vəzifə</label>
                  <input
                    className="card-ctrl-input"
                    value={cardTitle}
                    onChange={(e) => setCardTitle(e.target.value)}
                    placeholder="Vəzifə"
                  />
                </div>
              </div>

              <button type="button" className="card-flip-btn" onClick={() => setFlipped((f) => !f)}>
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

      {step === 4 && (
        <div className="pkg-step-content">
          <h3 className="pkg-step-title">Sifarişi təsdiqləyin</h3>

          <div className="checkout-layout">
            <div className="checkout-summary">
              <div className="checkout-card">
                <p className="checkout-section-label">Paket məlumatları</p>

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

              {(!MANUAL_MODE || isFreeUser) && isBasic && (
                <div className="checkout-card">
                  <p className="checkout-section-label">Kart rəngi</p>
                  <div className="checkout-row">
                    <span>Seçilmiş rəng</span>
                    <strong>{cardTheme === "dark" ? "Qara" : "Ağ"}</strong>
                  </div>
                </div>
              )}

              {(!MANUAL_MODE || isFreeUser) && !isBasic && (
                <div className="checkout-card">
                  <p className="checkout-section-label">Kart məlumatları</p>

                  <div className="checkout-row">
                    <span>Tema</span>
                    <strong>{cardTheme === "dark" ? "Tünd" : "Açıq"}</strong>
                  </div>

                  <div className="checkout-row">
                    <span>Dizayn rejimi</span>
                    <strong>{cardBrandMode === "ferdi" ? "Fərdi" : "Qəlib"}</strong>
                  </div>

                  {cardBrandMode === "ferdi" && (
                    <>
                      <div className="checkout-row">
                        <span>Şüar</span>
                        <strong>{cardSlogan || "—"}</strong>
                      </div>
                      <div className="checkout-row">
                        <span>Kart yazısı</span>
                        <strong>{cardBrandName || "—"}</strong>
                      </div>
                    </>
                  )}

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
                    {cardLogo ? (
                      <div className="checkout-logo-wrap">
                        <img src={cardLogo} alt="logo" className="checkout-logo-thumb" />
                        <strong>Yüklənib</strong>
                      </div>
                    ) : (
                      <strong>Yoxdur</strong>
                    )}
                  </div>
                </div>
              )}

              {error && <div className="checkout-error">{error}</div>}

              <button className="pkg-nav-btn primary full-width" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <span className="pkg-spinner-sm" /> : null}
                {submitting ? "Emal olunur..." : `${totalPrice}₼ Ödənişə keç`}
              </button>
            </div>

            {(!MANUAL_MODE || isFreeUser) && (
              <div className="checkout-preview">
                <p className="checkout-section-label">Kartınızın görünüşü</p>

                {isBasic ? (
                  <>
                    <BasicCardPreview theme={cardTheme} />
                    <p className="checkout-upgrade-hint">Kartın dizaynını digər paketdə xüsusiləşdirə bilərsiniz.</p>
                  </>
                ) : (
                  <>
                    <button
                      className="checkout-flip-btn"
                      onClick={() => setFlipped((f) => !f)}
                      type="button"
                      aria-label="Kartı fırla"
                      title="Kartı fırla"
                    >
                      <FiRefreshCw />
                    </button>

                    <CardPreview
                      theme={cardTheme}
                      logo={cardLogo}
                      name={cardName}
                      title={cardTitle}
                      slogan={cardSlogan}
                      brandMode={cardBrandMode}
                      brandName={cardBrandName}
                      flipped={flipped}
                      onFlip={() => setFlipped((f) => !f)}
                    />

                    <p className="card-preview-hint">Kartın üzərinə klik edib çevirin</p>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="pkg-nav-row">
            <button className="pkg-nav-btn ghost" onClick={() => setStep(effectiveManual ? 2 : 3)}>
              <FiChevronLeft /> Geri
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PackageMain;