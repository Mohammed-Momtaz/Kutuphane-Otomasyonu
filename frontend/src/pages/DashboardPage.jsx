import React, { useEffect } from 'react';
import { useSelector } from 'react-redux'; // Redux state'ine erişmek için
import { Link, useNavigate } from 'react-router-dom'; // Yönlendirme için
import { selectUserRole } from '../redux/slices/authSlice'; // selectUserRole selector'ını import ettik

const DashboardPage = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth); // Auth state'inden isAuthenticated ve user'ı al
  const userRole = useSelector(selectUserRole); // Kullanıcının rolünü alıyoruz

  const navigate = useNavigate();

  // Kimlik doğrulama kontrolü
  // Bu sayfanın sadece giriş yapmış kullanıcılar tarafından erişilebilir olmasını sağla
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { message: 'Bu sayfayı görmek için giriş yapmalısınız.' } });
    }
  }, [isAuthenticated, navigate]); // isAuthenticated veya navigate değiştiğinde bu etkiyi tekrar çalıştır

  // Eğer kullanıcı henüz kimlik doğrulanmamışsa veya user objesi gelmediyse, bir yüklenme veya boş durum göster
  if (!isAuthenticated || !user) {
    return (
      <div className="dashboard-page">
        <div className="form-container"> {/* Aynı stil sınıfını kullanabiliriz */}
          <h2>Yükleniyor...</h2>
          <p>Erişim kontrol ediliyor veya bilgiler yükleniyor.</p>
        </div>
      </div>
    );
  }

  const isAdmin = userRole === 'admin'; // Rolü 'admin' mi kontrol et

  return (
    <div className="dashboard-page">
      <div className="dashboard-content">
        <h2>Hoş Geldin, {user.name}!</h2>
        <p>Burası panel sayfanız. Rolünüz: **{userRole.toUpperCase()}**</p> {/* Rolü göster */}

        <div className="dashboard-sections">
          <h3>Genel Bakış</h3>
          <ul>
            <li>Toplam Kitap: --</li>
            <li>Üye Sayısı: --</li>
            <li>Emanet Kitaplar: --</li>
          </ul>

          {/* Rolüne göre farklı bölümler göster */}
          {isAdmin ? (
            // Admin kullanıcılar için özel bölüm
            <>
              <h3>Admin Paneli</h3>
              <ul className="quick-access-links">
                <li><Link to="/admin/books" className="dashboard-link">Kitapları Yönet</Link></li>
                <li><Link to="/admin/users" className="dashboard-link">Üyeleri Yönet</Link></li>
                <li><Link to="/admin/loans" className="dashboard-link">Emanetleri Görüntüle</Link></li>
                <li><Link to="/admin/settings" className="dashboard-link admin-link">Sistem Ayarları</Link></li> {/* Admin için özel link */}
              </ul>
            </>
          ) : (
            // Normal kullanıcılar için özel bölüm
            <>
              <h3>Kullanıcı Paneli</h3>
              <ul className="quick-access-links">
                <li><Link to="/my-books" className="dashboard-link">Kitaplarım</Link></li>
                <li><Link to="/borrow-history" className="dashboard-link">Ödünç Alma Geçmişi</Link></li>
                <li><Link to="/profile" className="dashboard-link">Profilim</Link></li>
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;