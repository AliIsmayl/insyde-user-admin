import React from "react";
import { FaInstagram, FaLinkedin, FaGithub, FaTwitter } from "react-icons/fa";
import "./Footer.scss"; // və ya .css

function Footer() {
  const currentYear = new Date().getFullYear(); // Avtomatik cari ili çəkir

  return (
    <footer className="footer-container">
      {/* Sol Tərəf - Copyright və Şirkət Adı */}
      <div className="footer-left">
        <p>&copy; {currentYear} Bütün hüquqlar qorunur. </p>
      </div>

      {/* Sağ Tərəf - Sosial Şəbəkələr */}
      <div className="footer-right">
        <a
          href="https://instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          className="social-icon"
        >
          <FaInstagram />
        </a>
        <a
          href="https://linkedin.com"
          target="_blank"
          rel="noopener noreferrer"
          className="social-icon"
        >
          <FaLinkedin />
        </a>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="social-icon"
        >
          <FaGithub />
        </a>
        <a
          href="https://twitter.com"
          target="_blank"
          rel="noopener noreferrer"
          className="social-icon"
        >
          <FaTwitter />
        </a>
      </div>
    </footer>
  );
}

export default Footer;
