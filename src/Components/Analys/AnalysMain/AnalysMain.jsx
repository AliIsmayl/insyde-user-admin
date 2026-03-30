import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  FiEye,
  FiTrendingUp,
  FiMapPin,
  FiSmartphone,
  FiMonitor,
  FiRefreshCw,
} from "react-icons/fi";
import {
  FaInstagram,
  FaApple,
  FaAndroid,
  FaGlobe,
  FaWhatsapp,
  FaTelegram,
  FaFacebook,
  FaTwitter,
  FaLink,
} from "react-icons/fa";
import { API_BASE, authFetch, CK } from "../../../Utils/authUtils";
import "./AnalysMain.scss";

const ALL_MONTHS = [
  { num: 1, name: "Yanvar" },
  { num: 2, name: "Fevral" },
  { num: 3, name: "Mart" },
  { num: 4, name: "Aprel" },
  { num: 5, name: "May" },
  { num: 6, name: "İyun" },
  { num: 7, name: "İyul" },
  { num: 8, name: "Avqust" },
  { num: 9, name: "Sentyabr" },
  { num: 10, name: "Oktyabr" },
  { num: 11, name: "Noyabr" },
  { num: 12, name: "Dekabr" },
];

const PERIODS = [
  { key: "month", label: "Aylıq" },
  { key: "6months", label: "6 Aylıq" },
  { key: "year", label: "İllik" },
];

function getSourceIcon(name = "") {
  const n = name.toLowerCase();
  if (n.includes("instagram")) return <FaInstagram />;
  if (n.includes("whatsapp")) return <FaWhatsapp />;
  if (n.includes("telegram")) return <FaTelegram />;
  if (n.includes("facebook")) return <FaFacebook />;
  if (n.includes("twitter") || n.includes("x.com")) return <FaTwitter />;
  return <FaLink />;
}

function getSourceColor(name = "") {
  const n = name.toLowerCase();
  if (n.includes("instagram")) return "#E1306C";
  if (n.includes("whatsapp")) return "#25D366";
  if (n.includes("telegram")) return "#2CA5E0";
  if (n.includes("facebook")) return "#1877F2";
  if (n.includes("twitter") || n.includes("x.com")) return "#1DA1F2";
  if (n.includes("direct")) return "#f59e0b";
  return "#6b7280";
}

function getDeviceIcon(os = "") {
  const d = os.toLowerCase();
  if (d.includes("ios") || d.includes("iphone") || d.includes("mac"))
    return <FaApple />;
  if (d.includes("android")) return <FaAndroid />;
  return <FiMonitor />;
}

function getDeviceColor(os = "") {
  const d = os.toLowerCase();
  if (d.includes("ios") || d.includes("iphone") || d.includes("mac"))
    return "#a8b2c1";
  if (d.includes("android")) return "#3DDC84";
  return "#3b82f6";
}

// çoxdan aza sırala, sonra percent hesabla
function sortAndCalcPercents(arr, key = "total") {
  if (!arr || arr.length === 0) return [];
  const sorted = [...arr].sort((a, b) => (b[key] || 0) - (a[key] || 0));
  const max = sorted[0][key] || 1;
  return sorted.map((item) => ({
    ...item,
    percent: Math.round(((item[key] || 0) / max) * 100),
  }));
}

function ProgressRow({ icon, name, count, percent, color, label = "baxış" }) {
  return (
    <div className="progress-row">
      <div className="row-info">
        <div className="info-left">
          <span className="item-icon" style={{ color }}>
            {icon}
          </span>
          <span className="item-name">{name}</span>
        </div>
        <span className="item-count">
          {count} {label}
        </span>
      </div>
      <div className="progress-bar-bg">
        <div
          className="progress-fill"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function EmptyState({ text = "Məlumat yoxdur" }) {
  return <p className="empty-state-text">{text}</p>;
}

function SkeletonRows() {
  return (
    <div className="skeleton-wrap">
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton-row">
          <div className="sk-line short" />
          <div className="sk-line long" />
        </div>
      ))}
    </div>
  );
}

function AnalysMain() {
  const { hash_id: paramHashId } = useParams();
  const hashId = CK.get("hash_id") || paramHashId || "";

  const [period, setPeriod] = useState("month");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    const id = hashId;
    if (!id) {
      setError("İstifadəçi tapılmadı.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");

    const url = `${API_BASE}/api/v1/profile/me/analytics/${id}/`;

    try {
      const res = await authFetch(url, { method: "GET" });
      if (!res) {
        setError("Sessiya bitib.");
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.detail || body?.error || `Server xətası: ${res.status}`);
        return;
      }
      const json = await res.json();
      setData(json);
      setSelectedMonth(null);
    } catch {
      setError("Server ilə əlaqə kəsildi.");
    } finally {
      setLoading(false);
    }
  }, [hashId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const summary = data?.summary || {};
  const monthlyTrends = data?.monthly_trends || [];
  const linkSideStats = sortAndCalcPercents(
    data?.link_side_stats || [],
    "total_clicks",
  );
  const deviceStats = sortAndCalcPercents(data?.device_stats || [], "total");
  const cityStats = [...(data?.city_stats || [])].sort(
    (a, b) => (b.total || 0) - (a.total || 0),
  );

  const trendMap = {};
  monthlyTrends.forEach((t) => {
    trendMap[t.month_num] = t;
  });

  const activeTrend = selectedMonth ? trendMap[selectedMonth] || null : null;
  const displayViews = activeTrend
    ? activeTrend.views
    : (summary.total_views_ytd ?? 0);
  const displayClicks = activeTrend
    ? activeTrend.clicks
    : (summary.total_clicks_ytd ?? 0);

  const totalCityCount = cityStats.reduce((s, c) => s + (c.total || 0), 0);

  const SUMMARY_CARDS = [
    {
      title: "Ümumi Baxış",
      value: displayViews,
      icon: <FiEye />,
      color: "#10b981",
    },
    {
      title: "Linkə Keçidlər",
      value: displayClicks,
      icon: <FiTrendingUp />,
      color: "#3b82f6",
    },
  ];

  return (
    <div className="analys-main-modern">
      {/* BAŞLIQ */}
      <div className="top-header">
        <div className="title-area">
          <h2 className="page-title">Analitika</h2>
          <p className="page-subtitle">
            {summary.analysis_period
              ? `Analiz dövrü: ${summary.analysis_period}`
              : "Səhifənizin ziyarətçi statistikasını və mənbələrini detallı izləyin."}
          </p>
        </div>

        <div className="top-header-right">
          <div className="period-filters">
            {PERIODS.map(({ key, label }) => (
              <button
                key={key}
                className={period === key ? "active" : ""}
                onClick={() => setPeriod(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* XƏTA */}
      {error && (
        <div className="analys-error-banner">
          <span>{error}</span>
          <button onClick={fetchAnalytics}>Yenidən cəhd et</button>
        </div>
      )}

      <div className="analys-content">
        {/* AYLAR */}
        <div className="months-row">
          {ALL_MONTHS.map((m) => {
            const trend = trendMap[m.num];
            const hasData = trend && (trend.views > 0 || trend.clicks > 0);
            const isActive = selectedMonth === m.num;
            return (
              <button
                key={m.num}
                className={[
                  "month-btn",
                  isActive ? "active" : "",
                  !hasData ? "no-data" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => setSelectedMonth(isActive ? null : m.num)}
                disabled={loading}
              >
                <span className="month-name">{m.name}</span>
                {hasData && <span className="month-views">{trend.views}</span>}
              </button>
            );
          })}
        </div>

        {/* SUMMARY KARTLAR */}
        <div className="summary-cards-row">
          {SUMMARY_CARDS.map((stat, i) => (
            <div className="stat-card" key={i}>
              <div
                className="stat-icon"
                style={{
                  backgroundColor: `${stat.color}18`,
                  color: stat.color,
                }}
              >
                {stat.icon}
              </div>
              <div className="stat-info">
                <h4>
                  {stat.title}
                  {activeTrend && (
                    <span className="month-badge">
                      {ALL_MONTHS.find((m) => m.num === selectedMonth)?.name}
                    </span>
                  )}
                </h4>
                <div className="stat-bottom">
                  {loading ? (
                    <span className="sk-num" />
                  ) : (
                    <span className="value">{stat.value.toLocaleString()}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* GRID */}
        <div className="dashboard-grid">
          {/* MƏNBƏLƏR */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>
                <FaGlobe className="head-icon" />
                Hansı vasitələrlə baxılıb?
              </h3>
            </div>
            <div className="card-body">
              {loading ? (
                <SkeletonRows />
              ) : linkSideStats.length === 0 ? (
                <EmptyState text="Mənbə məlumatı hələ yoxdur" />
              ) : (
                linkSideStats.map((item, i) => {
                  const src = item.name || "Digər";
                  return (
                    <ProgressRow
                      key={i}
                      icon={getSourceIcon(src)}
                      name={src}
                      count={item.total_clicks || 0}
                      percent={item.percent}
                      color={getSourceColor(src)}
                      label="klik"
                    />
                  );
                })
              )}
            </div>
          </div>

          {/* CİHAZLAR */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>
                <FiSmartphone className="head-icon" />
                Cihazlar
              </h3>
            </div>
            <div className="card-body">
              {loading ? (
                <SkeletonRows />
              ) : deviceStats.length === 0 ? (
                <EmptyState text="Cihaz məlumatı hələ yoxdur" />
              ) : (
                deviceStats.map((item, i) => {
                  const os = item.os_info || "Digər";
                  return (
                    <ProgressRow
                      key={i}
                      icon={getDeviceIcon(os)}
                      name={os}
                      count={item.total || 0}
                      percent={item.percent}
                      color={getDeviceColor(os)}
                    />
                  );
                })
              )}
            </div>
          </div>

          {/* COĞRAFİ YERLƏŞMƏ */}
          <div className="dashboard-card location-card">
            <div className="card-header">
              <h3>
                <FiMapPin className="head-icon" />
                Coğrafi Yerləşmə
              </h3>
            </div>
            <div className="card-body">
              {loading ? (
                <SkeletonRows />
              ) : cityStats.length === 0 ? (
                <EmptyState text="Coğrafi məlumat hələ yoxdur" />
              ) : (
                cityStats.map((item, i) => {
                  const pct =
                    totalCityCount > 0
                      ? Math.round(((item.total || 0) / totalCityCount) * 100)
                      : 0;
                  return (
                    <div className="location-row" key={i}>
                      <div className="loc-left">
                        <div className="loc-icon">
                          <FiMapPin />
                        </div>
                        <div className="loc-texts">
                          <span className="city">{item.city || "Naməlum"}</span>
                          <span className="country">{item.country || "—"}</span>
                        </div>
                      </div>
                      <div className="loc-right">
                        <span className="loc-count">{item.total || 0}</span>
                        <span className="loc-percent">{pct}%</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalysMain;
