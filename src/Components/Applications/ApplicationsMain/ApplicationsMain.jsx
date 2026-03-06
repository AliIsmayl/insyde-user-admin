import React, { useState } from 'react';
import { FiSend, FiChevronDown } from 'react-icons/fi';
import './ApplicationsMain.scss';

function ApplicationsMain() {
  const [formData, setFormData] = useState({
    type: 'Təklif',
    title: '',
    message: ''
  });

  const [activeAccordion, setActiveAccordion] = useState(null);

  // Nümunəvi əvvəlki müraciətlər
  const previousApplications = [
    {
      id: 1,
      title: 'assasa',
      status: 'Açıq', // Açıq, Cavablandı, Qapalı və s.
      date: '06-03-2026',
      content: 'Salam, bu bir sınaq mesajıdır.',
      reply: ''
    },
    {
      id: 2,
      title: 'Sistem xətası barədə',
      status: 'Cavablandı',
      date: '05-03-2026',
      content: 'Dünən giriş edərkən xəta ilə qarşılaşdım.',
      reply: 'Müraciətiniz üçün təşəkkürlər. Xəta aradan qaldırıldı.'
    }
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Göndərilən data:", formData);
    // Bura API çağırışı gələcək
  };

  const toggleAccordion = (index) => {
    setActiveAccordion(activeAccordion === index ? null : index);
  };

  return (
    <div className="applications-main-modern">
      
      {/* BAŞLIQ HİSSƏSİ */}
      <div className="top-header">
        <div>
          <h2 className="page-title">Müraciətlər</h2>
          <p className="page-subtitle">Şikayət və təkliflərinizi bizə çatdırın</p>
        </div>
      </div>

      <div className="applications-grid">
        
        {/* ======================================= */}
        {/* SOL TƏRƏF: YENİ MÜRACİƏT FORMASI        */}
        {/* ======================================= */}
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
                  <select name="type" value={formData.type} onChange={handleChange}>
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
              <button type="submit" className="submit-btn">
                <FiSend className="btn-icon" /> Göndər
              </button>
            </div>
          </form>
        </div>

        {/* ======================================= */}
        {/* SAĞ TƏRƏF: ƏVVƏLKİ MÜRACİƏTLƏR          */}
        {/* ======================================= */}
        <div className="modern-card history-section">
          <div className="card-header">
            <h3>Əvvəlki Müraciətlər</h3>
            <p>Göndərdiyiniz müraciətlər və cavablar.</p>
          </div>

          <div className="accordion-list">
            {previousApplications.map((app, index) => (
              <div 
                key={app.id} 
                className={`accordion-item ${activeAccordion === index ? 'active' : ''}`}
              >
                <div className="accordion-header" onClick={() => toggleAccordion(index)}>
                  <div className="header-left">
                    <span className={`status-dot ${app.status === 'Cavablandı' ? 'green' : 'orange'}`}></span>
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
    </div>
  );
}

export default ApplicationsMain;
