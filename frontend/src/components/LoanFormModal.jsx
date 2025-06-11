import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker'; // DatePicker import edildi
import 'react-datepicker/dist/react-datepicker.css'; // DatePicker stilleri

const LoanFormModal = ({ onClose, onSaveSuccess }) => {
  const [books, setBooks] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedBook, setSelectedBook] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [returnDate, setReturnDate] = useState(null); // **Yeni: İade tarihi için state**
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Kitap ve kullanıcıları API'den çekme
    const fetchFormData = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      try {
        // Kitapları çek (sadece mevcut olanları veya tümünü, backend'e bağlı)
        const booksResponse = await fetch('http://localhost:4000/api/v1/books', { headers });
        const booksData = await booksResponse.json();
        if (!booksResponse.ok) throw new Error(booksData.message || 'Kitaplar yüklenirken hata.');
        // Sadece mevcut (stokta olan) kitapları göster
        setBooks(booksData.books.filter(book => book.stock - book.borrowedCount > 0) || []);

        // Kullanıcıları çek
        const usersResponse = await fetch('http://localhost:4000/api/v1/auth/getallusers', { headers });
        const usersData = await usersResponse.json();
        if (!usersResponse.ok) throw new Error(usersData.message || 'Kullanıcılar yüklenirken hata.');
        setUsers(usersData.users || []);

      } catch (err) {
        console.error('Form verileri çekme hatası:', err);
        setError(err.message || 'Form verileri yüklenirken bir sorun oluştu.');
      } finally {
        setLoading(false);
      }
    };
    fetchFormData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage('');

    if (!selectedBook || !selectedUser || !returnDate) { // **returnDate kontrolünü ekledik**
      setError('Lütfen bir kitap, bir kullanıcı ve bir iade tarihi seçin.');
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('token');
    const url = 'http://localhost:4000/api/v1/admin/book/borrow';

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookId: selectedBook,
          userId: selectedUser,
          returnDate: returnDate.toISOString().split('T')[0], 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Emanet başarıyla oluşturuldu!');
        onSaveSuccess(); // Başarılıysa üst bileşene haber ver
      } else {
        setError(data.message || 'Emanet oluşturulurken bir hata oluştu: ' + (data.message || 'Bilinmeyen hata'));
      }
    } catch (err) {
      console.error('Emanet oluşturma hatası:', err);
      setError('Sunucuya bağlanılamadı veya bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Minimum iade tarihi bugün veya yarından itibaren olmalı (admin için de geçerli)
  const minReturnDate = new Date();
  minReturnDate.setDate(minReturnDate.getDate() + 1); // Yarından itibaren

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Yeni Emanet Oluştur</h3>
        {loading && <p className="form-message info-message">Veriler yükleniyor...</p>}
        {error && <p className="form-message error-message">{error}</p>}
        {message && <p className="form-message success-message">{message}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="bookSelect">Kitap Seçin:</label>
            <select
              id="bookSelect"
              name="bookSelect"
              value={selectedBook}
              onChange={(e) => setSelectedBook(e.target.value)}
              required
              disabled={loading}
            >
              <option value="">-- Kitap Seçin --</option>
              {books.map(book => (
                <option key={book._id} value={book._id}>
                  {book.title} (Stok: {book.stock})
                </option>
              ))}
            </select>
            {books.length === 0 && !loading && !error && (
                <p className="no-options-message">Mevcut veya stokta kitap bulunmuyor.</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="userSelect">Kullanıcı Seçin:</label>
            <select
              id="userSelect"
              name="userSelect"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              required
              disabled={loading}
            >
              <option value="">-- Kullanıcı Seçin --</option>
              {users.map(userItem => (
                <option key={userItem._id} value={userItem._id}>
                  {userItem.name} ({userItem.email})
                </option>
              ))}
            </select>
            {users.length === 0 && !loading && !error && (
                <p className="no-options-message">Kayıtlı kullanıcı bulunmuyor.</p>
            )}
          </div>

          {/* **Yeni: İade Tarihi Seçici** */}
          <div className="form-group">
            <label htmlFor="returnDate">İade Tarihi:</label>
            <DatePicker
              selected={returnDate}
              onChange={(date) => setReturnDate(date)}
              minDate={minReturnDate} // Yarından itibaren seçim
              dateFormat="dd/MM/yyyy"
              placeholderText="İade tarihi seçin"
              className="date-picker-input" // CSS sınıfı
              required // Zorunlu alan yaptık
            />
          </div>

          <div className="modal-actions">
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Oluşturuluyor...' : 'Emanet Oluştur'}
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

export default LoanFormModal;