import React, { useState, useEffect } from 'react';

const UserRoleModal = ({ user, onClose, onSaveSuccess }) => {
  const [selectedRole, setSelectedRole] = useState(user?.role || 'user'); // Varsayılan olarak mevcut rolü veya 'user'ı seç
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Kullanıcı değiştiğinde veya modal açıldığında rolü güncelle
    if (user) {
      setSelectedRole(user.role);
    }
    setError(null); // Modalı açarken hataları temizle
    setMessage(''); // Mesajları temizle
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage('');

    if (!user || !user._id) {
      setError('Kullanıcı bilgisi eksik.');
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('token');
    // Backend API'nizin kullanıcı rolü güncelleme endpoint'ine uygun URL
    const url = `http://localhost:4000/api/v1/auth/user/${user._id}`;

    try {
      const response = await fetch(url, {
        method: 'PUT', // Rol güncelleme genellikle PUT isteğiyle yapılır
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ role: selectedRole }), // Sadece rolü gönder
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Kullanıcı rolü başarıyla güncellendi!');
        onSaveSuccess(); // Başarılıysa üst bileşene haber ver
      } else {
        setError(data.message || 'Kullanıcı rolü güncellenirken bir hata oluştu.');
      }
    } catch (err) {
      console.error('Kullanıcı rolü güncelleme hatası:', err);
      setError('Sunucuya bağlanılamadı veya bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{user ? `${user.name} kullanıcısının rolünü düzenle` : 'Kullanıcı Rolünü Düzenle'}</h3>
        {error && <p className="form-message error-message">{error}</p>}
        {message && <p className="form-message success-message">{message}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="userRole">Rol Seçin:</label>
            <select
              id="userRole"
              name="userRole"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              required
            >
              <option value="user">Kullanıcı</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="modal-actions">
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Kaydediliyor...' : 'Rolü Kaydet'}
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

export default UserRoleModal;