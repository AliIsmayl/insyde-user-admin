import React, { useState } from "react";
import { FiSend, FiChevronDown, FiBell, FiMessageSquare } from "react-icons/fi";
import "./ApplicationsMain.scss";
import Popup from "../../Popup/Popup";

function ApplicationsMain() {
  const [formData, setFormData] = useState({
    type: "Təklif",
    title: "",
    message: "",
  });
  const [popup, setPopup] = useState({ isOpen: false, type: "success" });
  const closePopup = () => setPopup((p) => ({ ...p, isOpen: false }));
  const [activeAccordion, setActiveAccordion] = useState(null);
  const [activeTab, setActiveTab] = useState("applications"); // "applications" | "admin"
  const [replyText, setReplyText] = useState({});
  const [openReplyBox, setOpenReplyBox] = useState(null);

  const previousApplications = [
    {
      id: 1,
      title: "assasa",
      status: "Açıq",
      date: "06-03-2026",
      content: "Salam, bu bir sınaq mesajıdır.",
      reply: "",
    },
    {
      id: 2,
      title: "Sistem xətası barədə",
      status: "Cavablandı",
      date: "05-03-2026",
      content: "Dünən giriş edərkən xəta ilə qarşılaşdım.",
      reply: "Müraciətiniz üçün təşəkkürlər. Xəta aradan qaldırıldı.",
    },
  ];

  // Superadmin tərəfindən gələn mesajlar
  const [adminMessages, setAdminMessages] = useState([
    {
      id: 1,
      title: "Sistem yeniləməsi haqqında",
      date: "07-03-2026",
      content:
        "Hörmətli istifadəçi, sistemimiz 10 mart 2026 tarixində texniki yeniləmə keçirəcək. Bu müddətdə qısa fasilə ola bilər.",
      isRead: false,
      userReply: "",
    },
    {
      id: 2,
      title: "Premium paketiniz yeniləndi",
      date: "04-03-2026",
      content:
        "Paketiniz uğurla yeniləndi. Yeni funksiyalardan istifadə edə bilərsiniz. Hər hansı sualınız olarsa bizimlə əlaqə saxlayın.",
      isRead: true,
      userReply: "Təşəkkürlər, yeni funksiyalar çox faydalıdır!",
    },
  ]);

  const unreadCount = adminMessages.filter((m) => !m.isRead).length;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Göndərilən data:", formData);
  };

  const toggleAccordion = (index) => {
    setActiveAccordion(activeAccordion === index ? null : index);
  };

  const handleAdminMsgOpen = (id) => {
    // Açılanda oxunmuş kimi işarələ
    setAdminMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isRead: true } : m)),
    );
    setActiveAccordion(activeAccordion === id ? null : id);
  };

  const handleReplyChange = (id, value) => {
    setReplyText((prev) => ({ ...prev, [id]: value }));
  };

  const handleReplySend = (id) => {
    const text = replyText[id]?.trim();
    if (!text) return;
    setAdminMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, userReply: text } : m)),
    );
    setReplyText((prev) => ({ ...prev, [id]: "" }));
    setOpenReplyBox(null);
  };

  return (
    <div className="applications-main-modern">
      <Popup
        isOpen={popup.isOpen}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        confirmText={popup.confirmText}
        cancelText="Ləğv et"
        onConfirm={() => {
          popup.onConfirm?.();
          closePopup();
        }}
        onCancel={closePopup}
      />
      <div className="top-header">
        <div>
          <h2 className="page-title">Müraciətlər</h2>
          <p className="page-subtitle">
            Şikayət və təkliflərinizi bizə çatdırın
          </p>
        </div>
      </div>

      {/* TABS */}
      <div className="main-tabs">
        <button
          className={`main-tab ${activeTab === "applications" ? "active" : ""}`}
          onClick={() => setActiveTab("applications")}
        >
          <FiMessageSquare /> Müraciətlər
        </button>
        <button
          className={`main-tab ${activeTab === "admin" ? "active" : ""}`}
          onClick={() => setActiveTab("admin")}
        >
          <FiBell />
          Admin Mesajları
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount}</span>
          )}
        </button>
      </div>

      {/* ===== MÜRACİƏTLƏR TAB ===== */}
      {activeTab === "applications" && (
        <div className="applications-grid">
          {/* SOL: YENİ MÜRACİƏT */}
          <div className="modern-card form-section">
            <div className="card-header">
              <h3>Şikayət və Təklif</h3>
              <p>Probleminiz və ya ideyanız varsa bizə yazın.</p>
            </div>

            <form onSubmit={handleSubmit} className="application-form">
              <div className="form-row">
                <div className="input-group">
                  <label>Müraciət növü</label>
                  <div className="select-wrapper">
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                    >
                      <option value="Təklif">Təklif</option>
                      <option value="Şikayət">Şikayət</option>
                      <option value="Sual">Sual</option>
                      <option value="Digər">Digər</option>
                    </select>
                    <FiChevronDown className="select-icon" />
                  </div>
                </div>

                <div className="input-group flex-2">
                  <label>Başlıq (istəyə görə)</label>
                  <input
                    type="text"
                    name="title"
                    placeholder="Məs: Ödəniş problemi..."
                    value={formData.title}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="input-group full-width">
                <textarea
                  name="message"
                  rows="6"
                  placeholder="Mesajınızı bura daxil edin..."
                  value={formData.message}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="submit-btn"
                  onClick={() =>
                    setPopup({
                      isOpen: true,
                      type: "success",
                      title: "Uğurlu!",
                      message: "Sorğu uğurla göndərildi",
                      confirmText: "Tamam",
                      onConfirm: null,
                    })
                  }
                >
                  <FiSend className="btn-icon" /> Göndər
                </button>
              </div>
            </form>
          </div>

          {/* SAĞ: ƏVVƏLKİ MÜRACİƏTLƏR */}
          <div className="modern-card history-section">
            <div className="card-header">
              <h3>Əvvəlki Müraciətlər</h3>
              <p>Göndərdiyiniz müraciətlər və cavablar.</p>
            </div>

            <div className="accordion-list">
              {previousApplications.map((app, index) => (
                <div
                  key={app.id}
                  className={`accordion-item ${activeAccordion === index ? "active" : ""}`}
                >
                  <div
                    className="accordion-header"
                    onClick={() => toggleAccordion(index)}
                  >
                    <div className="header-left">
                      <span
                        className={`status-dot ${app.status === "Cavablandı" ? "green" : "orange"}`}
                      ></span>
                      <span className="app-title">{app.title}</span>
                    </div>
                    <div className="header-right">
                      <FiChevronDown className="accordion-icon" />
                    </div>
                  </div>

                  <div className="accordion-body">
                    <div className="app-content">
                      <strong>Sizin mesajınız:</strong>
                      <p>{app.content}</p>
                      <span className="app-date">{app.date}</span>
                    </div>
                    {app.reply && (
                      <div className="app-reply">
                        <strong>Cavab:</strong>
                        <p>{app.reply}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== ADMİN MESAJLARI TAB ===== */}
      {activeTab === "admin" && (
        <div className="admin-messages-section">
          <div className="modern-card">
            <div className="card-header">
              <h3>Admin Mesajları</h3>
              <p>Superadmin tərəfindən göndərilən bildiriş və mesajlar.</p>
            </div>

            <div className="accordion-list">
              {adminMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`accordion-item admin-item ${activeAccordion === msg.id ? "active" : ""} ${!msg.isRead ? "unread" : ""}`}
                >
                  <div
                    className="accordion-header"
                    onClick={() => handleAdminMsgOpen(msg.id)}
                  >
                    <div className="header-left">
                      {!msg.isRead && <span className="unread-dot"></span>}
                      <span className="app-title">{msg.title}</span>
                    </div>
                    <div className="header-right">
                      <span className="msg-date">{msg.date}</span>
                      <FiChevronDown className="accordion-icon" />
                    </div>
                  </div>

                  <div className="accordion-body">
                    {/* Admin mesajı */}
                    <div className="admin-msg-bubble">
                      <div className="bubble-label">Admin</div>
                      <p>{msg.content}</p>
                      <span className="app-date">{msg.date}</span>
                    </div>

                    {/* İstifadəçinin əvvəlki cavabı */}
                    {msg.userReply && (
                      <div className="user-reply-bubble">
                        <div className="bubble-label">Siz</div>
                        <p>{msg.userReply}</p>
                      </div>
                    )}

                    {/* Cavab yazma hissəsi */}
                    {openReplyBox === msg.id ? (
                      <div className="reply-input-area">
                        <textarea
                          rows="3"
                          placeholder="Cavabınızı yazın..."
                          value={replyText[msg.id] || ""}
                          onChange={(e) =>
                            handleReplyChange(msg.id, e.target.value)
                          }
                        />
                        <div className="reply-actions">
                          <button
                            className="cancel-btn"
                            onClick={() => setOpenReplyBox(null)}
                          >
                            Ləğv et
                          </button>
                          <button
                            className="send-reply-btn"
                            onClick={() => {
                              handleReplySend(msg.id);
                              setPopup({
                                isOpen: true,
                                type: "success",
                                title: "Uğurlu!",
                                message: "Sorğu uğurla göndərildi.",
                                confirmText: "Tamam",
                                onConfirm: null,
                              });
                            }}
                          >
                            <FiSend /> Göndər
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="open-reply-btn"
                        onClick={() => setOpenReplyBox(msg.id)}
                      >
                        <FiMessageSquare />
                        {msg.userReply ? "Yenidən cavabla" : "Cavabla"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApplicationsMain;
