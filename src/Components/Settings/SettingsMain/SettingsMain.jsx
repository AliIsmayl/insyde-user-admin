import React, { useState } from 'react';
import { FiLock, FiEye, FiEyeOff, FiCheckCircle } from 'react-icons/fi';
import './SettingsMain.scss';

function SettingsMain() {
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const toggleVisibility = (field) => {
    setShowPassword({ ...showPassword, [field]: !showPassword[field] });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Bura API çağırışı gələcək
    if (passwords.newPassword === passwords.confirmPassword) {
      console.log("Şifrə yeniləndi:", passwords);
      setIsSuccess(true);
      
      // 3 saniyə sonra uğurlu mesajını gizlət
      setTimeout(() => setIsSuccess(false), 3000);
    } else {
      alert("Yeni şifrələr uyğun gəlmir!");
    }
  };

  return (
    <div className="settings-main-modern">
      
      {/* BAŞLIQ */}
      <div className="top-header">
        <div>
          <h2 className="page-title">Ayarlar</h2>
          <p className="page-subtitle">Hesab təhlükəsizliyi və şifrə yenilənməsi</p>
        </div>
      </div>

      <div className="settings-content">
        
        {/* Şifrə Dəyişmə Kartı */}
        <div className="modern-card password-card">
          <div className="card-header">
            <div className="header-icon"><FiLock /></div>
            <div>
              <h3>Şifrəni Yenilə</h3>
              <p>Hesabınızın təhlükəsizliyini qorumaq üçün güclü şifrə istifadə edin.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="password-form">
            
            {/* Mövcud Şifrə */}
            <div className="input-group">
              <label>Mövcud Şifrə</label>
              <div className="input-wrapper">
                <input 
                  type={showPassword.current ? "text" : "password"} 
                  name="currentPassword"
                  placeholder="Hazırkı şifrənizi daxil edin"
                  value={passwords.currentPassword}
                  onChange={handleChange}
                  required
                />
                <button type="button" className="eye-btn" onClick={() => toggleVisibility('current')}>
                  {showPassword.current ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <div className="divider"></div>

            {/* Yeni Şifrə */}
            <div className="input-group">
              <label>Yeni Şifrə</label>
              <div className="input-wrapper">
                <input 
                  type={showPassword.new ? "text" : "password"} 
                  name="newPassword"
                  placeholder="Yeni şifrə yaradın"
                  value={passwords.newPassword}
                  onChange={handleChange}
                  required
                />
                <button type="button" className="eye-btn" onClick={() => toggleVisibility('new')}>
                  {showPassword.new ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              <ul className="password-rules">
                <li>Ən azı 8 simvol</li>
                <li>Böyük və kiçik hərflər</li>
                <li>Rəqəm və ya xüsusi simvol</li>
              </ul>
            </div>

            {/* Yeni Şifrə Təkrar */}
            <div className="input-group">
              <label>Yeni Şifrə (Təkrar)</label>
              <div className="input-wrapper">
                <input 
                  type={showPassword.confirm ? "text" : "password"} 
                  name="confirmPassword"
                  placeholder="Yeni şifrəni təsdiqləyin"
                  value={passwords.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button type="button" className="eye-btn" onClick={() => toggleVisibility('confirm')}>
                  {showPassword.confirm ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {/* Düymələr və Bildiriş */}
            <div className="form-actions">
              {isSuccess && (
                <div className="success-msg">
                  <FiCheckCircle /> Şifrəniz uğurla yeniləndi!
                </div>
              )}
              <button type="submit" className="save-btn">Yadda Saxla</button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}

export default SettingsMain;
