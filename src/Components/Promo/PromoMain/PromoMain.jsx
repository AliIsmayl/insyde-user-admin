import React, { useState, useEffect, useRef } from "react";
import { API_BASE, authFetch, CK } from "../../../Utils/authUtils";
import "./PromoMain.scss";

function buildMockCode() {
  const base = (CK.get("user_code") || "").replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 6);
  return base ? `INS${base}` : "INS2025";
}

function normalizePlan(raw) {
  const v = String(raw || "").trim().toLowerCase();
  if (!v || v === "free") return "free";
  if (v.includes("pro") || v.includes("premium") || v.includes("business")) return "pro";
  if (v.includes("basic") || v.includes("standart") || v.includes("standard") || v.includes("sadə") || v.includes("sade")) return "basic";
  return v;
}

function PromoMain() {
  const [promoCode, setPromoCode] = useState("");
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [pendingAdmin, setPendingAdmin] = useState(false);
  const infoRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const [profileRes, orderRes, promoRes] = await Promise.allSettled([
          authFetch(`${API_BASE}/api/v1/profile/me/`),
          authFetch(`${API_BASE}/api/v1/orders/my/`),
          authFetch(`${API_BASE}/api/v1/promo/my/`),
        ]);

        // Admin təsdiqi yoxlaması
        if (profileRes.status === "fulfilled" && profileRes.value?.ok) {
          const pd = await profileRes.value.clone().json().catch(() => ({}));
          if (!(pd?.card?.is_admin_active ?? true)) {
            setPendingAdmin(true);
            setLoading(false);
            return;
          }
        }

        // Plan yoxlaması — profile + order hər ikisindən
        let resolvedPlan = "free";

        if (orderRes.status === "fulfilled" && orderRes.value?.ok) {
          const od = await orderRes.value.json().catch(() => ({}));
          const fromOrder = normalizePlan(
            od?.payment_info?.plan_type ||
            od?.payment_info?.plan_name ||
            od?.package_info?.package_type ||
            ""
          );
          if (fromOrder !== "free") resolvedPlan = fromOrder;
        }

        if (resolvedPlan === "free" && profileRes.status === "fulfilled" && profileRes.value?.ok) {
          const pd = await profileRes.value.json().catch(() => ({}));
          const d = pd?.data || pd;
          const sub = d?.subscription || {};
          const fromProfile = normalizePlan(
            sub.version_type || sub.packet_type || sub.plan?.name || ""
          );
          if (fromProfile !== "free") resolvedPlan = fromProfile;
        }

        setIsPro(resolvedPlan === "pro");

        // Promo məlumatları
        if (promoRes.status === "fulfilled" && promoRes.value?.ok) {
          const data = await promoRes.value.json().catch(() => ({}));
          setPromoCode(data.code || data.promo_code || buildMockCode());
          setEarnings(data.total_earnings ?? data.earnings ?? 0);
        } else {
          setPromoCode(buildMockCode());
          setEarnings(0);
        }
      } catch {
        setPromoCode(buildMockCode());
        setEarnings(0);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!infoOpen) return;
    const handler = (e) => {
      if (infoRef.current && !infoRef.current.contains(e.target)) setInfoOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [infoOpen]);

  const handleCopy = () => {
    if (!promoCode) return;
    navigator.clipboard.writeText(promoCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      const el = document.createElement("textarea");
      el.value = promoCode;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleShare = () => {
    if (!promoCode) return;
    const text = `INSYDE promo kodumdan istifadə edərək kart alışında endirim əldə et! 🎉\nKod: ${promoCode}`;
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => {
        setShared(true);
        setTimeout(() => setShared(false), 2500);
      });
    }
  };

  const earningsNum = earnings ?? 0;
  const canWithdraw = earningsNum >= 20;

  const HOW_IT_WORKS = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      ),
      title: "Müştəri üçün endirim",
      desc: "Promo kodunuzu paylaşdığınız şəxs kart alışında xüsusi endirim əldə edir. Bu, onların kart almaq üçün əla bir səbəbidir.",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
          <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      ),
      title: "Hər satışdan qazanc",
      desc: "Kodunuzla edilən hər kart alışından siz partnyorluq qazancı (PF) əldə edirsiniz. Qazanc paketə görə dəyişir — daha yüksək paket, daha cəlbedici qazanc.",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      ),
      title: "Abunəlikdən də qazanc",
      desc: "Abunəliklərə endirim tətbiq olunmur, lakin siz yenə də davamlı qazanc əldə edirsiniz. Hər aylıq abunəlik yeniləməsindən sizə pay düşür.",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
          <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
        </svg>
      ),
      title: "Daha yüksək paket = Daha çox qazanc",
      desc: "Standart paketdə qazanc sabit faizlə hesablanır. Pro paketdə isə qazanc daha cəlbedici olur. Paylaşdığınız hər müştəridən daha çox gəlir əldə edə bilərsiniz.",
    },
  ];

  if (pendingAdmin) {
    return (
      <div className="promo-main">
        <div className="pending-admin-banner">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <p>Sizin hesab admin tərəfindən təsdiqlənməyi gözləyir.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="promo-main">
      <div className="promo-top-header">
        <div>
          <h2 className="promo-page-title">Promo Proqramı</h2>
          <p className="promo-page-subtitle">Kodunuzu paylaşın, qazanın</p>
        </div>
      </div>

      <div className="promo-content">
        {/* ── Sol: izahat ── */}
        <div className="promo-left">
          <div className="promo-info-card">
            <div className="promo-info-header">
              <div className="promo-info-header-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <h3 className="promo-info-title">Promo Kod Sistemi necə işləyir?</h3>
            </div>

            <div className="promo-steps">
              {HOW_IT_WORKS.map((item, i) => (
                <div key={i} className="promo-step">
                  <div className="promo-step-icon">{item.icon}</div>
                  <div className="promo-step-body">
                    <p className="promo-step-title">{item.title}</p>
                    <p className="promo-step-desc">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="promo-summary-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
                <path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/>
              </svg>
              <p>Sistem həm müştəri üçün endirim, həm də siz üçün davamlı qazanc imkanı yaradır.</p>
            </div>
          </div>
        </div>

        {/* ── Sağ: kod + qazanc ── */}
        <div className="promo-right">
          {/* Promo Kod kartı */}
          <div className="promo-code-card">
            <div className="promo-code-card-header">
              <p className="promo-section-label" style={{ margin: 0 }}>Promo Kodunuz</p>
              <div className="promo-info-trigger-wrap" ref={infoRef}>
                <button
                  className="promo-info-trigger"
                  onClick={() => setInfoOpen(o => !o)}
                  aria-label="Harada istifadə edilir?"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  Harada istifadə edilir?
                </button>

                {infoOpen && (
                  <div className="promo-info-popup">
                    <div className="promo-info-popup-arrow" />
                    <p className="promo-info-popup-title">Promo kodu necə istifadə edilir?</p>
                    <ol className="promo-info-popup-steps">
                      <li>Menyudan <strong>Paketlər</strong> hissəsinə keçid edilir</li>
                      <li>Uyğun paket və ödəniş müddəti seçilir</li>
                      <li><strong>4-cü addımda</strong> — ödəniş mərhələsində — promo kod sahəsi görünür</li>
                      <li>Kod daxil edilib <strong>Tətbiq et</strong> seçilir</li>
                      <li>Endirim ödənilə biləcək məbləğə avtomatik əlavə olunur</li>
                    </ol>
                    <div className="promo-info-popup-note">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13">
                        <path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/>
                      </svg>
                      Endirim yalnız kart alışına tətbiq edilir, abunəliyə deyil.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {loading ? (
              <div className="promo-code-skeleton" />
            ) : isPro ? (
              <>
                <div className="promo-code-display">
                  <span className="promo-code-text">{promoCode}</span>
                </div>

                <div className="promo-code-actions">
                  <button
                    className={`promo-action-btn copy-btn ${copied ? "success" : ""}`}
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                          <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Kopyalandı!
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
                          <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                        Kopyala
                      </>
                    )}
                  </button>

                  <button
                    className={`promo-action-btn share-btn ${shared ? "success" : ""}`}
                    onClick={handleShare}
                  >
                    {shared ? (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                          <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Paylaşıldı!
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
                          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                        </svg>
                        Paylaş
                      </>
                    )}
                  </button>
                </div>

                <p className="promo-code-hint">
                  Kodu dostlarınızla paylaşın. Onlar endirim, siz qazanc əldə edin.
                </p>
              </>
            ) : (
              <div className="promo-locked-box">
                <div className="promo-locked-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="28" height="28">
                    <rect x="3" y="11" width="18" height="11" rx="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <p className="promo-locked-title">Promo Kod — Pro Xüsusiyyəti</p>
                <p className="promo-locked-desc">
                  Promo kod hissəsi yalnız <strong>Pro</strong> versiyada aktivləşir.
                  Standart paketin istifadəçiləri üçün bu funksiya mövcud deyil.
                </p>
                <a href="/packages" className="promo-locked-btn">
                  Pro-ya keçid et
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
              </div>
            )}
          </div>

          {/* Qazanc kartı */}
          <div className={`promo-earnings-card ${canWithdraw ? "can-withdraw" : ""}`}>
            <p className="promo-section-label">Qazanclarım</p>

            <div className="promo-earnings-amount">
              {loading ? (
                <div className="promo-earnings-skeleton" />
              ) : (
                <>
                  <span className="promo-amount-num">{earningsNum.toFixed(2)}</span>
                  <span className="promo-amount-cur">AZN</span>
                </>
              )}
            </div>

            <div className="promo-withdraw-progress">
              <div className="promo-progress-bar">
                <div
                  className="promo-progress-fill"
                  style={{ width: `${Math.min((earningsNum / 20) * 100, 100)}%` }}
                />
              </div>
              <div className="promo-progress-labels">
                <span>0 AZN</span>
                <span>20 AZN</span>
              </div>
            </div>

            {canWithdraw ? (
              <div className="promo-withdraw-ready">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/>
                </svg>
                <p>Ödəniş almaq üçün müraciət edə bilərsiniz!</p>
              </div>
            ) : (
              <div className="promo-withdraw-hint">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p>
                  Minimum <strong>20 AZN</strong> qazandıqdan sonra ödəniş əldə edə bilərsiniz.
                  {!loading && ` Hələ ${(20 - earningsNum).toFixed(2)} AZN qalır.`}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PromoMain;
