import React, { useState, useEffect } from "react";
import { API_BASE, authFetch } from "../../../Utils/authUtils";
import "./OrderMain.scss";

// ─── Tarix / Vaxt köməkçiləri ─────────────────────────────
const MONTHS_AZ = [
  "yanvar", "fevral", "mart", "aprel", "may", "iyun",
  "iyul", "avqust", "sentyabr", "oktyabr", "noyabr", "dekabr",
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

// Verilən tarixdən sonrakı Şənbə + Bazar tarixlərini tap
function getDeliveryWeekend(fromDate) {
  const d = fromDate ? new Date(fromDate) : new Date();
  const day = d.getDay();
  let daysToSat;
  if (day === 6) daysToSat = 7;
  else if (day === 0) daysToSat = 6;
  else daysToSat = 6 - day;

  const sat = new Date(d);
  sat.setDate(d.getDate() + daysToSat);
  const sun = new Date(sat);
  sun.setDate(sat.getDate() + 1);
  return { sat, sun };
}

// ─── Metro stansiyaları ───────────────────────────────────
const METRO_STATIONS = [
  { id: "28may", label: "28 May" },
  { id: "genclik", label: "Gənclik" },
];

// ─── Vaxt slotları (backend formatı) ─────────────────────
const TIME_SLOTS = [
  { label: "10:00 – 12:00", value: "10:00-12:00" },
  { label: "13:00 – 16:00", value: "13:00-16:00" },
  { label: "17:00 – 20:00", value: "17:00-20:00" },
];

// ─── Stage ikonları ───────────────────────────────────────
function StageIcon({ stageKey }) {
  const icons = {
    ordered: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>,
    accepted: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20"><polyline points="20 6 9 17 4 12" /></svg>,
    printing: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><rect x="6" y="2" width="12" height="8" /><rect x="6" y="14" width="12" height="8" /><path d="M4 8h16v8H4z" /><circle cx="18" cy="12" r="1" fill="currentColor" /></svg>,
    packaging: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M21 10V20a1 1 0 01-1 1H4a1 1 0 01-1-1V10" /><rect x="1" y="6" width="22" height="4" rx="1" /><path d="M12 6V22M8 6l1-3h6l1 3" /></svg>,
    courier: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><rect x="1" y="3" width="15" height="13" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>,
    delivered: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
  };
  return icons[stageKey] || null;
}

// ─── Ana komponent ────────────────────────────────────────
function OrderMain() {
  const [cardId, setCardId] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [noDelivery, setNoDelivery] = useState(false);

  const [deliveryTab, setDeliveryTab] = useState("metro");
  const [selectedStation, setSelectedStation] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  // 1. Profildən card_id al, sonra delivery-ni yüklə
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Profil al → card.id tap
        const profileRes = await authFetch(`${API_BASE}/api/v1/profile/me/`);
        if (!profileRes?.ok) { setLoading(false); return; }
        const profileData = await profileRes.json();
        const d = profileData?.data || profileData;
        const cid = d?.card?.id;
        if (!cid) { setLoading(false); setNoDelivery(true); return; }
        setCardId(cid);

        // Delivery al
        const deliveryRes = await authFetch(`${API_BASE}/api/v1/deliveries/by-order/${cid}/`);
        if (deliveryRes?.status === 404 || !deliveryRes?.ok) {
          setNoDelivery(true);
        } else {
          const data = await deliveryRes.json();
          setDelivery(data);
        }
      } catch {
        setNoDelivery(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // 2. Çatdırılma yarat
  const handleConfirm = async () => {
    if (!cardId) return;
    setSubmitLoading(true);
    setSubmitError("");

    const isMetro = deliveryTab === "metro";

    // Telefonu təmizlə: yalnız rəqəmlər, başdakı 0-ları sil
    const cleanPhone = phone.replace(/\D/g, "").replace(/^0+/, "");

    // Telefon doldurulubsa amma yanlışdırsa xəta göstər
    if (phone.trim() && cleanPhone.length !== 9) {
      setSubmitError("Telefon nömrəsi düzgün deyil. Nümunə: 50 123 45 67");
      setSubmitLoading(false);
      return;
    }

    const body = {
      order_id: cardId,
      delivery_type: isMetro ? "metro" : "address",
      time_interval: selectedSlot,
      ...(isMetro
        ? { metro_station: selectedStation?.label }
        : { address: address.trim() || "—" }
      ),
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
        // DRF field-level xətaları ({"phone": [...], "note": [...]}) emal et
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

      const data = await res.json();
      setDelivery(data);
      setNoDelivery(false);
      setConfirmed(true);
    } catch {
      setSubmitError("Server ilə əlaqə kəsildi.");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="order-loading">
        <div className="order-spinner" />
      </div>
    );
  }

  // ── Delivery var: timeline göstər ─────────────────────────
  if (delivery) {
    const timeline = delivery.timeline || [];
    const currentStatus = delivery.current_status;
    const isDelivered = currentStatus === "delivered";
    const { sat, sun } = getDeliveryWeekend(delivery.created_at);

    return (
      <div className="order-page">
        {/* ── Sol panel: başlıq + timeline ── */}
        <div className="order-left">
          <div className="order-header">
            <div>
              <h2 className="order-title">Sifarişim</h2>
              <p className="order-subtitle">
                №: <strong>{delivery.order_number}</strong> &nbsp;·&nbsp;
                {fmtDateTime(delivery.created_at)}
              </p>
            </div>
            <div className={`order-status-badge status-${currentStatus}`}>
              {delivery.current_status_display || currentStatus}
            </div>
          </div>

          <div className="order-timeline">
            {timeline.map((stage, idx) => {
              const isDone = stage.is_done && !stage.is_current;
              const isActive = stage.is_current;

              return (
                <React.Fragment key={stage.status}>
                  <div className={`stage-row ${isDone ? "done" : ""} ${isActive ? "active" : ""}`}>
                    <div className={`stage-circle ${isDone ? "done" : isActive ? "active" : "pending"}`}>
                      {isDone ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="18" height="18">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <StageIcon stageKey={stage.status} />
                      )}
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

        {/* ── Sağ panel: çatdırılma məlumatı ── */}
        <div className="order-right">
          {isDelivered ? (
            <div className="delivered-banner">
              <div className="delivered-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="32" height="32">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="delivered-title">Sifariş çatdırıldı!</p>
              <p className="delivered-sub">Kart uğurla təhvil verildi.</p>
            </div>
          ) : (
            <div className="delivery-info-card">
              <h3 className="delivery-title">Çatdırılma Məlumatı</h3>

              <div className="delivery-detail-row">
                <span className="delivery-detail-label">Növ</span>
                <span className="delivery-detail-val">
                  {delivery.delivery_type === "metro" ? "Metro" : "Ünvana"}
                </span>
              </div>

              {delivery.metro_station && (
                <div className="delivery-detail-row">
                  <span className="delivery-detail-label">Metro</span>
                  <span className="delivery-detail-val">{delivery.metro_station}</span>
                </div>
              )}

              {delivery.address && (
                <div className="delivery-detail-row">
                  <span className="delivery-detail-label">Ünvan</span>
                  <span className="delivery-detail-val">{delivery.address}</span>
                </div>
              )}

              {delivery.time_interval && (
                <div className="delivery-detail-row">
                  <span className="delivery-detail-label">Vaxt</span>
                  <span className="delivery-detail-val">
                    {TIME_SLOTS.find(t => t.value === delivery.time_interval)?.label || delivery.time_interval}
                  </span>
                </div>
              )}

              {delivery.estimated_delivery_date && (
                <div className="delivery-detail-row">
                  <span className="delivery-detail-label">Tarix</span>
                  <span className="delivery-detail-val">
                    {fmtDate(delivery.estimated_delivery_date)}
                  </span>
                </div>
              )}

              {delivery.phone && (
                <div className="delivery-detail-row">
                  <span className="delivery-detail-label">Nömrə</span>
                  <span className="delivery-detail-val">{delivery.phone}</span>
                </div>
              )}

              {delivery.note && (
                <div className="delivery-detail-row">
                  <span className="delivery-detail-label">Qeyd</span>
                  <span className="delivery-detail-val">{delivery.note}</span>
                </div>
              )}

              <div className="delivery-note">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p>Çatdırılma tarixi <strong>{fmtDate(sat)}, Şənbə</strong> və ya <strong>{fmtDate(sun)}, Bazar</strong> günü nəzərdə tutulur.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Delivery yoxdur: forma göstər ─────────────────────────
  const { sat, sun } = getDeliveryWeekend(null);
  const canConfirmMetro = selectedStation && selectedSlot;
  const canConfirmAddress = address.trim() && selectedSlot;

  if (confirmed) {
    return (
      <div className="order-page">
        <div className="order-left">
          <div className="order-success">
            <div className="order-success-icon">✓</div>
            <p className="order-success-title">Sifarişiniz qəbul edildi!</p>
            <p className="order-success-desc">
              Çatdırılma məlumatlarınız sisteme daxil edildi.
            </p>
          </div>
        </div>
        <div className="order-right" />
      </div>
    );
  }

  return (
    <div className="order-page">
      <div className="order-left">
        <div className="order-header">
          <div>
            <h2 className="order-title">Çatdırılma</h2>
            <p className="order-subtitle">Çatdırılma metodunu seçin</p>
          </div>
        </div>

        {/* Tablar */}
        <div className="delivery-tabs">
          <button
            className={`tab-btn ${deliveryTab === "metro" ? "active" : ""}`}
            onClick={() => { setDeliveryTab("metro"); }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>
            Metro
          </button>
          <button
            className={`tab-btn ${deliveryTab === "address" ? "active" : ""}`}
            onClick={() => { setDeliveryTab("address"); }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
            Ünvana
          </button>
        </div>

        {submitError && (
          <div className="order-error-msg">{submitError}</div>
        )}

        {/* ── Metro tab ── */}
        {deliveryTab === "metro" && (
          <div className="metro-tab">
            <p className="field-label">Metro stansiyası</p>
            <div className="station-cards">
              {METRO_STATIONS.map(st => (
                <button
                  key={st.id}
                  className={`station-card ${selectedStation?.id === st.id ? "selected" : ""}`}
                  onClick={() => { setSelectedStation(st); setSelectedSlot(""); }}
                >
                  <span className="station-icon">M</span>
                  <span className="station-name">{st.label}</span>
                </button>
              ))}
            </div>

            {selectedStation && (
              <>
                <p className="field-label">Vaxt intervalı</p>
                <div className="slot-list">
                  {TIME_SLOTS.map(slot => (
                    <button
                      key={slot.value}
                      className={`slot-card ${selectedSlot === slot.value ? "selected" : ""}`}
                      onClick={() => setSelectedSlot(slot.value)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                      {slot.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            <p className="field-label">Əlaqə nömrəsi</p>
            <div className="phone-input-wrap">
              <span className="phone-prefix">+994</span>
              <input
                type="tel"
                className="phone-input"
                placeholder="50 123 45 67"
                value={phone}
                onChange={e => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 9);
                  setPhone(digits);
                }}
                maxLength={9}
              />
            </div>

            <p className="field-label">Qeyd (istəyə bağlı)</p>
            <textarea
              className="note-textarea"
              placeholder="Kuryer üçün əlavə məlumat..."
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
            />

            {canConfirmMetro && (
              <button
                className="confirm-btn"
                onClick={handleConfirm}
                disabled={submitLoading}
              >
                {submitLoading ? "Göndərilir..." : "Təsdiqlə"}
              </button>
            )}
          </div>
        )}

        {/* ── Ünvan tab ── */}
        {deliveryTab === "address" && (
          <div className="address-tab">
            <p className="field-label">Ünvan</p>
            <input
              type="text"
              className="address-input"
              placeholder="Küçə, bina, mənzil nömrəsi..."
              value={address}
              onChange={e => setAddress(e.target.value)}
            />

            <p className="field-label">Vaxt intervalı</p>
            <div className="slot-list">
              {TIME_SLOTS.map(slot => (
                <button
                  key={slot.value}
                  className={`slot-card ${selectedSlot === slot.value ? "selected" : ""}`}
                  onClick={() => setSelectedSlot(slot.value)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  {slot.label}
                </button>
              ))}
            </div>

            <p className="field-label">Əlaqə nömrəsi</p>
            <div className="phone-input-wrap">
              <span className="phone-prefix">+994</span>
              <input
                type="tel"
                className="phone-input"
                placeholder="50 123 45 67"
                value={phone}
                onChange={e => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 9);
                  setPhone(digits);
                }}
                maxLength={9}
              />
            </div>

            <p className="field-label">Qeyd (istəyə bağlı)</p>
            <textarea
              className="note-textarea"
              placeholder="Kuryer üçün əlavə məlumat..."
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
            />

            <div className="courier-note courier-note--paid">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
              <p>
                Çatdırılma kuryer vasitəsilə həyata keçirilir. Sifarişiniz yola çıxanda kuryerimiz sizinlə əlaqə saxlayıb çatdırılma haqqı və sizə uyğun vaxt barədə məlumat verəcək.
              </p>
            </div>

            {canConfirmAddress && (
              <button
                className="confirm-btn"
                onClick={handleConfirm}
                disabled={submitLoading}
              >
                {submitLoading ? "Göndərilir..." : "Təsdiqlə"}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="order-right">
        <div className="delivery-header">
          <h3 className="delivery-title">Çatdırılma tarixi</h3>
          <p className="delivery-subtitle">
            <strong>{fmtDate(sat)}, Şənbə</strong> və ya <strong>{fmtDate(sun)}, Bazar</strong>
          </p>
        </div>
      </div>
    </div>
  );
}

export default OrderMain;
