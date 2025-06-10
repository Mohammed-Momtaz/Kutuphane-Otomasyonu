import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux'; // Redux state'ine erişmek için
import { Link, useNavigate } from 'react-router-dom'; // Yönlendirme için
import { selectUserRole } from '../redux/slices/authSlice'; // selectUserRole selector'ını import ettik
import BookFormModal from '../components/BookFormModal'; // BookFormModal'ı import ettik

const DashboardPage = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth); // Auth state'inden isAuthenticated ve user'ı al
  const userRole = useSelector(selectUserRole); // Kullanıcının rolünü alıyoruz

  const navigate = useNavigate();

  const [books, setBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(true); // Kitap yükleme loading'i
  const [booksError, setBooksError] = useState(null); // Kitap yükleme hatası
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBook, setCurrentBook] = useState(null);

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
      fetchBooks();
    }
  }, [isAuthenticated, user, navigate, isAdmin]);
  // isAuthenticated veya navigate değiştiğinde bu etkiyi tekrar çalıştır

  // Kitapları API'den çekme fonksiyonu (Admin için)
  const fetchBooks = async () => {
    setLoadingBooks(true);
    setBooksError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/v1/books', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Bu işlemi yapmaya yetkiniz yok. Lütfen tekrar giriş yapın.');
        }
        throw new Error('Kitaplar yüklenirken bir hata oluştu.');
      }
      const data = await response.json();
      setBooks(data.books || []);
    } catch (err) {
      console.error('Kitap çekme hatası (AdminBooks):', err);
      setBooksError(err.message || 'Kitaplar yüklenirken bir sorun oluştu.');
    } finally {
      setLoadingBooks(false);
    }
  };

    // Yeni kitap ekleme işlemi
  const handleAddBook = () => {
    setCurrentBook(null); // Yeni kitap eklemek için currentBook'ı temizle
    setIsModalOpen(true);
  };

  // Kitap düzenleme işlemi
  const handleEditBook = (book) => {
    setCurrentBook(book); // Düzenlenecek kitabı set et
    setIsModalOpen(true);
  };

  // Kitap silme işlemi
  const handleDeleteBook = async (bookId) => {
    if (window.confirm('Bu kitabı silmek istediğinizden emin misiniz?')) {
      try {
        const token = localStorage.getItem('token');
        console.log(localStorage.getItem('token'));
        const response = await fetch(`http://localhost:4000/api/v1/book/${bookId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error('Bu işlemi yapmaya yetkiniz yok.');
          }
          throw new Error('Kitap silinirken bir hata oluştu.');
        }

        setBooks(books.filter(book => book._id !== bookId)); // Başarılıysa listeden kaldır
        alert('Kitap başarıyla silindi!');
      } catch (err) {
        console.error('Kitap silme hatası:', err);
        setBooksError(err.message || 'Kitap silinirken bir sorun oluştu.');
        alert(`Hata: ${err.message || 'Kitap silinemedi.'}`);
      }
    }
  };

    // Modal kapatıldığında
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentBook(null); // Modalı kapatınca currentBook'ı temizle
  };

  // Kitap ekleme/düzenleme sonrası başarılı olduğunda listeyi güncelle
  const handleBookSaveSuccess = () => {
    fetchBooks(); // Kitap listesini yeniden çek
    handleCloseModal(); // Modalı kapat
  };

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
                  <li><Link to="/admin/users" className="dashboard-link">Üyeleri Yönet</Link></li>
                  <li><Link to="/admin/loans" className="dashboard-link">Emanetleri Görüntüle</Link></li>
                  <li><Link to="/admin/settings" className="dashboard-link admin-link">Sistem Ayarları</Link></li>
                </ul>
              </div>

              {/* Kitap Yönetimi Bölümü */}
              <div className="admin-book-management-section">
                <div className="admin-books-header">
                  <h3>Kitap Yönetimi</h3> {/* Başlık AdminBooksPage'den geldi */}
                  <button onClick={handleAddBook} className="add-new-book-btn">Yeni Kitap Ekle</button>
                </div>

                {loadingBooks ? (
                  <div className="loading-message">Kitaplar yükleniyor...</div>
                ) : booksError ? (
                  <div className="error-message">
                    <p>{booksError}</p>
                    <button onClick={fetchBooks} className="action-button primary">Tekrar Dene</button>
                  </div>
                ) : books.length > 0 ? (
                  <div className="books-table-container">
                    <table className="books-table">
                      <thead>
                        <tr>
                          <th>Resim</th>
                          <th>Başlık</th>
                          <th>Yazar</th>
                          <th>Kategori</th>
                          <th>Fiyat</th>
                          <th>Stok</th>
                          <th>Durum</th>
                          <th>İşlemler</th>
                        </tr>
                      </thead>
                      <tbody>
                        {books.map(book => (
                          <tr key={book._id}>
                            <td className="book-image-cell">
                              {book.imageUrl ? (
                                <img src={book.imageUrl} alt={book.title} />
                              ) : (
                                <span>Resim Yok</span>
                              )}
                            </td>
                            <td>{book.title}</td>
                            <td>{book.author}</td>
                            <td>{book.genre}</td>
                            <td>{book.price ? `${book.price} TL` : '-'}</td>
                            <td>{book.stock || 0}</td>
                            <td>
                              <span className={book.stock - book.borrowedCount ? 'status-available' : 'status-not-available'}>
                                {book.stock - book.borrowedCount ? 'Mevcut' : 'Mevcut Değil'}
                              </span>
                            </td>
                            <td className="action-buttons">
                              <button onClick={() => handleEditBook(book)} className="action-button edit-btn">Düzenle</button>
                              <button onClick={() => handleDeleteBook(book._id)} className="action-button delete-btn">Sil</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="no-books-message">Yönetilecek kitap bulunmuyor. Yeni bir kitap ekleyin.</p>
                )}
              </div>
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
      {isModalOpen && (
        <BookFormModal
          book={currentBook}
          onClose={handleCloseModal}
          onSaveSuccess={handleBookSaveSuccess}
        />
      )}
    </div>
  );
};

export default DashboardPage;