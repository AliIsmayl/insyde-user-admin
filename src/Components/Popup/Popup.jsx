import React, { useEffect } from "react";
import {
  FiCheckCircle,
  FiTrash2,
  FiAlertCircle,
  FiSlash,
  FiRefreshCw, // update ikonu
  FiX,
} from "react-icons/fi";
import "./Popup.scss";

/* ── Type konfiqurasiyası ── */
const CONFIG = {
  success: {
    Icon: FiCheckCircle,
    confirmClass: "popup__btn--success",
    defaultConfirm: "Əla",
    cancelable: false,
  },
  delete: {
    Icon: FiTrash2,
    confirmClass: "popup__btn--delete",
    defaultConfirm: "Sil",
    cancelable: true,
  },
  error: {
    Icon: FiAlertCircle,
    confirmClass: "popup__btn--error",
    defaultConfirm: "Anladım",
    cancelable: false,
  },
  block: {
    Icon: FiSlash,
    confirmClass: "popup__btn--block",
    defaultConfirm: "Blokla",
    cancelable: true,
  },
  /* ─── YENİ ─── */
  update: {
    Icon: FiRefreshCw,
    confirmClass: "popup__btn--update",
    defaultConfirm: "Yenilə",
    cancelable: true,
  },
};

function Popup({
  isOpen = false,
  type = "success",
  title = "",
  message = "",
  confirmText,
  cancelText = "Ləğv et",
  onConfirm,
  onCancel,
}) {
  const cfg = CONFIG[type] ?? CONFIG.success;
  const finalConfirmText = confirmText ?? cfg.defaultConfirm;
  const normalizedMessage = typeof message === "string" ? message.trim() : "";
  const shouldHideMessage =
    !normalizedMessage ||
    normalizedMessage === '""' ||
    normalizedMessage === "''" ||
    /^error\s*:\s*["']{0,2}\s*["']{0,2}$/i.test(normalizedMessage) ||
    /^detail\s*:\s*["']{0,2}\s*["']{0,2}$/i.test(normalizedMessage);

  /* ESC ilə bağla */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === "Escape") onCancel?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onCancel]);

  /* Scroll kilidlə */
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="popup__overlay" onClick={onCancel} aria-hidden="true" />

      {/* Dialog */}
      <div
        className={`popup popup--${type}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="popup-title"
      >
        {/* X düyməsi */}
        <button className="popup__close" onClick={onCancel} aria-label="Bağla">
          <FiX />
        </button>

        {/* İkon */}
        <div className="popup__icon-wrap">
          <cfg.Icon className="popup__icon" />
        </div>

        {/* Mətn */}
        <div className="popup__content">
          {title && (
            <h3 id="popup-title" className="popup__title">
              {title}
            </h3>
          )}
          {!shouldHideMessage && <p className="popup__message">{message}</p>}
        </div>

        {/* Düymələr */}
        <div className="popup__actions">
          {cfg.cancelable && (
            <button
              className="popup__btn popup__btn--cancel"
              onClick={onCancel}
            >
              {cancelText}
            </button>
          )}
          <button
            className={`popup__btn ${cfg.confirmClass}`}
            onClick={() => onConfirm?.()}
          >
            {finalConfirmText}
          </button>
        </div>
      </div>
    </>
  );
}

export default Popup;

/* ── Popup state ── */
//   const [popup, setPopup] = useState({ isOpen: false, type: "success" });
//   const closePopup = () => setPopup((p) => ({ ...p, isOpen: false }));

//   <Popup
//     isOpen={popup.isOpen}
//     type={popup.type}
//     title={popup.title}
//     message={popup.message}
//     confirmText={popup.confirmText}
//     cancelText="Ləğv et"
//     onConfirm={() => {
//       popup.onConfirm?.();
//       closePopup();
//     }}
//     onCancel={closePopup}
//   />

{
  /* ── Popup sınaq düymələri ── */
}
// <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
//   {/* SUCCESS */}
//   <button
//     onClick={() =>
//       setPopup({
//         isOpen: true,
//         type: "success",
//         title: "Uğurla saxlanıldı!",
//         message: "Məlumatlarınız yeniləndi.",
//         confirmText: "Əla",
//         onConfirm: null,
//       })
//     }
//   >
//     ✅ Success
//   </button>

//   {/* DELETE */}
//   <button
//     onClick={() =>
//       setPopup({
//         isOpen: true,
//         type: "delete",
//         title: "Əmin misiniz?",
//         message: "Bu əməliyyat geri qaytarıla bilməz.",
//         confirmText: "Sil",
//         onConfirm: () => console.log("silindi"),
//       })
//     }
//   >
//     🗑 Delete
//   </button>

//   {/* ERROR */}
//   <button
//     onClick={() =>
//       setPopup({
//         isOpen: true,
//         type: "error",
//         title: "Xəta baş verdi!",
//         message: "Server ilə əlaqə qurulmadı.",
//         confirmText: "Anladım",
//         onConfirm: null,
//       })
//     }
//   >
//     ⚠️ Error
//   </button>

//   {/* BLOCK */}
//   <button
//     onClick={() =>
//       setPopup({
//         isOpen: true,
//         type: "block",
//         title: "İstifadəçini blokla?",
//         message: "Bu istifadəçi sisteme daxil ola bilməyəcək.",
//         confirmText: "Blokla",
//         onConfirm: () => console.log("bloklandı"),
//       })
//     }
//   >
//     🚫 Block
//   </button>
// </div>
