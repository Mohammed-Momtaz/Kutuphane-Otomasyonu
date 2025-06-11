import React, { useState, useEffect } from 'react';

const BookFormModal = ({ book, onClose, onSaveSuccess }) => {
  // Form alanları için state. Eğer 'book' objesi varsa, o değerlerle başlat.
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    genre: '',
    price: '',
    stock: '', // Stok alanı eklendi
    imageUrl: '',
    publicationYear: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (book) {
      // Eğer bir kitap düzenleniyorsa, form alanlarını kitabın mevcut değerleriyle doldur
      setFormData({
        title: book.title || '',
        author: book.author || '',
        description: book.description || '',
        genre: book.genre || '',
        price: book.price || '',
        stock: book.stock || 0,
        imageUrl: book.imageUrl || '',
        publicationYear: book.publicationYear || '',
        addedBy: book.addedBy || ''
      });
    } else {
      // Yeni kitap ekleniyorsa, formu varsayılan değerlerle başlat
      setFormData({
        title: '',
        author: '',
        description: '',
        genre: '',
        price: '',
        stock: '',
        imageUrl: '',
        publicationYear: '',
        addedBy: '',
      });
    }
  }, [book]); // book prop'u değiştiğinde formu güncelle

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage('');

    // Form doğrulama (basit)
    if (!formData.title || !formData.author || !formData.genre || !formData.price || !formData.stock || !formData.publicationYear) {
      setError('Lütfen tüm zorunlu alanları doldurun.');
      setLoading(false);
      return;
    }
    if (isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      setError('Geçerli bir fiyat girin.');
      setLoading(false);
      return;
    }
    if (isNaN(formData.stock) || parseInt(formData.stock) < 0) {
        setError('Geçerli bir stok miktarı girin.');
        setLoading(false);
        return;
    }
    if (isNaN(formData.publicationYear) || parseInt(formData.publicationYear) < 0) {
        setError('Geçerli bir yayın yılı girin.');
        setLoading(false);
        return;
    }


    const token = localStorage.getItem('token');
    const method = book ? 'PUT' : 'POST'; // Eğer kitap varsa PUT (güncelleme), yoksa POST (ekleme)
    const url = book ? `http://localhost:4000/api/v1/book/${book._id}` : 'http://localhost:4000/api/v1/book/new';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Kitap başarıyla kaydedildi!');
        onSaveSuccess(); // Başarılıysa üst bileşene haber ver
      } else {
        setError(data.message || 'Kitap kaydedilirken bir hata oluştu.');
      }
    } catch (err) {
      console.error('Kitap kaydetme hatası:', err);
      setError('Sunucuya bağlanılamadı veya bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{book ? 'Kitabı Düzenle' : 'Yeni Kitap Ekle'}</h3>
        {error && <p className="form-message error-message">{error}</p>}
        {message && <p className="form-message success-message">{message}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Başlık</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="author">Yazar</label>
            <input
              type="text"
              id="author"
              name="author"
              value={formData.author}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Açıklama</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
            ></textarea>
          </div>
          <div className="form-group">
            <label htmlFor="genre">Kategori</label>
            <input
              type="text"
              id="genre"
              name="genre"
              value={formData.genre}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="price">Fiyat (TL)</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              step="0.01" // Kuruşlu fiyatlar için
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="stock">Stok Miktarı</label>
            <input
              type="number"
              id="stock"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              min="0"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="publicationYear">Yayın Yılı</label>
            <input
              type="number"
              id="publicationYear"
              name="publicationYear"
              value={formData.publicationYear}
              onChange={handleChange}
              min="1000"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="imageUrl">Resim URL</label>
            <input
              type="url"
              id="imageUrl"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
            />
          </div>
          <div className="modal-actions">
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Kaydediliyor...' : (book ? 'Değişiklikleri Kaydet' : 'Kitap Ekle')}
            </button>
            <button type="button" onClick={onClose} className="cancel-btn" disabled={loading}>
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookFormModal;