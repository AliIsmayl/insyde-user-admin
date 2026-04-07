import React, { useState, useRef } from "react";
import "./CardDesignMain.scss";

function QrPlaceholder({ color = "currentColor" }) {
  const cell = 9;
  const gap = 2;
  const S = 7 * (cell + gap) - gap;

  const map = [
    [1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1],
  ];
  const inner = [
    [2, 2],
    [2, 4],
    [3, 3],
    [4, 2],
    [4, 4],
    [5, 3],
    [3, 5],
    [5, 5],
    [2, 6],
    [6, 2],
    [6, 4],
  ];

  return (
    <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
      {map.map((row, r) =>
        row.map((on, c) =>
          on ? (
            <rect
              key={`f-${r}-${c}`}
              x={c * (cell + gap)}
              y={r * (cell + gap)}
              width={cell}
              height={cell}
              rx={1.2}
              fill={color}
            />
          ) : null,
        ),
      )}
      {inner.map(([r, c], i) => (
        <rect
          key={`d-${i}`}
          x={c * (cell + gap)}
          y={r * (cell + gap)}
          width={cell}
          height={cell}
          rx={1.2}
          fill={color}
          opacity={0.75}
        />
      ))}
    </svg>
  );
}

function CardDesignMain() {
  const [flipped, setFlipped] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [name, setName] = useState("Ali İsmayıl");
  const [title, setTitle] = useState("IT Layihə Meneceri");
  const [logo, setLogo] = useState(null);
  const fileRef = useRef();

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLogo(ev.target.result);
    reader.readAsDataURL(file);
  };

  const isDark = theme === "dark";

  return (
    <div className="card-design-main">
      <div className="cdm-workspace">
        {/* PREVIEW */}
        <div className="cdm-preview-area">
          <p className="cdm-label">Kartın önü / arxası</p>

          <div
            className={`cdm-scene ${flipped ? "is-flipped" : ""}`}
            onClick={() => setFlipped((f) => !f)}
          >
            <div className={`cdm-card theme-${theme}`}>
              {/* FRONT */}
              <div className="cdm-face cdm-front">
                <div className="cdm-front-topbar">
                  <span className="cdm-tagline">İlk təəssürat önəmlidir</span>
                  <span className="cdm-site">insyde.info</span>
                </div>
                <div className="cdm-brand-word">Insyde</div>
              </div>

              {/* BACK */}
              <div className="cdm-face cdm-back">
                <div className="cdm-back-logo-wrap">
                  {logo ? (
                    <img src={logo} alt="logo" className="cdm-back-logo-img" />
                  ) : (
                    <span className="cdm-logo-text">LOGO</span>
                  )}
                </div>

                <div className="cdm-qr-wrap">
                  <QrPlaceholder color={isDark ? "#c9a84c" : "#b8942a"} />
                </div>

                <div className="cdm-back-info">
                  <span className="cdm-back-name">{name || "Ad Soyad"}</span>
                  <span className="cdm-back-title">{title || "Peşə"}</span>
                </div>
              </div>
            </div>
          </div>

          <p className="cdm-hint">Kartı çevirmək üçün klikləyin</p>
        </div>

        {/* CONTROLS */}
        <div className="cdm-controls">
          <h3 className="cdm-ctrl-title">Kart Məlumatları</h3>

          <div className="cdm-field">
            <label>Tema</label>
            <div className="cdm-theme-toggle">
              <button
                className={theme === "dark" ? "active" : ""}
                onClick={() => setTheme("dark")}
              >
                <span className="dot dark-dot" /> Tünd
              </button>
              <button
                className={theme === "light" ? "active" : ""}
                onClick={() => setTheme("light")}
              >
                <span className="dot light-dot" /> Açıq
              </button>
            </div>
          </div>

          <div className="cdm-field">
            <label>Logo / Şəkil</label>
            <div
              className="cdm-upload-area"
              onClick={() => fileRef.current.click()}
            >
              {logo ? (
                <img src={logo} alt="preview" className="cdm-upload-preview" />
              ) : (
                <div className="cdm-upload-placeholder">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    width="28"
                  >
                    <path
                      d="M3 16.5V19a2 2 0 002 2h14a2 2 0 002-2v-2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M12 3v13M8 7l4-4 4 4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>Logo yüklə</span>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleLogoUpload}
            />
            {logo && (
              <button className="cdm-remove-btn" onClick={() => setLogo(null)}>
                Silin
              </button>
            )}
          </div>

          <div className="cdm-field">
            <label>Ad Soyad</label>
            <input
              className="cdm-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ad Soyad"
            />
          </div>

          <div className="cdm-field">
            <label>Peşə / Vəzifə</label>
            <input
              className="cdm-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Peşəniz"
            />
          </div>

          <button
            className="cdm-flip-btn"
            onClick={() => setFlipped((f) => !f)}
          >
            {flipped ? "Ön üzü göstər" : "Arxa üzü göstər"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CardDesignMain;
