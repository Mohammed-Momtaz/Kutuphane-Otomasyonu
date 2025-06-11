import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import DatePicker from 'react-datepicker'; // DatePicker import edildi
import 'react-datepicker/dist/react-datepicker.css'; // DatePicker stilleri

const BookDetailPage = () => {
  const { id } = useParams(); // URL'den kitap ID'sini alıyoruz (örneğin: /books/60d21b46a1e34c2a8c8b4567)
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const [book, setBook] = useState(null); // Tekil kitap verisini tutacak state
  const [loading, setLoading] = useState(true); // Yüklenme durumu
  const [error, setError] = useState(null); // Hata durumu
  const [borrowMessage, setBorrowMessage] = useState(''); // Ödünç alma mesajı
  const [borrowError, setBorrowError] = useState(null); // Ödünç alma hatası
  const [returnDate, setReturnDate] = useState(null); // İade tarihi için state


  useEffect(() => {
    const fetchBookDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        setBook(null); // Önceki kitabı temizle

        // API URL'inizi buraya ekleyin (örneğin: 'http://localhost:4000/api/v1/books/:id')
        const response = await fetch(`http://localhost:4000/api/v1/book/${id}`);
        if (!response.ok) {
          // Hata durumunda 404 gibi bir sayfaya yönlendirme veya mesaj
          if (response.status === 404) {
            throw new Error('Kitap bulunamadı.');
          }
          throw new Error('Kitap detayları yüklenirken bir hata oluştu.');
        }
        const data = await response.json();
        setBook(data.book); // Backend'den gelen tekil kitap objesini set ediyoruz
      } catch (err) {
        console.error('Kitap detay çekme hatası:', err);
        setError(err.message || 'Kitap detayları yüklenirken bir sorun oluştu.');
      } finally {
        setLoading(false);
      }
    };

    if (id) { // ID varsa fetch yap
      fetchBookDetails();
    } else { // ID yoksa hata durumu
      setError('Kitap ID\'si bulunamadı.');
      setLoading(false);
    }
  }, [id]); // ID değiştiğinde bu etkiyi tekrar çalıştır

    // Kitap ödünç alma fonksiyonu
  const handleBorrowBook = async () => {
    setBorrowMessage('');
    setBorrowError(null);

    if (!isAuthenticated) {
      setBorrowError('Kitap ödünç almak için giriş yapmalısınız.');
      navigate('/login', { state: { from: `/books/${id}` } }); // Giriş sayfasına yönlendir
      return;
    }

    if (user?.role === 'admin') {
        setBorrowError('Adminler doğrudan bu arayüzden kitap ödünç alamaz. Lütfen admin panelinden emanet oluşturun.');
        return;
    }

    if (!returnDate) {
      setBorrowError('Lütfen bir iade tarihi seçin.');
      return;
    }

    const token = localStorage.getItem('token');
    const borrowUrl = 'http://localhost:4000/api/v1/book/borrow';

    try {
      const response = await fetch(borrowUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookId: book._id,
          returnDate: returnDate.toISOString().split('T')[0], // YYYY-MM-DD formatında gönder
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Kitap ödünç alınırken bir hata oluştu.');
      }

      setBorrowMessage('Kitap başarıyla ödünç alındı!');
      // Stoğu ve mevcut durumunu güncelleyebiliriz (opsiyonel)
      setBook(prevBook => ({
        ...prevBook,
        borrowedCount: prevBook.borrowedCount - 1 > 0
      }));

    } catch (err) {
      console.error('Ödünç alma hatası:', err);
      setBorrowError(err.message || 'Kitap ödünç alınırken bir sorun oluştu.');
    }
  };

  if (loading) {
    return (
      <div className="book-detail-page">
        <div className="loading-message">Kitap detayları yükleniyor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="book-detail-page">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => navigate('/books')} className="back-to-books-btn">Kitaplara Geri Dön</button>
        </div>
      </div>
    );
  }

  // Eğer kitap bulunamazsa veya null ise (API'den gelmezse)
  if (!book) {
    return (
      <div className="book-detail-page">
        <div className="no-book-found">
          <p>Kitap bilgileri bulunamadı.</p>
          <button onClick={() => navigate('/books')} className="back-to-books-btn">Kitaplara Geri Dön</button>
        </div>
      </div>
    );
  }

  // Minimum iade tarihi bugün veya yarından itibaren olmalı
  const minReturnDate = new Date();
  minReturnDate.setDate(minReturnDate.getDate() + 1); // Yarından itibaren

  return (
    <div className="book-detail-page">
      <div className="book-detail-card">
          {book.imageUrl && ( // Eğer resim URL'i varsa göster
            <div className=".detail-image-container">
              <img src={book.imageUrl} alt={book.title} className=".detail-book-image" />
            </div>
          )} { !book.imageUrl && 
            <div className=".detail-image-container">
              <img src="https://myersedpress.presswarehouse.com/publishers/default_cover.png" alt={book.title} className="book-image" />
            </div>
          }
        <div className="detail-info">
          <h2 className="detail-title">{book.title}</h2>
          <p className="detail-author">Yazar: {book.author}</p>
          <p className="detail-category">Kategori: {book.genre}</p>
          <p className="detail-price">Fiyat: {book.price ? `${book.price} TL` : 'Belirtilmemiş'}</p>
          <p className="book-status">Durum: <span className={book.stock - book.borrowedCount > 0 ? 'available' : 'not-available'}>
            {book.stock - book.borrowedCount > 0 ? 'Mevcut' : 'Mevcut Değil'}
          </span></p>
          <div className="detail-description-full">
            <h3>Açıklama</h3>
            <p>{book.description}</p>
          </div>

          {/* Ödünç Alma Bölümü */}
          {isAuthenticated && user?.role === 'user' && ( // Sadece normal kullanıcılar için göster
            <div className="borrow-section">
              <h4>Kitabı Ödünç Al</h4>
              {borrowError && <p className="form-message error-message">{borrowError}</p>}
              {borrowMessage && <p className="form-message success-message">{borrowMessage}</p>}

              { book.stock - book.borrowedCount > 0 ? (
                <>
                  <div className="form-group">
                    <label htmlFor="returnDate">İade Tarihi:</label>
                    <DatePicker
                      selected={returnDate}
                      onChange={(date) => setReturnDate(date)}
                      minDate={minReturnDate} // Yarından itibaren seçim
                      dateFormat="dd/MM/yyyy"
                      placeholderText="İade tarihi seçin"
                      className="date-picker-input" // CSS sınıfı
                    />
                  </div>
                  <button
                    onClick={handleBorrowBook}
                    className="borrow-book-btn"
                    disabled={!returnDate || borrowMessage !== ''} // Tarih seçilmeden veya ödünç alma başarılıysa disabled
                  >
                    Kitabı Ödünç Al
                  </button>
                </>
              ) : (
                <p className="no-options-message">Bu kitap şu anda ödünç alınamaz (stokta yok veya mevcut değil).</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookDetailPage;