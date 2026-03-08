import React, { useState } from "react";
import {
  FiCheck,
  FiX,
  FiCheckCircle,
  FiInfo,
  FiCalendar,
} from "react-icons/fi";
import "./PackageMain.scss";

const MobileFeatureRow = ({ title, info, isAvailable, isMonthly, price }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (isMonthly) {
    return (
      <div className="mobile-feat-group">
        <div
          className="feat-item monthly-fee"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="icon">
            <FiCheck className="icon-check" />
          </div>
          <div className="feat-text-wrapper">
            <span>
              Aylıq aktivlik: <strong>{price}</strong>
            </span>
            <FiInfo className={`mobile-info-icon ${isOpen ? "active" : ""}`} />
          </div>
        </div>
        <div className={`mobile-faq-box ${isOpen ? "open" : ""}`}>
          <div className="faq-inner">{info}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-feat-group">
      <div className="feat-item" onClick={() => setIsOpen(!isOpen)}>
        <div className="icon">
          {isAvailable ? (
            <FiCheck className="icon-check" />
          ) : (
            <FiX className="icon-cross" />
          )}
        </div>
        <div className="feat-text-wrapper">
          <span className={!isAvailable ? "disabled-text" : ""}>{title}</span>
          <FiInfo className={`mobile-info-icon ${isOpen ? "active" : ""}`} />
        </div>
      </div>
      <div className={`mobile-faq-box ${isOpen ? "open" : ""}`}>
        <div className="faq-inner">{info}</div>
      </div>
    </div>
  );
};

const packageMonthlyPrice = { basic: 1.5, pro: 2.0, premium: 2.0 };
const packageCardPrice = { basic: "12.90₼", pro: "27.90₼", premium: "36.90₼" };
const packageNames = { basic: "Sadə", pro: "Pro", premium: "Premium" };

const billingOptions = [
  { key: "monthly", label: "1 Aylıq", months: 1 },
  { key: "biannual", label: "6 Aylıq", months: 6 },
  { key: "annual", label: "12 Aylıq", months: 12 },
];

function PackageMain() {
  const [currentPackage, setCurrentPackage] = useState("pro");
  const [selectedBilling, setSelectedBilling] = useState("monthly");

  const features = [
    {
      name: "Sosial şəbəkə",
      info: "Bütün sosial şəbəkə hesablarınızı tək bir səhifədə birləşdirin.",
      basic: true,
      pro: true,
      premium: true,
    },
    {
      name: "Əlaqə məlumatları",
      info: "Telefon, e-poçt və ünvan kimi əlaqə vasitələrini müştərilərlə paylaşın.",
      basic: true,
      pro: true,
      premium: true,
    },
    {
      name: "Portfel, kataloq, menu",
      info: "İşlərinizi, məhsullarınızı və ya restoran menyusunu nümayiş etdirin.",
      basic: true,
      pro: true,
      premium: true,
    },
    {
      name: "NFC + QR sistem",
      info: "Məlumatlarınızı həm NFC toxunuşu, həm də QR kod oxudularaq anında paylaşın.",
      basic: true,
      pro: true,
      premium: true,
    },
    {
      name: "Fiziki kart",
      info: "İçində çip olan xüsusi fiziki vizit kartı ünvana çatdırılır.",
      basic: true,
      pro: true,
      premium: true,
    },
    {
      name: "Sistem analitikası",
      info: "Profilinizə baxış sayını və hansı linklərə klikləndiyini detallı izləyin.",
      basic: false,
      pro: true,
      premium: true,
    },
    {
      name: "Xüsusi dizayn",
      info: "Kartınızın üzərində şirkətinizin loqosu və fərdi dizaynı tətbiq olunur.",
      basic: false,
      pro: true,
      premium: true,
    },
    {
      name: "Qablaşma",
      info: "Fiziki kartınız xüsusi premium qutu və qablaşdırmada təqdim olunur.",
      basic: false,
      pro: true,
      premium: true,
    },
    {
      name: "Digital kart",
      info: "Apple Wallet və Google Wallet üçün rəqəmsal kart dəstəyi.",
      basic: false,
      pro: false,
      premium: true,
    },
  ];

  const monthlyRate = packageMonthlyPrice[currentPackage];
  const activeBilling = billingOptions.find((b) => b.key === selectedBilling);
  const totalPrice = +(monthlyRate * activeBilling.months).toFixed(2);

  return (
    <div className="package-main-modern">
      <div className="top-header">
        <div>
          <h2 className="page-title">Ödəniş Planı</h2>
          <p className="page-subtitle">
            Ehtiyaclarınıza uyğun ən ideal paketi seçin və idarə edin.
          </p>
        </div>
      </div>

      <div className="package-content">
        {/* ===== MASAÜSTÜ CƏDVƏL ===== */}
        <div className="desktop-only pricing-card">
          <div className="pricing-table">
            <div className="table-header-row">
              <div className="feature-cell empty-cell">Özəlliklər</div>
              {["basic", "pro", "premium"].map((pkg) => (
                <div
                  key={pkg}
                  className={`package-cell ${pkg} ${currentPackage === pkg ? "is-current" : ""}`}
                >
                  <h3>{packageNames[pkg]}</h3>
                  <div className="price">{packageCardPrice[pkg]}</div>
                  {currentPackage === pkg ? (
                    <div className="current-badge">
                      <FiCheckCircle /> Hazırkı Paket
                    </div>
                  ) : (
                    <button
                      className="select-btn"
                      onClick={() => setCurrentPackage(pkg)}
                    >
                      Seç
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="table-body">
              {features.map((feat, index) => (
                <div className="table-row" key={index}>
                  <div className="feature-name has-tooltip">
                    <span>{feat.name}</span>
                    <div className="info-icon" tabIndex="0">
                      <FiInfo />
                      <div className="tooltip-box">{feat.info}</div>
                    </div>
                  </div>
                  {["basic", "pro", "premium"].map((pkg) => (
                    <div
                      key={pkg}
                      className={`feature-status ${pkg} ${currentPackage === pkg ? "active-col" : ""}`}
                    >
                      {feat[pkg] ? (
                        <FiCheck className="icon-check" />
                      ) : (
                        <FiX className="icon-cross" />
                      )}
                    </div>
                  ))}
                </div>
              ))}

              <div className="table-row highlight-row">
                <div className="feature-name has-tooltip">
                  <span>Aylıq aktivlik ödənişi</span>
                  <div className="info-icon" tabIndex="0">
                    <FiInfo />
                    <div className="tooltip-box">
                      Sistemdə qeydiyyatda qalmaq üçün aylıq ödəniş.
                    </div>
                  </div>
                </div>
                <div
                  className={`feature-status basic ${currentPackage === "basic" ? "active-col" : ""}`}
                >
                  <strong>1.50₼</strong>
                </div>
                <div
                  className={`feature-status pro ${currentPackage === "pro" ? "active-col" : ""}`}
                >
                  <strong>2.00₼</strong>
                </div>
                <div
                  className={`feature-status premium ${currentPackage === "premium" ? "active-col" : ""}`}
                >
                  <strong>2.00₼</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== MOBİL KARTLAR ===== */}
        <div className="mobile-only mobile-cards-container">
          {["basic", "pro", "premium"].map((pkg) => (
            <div
              key={pkg}
              className={`mobile-package-card ${pkg} ${currentPackage === pkg ? "is-current" : ""}`}
            >
              <div className="card-top">
                <h3>{packageNames[pkg]}</h3>
                <div className="price">{packageCardPrice[pkg]}</div>
              </div>
              <div className="card-features">
                {features.map((feat, i) => (
                  <MobileFeatureRow
                    key={i}
                    title={feat.name}
                    info={feat.info}
                    isAvailable={feat[pkg]}
                  />
                ))}
                <MobileFeatureRow
                  isMonthly={true}
                  price={pkg === "basic" ? "1.50₼" : "2.00₼"}
                  info="Xidmətdən fasiləsiz istifadə üçün aylıq abunəlik."
                />
              </div>
              <div className="card-bottom">
                {currentPackage === pkg ? (
                  <div className="current-badge">
                    <FiCheckCircle /> Hazırkı Paket
                  </div>
                ) : (
                  <button
                    className="select-btn"
                    onClick={() => setCurrentPackage(pkg)}
                  >
                    Seç
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ===== AYLIQ AKTİVLİK BÖLMƏSİ ===== */}
        <div className="billing-section">
          <div className="billing-header">
            <div>
              <h3 className="billing-title">Aylıq Aktivlik Ödənişi</h3>
              <p className="billing-subtitle">
                <strong>{packageNames[currentPackage]}</strong> paketi — aylıq{" "}
                <strong className="rate-highlight">
                  {monthlyRate.toFixed(2).replace(".00", "")}₼
                </strong>
              </p>
            </div>
            <div className="billing-rate-badge">
              <FiCalendar />
              <span>{monthlyRate.toFixed(2).replace(".00", "")}₼ / ay</span>
            </div>
          </div>

          {/* Müddət tabları — hər birinin qiyməti avtomatik hesablanır */}
          <div className="billing-tabs">
            {billingOptions.map((opt) => {
              const price = +(monthlyRate * opt.months).toFixed(2);
              return (
                <button
                  key={opt.key}
                  className={`billing-tab ${selectedBilling === opt.key ? "active" : ""}`}
                  onClick={() => setSelectedBilling(opt.key)}
                >
                  <span className="tab-label">{opt.label}</span>
                  <span className="tab-price">{price}₼</span>
                </button>
              );
            })}
          </div>

          {/* Yekun məbləğ */}
          <div className="billing-summary">
            <div className="summary-item">
              <span className="summary-label">Paket</span>
              <span className="summary-value">
                {packageNames[currentPackage]}
              </span>
            </div>
            <div className="summary-divider" />
            <div className="summary-item">
              <span className="summary-label">Müddət</span>
              <span className="summary-value">{activeBilling.label}</span>
            </div>
            <div className="summary-divider" />
            <div className="summary-item">
              <span className="summary-label">Aylıq qiymət</span>
              <span className="summary-value">
                {monthlyRate.toFixed(2).replace(".00", "")}₼
              </span>
            </div>
            <div className="summary-divider" />
            <div className="summary-item total-item">
              <span className="summary-label">Ümumi məbləğ</span>
              <span className="summary-total">{totalPrice}₼</span>
            </div>
            <button className="pay-btn">
              <FiCheckCircle /> Ödənişi Tamamla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PackageMain;
