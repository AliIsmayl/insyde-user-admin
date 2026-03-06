import React, { useState } from "react";
import { FiCheck, FiX, FiCheckCircle, FiInfo } from "react-icons/fi";
import "./PackageMain.scss";

// Mobildə hər sətrin FAQ (Accordion) kimi açılıb-bağlanması üçün kiçik komponent
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

function PackageMain() {
  const [currentPackage, setCurrentPackage] = useState("pro");

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

  return (
    <div className="package-main-modern">
      {/* BAŞLIQ */}
      <div className="top-header">
        <div>
          <h2 className="page-title">Ödəniş Planı</h2>
          <p className="page-subtitle">
            Ehtiyaclarınıza uyğun ən ideal paketi seçin və idarə edin.
          </p>
        </div>
      </div>

      <div className="package-content">
        {/* ========================================================= */}
        {/* ================ 1. MASAÜSTÜ ÜÇÜN CƏDVƏL (Tooltip) ====== */}
        {/* ========================================================= */}
        <div className="desktop-only pricing-card">
          <div className="pricing-table">
            {/* BAŞLIQLAR */}
            <div className="table-header-row">
              <div className="feature-cell empty-cell">Özəlliklər</div>

              <div
                className={`package-cell basic ${currentPackage === "basic" ? "is-current" : ""}`}
              >
                <h3>Sadə</h3>
                <div className="price">12.90₼</div>
                {currentPackage === "basic" ? (
                  <div className="current-badge">
                    <FiCheckCircle /> Hazırkı Paket
                  </div>
                ) : (
                  <button
                    className="select-btn"
                    onClick={() => setCurrentPackage("basic")}
                  >
                    Seç
                  </button>
                )}
              </div>

              <div
                className={`package-cell pro ${currentPackage === "pro" ? "is-current" : ""}`}
              >
                <div className="popular-badge">Ən Çox Seçilən</div>
                <h3>Pro</h3>
                <div className="price">26.90₼</div>
                {currentPackage === "pro" ? (
                  <div className="current-badge">
                    <FiCheckCircle /> Hazırkı Paket
                  </div>
                ) : (
                  <button
                    className="select-btn active"
                    onClick={() => setCurrentPackage("pro")}
                  >
                    Seç
                  </button>
                )}
              </div>

              <div
                className={`package-cell premium ${currentPackage === "premium" ? "is-current" : ""}`}
              >
                <h3>Premium</h3>
                <div className="price">32.90₼</div>
                {currentPackage === "premium" ? (
                  <div className="current-badge">
                    <FiCheckCircle /> Hazırkı Paket
                  </div>
                ) : (
                  <button
                    className="select-btn"
                    onClick={() => setCurrentPackage("premium")}
                  >
                    Seç
                  </button>
                )}
              </div>
            </div>

            {/* CƏDVƏL BƏDƏNİ */}
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

                  <div
                    className={`feature-status basic ${currentPackage === "basic" ? "active-col" : ""}`}
                  >
                    {feat.basic ? (
                      <FiCheck className="icon-check" />
                    ) : (
                      <FiX className="icon-cross" />
                    )}
                  </div>

                  <div
                    className={`feature-status pro ${currentPackage === "pro" ? "active-col" : ""}`}
                  >
                    {feat.pro ? (
                      <FiCheck className="icon-check" />
                    ) : (
                      <FiX className="icon-cross" />
                    )}
                  </div>

                  <div
                    className={`feature-status premium ${currentPackage === "premium" ? "active-col" : ""}`}
                  >
                    {feat.premium ? (
                      <FiCheck className="icon-check" />
                    ) : (
                      <FiX className="icon-cross" />
                    )}
                  </div>
                </div>
              ))}

              <div className="table-row highlight-row">
                <div className="feature-name has-tooltip">
                  <span>Aylıq aktivlik ödənişi</span>
                  <div className="info-icon" tabIndex="0">
                    <FiInfo />
                    <div className="tooltip-box">
                      Sistemdə qeydiyyatda qalmaq və xidmətlərdən fasiləsiz
                      istifadə üçün aylıq ödəniş.
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

        {/* ========================================================= */}
        {/* ================ 2. MOBİL ÜÇÜN KARTLAR (FAQ) ============ */}
        {/* ========================================================= */}
        <div className="mobile-only mobile-cards-container">
          {/* SADƏ KART */}
          <div
            className={`mobile-package-card basic ${currentPackage === "basic" ? "is-current" : ""}`}
          >
            <div className="card-top">
              <h3>Sadə</h3>
              <div className="price">12.90₼</div>
            </div>

            <div className="card-features">
              {features.map((feat, index) => (
                <MobileFeatureRow
                  key={index}
                  title={feat.name}
                  info={feat.info}
                  isAvailable={feat.basic}
                />
              ))}
              <MobileFeatureRow
                isMonthly={true}
                price="1.50₼"
                info="Xidmətdən fasiləsiz istifadə üçün aylıq abunəlik."
              />
            </div>

            <div className="card-bottom">
              {currentPackage === "basic" ? (
                <div className="current-badge">
                  <FiCheckCircle /> Hazırkı Paket
                </div>
              ) : (
                <button
                  className="select-btn"
                  onClick={() => setCurrentPackage("basic")}
                >
                  Seç
                </button>
              )}
            </div>
          </div>

          {/* PRO KART */}
          <div
            className={`mobile-package-card pro ${currentPackage === "pro" ? "is-current" : ""}`}
          >
            <div className="popular-badge">Ən Çox Seçilən</div>
            <div className="card-top">
              <h3>Pro</h3>
              <div className="price">26.90₼</div>
            </div>

            <div className="card-features">
              {features.map((feat, index) => (
                <MobileFeatureRow
                  key={index}
                  title={feat.name}
                  info={feat.info}
                  isAvailable={feat.pro}
                />
              ))}
              <MobileFeatureRow
                isMonthly={true}
                price="2.00₼"
                info="Xidmətdən fasiləsiz istifadə üçün aylıq abunəlik."
              />
            </div>

            <div className="card-bottom">
              {currentPackage === "pro" ? (
                <div className="current-badge">
                  <FiCheckCircle /> Hazırkı Paket
                </div>
              ) : (
                <button
                  className="select-btn active"
                  onClick={() => setCurrentPackage("pro")}
                >
                  Seç
                </button>
              )}
            </div>
          </div>

          {/* PREMİUM KART */}
          <div
            className={`mobile-package-card premium ${currentPackage === "premium" ? "is-current" : ""}`}
          >
            <div className="card-top">
              <h3>Premium</h3>
              <div className="price">32.90₼</div>
            </div>

            <div className="card-features">
              {features.map((feat, index) => (
                <MobileFeatureRow
                  key={index}
                  title={feat.name}
                  info={feat.info}
                  isAvailable={feat.premium}
                />
              ))}
              <MobileFeatureRow
                isMonthly={true}
                price="2.00₼"
                info="Xidmətdən fasiləsiz istifadə üçün aylıq abunəlik."
              />
            </div>

            <div className="card-bottom">
              {currentPackage === "premium" ? (
                <div className="current-badge">
                  <FiCheckCircle /> Hazırkı Paket
                </div>
              ) : (
                <button
                  className="select-btn"
                  onClick={() => setCurrentPackage("premium")}
                >
                  Seç
                </button>
              )}
            </div>
          </div>
        </div>

     
      </div>
    </div>
  );
}

export default PackageMain;
