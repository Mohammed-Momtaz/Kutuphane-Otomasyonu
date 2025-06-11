// src/pages/HomePage.jsx

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:4000/api/v1/books'); // API endpoint'i

      if (!response.ok) {
        throw new Error('Kitaplar yüklenirken bir hata oluştu.');
      }

      const data = await response.json();
      setBooks(data.books || []); // Backend'den gelen 'books' dizisini kullanın
    } catch (err) {
      console.error('Kitap çekme hatası:', err);
      setError(err.message || 'Kitaplar yüklenirken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="home-page loading">
        <div className="loading-message">Kitaplar yükleniyor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-page error">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchBooks} className="action-button primary">Tekrar Dene</button>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <section className="hero-section">
        <h1>Kütüphanemize Hoş Geldiniz!</h1>
        <p>En sevdiğiniz kitapları keşfedin, ödünç alın ve iade edin.</p>
        <div className="hero-buttons">
          <Link to="/books" className="hero-button primary">Tüm Kitapları Görüntüle</Link>
          <Link to="/register" className="hero-button secondary">Şimdi Kaydol</Link>
        </div>
      </section>

      <section className="featured-books-section">
        <h2>Popüler Kitaplar</h2>
        {books.length > 0 ? (
          <div className="book-grid">
            {books.slice(0, 8).map(book => ( // İlk 8 kitabı göster
              <Link to={`/books/${book._id}`} key={book._id} className="book-card">
                <div className="book-image-container">
                  {book.imageUrl ? (
                    <img src={book.imageUrl} alt={book.title} className="book-card-image" />
                  ) : (
                    <div className="no-image-placeholder">Resim Yok</div>
                  )}
                </div>
                <div className="book-card-content">
                  <h3 className="book-card-title">{book.title}</h3>
                  <p className="book-card-author">{book.author}</p>
                  <p className="book-card-category">{book.category}</p>
                  <p className={`book-card-status ${ book.stock - book.borrowedCount > 0 ? 'status-available' : 'status-not-available'}`}>
                    {book.stock - book.borrowedCount > 0 ? 'Mevcut' : 'Mevcut Değil'} ({book.stock})
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="no-books-found">Şu anda gösterilecek kitap bulunmuyor.</p>
        )}
      </section>
    </div>
  );
};

export default HomePage;