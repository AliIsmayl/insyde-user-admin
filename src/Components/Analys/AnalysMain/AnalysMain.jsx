import React, { useState } from "react";
import {
  FiEye,
  FiUsers,
  FiTrendingUp,
  FiMapPin,
  FiLink,
  FiSmartphone,
  FiMonitor,
} from "react-icons/fi";
import {
  FaInstagram,
  FaApple,
  FaAndroid,
  FaGlobe,
  FaWhatsapp,
} from "react-icons/fa";
import "./AnalysMain.scss";

function AnalysMain() {
  // Zaman filtri üçün state (week, month, 6months, year)
  const [period, setPeriod] = useState("month");

  // Zaman aralığına görə rəqəmləri dəyişmək üçün sadə vuruq məntiqi (Vizual effekt üçün)
  const multipliers = {
    week: 0.25,
    month: 1,
    "6months": 6,
    year: 12,
  };
  const m = multipliers[period];

  // ================= MOCK DATALAR ================= //
  const summaryStats = [
    {
      title: "Ümumi Baxış",
      value: Math.round(1250 * m),
      icon: <FiEye />,
      color: "#10b981",
      trend: "+12%",
    },
    {
      title: "Linkə Keçidlər",
      value: Math.round(430 * m),
      icon: <FiTrendingUp />,
      color: "#3b82f6",
      trend: "+18%",
    },
  ];

  const sourceData = [
    {
      name: "Instagram",
      icon: <FaInstagram />,
      count: Math.round(450 * m),
      percent: 65,
      color: "#E1306C",
    },
    {
      name: "WhatsApp",
      icon: <FaWhatsapp />,
      count: Math.round(150 * m),
      percent: 25,
      color: "#25D366",
    },
  ];

  const deviceData = [
    {
      name: "iOS (iPhone)",
      icon: <FaApple />,
      count: Math.round(520 * m),
      percent: 55,
      color: "#000000",
    },
    {
      name: "Android",
      icon: <FaAndroid />,
      count: Math.round(380 * m),
      percent: 40,
      color: "#3DDC84",
    },
    {
      name: "Masaüstü",
      icon: <FiMonitor />,
      count: Math.round(45 * m),
      percent: 5,
      color: "#3b82f6",
    },
  ];

  const locationData = [
    {
      country: "Azərbaycan",
      city: "Bakı",
      count: Math.round(850 * m),
      percent: 75,
    },
    {
      country: "Azərbaycan",
      city: "Sumqayıt",
      count: Math.round(120 * m),
      percent: 12,
    },
    {
      country: "Azərbaycan",
      city: "Gəncə",
      count: Math.round(80 * m),
      percent: 8,
    },
    {
      country: "Türkiyə",
      city: "İstanbul",
      count: Math.round(45 * m),
      percent: 5,
    },
  ];

  return (
    <div className="analys-main-modern">
      {/* BAŞLIQ VƏ FİLTRLƏR */}
      <div className="top-header">
        <div className="title-area">
          <h2 className="page-title">Analitika</h2>
          <p className="page-subtitle">
            Səhifənizin ziyarətçi statistikasını və mənbələrini detallı izləyin.
          </p>
        </div>

        {/* ZAMAN FİLTRİ */}
        <div className="period-filters">
          <button
            className={period === "week" ? "active" : ""}
            onClick={() => setPeriod("week")}
          >
            Həftəlik
          </button>
          <button
            className={period === "month" ? "active" : ""}
            onClick={() => setPeriod("month")}
          >
            Aylıq
          </button>
          <button
            className={period === "6months" ? "active" : ""}
            onClick={() => setPeriod("6months")}
          >
            6 Aylıq
          </button>
          <button
            className={period === "year" ? "active" : ""}
            onClick={() => setPeriod("year")}
          >
            İllik
          </button>
        </div>
      </div>

      <div className="analys-content">
        {/* ÜMUMİ STATİSTİKA KARTLARI */}
        <div className="summary-cards-row">
          {summaryStats.map((stat, index) => (
            <div className="stat-card" key={index}>
              <div
                className="stat-icon"
                style={{
                  backgroundColor: `${stat.color}15`,
                  color: stat.color,
                }}
              >
                {stat.icon}
              </div>
              <div className="stat-info">
                <h4>{stat.title}</h4>
                <div className="stat-bottom">
                  <span className="value">{stat.value}</span>
                  <span className="trend positive">{stat.trend}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* DETALLI ANALİZ QRİDİ */}
        <div className="dashboard-grid">
          {/* MƏNBƏLƏR (VASİTƏLƏR) KARTI */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>
                <FaGlobe className="head-icon" /> Hansı vasitələrlə baxılıb?
              </h3>
            </div>
            <div className="card-body">
              {sourceData.map((item, index) => (
                <div className="progress-row" key={index}>
                  <div className="row-info">
                    <div className="info-left">
                      <span className="item-icon" style={{ color: item.color }}>
                        {item.icon}
                      </span>
                      <span className="item-name">{item.name}</span>
                    </div>
                    <span className="item-count">{item.count} baxış</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${item.percent}%`,
                        backgroundColor: item.color,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CİHAZLAR KARTI */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>
                <FiSmartphone className="head-icon" /> Cihazlar
              </h3>
            </div>
            <div className="card-body">
              {deviceData.map((item, index) => (
                <div className="progress-row" key={index}>
                  <div className="row-info">
                    <div className="info-left">
                      <span className="item-icon" style={{ color: item.color }}>
                        {item.icon}
                      </span>
                      <span className="item-name">{item.name}</span>
                    </div>
                    <span className="item-count">{item.count} baxış</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${item.percent}%`,
                        backgroundColor: item.color,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* YERLƏŞMƏ (ÖLKƏ/ŞƏHƏR) KARTI */}
          <div className="dashboard-card location-card">
            <div className="card-header">
              <h3>
                <FiMapPin className="head-icon" /> Coğrafi Yerləşmə
              </h3>
            </div>
            <div className="card-body">
              {locationData.map((item, index) => (
                <div className="location-row" key={index}>
                  <div className="loc-left">
                    <div className="loc-icon">
                      <FiMapPin />
                    </div>
                    <div className="loc-texts">
                      <span className="city">{item.city}</span>
                      <span className="country">{item.country}</span>
                    </div>
                  </div>
                  <div className="loc-right">
                    <span className="loc-count">{item.count}</span>
                    <span className="loc-percent">{item.percent}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalysMain;
