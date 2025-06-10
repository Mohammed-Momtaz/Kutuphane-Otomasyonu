import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux'; // Redux hook'larını import ettik
import { logout } from '../../redux/slices/authSlice'; // logout action'ı import ettik

const Header = () => {
  // Redux store'dan 'isAuthenticated' durumunu alıyoruz
  const { isAuthenticated } = useSelector((state) => state.auth);
  // Redux action'larını dispatch etmek için
  const dispatch = useDispatch();

  // Çıkış yapma fonksiyonu
  const handleLogout = () => {
    dispatch(logout()); // Redux store'daki logout action'ını tetikler
    // Logout işlemi authSlice içinde localStorage'ı temizleyecektir.
    // Yönlendirme (isteğe bağlı, logout sonrası genelde login'e veya anasayfaya gidilir)
    // navigate('/login'); // Eğer useNavigate kullanırsak buraya eklenebilir
  };

  return (
    <header className="main-header">
      <nav className="navbar">
        <Link to="/" className="logo">
          Kütüphane Sistemi
        </Link>
        <ul className="nav-links">
          <li><Link to="/books" className="nav-item">Kitaplar</Link></li>

          {/* isAuthenticatd durumuna göre farklı bağlantılar gösteriyoruz */}
          {isAuthenticated ? (
            // Kullanıcı giriş yapmışsa
            <>
              <li><Link to="/dashboard" className="nav-item">Panel</Link></li>
              <li onClick={handleLogout}><Link to="/login"  className="nav-item auth-btn logout-btn" >Çıkış Yap</Link></li>
            </>
          ) : (
            // Kullanıcı giriş yapmamışsa
            <>
              <li><Link to="/login" className="nav-item auth-btn">Giriş Yap</Link></li>
              <li><Link to="/register" className="nav-item auth-btn primary">Kayıt Ol</Link></li>
            </>
          )}
         </ul>
      </nav>
    </header>
  );
};

export default Header;