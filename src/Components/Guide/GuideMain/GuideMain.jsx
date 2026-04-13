import React, { useState } from "react";
import { FiChevronRight, FiChevronLeft } from "react-icons/fi";
import { HiOutlineHome } from "react-icons/hi2";
import { PiPackage } from "react-icons/pi";
import { TbTruckDelivery, TbBrandGoogleAnalytics } from "react-icons/tb";
import { FiSettings } from "react-icons/fi";
import { MdOutlinePageview } from "react-icons/md";
import { BsListCheck } from "react-icons/bs";
import { HiOutlineBookOpen } from "react-icons/hi";
import "./GuideMain.scss";

// ─── 1. Addım-addım gedişat ───────────────────────────────
const STEPS = [
  {
    num: 1,
    icon: <HiOutlineHome />,
    title: "Profil bölməsində məlumatlarınızı daxil edin",
    desc: "Profil bölməsinə keçib adınızı, vəzifənizi, şirkətinizi, telefon və sosial media linklərini daxil edin. Doldurduqdan sonra yadda saxlayın — bütün məlumatlar kartınızda avtomatik görünəcək.",
    imageAlt: "Profil — məlumat forması",
  },
  {
    num: 2,
    icon: <MdOutlinePageview />,
    title: "Müştəri vizualına göz gəzdirin",
    desc: "\"Səhifəmə keçid\" hissəsinə toxunub açılan paneldə müştəriyə təqdim ediləcək vizuala nəzər yetirin. Daxil etdiyiniz məlumatlar, linklər və şəkil burada canlı əks olunur.",
    imageAlt: "Müştəri profil səhifəsi önizləməsi",
  },
  {
    num: 3,
    icon: <PiPackage />,
    title: "Paketlər səhifəsindən sifarişi tamamlayın",
    desc: "Sizin üçün uyğun paketi seçin. Kart dizaynını fərdiləşdirin — rəng, üslub və nümunələr arasında seçim edin. Ödənişi tamamlayaraq sifarişinizi verin.",
    imageAlt: "Paket seçimi və kart dizaynı",
  },
  {
    num: 4,
    icon: <TbTruckDelivery />,
    title: "Sifarişinizi izləyin və kartı təhvil alın",
    desc: "\"Sifarişim\" səhifəsindən hazırlanma prosesini real vaxtda izləyin. Kart çatdırıldıqdan sonra NFC toxunma və ya QR kod vasitəsilə dərhal istifadəyə başlaya bilərsiniz.",
    imageAlt: "Sifariş izləmə və çatdırılma",
  },
];

// ─── 2. Səhifələrin izahı ─────────────────────────────────
const PAGES = [
  {
    id: "home",
    icon: <HiOutlineHome />,
    label: "Profil",
    subs: [
      {
        id: "home-info",
        title: "Məlumatlarınızı daxil edin",
        desc: "Profil bölməsinə daxil olub adınızı, vəzifənizi, şirkətinizi və əlaqə məlumatlarınızı daxil edin. Dəyişiklikləri yadda saxlayın — kartınızda dərhal görünəcək.",
        imageAlt: "Profil — məlumat forması",
      },
      {
        id: "home-links",
        title: "Sosial və əlaqə linkləri",
        desc: "Instagram, WhatsApp, Telegram, vebsayt və digər linklərini əlavə edin. Hər link kartınızda tıklanabilir şəkildə görünəcək.",
        imageAlt: "Profil — link paneli",
      },
    ],
  },
  {
    id: "preview",
    icon: <MdOutlinePageview />,
    label: "Müştəri Səhifəsi",
    subs: [
      {
        id: "preview-panel",
        title: "Müştəri görünüşü",
        desc: "\"Səhifəmə keçid\" düyməsinə basaraq müştəriyə göstəriləcək profil səhifənizi canlı olaraq görün. Bütün məlumatlar, şəkillər və linklər burada əks olunur.",
        imageAlt: "Müştəri profil səhifəsi",
      },
      {
        id: "preview-share",
        title: "Paylaşma üsulları",
        desc: "Profil səhifənizi QR kod, NFC toxunması və ya birbaşa link vasitəsilə paylaşa bilərsiniz. Hər üsul müştərini avtomatik profil səhifənizə yönləndirir.",
        imageAlt: "Paylaşma üsulları",
      },
    ],
  },
  {
    id: "packages",
    icon: <PiPackage />,
    label: "Paketlər",
    subs: [
      {
        id: "packages-select",
        title: "Paketi seçin",
        desc: "Paketlər səhifəsindən sizin üçün uyğun planı seçin. Hər paketin qiyməti, xüsusiyyətləri və müddəti burada göstərilir.",
        imageAlt: "Paket seçimi ekranı",
      },
      {
        id: "packages-design",
        title: "Kart dizaynı",
        desc: "Paketinizi seçdikdən sonra kart dizaynınızı fərdiləşdirin. Rəng, üslub və nümunələr arasından seçim edin — nəticəni önizləmədə dərhal görəcəksiniz.",
        imageAlt: "Kart dizayn seçimi",
      },
      {
        id: "packages-payment",
        title: "Ödənişi tamamlayın",
        desc: "Seçdiyiniz paketi və kart dizaynını təsdiqləyib ödənişi tamamlayın. Ödəniş uğurlu olduqdan sonra sifarişiniz avtomatik işlənməyə başlayır.",
        imageAlt: "Ödəniş ekranı",
      },
    ],
  },
  {
    id: "order",
    icon: <TbTruckDelivery />,
    label: "Sifarişim",
    subs: [
      {
        id: "order-track",
        title: "Sifarişi izləyin",
        desc: "Sifarişinizin hansı mərhələdə olduğunu real vaxtda izləyin: qəbul edilib, çap olunub, qablaşdırılıb, kuryer yolda, çatdırıldı.",
        imageAlt: "Sifariş izləmə mərhələləri",
      },
      {
        id: "order-delivery",
        title: "Çatdırılma növünü seçin",
        desc: "Metro stansiyasına və ya ünvana çatdırılma seçimlərindən birini seçin. Kuryer sifarişiniz yola çıxanda sizinlə əlaqə saxlayacaq.",
        imageAlt: "Çatdırılma seçimi",
      },
      {
        id: "order-receive",
        title: "Kartı təhvil alın",
        desc: "Kartınızı aldıqdan sonra NFC toxunma və ya QR kod vasitəsilə dərhal istifadəyə başlaya bilərsiniz. Kart üzərindəki məlumatlar profil səhifənizə avtomatik bağlıdır.",
        imageAlt: "Kartın istifadəsi",
      },
    ],
  },
  {
    id: "analys",
    icon: <TbBrandGoogleAnalytics />,
    label: "Analitika",
    subs: [
      {
        id: "analys-stats",
        title: "Baxış statistikası",
        desc: "Profil səhifənizə neçə dəfə baxıldığını, hansı kanaldan (NFC, QR, birbaşa link) və hansı cihazdan (mobil / masaüstü) daxil olduğunu izləyin.",
        imageAlt: "Baxış statistikası",
      },
      {
        id: "analys-share",
        title: "Paylaşma formatları",
        desc: "QR kod, NFC və birbaşa link vasitəsilə paylaşmaların statistikasını ayrıca görün. Hansı üsulun daha effektiv olduğunu müəyyənləşdirin.",
        imageAlt: "Paylaşma formatı statistikası",
      },
      {
        id: "analys-tools",
        title: "Vasitə seçimi",
        desc: "Analiz etmək istədiyiniz göstəriciləri seçin: ümumi baxışlar, unikal ziyarətçilər, ən çox aktivlik olan gün və saat.",
        imageAlt: "Analitika alət seçimi",
      },
      {
        id: "analys-period",
        title: "Aylıq və illik analiz",
        desc: "Statistikanızı aylıq və illik kəsimdə müqayisə edin. Hansı dövrdə daha çox maraq olduğunu görüb fəaliyyətinizi planlayın.",
        imageAlt: "Aylıq / illik analitika",
      },
    ],
  },
  {
    id: "settings",
    icon: <FiSettings />,
    label: "Ayarlar",
    subs: [
      {
        id: "settings-theme",
        title: "Sistem rəngini dəyişin",
        desc: "Ayarlar bölməsindən interfeysin rəng temasını dəyişə bilərsiniz. Qaranlıq və ya açıq rejimi seçin — dəyişiklik dərhal tətbiq olunur.",
        imageAlt: "Tema rəng seçimi",
      },
      {
        id: "settings-password",
        title: "Parolu yeniləyin",
        desc: "Hesabınızın təhlükəsizliyi üçün cari parolunuzu daxil edib yeni parol təyin edin.",
        imageAlt: "Parol yeniləmə forması",
      },
    ],
  },
];

// ─── Şəkil placeholder ────────────────────────────────────
function ImgPlaceholder({ alt }) {
  return (
    <div className="guide-img-ph" aria-label={alt}>
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
      <span>{alt}</span>
    </div>
  );
}

// ─── Addım-addım paneli ───────────────────────────────────
function StepGuide() {
  const [current, setCurrent] = useState(0);
  const step = STEPS[current];

  return (
    <div className="guide-step-wrap">
      {/* Progress */}
      <div className="guide-progress">
        {STEPS.map((s, i) => (
          <React.Fragment key={i}>
            <button
              className={`guide-progress__dot ${i === current ? "active" : ""} ${i < current ? "done" : ""}`}
              onClick={() => setCurrent(i)}
            >
              <span>{s.num}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`guide-progress__line ${i < current ? "done" : ""}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Məzmun */}
      <div className="guide-block">
        <div className="guide-block__text">
          <div className="guide-block__icon">{step.icon}</div>
          <p className="guide-block__badge">Addım {step.num} / {STEPS.length}</p>
          <h2 className="guide-block__title">{step.title}</h2>
          <p className="guide-block__desc">{step.desc}</p>

          <div className="guide-block__nav">
            <button className="guide-block__nav-btn" onClick={() => setCurrent(c => c - 1)} disabled={current === 0}>
              <FiChevronLeft /> Geri
            </button>
            <button className="guide-block__nav-btn guide-block__nav-btn--next" onClick={() => setCurrent(c => c + 1)} disabled={current === STEPS.length - 1}>
              Növbəti <FiChevronRight />
            </button>
          </div>
        </div>

        <div className="guide-block__img">
          <ImgPlaceholder alt={step.imageAlt} />
        </div>
      </div>
    </div>
  );
}

// ─── Səhifə izahı paneli ─────────────────────────────────
function PageGuide() {
  const [activePage, setActivePage] = useState(PAGES[0].id);
  const [activeSub,  setActiveSub]  = useState(PAGES[0].subs[0].id);

  const page   = PAGES.find(p => p.id === activePage);
  const sub    = page.subs.find(s => s.id === activeSub) || page.subs[0];
  const subIdx = page.subs.findIndex(s => s.id === activeSub);

  const selectPage = (p) => { setActivePage(p.id); setActiveSub(p.subs[0].id); };

  return (
    <div className="guide-pages-wrap">
      {/* Sol nav */}
      <aside className="guide-nav">
        <nav className="guide-nav__list">
          {PAGES.map(p => (
            <button
              key={p.id}
              className={`guide-nav__item ${activePage === p.id ? "active" : ""}`}
              onClick={() => selectPage(p)}
            >
              <span className="guide-nav__item-icon">{p.icon}</span>
              <span className="guide-nav__item-label">{p.label}</span>
              {activePage === p.id && <FiChevronRight className="guide-nav__item-arrow" />}
            </button>
          ))}
        </nav>
      </aside>

      {/* Sağ məzmun */}
      <div className="guide-page-content">
        <div className="guide-content__top">
          <div className="guide-content__page-icon">{page.icon}</div>
          <div>
            <p className="guide-content__page-label">{page.label}</p>
            <h1 className="guide-content__title">{sub.title}</h1>
          </div>
        </div>

        {page.subs.length > 1 && (
          <div className="guide-sub-tabs">
            {page.subs.map((s, i) => (
              <button
                key={s.id}
                className={`guide-sub-tab ${activeSub === s.id ? "active" : ""}`}
                onClick={() => setActiveSub(s.id)}
              >
                <span className="guide-sub-tab__num">{i + 1}</span>
                {s.title}
              </button>
            ))}
          </div>
        )}

        <div className="guide-block">
          <div className="guide-block__text">
            <p className="guide-block__desc">{sub.desc}</p>

            {page.subs.length > 1 && (
              <div className="guide-block__nav">
                <button className="guide-block__nav-btn" onClick={() => setActiveSub(page.subs[subIdx - 1].id)} disabled={subIdx === 0}>
                  <FiChevronLeft /> Geri
                </button>
                <span className="guide-block__nav-count">{subIdx + 1} / {page.subs.length}</span>
                <button className="guide-block__nav-btn guide-block__nav-btn--next" onClick={() => setActiveSub(page.subs[subIdx + 1].id)} disabled={subIdx === page.subs.length - 1}>
                  Növbəti <FiChevronRight />
                </button>
              </div>
            )}
          </div>

          <div className="guide-block__img">
            <ImgPlaceholder alt={sub.imageAlt} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Əsas komponent ───────────────────────────────────────
export default function GuideMain() {
  const [mode, setMode] = useState("steps"); // "steps" | "pages"

  return (
    <div className="guide-wrap">
      {/* Üst rejim seçimi */}
      <div className="guide-mode-bar">
        <button
          className={`guide-mode-btn ${mode === "steps" ? "active" : ""}`}
          onClick={() => setMode("steps")}
        >
          <BsListCheck />
          Necə istifadə etməli?
        </button>
        <button
          className={`guide-mode-btn ${mode === "pages" ? "active" : ""}`}
          onClick={() => setMode("pages")}
        >
          <HiOutlineBookOpen />
          Səhifələrin izahı
        </button>
      </div>

      {/* Rejimə görə panel */}
      <div className="guide-panel">
        {mode === "steps" ? <StepGuide /> : <PageGuide />}
      </div>
    </div>
  );
}
