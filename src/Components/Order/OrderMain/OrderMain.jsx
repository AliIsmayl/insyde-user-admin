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
function getNextWeekend(fromDate) {
  const d = fromDate ? (fromDate instanceof Date ? fromDate : new Date(fromDate)) : new Date();
  const day = d.getDay();
  const daysToSat = day === 6 ? 7 : day === 0 ? 6 : 6 - day;
  const sat = new Date(d); sat.setDate(d.getDate() + daysToSat);
  const sun = new Date(sat); sun.setDate(sat.getDate() + 1);
  return { sat, sun };
}

function toMoneyNumber(v) {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

function getPaymentStatusLabel(status) {
  const key = String(status || "").toLowerCase();
  if (key === "paid") return "Ödənilib";
  if (key === "pending") return "Gözləmədə";
  if (key === "failed") return "Uğursuz";
  return status || "—";
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
  { status: "ordered",   label: "Sifariş edildi",  is_done: true,  is_current: false },
  { status: "accepted",  label: "Qəbul olundu",     is_done: false, is_current: true  },
  { status: "printing",  label: "Çapdadır",          is_done: false, is_current: false },
  { status: "packaging", label: "Qablaşdırılır",     is_done: false, is_current: false },
  { status: "courier",   label: "Kuryerdədir",       is_done: false, is_current: false },
  { status: "delivered", label: "Təhvil verildi",    is_done: false, is_current: false },
];

function StageIcon({ stageKey }) {
  const icons = {
    ordered:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
    accepted:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    printing:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><rect x="6" y="2" width="12" height="8"/><rect x="6" y="14" width="12" height="8"/><path d="M4 8h16v8H4z"/><circle cx="18" cy="12" r="1" fill="currentColor"/></svg>,
    packaging: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    courier:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
    delivered: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  };
  return icons[stageKey] || null;
}

function OrderMain() {
  const location = useLocation();
  const navigate = useNavigate();
  const newOrderState = location.state?.isNew ? location.state : null;

  const [cardId, setCardId]       = useState(null);
  const [userId, setUserId]       = useState(null);
  const [uniqueId, setUniqueId]   = useState(null);
  const [userPhone, setUserPhone] = useState("");
  const [delivery, setDelivery]   = useState(null);
  const [orderInfo, setOrderInfo] = useState(null);
  const [loading, setLoading]     = useState(true);

  const [showPastDetail, setShowPastDetail] = useState(false);
  const [pendingMode, setPendingMode]       = useState(false);
  const [activeSection, setActiveSection]   = useState("orders");
  const [subscriptions, setSubscriptions]   = useState([]);
  const [selectedSubId, setSelectedSubId]   = useState(null);

  // delivery form
  const [deliveryTab, setDeliveryTab]         = useState("metro");
  const [selectedStation, setSelectedStation] = useState(null);
  const [selectedSlot, setSelectedSlot]       = useState("");
  const [address, setAddress]                 = useState("");
  const [phone, setPhone]                     = useState("");
  const [note, setNote]                       = useState("");
  const [submitLoading, setSubmitLoading]     = useState(false);
  const [submitError, setSubmitError]         = useState("");

  // after confirmation
  const [staticOrder, setStaticOrder]     = useState(null);
  const [showConfirmed, setShowConfirmed] = useState(false);
  const [confCount, setConfCount]         = useState(3);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const orderRes = await authFetch(`${API_BASE}/api/v1/orders/my/`);
        if (!orderRes?.ok) { setLoading(false); return; }
        const orderData = await orderRes.json();

        const cid = orderData?.id;
        const uid = orderData?.user_info?.id;
        if (!cid) { setLoading(false); return; }

        setCardId(cid);
        setUserId(uid);
        setUniqueId(orderData?.unique_id || null);
        setUserPhone(orderData?.user_info?.phone_number || "");

        const payInfo = orderData?.payment_info || {};
        const pkgInfo = orderData?.package_info || {};

        const durationMonths = payInfo.duration_months || 12;
        const billingLabel = durationMonths === 1
          ? "Aylıq"
          : durationMonths === 12
            ? "İllik"
            : `${durationMonths} aylıq`;

        // plan.card_price varsa istifadə et, yoxsa package_type.price
        const rawCardPrice    = payInfo.card_price    ?? pkgInfo.package_price ?? null;
        const rawMonthlyPrice = payInfo.monthly_price ?? null;

        setOrderInfo({
          package_name:   payInfo.plan_name   || pkgInfo.package_type || "—",
          package_color:  "#d4af37",
          card_total:     toMoneyNumber(rawCardPrice),
          monthly_total:  toMoneyNumber(rawMonthlyPrice),
          billing_label:  billingLabel,
          billing_months: durationMonths,
          payment_status: payInfo.payment_status,
        });

        if (!newOrderState) {
          const deliveryRes = await authFetch(`${API_BASE}/api/v1/deliveries/by-order/${cid}/`);
          if (deliveryRes?.ok) {
            const data = await deliveryRes.json();
            setDelivery(data);
            setShowPastDetail(true);
          }
        }

        const subRes = await authFetch(`${API_BASE}/api/v1/subscriptions/`);
        if (subRes?.ok) {
          const subData = await subRes.json();
          const subs = subData.subscriptions || [];
          setSubscriptions(subs);
          if (subs.length > 0) setSelectedSubId(subs[0].id);
        }
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleConfirm = async () => {
    if (!userId) return;
    setSubmitLoading(true);
    setSubmitError("");

    const isMetro = deliveryTab === "metro";
    const cleanPhone = phone.replace(/\D/g, "").replace(/^0+/, "");

    if (phone.trim() && cleanPhone.length !== 9) {
      setSubmitError("Telefon nömrəsi düzgün deyil. Nümunə: 50 123 45 67");
      setSubmitLoading(false);
      return;
    }

    const formattedPhone = cleanPhone.length === 9 ? `+994${cleanPhone}` : "";

    const body = {
      user_id:       userId,
      delivery_type: isMetro ? "metro" : "address",
      time_interval: selectedSlot,
      ...(isMetro
        ? { metro_station: selectedStation?.label }
        : { address: address.trim() || "—" }),
      ...(formattedPhone ? { phone_number: formattedPhone } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
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
              const label = field === "note" ? "Qeyd" : field;
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

      const responseData = await res.json();
      const now = new Date();
      const confirmedOrder = {
        order_number:           responseData.order_number || "",
        delivery_type:          deliveryTab,
        metro_station:          isMetro ? selectedStation?.label : null,
        address:                !isMetro ? address : null,
        time_interval:          selectedSlot,
        phone:                  formattedPhone,
        note:                   note.trim(),
        created_at:             responseData.created_at || now.toISOString(),
        current_status:         "ordered",
        current_status_display: "Sifariş edildi",
        timeline:               responseData.timeline || STATIC_TIMELINE.map(s => ({
          ...s,
          changed_at: s.is_done ? now.toISOString() : null,
        })),
      };
      setStaticOrder(confirmedOrder);
      setDelivery(confirmedOrder);
      setPendingMode(false);
      setShowPastDetail(true);
      resetDeliveryForm();
      navigate(location.pathname, { replace: true, state: null });
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
    setAddress("");
    setPhone("");
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
    const loc = staticOrder.delivery_type === "metro" ? staticOrder.metro_station : staticOrder.address;
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

          {(staticOrder.order_number || uniqueId) && (
            <div className="order-confirmed-num-box">
              <span>Sifariş №</span>
              <strong>{staticOrder.order_number || uniqueId}</strong>
            </div>
          )}

          <div className="order-confirmed-delivery-summary">
            <div className="ocd-row">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                {staticOrder.delivery_type === "metro"
                  ? <><circle cx="12" cy="12" r="9"/><path d="M8 12l2.5 2.5L16 9"/></>
                  : <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></>
                }
              </svg>
              <span>{staticOrder.delivery_type === "metro" ? "Metro" : "Ünvan"}</span>
              <strong>{loc}</strong>
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
                <span>Telefon</span>
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
  // Only show delivery form if navigated from PackageMain AND delivery doesn't already exist
  const activeNewOrder = (!delivery && (newOrderState || pendingMode)) ? (newOrderState || {
    order_number: uniqueId || "",
    package_name:   orderInfo?.package_name   || "—",
    package_color:  orderInfo?.package_color  || "#d4af37",
    billing_label:  orderInfo?.billing_label  || "—",
    billing_months: orderInfo?.billing_months || 1,
    card_total:     orderInfo?.card_total,
    monthly_total:  orderInfo?.monthly_total,
  }) : null;

  if (activeNewOrder) {
    const cardTotal    = toMoneyNumber(activeNewOrder.card_total);
    const monthlyTotal = toMoneyNumber(activeNewOrder.monthly_total);

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
                <span>Sifariş №: <strong>{activeNewOrder.order_number || uniqueId || "—"}</strong></span>
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
    metro_station:          staticOrder.metro_station,
    address:                staticOrder.address,
    time_interval:          staticOrder.time_interval,
    phone:                  staticOrder.phone,
    note:                   staticOrder.note,
  } : null);

  const deliveryLocation = effectiveDelivery?.delivery_type === "metro"
    ? effectiveDelivery?.metro_station
    : effectiveDelivery?.address;

  // Deliverydən gələn telefon: staticOrder.phone (yeni) və ya userPhone (köhnə sifarişlər üçün)
  const displayPhone = effectiveDelivery?.phone || userPhone || null;

  const hasPastOrder = !!effectiveDelivery;
  const orderCount   = hasPastOrder ? 1 : 0;

  const timeline      = effectiveDelivery?.timeline || [];
  const currentStatus = effectiveDelivery?.current_status;
  const cardTotal    = toMoneyNumber(orderInfo?.card_total);
  const monthlyTotal = toMoneyNumber(orderInfo?.monthly_total);
  const overallTotal = cardTotal != null && monthlyTotal != null
    ? cardTotal + monthlyTotal
    : cardTotal != null
      ? cardTotal
      : monthlyTotal;

  const displayOrderNum = uniqueId || effectiveDelivery?.order_number || "—";
  const paymentDate = effectiveDelivery?.created_at || null;
  const paymentStatusLabel = getPaymentStatusLabel(orderInfo?.payment_status);
  const selectedSub = subscriptions.find(s => s.id === selectedSubId) || null;

  function subStatusLabel(sub) {
    if (sub.is_expired)  return { label: "Bitib",       cls: "expired"  };
    if (sub.is_active)   return { label: "Aktiv",       cls: "accepted" };
    return               { label: "Gözlənilir",         cls: "ordered"  };
  }
  function subDurationLabel(m) {
    if (m === 1)  return "1 aylıq";
    if (m === 12) return "İllik";
    return `${m} aylıq`;
  }
  function fmtDateShort(raw) {
    if (!raw) return "—";
    try {
      const d = new Date(raw);
      return `${d.getDate()} ${MONTHS_AZ[d.getMonth()]} ${d.getFullYear()}`;
    } catch { return "—"; }
  }

  return (
    <div className="orders-wrap">
      <div className="orders-page">
        {/* ── Sol: sifariş siyahısı ── */}
        <div className="orders-left">
          <div className="orders-section-switch">
            <button
              className={`orders-section-btn ${activeSection === "orders" ? "active" : ""}`}
              onClick={() => setActiveSection("orders")}
            >
              Sifarişlərim
            </button>
            <button
              className={`orders-section-btn ${activeSection === "payments" ? "active" : ""}`}
              onClick={() => setActiveSection("payments")}
            >
              Abunəliklərim
            </button>
          </div>
          <div className="orders-header">
            <h2 className="orders-title">{activeSection === "orders" ? "Sifarişlərim" : "Abunəliklərim"}</h2>
            <p className="orders-subtitle">
              {activeSection === "orders" ? `${orderCount} sifariş` : `${subscriptions.length} abunəlik`}
            </p>
          </div>

          <div className="orders-list">
            {activeSection === "orders" && hasPastOrder && (
              <div className={`order-card ${showPastDetail ? "active" : ""}`} onClick={() => setShowPastDetail(true)}>
                <div className="order-card-top">
                  <span className="order-card-num">№ {displayOrderNum}</span>
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

            {activeSection === "payments" && subscriptions.map((sub, idx) => {
              const st = subStatusLabel(sub);
              const isFirst = idx === 0;
              return (
                <div
                  key={sub.id}
                  className={`order-card ${selectedSubId === sub.id ? "active" : ""}`}
                  onClick={() => setSelectedSubId(sub.id)}
                >
                  <div className="order-card-top">
                    <span className="order-card-num">
                      {isFirst ? "Son abunəlik" : `Abunəlik #${subscriptions.length - idx}`}
                    </span>
                    <span className={`order-badge status-${st.cls}`}>{st.label}</span>
                  </div>
                  <div className="order-card-pkg" style={{ color: "#d4af37" }}>
                    {sub.plan?.name || "—"} · {subDurationLabel(sub.duration_months)}
                  </div>
                  <div className="order-card-meta">
                    {sub.plan?.monthly_price && (
                      <span>{parseFloat(sub.plan.monthly_price).toFixed(2)}₼/ay</span>
                    )}
                    <span>{fmtDateShort(sub.created_at)}</span>
                  </div>
                </div>
              );
            })}

            {activeSection === "orders" && orderCount === 0 && (
              <div className="orders-empty">
                <div className="orders-empty-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="36" height="36"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                </div>
                <p>Sifariş yoxdur</p>
                <span className="orders-empty-hint">Ödəniş planı seçərək kart sifariş edə bilərsiniz</span>
              </div>
            )}

            {activeSection === "payments" && subscriptions.length === 0 && (
              <div className="orders-empty">
                <div className="orders-empty-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="36" height="36"><path d="M3 7h18M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path d="M16 14h.01"/></svg>
                </div>
                <p>Abunəlik yoxdur</p>
                <span className="orders-empty-hint">Aktiv paket seçdikdən sonra abunəlik burada görünəcək</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Sağ: sifariş detalları ── */}
        <div className="orders-right">
          {activeSection === "orders" && hasPastOrder && showPastDetail ? (
            <>
              <div className="order-detail-header">
                <div>
                  <h3 className="order-detail-title">Sifariş detalları</h3>
                  <p className="order-detail-sub">
                    №: <strong>{displayOrderNum}</strong>
                    {effectiveDelivery.created_at && ` · ${fmtDateTime(effectiveDelivery.created_at)}`}
                  </p>
                </div>
                <span className={`order-badge status-${currentStatus}`}>
                  {effectiveDelivery.current_status_display || currentStatus}
                </span>
              </div>

              <div className="order-detail-body">
                {/* Timeline + Təxmini çatdırılma */}
                <div className="order-timeline-card">
                  <p className="detail-section-label">Sifariş statusu</p>
                  <div className="order-timeline">
                    {(() => {
                      const activeIdx = timeline.findIndex(s => s.is_current);
                      return timeline.map((stage, idx) => {
                        const isDelivered = stage.status === "delivered" && stage.is_current;
                        const isDone   = isDelivered || (activeIdx === -1 ? stage.is_done : idx < activeIdx);
                        const isActive = stage.is_current && !isDelivered;
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
                              </div>
                            </div>
                            {idx < timeline.length - 1 && (
                              <div className={`stage-connector ${isDone ? "done" : ""}`} />
                            )}
                          </React.Fragment>
                        );
                      });
                    })()}
                  </div>

                  {/* Təxmini çatdırılma — yalnız çatdırılmamışdırsa göstər */}
                  {currentStatus !== "delivered" && (() => {
                    const { sat: estSat, sun: estSun } = getNextWeekend(effectiveDelivery?.created_at);
                    const DAY_AZ = ["Bazar","Bazar ertəsi","Çərşənbə axşamı","Çərşənbə","Cümə axşamı","Cümə","Şənbə"];
                    return (
                      <>
                        <div className="detail-divider" style={{ margin: "16px 0" }} />
                        <p className="detail-section-label">Təxmini çatdırılma</p>
                        <div className="detail-row">
                          <span>Şənbə</span>
                          <strong>{fmtDate(estSat)}, {DAY_AZ[estSat.getDay()]}</strong>
                        </div>
                        <div className="detail-row">
                          <span>Bazar</span>
                          <strong>{fmtDate(estSun)}, {DAY_AZ[estSun.getDay()]}</strong>
                        </div>
                        <p className="weekend-delivery-note">Sifarişiniz ən yaxın həftə sonu çatdırılacaq</p>
                      </>
                    );
                  })()}
                </div>

                {/* Info cards */}
                <div className="order-info-col">
                  {/* Sifariş məlumatları */}
                  <div className="order-info-card">
                    <p className="detail-section-label">Sifariş məlumatları</p>
                    <div className="detail-row">
                      <span>Sifariş №</span>
                      <strong>{displayOrderNum}</strong>
                    </div>
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
                    {displayPhone && (
                      <>
                        <div className="detail-divider" />
                        <div className="detail-row">
                          <span>Telefon</span>
                          <strong>{displayPhone}</strong>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Çatdırılma məlumatları */}
                  {(deliveryLocation || effectiveDelivery.time_interval) && (
                    <div className="order-info-card">
                      <p className="detail-section-label">Çatdırılma məlumatları</p>
                      {effectiveDelivery.delivery_type && (
                        <div className="detail-row">
                          <span>Növ</span>
                          <strong>{effectiveDelivery.delivery_type === "metro" ? "Metro" : "Ünvana"}</strong>
                        </div>
                      )}
                      {deliveryLocation && (
                        <div className="detail-row">
                          <span>{effectiveDelivery.delivery_type === "metro" ? "Stansiya" : "Ünvan"}</span>
                          <strong>{deliveryLocation}</strong>
                        </div>
                      )}
                      {effectiveDelivery.time_interval && (
                        <div className="detail-row">
                          <span>Vaxt</span>
                          <strong>{effectiveDelivery.time_interval}</strong>
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
          ) : activeSection === "payments" && selectedSub ? (
            <>
              <div className="order-detail-header">
                <div>
                  <h3 className="order-detail-title">Abunəlik detalları</h3>
                  <p className="order-detail-sub">{fmtDateShort(selectedSub.created_at)}</p>
                </div>
                <span className={`order-badge status-${subStatusLabel(selectedSub).cls}`}>
                  {subStatusLabel(selectedSub).label}
                </span>
              </div>

              <div className="order-detail-body single-col">
                <div className="order-info-col">
                  <div className="order-info-card">
                    <p className="detail-section-label">Abunəlik məlumatları</p>
                    <div className="detail-row">
                      <span>Paket</span>
                      <strong style={{ color: "#d4af37" }}>{selectedSub.plan?.name || "—"}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Müddət</span>
                      <strong>{subDurationLabel(selectedSub.duration_months)}</strong>
                    </div>
                    {selectedSub.plan?.monthly_price && (
                      <div className="detail-row">
                        <span>Aylıq qiymət</span>
                        <strong>{parseFloat(selectedSub.plan.monthly_price).toFixed(2)}₼/ay</strong>
                      </div>
                    )}
                    {selectedSub.created_at && (
                      <div className="detail-row">
                        <span>Başlama tarixi</span>
                        <strong>{fmtDateShort(selectedSub.created_at)}</strong>
                      </div>
                    )}
                    {(selectedSub.end_date || selectedSub.expires_at) && (
                      <div className="detail-row">
                        <span>Bitmə tarixi</span>
                        <strong>{fmtDateShort(selectedSub.end_date || selectedSub.expires_at)}</strong>
                      </div>
                    )}
                    {selectedSub.plan?.monthly_price && selectedSub.duration_months && (
                      <>
                        <div className="detail-divider" />
                        <div className="detail-row total">
                          <span>Cəmi</span>
                          <strong>
                            {(parseFloat(selectedSub.plan.monthly_price) * selectedSub.duration_months).toFixed(2)}₼
                          </strong>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="orders-no-select">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40">
                <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
              </svg>
              <p>
                {activeSection === "orders"
                  ? (orderCount === 0 ? "Sifariş yoxdur" : "Sifariş seçin")
                  : (subscriptions.length === 0 ? "Abunəlik yoxdur" : "Abunəlik seçin")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrderMain;
