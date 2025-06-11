import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux'; // Redux state'ine erişmek için
import { Link, useNavigate } from 'react-router-dom'; // Yönlendirme için
import { selectUserRole } from '../redux/slices/authSlice'; // selectUserRole selector'ını import ettik
import BookFormModal from '../components/BookFormModal'; // BookFormModal'ı import ettik

const DashboardPage = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth); // Auth state'inden isAuthenticated ve user'ı al
  const userRole = useSelector(selectUserRole); // Kullanıcının rolünü alıyoruz

  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBooks: 0,
    loanedBooks: 0,
    availableBooks: 0, // Yeni: Mevcut kitap sayısı
  });
  const [overdueLoans, setOverdueLoans] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState(null);
  const [loadingOverdue, setLoadingOverdue] = useState(true);
  const [overdueError, setOverdueError] = useState(null);


  const isAdmin = userRole === 'admin';
  // Kimlik doğrulama kontrolü
  // Bu sayfanın sadece giriş yapmış kullanıcılar tarafından erişilebilir olmasını sağla
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { message: 'Bu sayfayı görmek için giriş yapmalısınız.' } });
      return;
    }
    // Eğer admin ise ve kitaplar henüz yüklenmemişse veya rol değişmişse tekrar çek
    if (isAdmin) {
      fetchAdminDashboardData();
    } else {
      // Normal kullanıcılar için farklı veriler çekilebilir veya sadece mesaj gösterilir
      setLoadingStats(false);
      setLoadingOverdue(false);
    }
  }, [isAuthenticated, user, navigate, isAdmin]);
  // isAuthenticated veya navigate değiştiğinde bu etkiyi tekrar çalıştır

  const fetchAdminDashboardData = async () => {
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };

    // İstatistikleri çekme
    setLoadingStats(true);
    setStatsError(null);
    try {
        // Örnek endpoint'ler, sizin backend'inize göre değiştirebilirsiniz
        const [usersRes, booksRes, loansRes] = await Promise.all([
            fetch('http://localhost:4000/api/v1/auth/getallusers', { headers }),
            fetch('http://localhost:4000/api/v1/books', { headers }),
            fetch('http://localhost:4000/api/v1/admin/borrowings', { headers })
        ]);

        if (!usersRes.ok || !booksRes.ok || !loansRes.ok) {
            const errorData = await Promise.allSettled([usersRes.json(), booksRes.json(), loansRes.json()]);
            const errorMessage = errorData.map(res => res.status === 'fulfilled' ? res.value?.message : 'Bilinmeyen hata').join(', ');
            throw new Error(`İstatistikler yüklenirken hata: ${errorMessage}`);
        }

        const usersData = await usersRes.json();
        const booksData = await booksRes.json();
        const loansData = await loansRes.json();

        const totalUsers = usersData.users?.length || 0;
        const totalBooks = booksData.books?.length || 0;
        const loanedBooks = loansData.borrowings?.filter(loan => loan.status === 'borrowed').length || 0;
        const availableBooks = booksData.books?.filter(book => book.stock - book.borrowedCount > 0).length || 0; // Stokta olan kitaplar

        setStats({ totalUsers, totalBooks, loanedBooks, availableBooks });

    } catch (err) {
        console.error('İstatistik çekme hatası:', err);
        setStatsError(err.message || 'İstatistikler yüklenirken bir sorun oluştu.');
    } finally {
        setLoadingStats(false);
    }

    // Geciken kitapları çekme
    setLoadingOverdue(true);
    setOverdueError(null);
    try {
        // Bu endpoint'in backend'de geciken kitapları dönmesi gerekiyor
        const response = await fetch('http://localhost:4000/api/v1/admin/overdue-books', { headers });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Geciken kitaplar yüklenirken hata.');
        }

        const data = await response.json();
        setOverdueLoans(data.overdueBooks || []); // Backend'den gelen veriye göre ayarlayın
    } catch (err) {
        console.error('Geciken kitap çekme hatası:', err);
        setOverdueError(err.message || 'Geciken kitaplar yüklenirken bir sorun oluştu.');
    } finally {
        setLoadingOverdue(false);
    }
  };

  if (loadingStats && isAdmin) { // Sadece admin ise istatistikleri beklesin
    return (
      <div className="dashboard-page">
        <div className="loading-message">Dashboard verileri yükleniyor...</div>
      </div>
    );
  }

  if (statsError && isAdmin) {
      return (
          <div className="dashboard-page">
              <div className="error-message">
                  <p>{statsError}</p>
                  <button onClick={fetchAdminDashboardData} className="action-button primary">Tekrar Dene</button>
              </div>
          </div>
      );
  }
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

  return (
    <div className="dashboard-page">
      <div className="dashboard-content">
        <h2>Hoş Geldin, {user.name}!</h2>

        <div className="dashboard-sections">

          {/* Rolüne göre farklı bölümler göster */}
          {isAdmin ? (
            <>
              {/* Admin Paneli İçeriği */}
              <div className="admin-section-header">
                <h3>Admin Paneli</h3>
                <ul className="quick-access-links">
                  <li><Link to="/admin/books" className="dashboard-link">Kitapları Yönet</Link></li>
                  <li><Link to="/admin/users" className="dashboard-link">Üyeleri Yönet</Link></li>
                  <li><Link to="/admin/loans" className="dashboard-link">Emanetleri Görüntüle</Link></li>
                  <li><Link to="/admin/settings" className="dashboard-link admin-link">Sistem Ayarları</Link></li>
                </ul>
              </div>

              <div className="admin-stats-section">
            <h3>Sistem İstatistikleri</h3>
            <div className="stats-cards">
              <div className="stat-card">
                <h4>Toplam Kullanıcılar</h4>
                <p>{stats.totalUsers}</p>
              </div>
              <div className="stat-card">
                <h4>Toplam Kitaplar</h4>
                <p>{stats.totalBooks}</p>
              </div>
              <div className="stat-card">
                <h4>Ödünç Verilen Kitaplar</h4>
                <p>{stats.loanedBooks}</p>
              </div>
              <div className="stat-card">
                <h4>Mevcut Kitaplar</h4>
                <p>{stats.availableBooks}</p>
              </div>
            </div>
          </div>

          <div className="admin-overdue-section">
            <h3>Geciken Kitaplar</h3>
            {loadingOverdue ? (
              <p className="loading-message">Geciken kitaplar yükleniyor...</p>
            ) : overdueError ? (
              <div className="error-message">
                <p>{overdueError}</p>
                <button onClick={fetchAdminDashboardData} className="action-button primary">Tekrar Dene</button>
              </div>
            ) : overdueLoans.length > 0 ? (
              <div className="overdue-list-container">
                <table className="overdue-table">
                  <thead>
                    <tr>
                      <th>Kitap Adı</th>
                      <th>Ödünç Alan</th>
                      <th>Emanet Tarihi</th>
                      <th>Beklenen İade Tarihi</th>
                      <th>Geçen Gün</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overdueLoans.map(loan => (
                      <tr key={loan._id} className="overdue-item">
                        <td>{loan.book?.title || 'Kitap Bilgisi Yok'}</td>
                        <td>{loan.user?.name || 'Kullanıcı Bilgisi Yok'}</td>
                        <td>{new Date(loan.borrowDate).toLocaleDateString()}</td>
                        <td>{new Date(loan.returnDate).toLocaleDateString()}</td>
                        <td>
                          {Math.floor((new Date() - new Date(loan.returnDate)) / (1000 * 60 * 60 * 24))} gün
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="no-overdue-message">Geciken kitap bulunmuyor. Harika!</p>
            )}
          </div>
            </>
          ) : (
            // Normal kullanıcılar için özel bölüm
            <>
              <h3>Kullanıcı Paneli</h3>
              <ul className="quick-access-links">
                <li><Link to="/my-loans" className="dashboard-link">Ödünç Alma Geçmişi</Link></li>
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