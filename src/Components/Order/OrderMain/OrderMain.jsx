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
  return `${d.getDate()} ${MONTHS_AZ[d.getMonth()]}`;
}
function fmtDateTime(d) {
  if (!d) return "—";
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${d.getDate()} ${MONTHS_AZ[d.getMonth()]}, ${h}:${m}`;
}

// Verilən tarixdən sonrakı Şənbə + Bazar tarixlərini tap
function getDeliveryWeekend(fromDate) {
  const d = new Date(fromDate);
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

// ─── Metro stansiyaları (yalnız 2) ───────────────────────
const METRO_STATIONS = [
  { id: "28may", label: "28 May" },
  { id: "genclik", label: "Gənclik" },
];

// ─── Vaxt slotları (hər stansiya üçün 3) ─────────────────
const TIME_SLOTS = [
  "10:00 – 12:00",
  "13:00 – 16:00",
  "17:00 – 20:00",
];

// ─── Mock data ────────────────────────────────────────────
const MOCK_ORDER = {
  id: "INS-0042",
  package_type: "pro",
  order_date: new Date(2026, 3, 8, 14, 30),
  current_status: "courier",
  stages: {
    placed: { estimated: new Date(2026, 3, 8, 14, 30), actual: new Date(2026, 3, 8, 14, 31) },
    accepted: { estimated: new Date(2026, 3, 8, 16, 0), actual: new Date(2026, 3, 8, 15, 47) },
    printing: { estimated: new Date(2026, 3, 9, 10, 0), actual: new Date(2026, 3, 9, 11, 22) },
    packaging: { estimated: new Date(2026, 3, 10, 14, 0), actual: new Date(2026, 3, 11, 9, 15) },
    courier: { estimated: new Date(2026, 3, 12, 9, 0), actual: new Date(2026, 3, 12, 9, 40) },
    delivered: { estimated: new Date(2026, 3, 12, 18, 0), actual: null },
  },
};

// ─── Stage konfiqrasiyası ─────────────────────────────────
const ALL_STAGES = [
  { key: "placed", label: "Sifariş edildi", icon: "placed" },
  { key: "accepted", label: "Qəbul olundu", icon: "accepted" },
  { key: "printing", label: "Çapdadır", icon: "printing", skipForBasic: true },
  { key: "packaging", label: "Qablaşdırılır", icon: "packaging" },
  { key: "courier", label: "Kuryerdədir", icon: "courier" },
  { key: "delivered", label: "Təhvil verildi", icon: "delivered" },
];

function getStatusIndex(status, stages) {
  return stages.findIndex(s => s.key === status);
}

function StageIcon({ stageKey }) {
  const icons = {
    placed: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>,
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
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const [deliveryTab, setDeliveryTab] = useState("metro");
  const [selectedStation, setSelectedStation] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    authFetch(`${API_BASE}/api/v1/orders/latest/`)
      .then(res => (res?.ok ? res.json() : null))
      .then(data => { setOrder(data || MOCK_ORDER); })
      .catch(() => setOrder(MOCK_ORDER))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="order-loading">
        <div className="order-spinner" />
      </div>
    );
  }

  if (!order) return null;

  const isBasic = (order.package_type || "").toLowerCase() === "basic";
  const stages = ALL_STAGES.filter(s => !(s.skipForBasic && isBasic));
  const currentStatusIdx = getStatusIndex(order.current_status, stages);
  const isDelivered = order.current_status === "delivered";
  const { sat, sun } = getDeliveryWeekend(order.order_date);

  const handleConfirm = () => setConfirmed(true);

  const canConfirmMetro = selectedStation && selectedSlot;
  const canConfirmPhone = phone.replace(/\D/g, "").length >= 9;

  return (
    <div className="order-page">
      {/* ── Sol panel: başlıq + timeline ── */}
      <div className="order-left">
        <div className="order-header">
          <div>
            <h2 className="order-title">Sifarişim</h2>
            <p className="order-subtitle">
              №: <strong>{order.id}</strong> &nbsp;·&nbsp;
              {fmtDateTime(order.order_date instanceof Date ? order.order_date : new Date(order.order_date))}
            </p>
          </div>
          <div className={`order-status-badge status-${order.current_status}`}>
            {stages.find(s => s.key === order.current_status)?.label || order.current_status}
          </div>
        </div>

        <div className="order-timeline">
          {stages.map((stage, idx) => {
            const isDone = idx < currentStatusIdx;
            const isActive = idx === currentStatusIdx;
            const stageData = order.stages?.[stage.key];
            const timeToShow = stageData?.actual
              ? fmtDateTime(stageData.actual instanceof Date ? stageData.actual : new Date(stageData.actual))
              : stageData?.estimated
                ? fmtDate(stageData.estimated instanceof Date ? stageData.estimated : new Date(stageData.estimated))
                : null;

            return (
              <React.Fragment key={stage.key}>
                <div className={`stage-row ${isDone ? "done" : ""} ${isActive ? "active" : ""}`}>
                  <div className={`stage-circle ${isDone ? "done" : isActive ? "active" : "pending"}`}>
                    {isDone ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="18" height="18">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <StageIcon stageKey={stage.key} />
                    )}
                  </div>
                  <div className="stage-info">
                    <span className="stage-label">{stage.label}</span>
                    {timeToShow && (
                      <span className={`stage-time ${stageData?.actual ? "actual" : "estimated"}`}>
                        {stageData?.actual ? timeToShow : `~${timeToShow}`}
                      </span>
                    )}
                  </div>
                </div>
                {idx < stages.length - 1 && (
                  <div className={`stage-connector ${isDone ? "done" : ""}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── Sağ panel: çatdırılma ── */}
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
          <>
            <div className="delivery-header">
              <h3 className="delivery-title">Çatdırılma</h3>
              <p className="delivery-subtitle">
                <strong>{fmtDate(sat)}, Şənbə</strong> və ya <strong>{fmtDate(sun)}, Bazar</strong>
              </p>
            </div>

            {/* Tablar */}
            <div className="delivery-tabs">
              <button
                className={`tab-btn ${deliveryTab === "metro" ? "active" : ""}`}
                onClick={() => { setDeliveryTab("metro"); setConfirmed(false); }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>
                Metro
              </button>
              <button
                className={`tab-btn ${deliveryTab === "address" ? "active" : ""}`}
                onClick={() => { setDeliveryTab("address"); setConfirmed(false); }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                Ünvana
              </button>
            </div>

            {confirmed ? (
              <div className="order-success">
                <div className="order-success-icon">✓</div>
                <p className="order-success-title">Təsdiqləndi!</p>
                {deliveryTab === "metro" ? (
                  <p className="order-success-desc">
                    {fmtDate(sat)}, Şənbə — {selectedStation?.label} metro<br />
                    <strong>{selectedSlot}</strong>
                  </p>
                ) : (
                  <p className="order-success-desc">
                    Kuryer <strong>{phone}</strong> nömrəsi ilə əlaqə saxlayacaq.
                  </p>
                )}
              </div>
            ) : (
              <>
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
                              key={slot}
                              className={`slot-card ${selectedSlot === slot ? "selected" : ""}`}
                              onClick={() => setSelectedSlot(slot)}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                              {slot}
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    {canConfirmMetro && (
                      <button className="confirm-btn" onClick={handleConfirm}>
                        Təsdiqlə
                      </button>
                    )}
                  </div>
                )}

                {/* ── Ünvan tab ── */}
                {deliveryTab === "address" && (
                  <div className="address-tab">
                    <p className="field-label">Əlaqə nömrəsi</p>
                    <div className="phone-input-wrap">
                      <span className="phone-prefix">+994</span>
                      <input
                        type="tel"
                        className="phone-input"
                        placeholder="50 123 45 67"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        maxLength={12}
                      />
                    </div>

                    <div className="courier-note">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                      <p>
                        Kuryer sizinlə əlaqə saxlayaraq çatdırılma vaxtını ({fmtDate(sat)} Şənbə
                        və ya {fmtDate(sun)} Bazar) təsdiqləyəcəkdir.
                      </p>
                    </div>

                    {canConfirmPhone && (
                      <button className="confirm-btn" onClick={handleConfirm}>
                        Təsdiqlə
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default OrderMain;
