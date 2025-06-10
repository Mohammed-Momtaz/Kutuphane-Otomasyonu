import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="main-header">
      <nav className="navbar">
        <Link to="/" className="logo">
          Kütüphane Sistemi
        </Link>
        <ul className="nav-links">
          <li><Link to="/" className="nav-item">Kitaplar</Link></li>
          {/* Şimdilik basit bağlantılar koyuyoruz, ileride dinamikleşecek */}
          <li><Link to="/login" className="nav-item auth-btn">Giriş Yap</Link></li>
          <li><Link to="/register" className="nav-item auth-btn primary">Kayıt Ol</Link></li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;