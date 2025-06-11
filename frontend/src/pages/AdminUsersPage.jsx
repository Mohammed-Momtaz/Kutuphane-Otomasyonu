import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

// Kullanıcı rolünü düzenlemek için bir modal oluşturacağız
import UserRoleModal from '../components/UserRoleModal';

const AdminUsersPage = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal durumu
  const [currentUser, setCurrentUser] = useState(null); // Düzenlenecek kullanıcı

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
    fetchUsers(); // Admin ise kullanıcıları çek
  }, [isAuthenticated, user, navigate]);

  // Kullanıcıları API'den çekme fonksiyonu
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/v1/auth/getallusers', { // Backend'deki admin users endpoint'i
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Bu işlemi yapmaya yetkiniz yok. Lütfen tekrar giriş yapın.');
        }
        throw new Error('Kullanıcılar yüklenirken bir hata oluştu.');
      }
      const data = await response.json();
      setUsers(data.users || []); // Backend'den gelen users objesini set ediyoruz
    } catch (err) {
      console.error('Kullanıcı çekme hatası:', err);
      setError(err.message || 'Kullanıcılar yüklenirken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Kullanıcı rolünü düzenleme işlemi
  const handleEditUserRole = (userToEdit) => {
    setCurrentUser(userToEdit); // Düzenlenecek kullanıcıyı set et
    setIsModalOpen(true);
  };

  // Kullanıcı silme işlemi
  const handleDeleteUser = async (userId) => {
    // Kendi kendini silme engelleme (Adminin kendi hesabını yanlışlıkla silmesini önleriz)
    if (userId === user?._id) {
        alert('Kendi hesabınızı bu arayüzden silemezsiniz.');
        return;
    }

    if (window.confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:4000/api/v1/auth/user/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error('Bu işlemi yapmaya yetkiniz yok.');
          }
          throw new Error('Kullanıcı silinirken bir hata oluştu.');
        }

        setUsers(users.filter(u => u._id !== userId)); // Başarılıysa listeden kaldır
        alert('Kullanıcı başarıyla silindi!');
      } catch (err) {
        console.error('Kullanıcı silme hatası:', err);
        setError(err.message || 'Kullanıcı silinirken bir sorun oluştu.');
        alert(`Hata: ${err.message || 'Kullanıcı silinemedi.'}`);
      }
    }
  };

  // Modal kapatıldığında
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentUser(null);
  };

  // Kullanıcı rolü güncelleme sonrası başarılı olduğunda listeyi güncelle
  const handleUserSaveSuccess = () => {
    fetchUsers(); // Kullanıcı listesini yeniden çek
    handleCloseModal(); // Modalı kapat
  };

  if (loading) {
    return (
      <div className="admin-users-page">
        <div className="loading-message">Kullanıcılar yükleniyor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-users-page">
        <div className="error-message">
          <p>{error}</p>
          {user?.role === 'admin' && (
             <button onClick={fetchUsers} className="action-button primary">Tekrar Dene</button>
          )}
        </div>
      </div>
    );
  }

  // Kullanıcı admin değilse veya kimlik doğrulanmamışsa, yönlendirme zaten yapıldı
  if (!isAuthenticated || user?.role !== 'admin') {
      return null;
  }

  return (
    <div className="admin-users-page">
      <div className="admin-users-header">
        <h2>Kullanıcı Yönetimi</h2>
        {/* Yeni kullanıcı ekleme butonu burada yer almayabilir, kayıt sayfası yeterli olabilir */}
      </div>

      {users.length > 0 ? (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Ad</th>
                <th>E-posta</th>
                <th>Rol</th>
                <th>Oluşturulma Tarihi</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td>{u._id}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`user-role-${u.role}`}>{u.role.toUpperCase()}</span>
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="action-buttons">
                    <button onClick={() => handleEditUserRole(u)} className="action-button edit-btn">Rolü Düzenle</button>
                    {/* Kendi kendini silme butonu pasif hale getirilebilir veya gizlenebilir */}
                    <button
                      onClick={() => handleDeleteUser(u._id)}
                      className="action-button delete-btn"
                      disabled={u._id === user?._id} // Kendi kendini silmeyi engelle
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="no-users-message">Sistemde yönetilecek kullanıcı bulunmuyor.</p>
      )}

      {isModalOpen && (
        <UserRoleModal
          user={currentUser}
          onClose={handleCloseModal}
          onSaveSuccess={handleUserSaveSuccess}
        />
      )}
    </div>
  );
};

export default AdminUsersPage;