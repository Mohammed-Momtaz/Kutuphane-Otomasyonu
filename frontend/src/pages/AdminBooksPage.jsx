import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import BookFormModal from '../components/BookFormModal'; // Kitap formu modalını import edin

const AdminBooksPage = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [books, setBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(true); // Kitap yükleme loading'i
  const [booksError, setBooksError] = useState(null); // Kitap yükleme hatası
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBook, setCurrentBook] = useState(null); // Düzenlenecek kitap için

  // Rol kontrolü: Sadece adminler erişebilir
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { message: 'Bu sayfayı görmek için giriş yapmalısınız.' } });
      return;
    }
    if (user?.role !== 'admin') {
      navigate('/dashboard', { state: { message: 'Bu sayfaya erişim yetkiniz yok.' } });
      return;
    }
    fetchBooks(); // Admin ise kitapları çek
  }, [isAuthenticated, user, navigate]);

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

  if (loadingBooks) {
    return (
      <div className="admin-books-page">
        <div className="loading-message">Kitaplar yükleniyor...</div>
      </div>
    );
  }

  if (booksError) {
    return (
      <div className="admin-books-page">
        <div className="error-message">
          <p>{booksError}</p>
          {user?.role === 'admin' && (
             <button onClick={fetchBooks} className="action-button primary">Tekrar Dene</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className='books-page'>
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

      {isModalOpen && (
        <BookFormModal
        book={currentBook} // Düzenleme için mevcut kitabı gönderiyoruz
        onClose={handleCloseModal}
        onSaveSuccess={handleBookSaveSuccess}
        />
    )}
    </div>
  );
};

export default AdminBooksPage;