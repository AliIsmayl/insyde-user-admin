import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_BASE, authFetch } from "../../../Utils/authUtils";
import "./OrderMain.scss";

const MONTHS_AZ = [
  "yanvar","fevral","mart","aprel","may","iyun",
  "iyul","avqust","sentyabr","oktyabr","noyabr","dekabr",
];
function fmtDate(d) {
  if (!d) return "—";
  const dt = d instanceof Date ? d : new Date(d);
  return `${dt.getDate()} ${MONTHS_AZ[dt.getMonth()]}`;
}
function fmtDateTime(d) {
  if (!d) return "—";
  const dt = d instanceof Date ? d : new Date(d);
  const h = String(dt.getHours()).padStart(2, "0");
  const m = String(dt.getMinutes()).padStart(2, "0");
  return `${dt.getDate()} ${MONTHS_AZ[dt.getMonth()]}, ${h}:${m}`;
}
function getNextWeekend() {
  const d = new Date();
  const day = d.getDay();
  const daysToSat = day === 6 ? 7 : day === 0 ? 6 : 6 - day;
  const sat = new Date(d); sat.setDate(d.getDate() + daysToSat);
  const sun = new Date(sat); sun.setDate(sat.getDate() + 1);
  return { sat, sun };
}

const METRO_STATIONS = [
  { id: "28may", label: "28 May" },
  { id: "genclik", label: "Gənclik" },
];
const TIME_SLOTS = [
  { label: "10:00 – 12:00", value: "10:00-12:00" },
  { label: "13:00 – 16:00", value: "13:00-16:00" },
  { label: "17:00 – 20:00", value: "17:00-20:00" },
];

const STATIC_TIMELINE = [
  { status: "ordered",   label: "Sifariş qəbul edildi", is_done: true,  is_current: false },
  { status: "printing",  label: "Hazırlanır",            is_done: false, is_current: true  },
  { status: "courier",   label: "Kuryerdə",              is_done: false, is_current: false },
  { status: "delivered", label: "Çatdırıldı",            is_done: false, is_current: false },
];

function StageIcon({ stageKey }) {
  const icons = {
    ordered:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
    printing:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><rect x="6" y="2" width="12" height="8"/><rect x="6" y="14" width="12" height="8"/><path d="M4 8h16v8H4z"/><circle cx="18" cy="12" r="1" fill="currentColor"/></svg>,
    courier:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
    delivered: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  };
  return icons[stageKey] || null;
}

function OrderMain() {
  const location = useLocation();
  const navigate = useNavigate();
  const newOrder = location.state?.isNew ? location.state : null;

  const [cardId, setCardId]       = useState(null);
  const [delivery, setDelivery]   = useState(null);
  const [orderInfo, setOrderInfo] = useState(null);
  const [loading, setLoading]     = useState(true);

  const [showPastDetail, setShowPastDetail] = useState(false);
  const [pendingMode, setPendingMode]       = useState(false);

  // delivery form
  const [deliveryTab, setDeliveryTab]       = useState("metro");
  const [selectedStation, setSelectedStation] = useState(null);
  const [selectedSlot, setSelectedSlot]     = useState("");
  const [phone, setPhone]                   = useState("");
  const [address, setAddress]               = useState("");
  const [note, setNote]                     = useState("");
  const [submitLoading, setSubmitLoading]   = useState(false);
  const [submitError, setSubmitError]       = useState("");

  // after confirmation
  const [staticOrder, setStaticOrder]       = useState(null);
  const [showConfirmed, setShowConfirmed]   = useState(false);
  const [confCount, setConfCount]           = useState(3);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const profileRes = await authFetch(`${API_BASE}/api/v1/profile/me/`);
        if (!profileRes?.ok) { setLoading(false); return; }
        const profileData = await profileRes.json();
        const d = profileData?.data || profileData;
        const cid = d?.card?.id;
        if (!cid) { setLoading(false); return; }
        setCardId(cid);

        const sub = d?.subscription || {};
        const plan = sub?.plan || {};
        setOrderInfo({
          package_name:   plan?.name || sub?.version_type || "—",
          package_color:  plan?.color || "#d4af37",
          card_total:     plan?.card_price   ? parseFloat(plan.card_price)   : null,
          monthly_total:  plan?.monthly_rate ? parseFloat(plan.monthly_rate) : null,
          billing_label:  sub?.billing_label  || "Aylıq",
          billing_months: sub?.billing_months || 1,
        });

        if (!newOrder) {
          const deliveryRes = await authFetch(`${API_BASE}/api/v1/deliveries/by-order/${cid}/`);
          if (deliveryRes?.ok) {
            const data = await deliveryRes.json();
            setDelivery(data);
            setShowPastDetail(true);
          }
        }
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // auto-close confirmed screen
  useEffect(() => {
    if (!showConfirmed) return;
    if (confCount <= 0) {
      setShowConfirmed(false);
      setShowPastDetail(true);
      return;
    }
    const t = setTimeout(() => setConfCount(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [showConfirmed, confCount]);

  const handleConfirm = async () => {
    if (!cardId) return;
    setSubmitLoading(true);
    setSubmitError("");

    const isMetro = deliveryTab === "metro";
    const cleanPhone = phone.replace(/\D/g, "").replace(/^0+/, "");

    if (phone.trim() && cleanPhone.length !== 9) {
      setSubmitError("Telefon nömrəsi düzgün deyil. Nümunə: 50 123 45 67");
      setSubmitLoading(false);
      return;
    }

    const body = {
      order_id: cardId,
      delivery_type: isMetro ? "metro" : "address",
      time_interval: selectedSlot,
      ...(isMetro ? { metro_station: selectedStation?.label } : { address: address.trim() || "—" }),
      phone: cleanPhone.length === 9 ? `+994${cleanPhone}` : "",
      note: note.trim(),
    };

    try {
      const res = await authFetch(`${API_BASE}/api/v1/deliveries/create/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res?.ok) {
        const err = await res?.json().catch(() => ({}));
        if (err && typeof err === "object" && !err.detail && !err.error) {
          const fieldErrors = Object.entries(err)
            .map(([field, msgs]) => {
              const label = field === "phone" ? "Telefon" : field === "note" ? "Qeyd" : field;
              const msg = Array.isArray(msgs) ? msgs[0] : msgs;
              return `${label}: ${msg}`;
            })
            .join(" | ");
          setSubmitError(fieldErrors || "Xəta baş verdi.");
        } else {
          setSubmitError(err?.detail || err?.error || "Xəta baş verdi.");
        }
        return;
      }

      const now = new Date();
      const orderNum = `${Math.floor(Math.random() * 9000) + 1000}`;
      setStaticOrder({
        order_number:           orderNum,
        delivery_type:          deliveryTab,
        location:               isMetro ? selectedStation?.label : address,
        time_interval:          selectedSlot,
        phone:                  cleanPhone.length === 9 ? `+994${cleanPhone}` : "",
        note:                   note.trim(),
        created_at:             now.toISOString(),
        current_status:         "ordered",
        current_status_display: "Qəbul edildi",
        timeline:               STATIC_TIMELINE.map(s => ({ ...s, changed_at: s.is_done ? now.toISOString() : null })),
      });
      setPendingMode(false);
      setShowConfirmed(true);
      setConfCount(3);
    } catch {
      setSubmitError("Server ilə əlaqə kəsildi.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const resetDeliveryForm = () => {
    setDeliveryTab("metro");
    setSelectedStation(null);
    setSelectedSlot("");
    setPhone("");
    setAddress("");
    setNote("");
    setSubmitError("");
  };

  if (loading) {
    return (
      <div className="order-loading">
        <div className="order-spinner" />
      </div>
    );
  }

  // ── CONFIRMED SCREEN ──────────────────────────────────────
  if (showConfirmed && staticOrder) {
    return (
      <div className="order-confirmed-screen">
        <div className="order-confirmed-card">
          <div className="order-confirmed-glow" />

          <div className="order-confirmed-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="32" height="32">
              <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <div className="order-confirmed-badge">Sifariş qəbul edildi</div>
          <h2>Çox sağ olun!</h2>
          <p className="order-confirmed-sub">
            Sifarişiniz uğurla qeydə alındı. Kuryer ən yaxın həftə sonu çatdırma həyata keçirəcək.
          </p>

          <div className="order-confirmed-num-box">
            <span>Sifariş №</span>
            <strong>{staticOrder.order_number}</strong>
          </div>

          <div className="order-confirmed-delivery-summary">
            <div className="ocd-row">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                {staticOrder.delivery_type === "metro"
                  ? <><circle cx="12" cy="12" r="9"/><path d="M8 12l2.5 2.5L16 9"/></>
                  : <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></>
                }
              </svg>
              <span>{staticOrder.delivery_type === "metro" ? "Metro" : "Ünvan"}</span>
              <strong>{staticOrder.location}</strong>
            </div>
            <div className="ocd-row">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>Vaxt</span>
              <strong>{staticOrder.time_interval}</strong>
            </div>
            {staticOrder.phone && (
              <div className="ocd-row">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.5 9.87a19.79 19.79 0 01-3.07-8.68A2 2 0 012.41 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.06 6.06l1.27-.76a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                </svg>
                <span>Nömrə</span>
                <strong>{staticOrder.phone}</strong>
              </div>
            )}
          </div>

          <div className="order-confirmed-divider" />

          <p className="order-confirmed-redirect">{confCount} saniyə sonra sifarişinizə keçilir...</p>
          <button className="order-confirmed-btn" onClick={() => { setShowConfirmed(false); setShowPastDetail(true); }}>
            Sifarişimi gör
          </button>
        </div>
      </div>
    );
  }

  const { sat, sun } = getNextWeekend();
  const canConfirmMetro   = selectedStation && selectedSlot;
  const canConfirmAddress = address.trim() && selectedSlot;

  // ── Delivery form ─────────────────────────────────────────
  const DeliveryForm = (
    <div className="delivery-form-wrap">
      <h3 className="delivery-form-title">Çatdırılma məntəqəsini seç</h3>

      <div className="delivery-tabs">
        <button className={`tab-btn ${deliveryTab === "metro" ? "active" : ""}`} onClick={() => setDeliveryTab("metro")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><circle cx="12" cy="12" r="9"/><path d="M8 12l2.5 2.5L16 9"/></svg>
          Metro
        </button>
        <button className={`tab-btn ${deliveryTab === "address" ? "active" : ""}`} onClick={() => setDeliveryTab("address")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          Ünvana
        </button>
      </div>

      {submitError && <div className="order-error-msg">{submitError}</div>}

      {deliveryTab === "metro" && (
        <div className="delivery-tab-content">
          <p className="field-label">Metro stansiyası</p>
          <div className="station-cards">
            {METRO_STATIONS.map((st) => (
              <button key={st.id} className={`station-card ${selectedStation?.id === st.id ? "selected" : ""}`}
                onClick={() => { setSelectedStation(st); setSelectedSlot(""); }}>
                <span className="station-icon">M</span>
                <span className="station-name">{st.label}</span>
              </button>
            ))}
          </div>

          {selectedStation && (
            <>
              <p className="field-label">Vaxt intervalı</p>
              <div className="slot-list">
                {TIME_SLOTS.map((slot) => (
                  <button key={slot.value} className={`slot-card ${selectedSlot === slot.value ? "selected" : ""}`}
                    onClick={() => setSelectedSlot(slot.value)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {slot.label}
                  </button>
                ))}
              </div>
            </>
          )}

          <p className="field-label">Əlaqə nömrəsi</p>
          <div className="phone-input-wrap">
            <span className="phone-prefix">+994</span>
            <input type="tel" className="phone-input" placeholder="50 123 45 67"
              value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))} />
          </div>

          <p className="field-label">Qeyd (istəyə bağlı)</p>
          <textarea className="note-textarea" placeholder="Kuryer üçün əlavə məlumat..."
            value={note} onChange={(e) => setNote(e.target.value)} rows={3} />

          {canConfirmMetro && (
            <button className="confirm-btn" onClick={handleConfirm} disabled={submitLoading}>
              {submitLoading ? "Göndərilir..." : "Sifarişi təsdiqlə"}
            </button>
          )}
        </div>
      )}

      {deliveryTab === "address" && (
        <div className="delivery-tab-content">
          <p className="field-label">Ünvan</p>
          <input type="text" className="address-input" placeholder="Küçə, bina, mənzil nömrəsi..."
            value={address} onChange={(e) => setAddress(e.target.value)} />

          <p className="field-label">Vaxt intervalı</p>
          <div className="slot-list">
            {TIME_SLOTS.map((slot) => (
              <button key={slot.value} className={`slot-card ${selectedSlot === slot.value ? "selected" : ""}`}
                onClick={() => setSelectedSlot(slot.value)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {slot.label}
              </button>
            ))}
          </div>

          <p className="field-label">Əlaqə nömrəsi</p>
          <div className="phone-input-wrap">
            <span className="phone-prefix">+994</span>
            <input type="tel" className="phone-input" placeholder="50 123 45 67"
              value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))} />
          </div>

          <p className="field-label">Qeyd (istəyə bağlı)</p>
          <textarea className="note-textarea" placeholder="Kuryer üçün əlavə məlumat..."
            value={note} onChange={(e) => setNote(e.target.value)} rows={3} />

          <div className="courier-note">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            <p>Çatdırılma kuryer vasitəsilə həyata keçirilir. Sifarişiniz yola çıxanda kuryerimiz sizinlə əlaqə saxlayıb çatdırılma haqqı barədə məlumat verəcək.</p>
          </div>

          {canConfirmAddress && (
            <button className="confirm-btn" onClick={handleConfirm} disabled={submitLoading}>
              {submitLoading ? "Göndərilir..." : "Sifarişi təsdiqlə"}
            </button>
          )}
        </div>
      )}
    </div>
  );

  // ── NEW ORDER / PENDING MODE ──────────────────────────────
  const activeNewOrder = newOrder || (pendingMode ? {
    order_number: "",
    package_name:   orderInfo?.package_name   || "—",
    package_color:  orderInfo?.package_color  || "#d4af37",
    billing_label:  orderInfo?.billing_label  || "—",
    billing_months: orderInfo?.billing_months || 1,
    card_total:     orderInfo?.card_total,
    monthly_total:  orderInfo?.monthly_total,
  } : null);

  if (activeNewOrder) {
    const cardTotal    = activeNewOrder.card_total    != null ? parseFloat(activeNewOrder.card_total)    : null;
    const monthlyTotal = activeNewOrder.monthly_total != null ? parseFloat(activeNewOrder.monthly_total) : null;

    return (
      <div className="orders-wrap">
        <div className="new-order-page">
          <div className="new-order-left">
            <div className="new-order-summary">
              <div className="new-order-summary-row main-row">
                <span className="nos-count">1 ədəd kart</span>
                <span className="nos-sep">·</span>
                <span className="nos-period">{activeNewOrder.billing_months} aylıq aktivlik</span>
              </div>
              <div className="new-order-summary-row sub-row">
                <span>Sifariş №: <strong>{activeNewOrder.order_number || "—"}</strong></span>
                <span className="nos-pkg" style={{ color: activeNewOrder.package_color }}>
                  {activeNewOrder.package_name}
                </span>
              </div>
              <div className="new-order-price-split">
                <div className="nos-price-item">
                  <span>Kart qiyməti</span>
                  <strong>{cardTotal != null ? `${cardTotal.toFixed(2)}₼` : "—"}</strong>
                </div>
                <div className="nos-price-sep" />
                <div className="nos-price-item">
                  <span>Abunəlik ({activeNewOrder.billing_label})</span>
                  <strong>{monthlyTotal != null ? `${monthlyTotal.toFixed(2)}₼` : "—"}</strong>
                </div>
                {cardTotal != null && monthlyTotal != null && (
                  <>
                    <div className="nos-price-sep" />
                    <div className="nos-price-item nos-price-total">
                      <span>Cəmi</span>
                      <strong>{(cardTotal + monthlyTotal).toFixed(2)}₼</strong>
                    </div>
                  </>
                )}
              </div>
            </div>

            {DeliveryForm}
          </div>

          <div className="new-order-right">
            <div className="delivery-date-card">
              <div className="ddc-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="26" height="26">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
              </div>
              <h4 className="ddc-title">Çatdırılma tarixi</h4>
              <p className="ddc-dates">
                <strong>{fmtDate(sat)}, Şənbə</strong><br />
                <span>və ya</span><br />
                <strong>{fmtDate(sun)}, Bazar</strong>
              </p>
              <p className="ddc-note">Kartınız ən yaxın həftə sonu çatdırılacaq.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── PAST ORDERS LIST MODE ─────────────────────────────────
  const effectiveDelivery = delivery || (staticOrder ? {
    order_number:           staticOrder.order_number,
    current_status:         staticOrder.current_status,
    current_status_display: staticOrder.current_status_display,
    timeline:               staticOrder.timeline,
    created_at:             staticOrder.created_at,
    delivery_type:          staticOrder.delivery_type,
    location:               staticOrder.location,
    time_interval:          staticOrder.time_interval,
    phone:                  staticOrder.phone,
    note:                   staticOrder.note,
  } : null);

  const hasPendingAddress = cardId && !delivery && !staticOrder;
  const hasPastOrder      = !!effectiveDelivery;
  const orderCount        = (hasPendingAddress ? 1 : 0) + (hasPastOrder ? 1 : 0);

  const timeline      = effectiveDelivery?.timeline || [];
  const currentStatus = effectiveDelivery?.current_status;
  const cardTotal     = orderInfo?.card_total;
  const monthlyTotal  = orderInfo?.monthly_total;

  return (
    <div className="orders-wrap">
      <div className="orders-page">
        {/* ── Sol: sifariş siyahısı ── */}
        <div className="orders-left">
          <div className="orders-header">
            <h2 className="orders-title">Sifarişlərim</h2>
            <p className="orders-subtitle">{orderCount} sifariş</p>
          </div>

          <div className="orders-list">
            {hasPendingAddress && (
              <button className="pending-address-card" type="button"
                onClick={() => { resetDeliveryForm(); setPendingMode(true); navigate(location.pathname, { replace: true, state: { isNew: true, ...orderInfo } }); }}>
                <div className="pending-address-card__top">
                  <span className="pending-address-card__label">Ünvan gözləyən sifariş</span>
                  <span className="order-badge status-accepted">Ünvan seç</span>
                </div>
                <div className="pending-address-card__num">№ —</div>
                <div className="pending-address-card__meta">
                  <span>1 kart</span>
                  {cardTotal != null && (
                    <span>
                      {cardTotal.toFixed(2)}₼ kart
                      {monthlyTotal != null ? ` + ${monthlyTotal.toFixed(2)}₼ abunə` : ""}
                    </span>
                  )}
                </div>
              </button>
            )}

            {hasPastOrder && (
              <div className={`order-card ${showPastDetail ? "active" : ""}`} onClick={() => setShowPastDetail(true)}>
                <div className="order-card-top">
                  <span className="order-card-num">№ {effectiveDelivery.order_number || "—"}</span>
                  <span className={`order-badge status-${currentStatus}`}>
                    {effectiveDelivery.current_status_display || currentStatus}
                  </span>
                </div>
                <div className="order-card-pkg" style={{ color: orderInfo?.package_color }}>
                  {orderInfo?.package_name} paketi
                </div>
                <div className="order-card-meta">
                  <span>1 kart</span>
                  {cardTotal != null && (
                    <span>
                      {cardTotal.toFixed(2)}₼ kart
                      {monthlyTotal != null ? ` + ${monthlyTotal.toFixed(2)}₼ abunə` : ""}
                    </span>
                  )}
                  {effectiveDelivery.created_at && <span>{fmtDate(effectiveDelivery.created_at)}</span>}
                </div>
              </div>
            )}

            {orderCount === 0 && (
              <div className="orders-empty">
                <div className="orders-empty-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="36" height="36"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                </div>
                <p>Hələ sifariş yoxdur</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Sağ: sifariş detalları ── */}
        <div className="orders-right">
          {hasPastOrder && showPastDetail ? (
            <>
              <div className="order-detail-header">
                <div>
                  <h3 className="order-detail-title">Sifariş detalları</h3>
                  <p className="order-detail-sub">
                    №: <strong>{effectiveDelivery.order_number}</strong>
                    {effectiveDelivery.created_at && ` · ${fmtDateTime(effectiveDelivery.created_at)}`}
                  </p>
                </div>
                <span className={`order-badge status-${currentStatus}`}>
                  {effectiveDelivery.current_status_display || currentStatus}
                </span>
              </div>

              <div className="order-detail-body">
                {/* Timeline */}
                <div className="order-timeline-card">
                  <p className="detail-section-label">Sifariş statusu</p>
                  <div className="order-timeline">
                    {timeline.map((stage, idx) => {
                      const isDone   = stage.is_done && !stage.is_current;
                      const isActive = stage.is_current;
                      return (
                        <React.Fragment key={stage.status}>
                          <div className={`stage-row ${isDone ? "done" : ""} ${isActive ? "active" : ""}`}>
                            <div className={`stage-circle ${isDone ? "done" : isActive ? "active" : "pending"}`}>
                              {isDone
                                ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="15" height="15"><polyline points="20 6 9 17 4 12"/></svg>
                                : <StageIcon stageKey={stage.status} />}
                            </div>
                            <div className="stage-info">
                              <span className="stage-label">{stage.label}</span>
                              {stage.changed_at && (
                                <span className={`stage-time ${stage.is_done ? "actual" : "estimated"}`}>
                                  {fmtDateTime(stage.changed_at)}
                                </span>
                              )}
                            </div>
                          </div>
                          {idx < timeline.length - 1 && (
                            <div className={`stage-connector ${isDone ? "done" : ""}`} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Info cards */}
                <div className="order-info-col">
                  {/* Package info */}
                  <div className="order-info-card">
                    <p className="detail-section-label">Sifariş məlumatları</p>
                    <div className="detail-row">
                      <span>Paket</span>
                      <strong style={{ color: orderInfo?.package_color }}>{orderInfo?.package_name}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Kart sayı</span>
                      <strong>1 ədəd</strong>
                    </div>
                    {cardTotal != null && (
                      <div className="detail-row">
                        <span>Kart qiyməti</span>
                        <strong>{cardTotal.toFixed(2)}₼</strong>
                      </div>
                    )}
                    {monthlyTotal != null && (
                      <div className="detail-row">
                        <span>Abunəlik</span>
                        <strong>{monthlyTotal.toFixed(2)}₼ / {orderInfo?.billing_label}</strong>
                      </div>
                    )}
                    {cardTotal != null && monthlyTotal != null && (
                      <>
                        <div className="detail-divider" />
                        <div className="detail-row total">
                          <span>Ümumi</span>
                          <strong>{(cardTotal + monthlyTotal).toFixed(2)}₼</strong>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Delivery info */}
                  {(effectiveDelivery.location || effectiveDelivery.time_interval) && (
                    <div className="order-info-card">
                      <p className="detail-section-label">Çatdırılma məlumatları</p>
                      {effectiveDelivery.delivery_type && (
                        <div className="detail-row">
                          <span>Növ</span>
                          <strong>{effectiveDelivery.delivery_type === "metro" ? "Metro" : "Ünvana"}</strong>
                        </div>
                      )}
                      {effectiveDelivery.location && (
                        <div className="detail-row">
                          <span>{effectiveDelivery.delivery_type === "metro" ? "Stansiya" : "Ünvan"}</span>
                          <strong>{effectiveDelivery.location}</strong>
                        </div>
                      )}
                      {effectiveDelivery.time_interval && (
                        <div className="detail-row">
                          <span>Vaxt</span>
                          <strong>{effectiveDelivery.time_interval}</strong>
                        </div>
                      )}
                      {effectiveDelivery.phone && (
                        <div className="detail-row">
                          <span>Əlaqə</span>
                          <strong>{effectiveDelivery.phone}</strong>
                        </div>
                      )}
                      {effectiveDelivery.note && (
                        <div className="detail-row">
                          <span>Qeyd</span>
                          <strong>{effectiveDelivery.note}</strong>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="orders-no-select">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40">
                <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
              </svg>
              <p>Sifariş seçin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrderMain;
