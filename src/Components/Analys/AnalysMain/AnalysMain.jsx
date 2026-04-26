import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { FiEye, FiTrendingUp, FiSmartphone, FiMonitor, FiLink, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { TbNfc } from "react-icons/tb";
import { BsQrCode } from "react-icons/bs";
import * as FaIconsAll from "react-icons/fa";
import * as MdIcons    from "react-icons/md";
import * as BsIcons    from "react-icons/bs";
import * as AiIcons    from "react-icons/ai";
import * as BiIcons    from "react-icons/bi";
import * as RiIcons    from "react-icons/ri";
import {
  FaApple, FaAndroid, FaLink, FaGlobe,
  FaInstagram, FaWhatsapp, FaTelegram, FaFacebook, FaTwitter,
} from "react-icons/fa";
import { API_BASE, authFetch, CK } from "../../../Utils/authUtils";
import "./AnalysMain.scss";

// ─── Sabitlər ────────────────────────────────────────────
const ALL_MONTHS = [
  { num: 1,  name: "Yanvar"    },
  { num: 2,  name: "Fevral"   },
  { num: 3,  name: "Mart"     },
  { num: 4,  name: "Aprel"    },
  { num: 5,  name: "May"      },
  { num: 6,  name: "İyun"     },
  { num: 7,  name: "İyul"     },
  { num: 8,  name: "Avqust"   },
  { num: 9,  name: "Sentyabr" },
  { num: 10, name: "Oktyabr"  },
  { num: 11, name: "Noyabr"   },
  { num: 12, name: "Dekabr"   },
];

// scan_type_stats üçün icon + rəng xəritəsi
const SCAN_TYPE_MAP = {
  qr_code:  { label: "QR Skan",      icon: <BsQrCode />,       color: "#8b5cf6" },
  qr:       { label: "QR Skan",      icon: <BsQrCode />,       color: "#8b5cf6" },
  nfc:      { label: "NFC Toxunma",  icon: <TbNfc />,          color: "#f59e0b" },
  direct:   { label: "Birbaşa Link", icon: <FiLink />,         color: "#3b82f6" },
  link:     { label: "Link",         icon: <FiLink />,         color: "#3b82f6" },
  social:   { label: "Sosial",       icon: <FaGlobe />,        color: "#10b981" },
  web:      { label: "Web",          icon: <FaGlobe />,        color: "#06b6d4" },
};

const PAGE_SIZE = 5;

// ─── Yardımçılar ─────────────────────────────────────────
function getProfileIcon(iconCode) {
  if (!iconCode) return <FaLink />;
  const libs = { Fa: FaIconsAll, Md: MdIcons, Bs: BsIcons, Ai: AiIcons, Bi: BiIcons, Ri: RiIcons };
  const lib = libs[iconCode.slice(0, 2)];
  if (!lib) return <FaLink />;
  const C = lib[iconCode];
  return C ? <C /> : <FaLink />;
}

function getSourceIcon(name = "") {
  const n = name.toLowerCase();
  if (n.includes("instagram")) return <FaInstagram />;
  if (n.includes("whatsapp"))  return <FaWhatsapp />;
  if (n.includes("telegram"))  return <FaTelegram />;
  if (n.includes("facebook"))  return <FaFacebook />;
  if (n.includes("twitter") || n.includes("x.com")) return <FaTwitter />;
  return <FaLink />;
}

function getSourceColor(name = "") {
  const n = name.toLowerCase();
  if (n.includes("instagram")) return "#E1306C";
  if (n.includes("whatsapp"))  return "#25D366";
  if (n.includes("telegram"))  return "#2CA5E0";
  if (n.includes("facebook"))  return "#1877F2";
  if (n.includes("twitter") || n.includes("x.com")) return "#1DA1F2";
  if (n.includes("direct"))    return "#f59e0b";
  return "#6b7280";
}

function getDeviceIcon(os = "") {
  const d = os.toLowerCase();
  if (d.includes("ios") || d.includes("iphone") || d.includes("mac")) return <FaApple />;
  if (d.includes("android")) return <FaAndroid />;
  return <FiMonitor />;
}

function getDeviceColor(os = "") {
  const d = os.toLowerCase();
  if (d.includes("ios") || d.includes("iphone") || d.includes("mac")) return "#a8b2c1";
  if (d.includes("android")) return "#3DDC84";
  return "#3b82f6";
}

function getPlatformColor(name = "") {
  const n = (name || "").toLowerCase();
  if (n.includes("instagram")) return "#E1306C";
  if (n.includes("whatsapp"))  return "#25D366";
  if (n.includes("telegram"))  return "#2CA5E0";
  if (n.includes("facebook"))  return "#1877F2";
  if (n.includes("twitter") || n.includes("x")) return "#1DA1F2";
  if (n.includes("linkedin"))  return "#0077B5";
  if (n.includes("youtube"))   return "#FF0000";
  if (n.includes("tiktok"))    return "#010101";
  if (n.includes("phone") || n.includes("tel")) return "#10b981";
  if (n.includes("email") || n.includes("mail")) return "#f59e0b";
  return "#6b7280";
}

function sortAndPercent(arr, key = "total") {
  if (!arr || arr.length === 0) return [];
  const sorted = [...arr].sort((a, b) => (b[key] || 0) - (a[key] || 0));
  const max = sorted[0][key] || 1;
  return sorted.map(item => ({ ...item, percent: Math.round(((item[key] || 0) / max) * 100) }));
}

// scan_type_stats → array normallaşdır
function normalizeScanTypes(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  // { qr: 5, nfc: 3 } formatı
  return Object.entries(raw).map(([scan_type, total]) => ({ scan_type, total }));
}

// ─── UI Komponentlər ─────────────────────────────────────
function StatCard({ icon, label, value, color, loading }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ backgroundColor: `${color}18`, color }}>
        {icon}
      </div>
      <div className="stat-info">
        <h4>{label}</h4>
        <div className="stat-bottom">
          {loading
            ? <span className="sk-num" />
            : <span className="value">{(value ?? 0).toLocaleString()}</span>}
        </div>
      </div>
    </div>
  );
}

function ProgressRow({ icon, name, count, percent, color, label = "baxış" }) {
  return (
    <div className="progress-row">
      <div className="row-info">
        <div className="info-left">
          <span className="item-icon" style={{ color }}>{icon}</span>
          <span className="item-name">{name}</span>
        </div>
        <span className="item-count">{count} {label}</span>
      </div>
      <div className="progress-bar-bg">
        <div className="progress-fill" style={{ width: `${percent}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function Pagination({ page, total, pageSize, onChange }) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  return (
    <div className="pagination-row">
      <button
        className="pg-btn"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
      >
        <FiChevronLeft />
      </button>
      <span className="pg-info">{page} / {totalPages}</span>
      <button
        className="pg-btn"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
      >
        <FiChevronRight />
      </button>
    </div>
  );
}

function EmptyState({ text = "Məlumat yoxdur" }) {
  return <p className="empty-state-text">{text}</p>;
}

function SkeletonRows({ count = 3 }) {
  return (
    <div className="skeleton-wrap">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-row">
          <div className="sk-line short" />
          <div className="sk-line long" />
        </div>
      ))}
    </div>
  );
}

function DashCard({ title, icon, children }) {
  return (
    <div className="dashboard-card">
      <div className="card-header">
        <h3>{React.cloneElement(icon, { className: "head-icon" })}{title}</h3>
      </div>
      <div className="card-body">{children}</div>
    </div>
  );
}

// ─── Ana Komponent ────────────────────────────────────────
function AnalysMain() {
  const { hash_id: paramHashId } = useParams();
  const hashId = CK.get("hash_id") || paramHashId || "";

  const [selectedMonth, setSelectedMonth] = useState(null);
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [sourcePage, setSourcePage] = useState(1);
  const [pendingAdmin, setPendingAdmin] = useState(false);

  // Ay seçimi dəyişdikdə API-ni yenidən çağır (month param ilə)
  const fetchAnalytics = useCallback(async (month = null) => {
    if (!hashId) { setError("İstifadəçi tapılmadı."); setLoading(false); return; }
    setLoading(true);
    setError("");

    const params = month ? `?month=${month}` : "";
    const url = `${API_BASE}/api/v1/profile/me/analytics/${hashId}/${params}`;

    try {
      const res = await authFetch(url, { method: "GET" });
      if (!res) { setError("Sessiya bitib."); return; }

      // 403: plan yoxdur və ya admin hələ təsdiqləməyib
      if (res.status === 403) {
        try {
          const profileRes = await authFetch(`${API_BASE}/api/v1/profile/me/`);
          if (profileRes?.ok) {
            const pd = await profileRes.json().catch(() => ({}));
            if (!(pd?.card?.is_admin_active ?? true)) {
              setPendingAdmin(true);
              return;
            }
          }
        } catch { /* ignored */ }
        const body = await res.json().catch(() => ({}));
        setError(body?.error || body?.detail || "Bu xüsusiyyət üçün Pro və ya Premium paket tələb olunur.");
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.detail || body?.error || `Server xətası: ${res.status}`);
        return;
      }
      setData(await res.json());
    } catch {
      setError("Server ilə əlaqə kəsildi.");
    } finally {
      setLoading(false);
    }
  }, [hashId]);

  useEffect(() => { fetchAnalytics(null); }, [fetchAnalytics]);

  const handleMonthClick = (num) => {
    const next = selectedMonth === num ? null : num;
    setSelectedMonth(next);
    setSourcePage(1);
    fetchAnalytics(next);
  };

  // ── Data çıxarışı ─────────────────────────────────────
  const summary       = data?.summary || {};
  const monthlyTrends = data?.monthly_trends || [];
  const scanTypes     = normalizeScanTypes(data?.scan_type_stats);
  const linkSideStats = sortAndPercent(data?.link_side_stats || [], "total_clicks");
  const deviceStats   = sortAndPercent(data?.device_stats   || [], "total");
  const linkStats     = sortAndPercent(data?.link_stats      || [], "total_clicks");

  // Vasitələr pagination
  const sourceSlice = linkSideStats.slice((sourcePage - 1) * PAGE_SIZE, sourcePage * PAGE_SIZE);

  // Aylıq trend xəritəsi (yalnız ay seçicisi üçün göstərici)
  const trendMap = {};
  monthlyTrends.forEach(t => { trendMap[t.month_num] = t; });

  const activeTrend    = selectedMonth ? trendMap[selectedMonth] : null;
  const selectedMonthName = ALL_MONTHS.find(m => m.num === selectedMonth)?.name || "";

  if (pendingAdmin) {
    return (
      <div className="analys-main-modern pending-admin-page">
        <div className="pending-admin-card">
          <div className="pending-icon-wrap">
            <FaIconsAll.FaHourglassHalf />
          </div>
          <div className="pending-admin-text">
            <h3>Hesabınız gözləmədədir</h3>
            <p>Analitika bölməsinə giriş üçün hesabınızın admin tərəfindən təsdiqlənməsi tələb olunur. Təsdiqləndikdən sonra bu bölmə avtomatik aktiv olacaq.</p>
          </div>
          <div className="pending-admin-badge">
            <span className="badge-dot" />
            Təsdiq gözlənilir
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="analys-main-modern">

      {/* ── BAŞLIQ ── */}
      <div className="top-header">
        <div className="title-area">
          <h2 className="page-title">Analitika</h2>
          <p className="page-subtitle">
            {selectedMonth
              ? `${selectedMonthName} ayı üzrə statistika`
              : summary.analysis_period
                ? `Analiz dövrü: ${summary.analysis_period}`
                : "Səhifənizin ziyarətçi statistikasını detallı izləyin."}
          </p>
        </div>
        {selectedMonth && (
          <button className="clear-month-btn" onClick={() => handleMonthClick(selectedMonth)}>
            Bütün dövr
          </button>
        )}
      </div>

      {/* ── XƏTA ── */}
      {error && (
        <div className="analys-error-banner">
          <span>{error}</span>
          <button onClick={() => { setSourcePage(1); fetchAnalytics(selectedMonth); }}>Yenidən cəhd et</button>
        </div>
      )}

      <div className="analys-content">

        {/* ── AYLAR ── */}
        <div className="months-row">
          {ALL_MONTHS.map(m => {
            const trend  = trendMap[m.num];
            const hasData = trend && (trend.views > 0 || trend.clicks > 0);
            const isActive = selectedMonth === m.num;
            return (
              <button
                key={m.num}
                className={["month-btn", isActive ? "active" : "", !hasData ? "no-data" : ""].filter(Boolean).join(" ")}
                onClick={() => handleMonthClick(m.num)}
                disabled={loading}
              >
                <span className="month-name">{m.name}</span>
                {hasData && <span className="month-dot" />}
              </button>
            );
          })}
        </div>

        {/* ── SCAN TYPE STATS ── */}
        {(loading || scanTypes.length > 0) && (
          <div className="section-block">
            <p className="section-label">Giriş növləri</p>
            <div className="scan-type-row">
              {loading ? (
                [1, 2, 3].map(i => <div key={i} className="stat-card skeleton-card"><div className="sk-card" /></div>)
              ) : (
                scanTypes.map((item, i) => {
                  const key  = (item.scan_type || "").toLowerCase();
                  const meta = SCAN_TYPE_MAP[key] || {
                    label: item.scan_type,
                    icon: <FiLink />,
                    color: "#6b7280",
                  };
                  return (
                    <StatCard
                      key={i}
                      icon={meta.icon}
                      label={meta.label}
                      value={item.total}
                      color={meta.color}
                      loading={false}
                    />
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ── SUMMARY KARTLAR ── */}
        <div className="section-block">
          <p className="section-label">
            {selectedMonth ? `${selectedMonthName} — Ümumi` : "İl üzrə ümumi"}
          </p>
          <div className="summary-cards-row">
            <StatCard icon={<FiEye />}       label="Ümumi Baxış"    value={summary.total_views_ytd  ?? 0} color="#10b981" loading={loading} />
            <StatCard icon={<FiTrendingUp />} label="Ümumi Keçidlər" value={summary.total_clicks_ytd ?? 0} color="#3b82f6" loading={loading} />
          </div>
        </div>

        {/* ── ANA GRID: Vasitələr | Cihazlar ── */}
        <div className="dashboard-grid two-col">

          <DashCard title="Vasitələr" icon={<FaGlobe />}>
            {loading ? <SkeletonRows /> : linkSideStats.length === 0
              ? <EmptyState text="Mənbə məlumatı hələ yoxdur" />
              : <>
                  {sourceSlice.map((item, i) => {
                    const src = item.name || "Digər";
                    return (
                      <ProgressRow key={i}
                        icon={getSourceIcon(src)} name={src}
                        count={item.total_clicks || 0} percent={item.percent}
                        color={getSourceColor(src)} label="klik"
                      />
                    );
                  })}
                  <Pagination
                    page={sourcePage}
                    total={linkSideStats.length}
                    pageSize={PAGE_SIZE}
                    onChange={setSourcePage}
                  />
                </>
            }
          </DashCard>

          <DashCard title="Cihazlar" icon={<FiSmartphone />}>
            {loading ? <SkeletonRows /> : deviceStats.length === 0
              ? <EmptyState text="Cihaz məlumatı hələ yoxdur" />
              : deviceStats.map((item, i) => {
                  const os = item.os_info || "Digər";
                  return (
                    <ProgressRow key={i}
                      icon={getDeviceIcon(os)} name={os}
                      count={item.total || 0} percent={item.percent}
                      color={getDeviceColor(os)}
                    />
                  );
                })
            }
          </DashCard>

        </div>

        {/* ── LİNK STATS ── */}
        {(loading || linkStats.length > 0) && (
          <div className="section-block">
            <p className="section-label">Profil Linkləri</p>
            <div className="dashboard-card">
              <div className="card-body">
                {loading ? <SkeletonRows count={5} /> : linkStats.length === 0
                  ? <EmptyState text="Link klik məlumatı hələ yoxdur" />
                  : linkStats.map((item, i) => {
                      const name  = item.platform_name || item.name || "Link";
                      const color = getPlatformColor(name);
                      return (
                        <ProgressRow key={i}
                          icon={item.icon_code ? getProfileIcon(item.icon_code) : getSourceIcon(name)}
                          name={name}
                          count={item.total_clicks || 0}
                          percent={item.percent}
                          color={color}
                          label="klik"
                        />
                      );
                    })
                }
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default AnalysMain;
