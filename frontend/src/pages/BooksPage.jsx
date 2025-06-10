// src/pages/BooksPage.jsx

import React, { useState, useEffect } from 'react';
// Kitap verilerini alacağımız için useSelector ve useDispatch'e belki ihtiyacımız olacak
// Şimdilik sadece statik içerikle başlayacağız.
 import { Link } from 'react-router-dom';

const BooksPage = () => {
  const [books, setBooks] = useState([]); // Kitapları tutacak state
  const [loading, setLoading] = useState(true); // Yüklenme durumu
  const [error, setError] = useState(null); // Hata durumu
  const [searchTerm, setSearchTerm] = useState(''); // Arama terimi
  const [filterCategory, setFilterCategory] = useState('all'); // Kategori filtresi

  useEffect(() => {
    // Kitapları API'den çekeceğimiz yer
    const fetchBooks = async () => {
      try {
        setLoading(true);
        setError(null);

        // API URL'inizi buraya ekleyin (örneğin: 'http://localhost:4000/api/v1/books')
        const response = await fetch('http://localhost:4000/api/v1/books');
        if (!response.ok) {
          throw new Error('Kitaplar yüklenirken bir hata oluştu.');
        }
        const data = await response.json();
        setBooks(data.books || []); // Backend'den gelen kitap dizisini set ediyoruz
      } catch (err) {
        console.error('Kitap çekme hatası:', err);
        setError(err.message || 'Kitaplar yüklenirken bir sorun oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []); // Sayfa yüklendiğinde bir kez çalıştır

  // Arama ve filtreleme mantığı
  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          book.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || book.genre.toLowerCase().includes(filterCategory.toLowerCase()) ;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="books-page">
        <div className="loading-message">Kitaplar yükleniyor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="books-page">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="books-page">
      <div className="books-header">
        <h2>Kütüphanemizdeki Kitaplar</h2>
        <div className="search-filter-controls">
          <input
            type="text"
            placeholder="Kitap veya yazar ara..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="filter-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">Tüm Kategoriler</option>
            <option value="bilim">Bilim Kurgu</option>
            <option value="biyografi">Biyografi</option>
            <option value="tarih">Tarih</option>
            <option value="distopya">Distopya</option>
            <option value="edebiyat">Edebiyat</option>
            <option value="gelişim">Gelişim</option>
            {/* Daha fazla kategori eklenebilir */}
          </select>
        </div>
      </div>

      <div className="book-list">
        {filteredBooks.length > 0 ? (
            filteredBooks.map(book => (
              <div key={book._id || book.id} className="book-card">
                {book.imageUrl && ( // Eğer resim URL'i varsa göster
                  <div className="book-image-container">
                    <img src={book.imageUrl} alt={book.title} className="book-image" />
                  </div>
                )} { !book.imageUrl && 
                  <div className="book-image-container">
                    <img src="https://myersedpress.presswarehouse.com/publishers/default_cover.png" alt={book.title} className="book-image" />
                  </div>
                }
                  <h3 className="book-title">{book.title}</h3>
                  <p className="book-author">Yazar: {book.author}</p>
                  <p className="book-category">Kategori: {book.genre}</p>
                  <p className="book-price">Fiyat: {book.price ? `${book.price} TL` : 'Belirtilmemiş'}</p> {/* Fiyat eklendi */}
                <p className="book-status">Durum: <span className={book.stock - book.borrowedCount > 0 ? 'available' : 'not-available'}>
                  {book.stock - book.borrowedCount > 0 ? 'Mevcut' : 'Mevcut Değil'}
                </span></p>
                {/* İsteğe bağlı olarak ek bilgiler veya detay butonu eklenebilir */}
                <div className="book-card-actions">
                  <Link to={`/books/${book._id || book.id}`} className="details-btn">
                    Detaylar
                  </Link>
                </div>
              </div>
            ))
        ) : (
          <p className="no-books-message">Kitap bulunamadı veya aramanızla eşleşen sonuç yok.</p>
        )}
      </div>
    </div>
  );
};

export default BooksPage;