import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // useParams ile URL'den ID alacağız

const BookDetailPage = () => {
  const { id } = useParams(); // URL'den kitap ID'sini alıyoruz (örneğin: /books/60d21b46a1e34c2a8c8b4567)
  const navigate = useNavigate();

  const [book, setBook] = useState(null); // Tekil kitap verisini tutacak state
  const [loading, setLoading] = useState(true); // Yüklenme durumu
  const [error, setError] = useState(null); // Hata durumu

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

          <div className="detail-actions">
            {/* Emanet al butonu (isteğe bağlı, admin/kullanıcı rolüne göre değişebilir) */}
            {book.isAvailable && (
                <button className="borrow-book-btn">Emanet Al</button>
            )}
            <button onClick={() => navigate('/books')} className="back-to-list-btn">Kitap Listesine Dön</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetailPage;