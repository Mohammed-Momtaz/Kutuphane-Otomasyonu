import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import LoanFormModal from '../components/LoanFormModal'; // Emanet verme modalını import ediyoruz

const AdminLoansPage = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal durumu
  // eslint-disable-next-line no-unused-vars
  const [currentLoan, setCurrentLoan] = useState(null); // Düzenlenecek emanet (opsiyonel: iade için)

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
    fetchLoans(); // Admin ise emanetleri çek
  }, [isAuthenticated, user, navigate]);

  // Emanetleri API'den çekme fonksiyonu
  const fetchLoans = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/v1/admin/borrowings', { // Backend'deki admin loans endpoint'i
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Bu işlemi yapmaya yetkiniz yok. Lütfen tekrar giriş yapın.');
        }
        throw new Error('Emanetler yüklenirken bir hata oluştu.');
      }
      const data = await response.json();
      setLoans(data.borrowings || []); // Backend'den gelen loans objesini set ediyoruz
    } catch (err) {
      console.error('Emanet çekme hatası:', err);
      setError(err.message || 'Emanetler yüklenirken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Yeni emanet verme işlemi (Modal'ı açar)
  const handleGiveLoan = () => {
    setCurrentLoan(null); // Yeni kayıt için currentLoan'ı temizle
    setIsModalOpen(true);
  };

  // Emanet iade alma işlemi
  const handleReturnLoan = async (loanId) => {
    if (window.confirm('Bu kitabı iade edildi olarak işaretlemek istediğinizden emin misiniz?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:4000/api/v1/admin/book/return`, { // Backend'deki iade endpoint'i
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({borrowingId : loanId}),
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error('Bu işlemi yapmaya yetkiniz yok.');
          }
          throw new Error('Emanet iade edilirken bir hata oluştu.');
        }

        // Listeyi güncelle: İade edilen emaneti "Returned" olarak işaretle
        setLoans(prevLoans =>
          prevLoans.map(loan =>
            loan._id === loanId ? { ...loan, status: 'returned', returnedAt: new Date().toISOString() } : loan
          )
        );
        alert('Kitap başarıyla iade edildi!');
      } catch (err) {
        console.error('Emanet iade hatası:', err);
        setError(err.message || 'Kitap iade edilirken bir sorun oluştu.');
        alert(`Hata: ${err.message || 'Kitap iade edilemedi.'}`);
      }
    }
  };

  // Emanet Silme İşlemi**
  const handleDeleteLoan = async (loanId) => {
    if (window.confirm('Bu emanet kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        // Backend'deki emanet silme endpoint'i
        // Genellikle bir DELETE isteği ve /api/v1/admin/loans/:id şeklinde olur
        const response = await fetch(`http://localhost:4000/api/v1/admin/borrowing/${loanId}`, {
          method: 'DELETE', // DELETE isteği
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error('Bu işlemi yapmaya yetkiniz yok.');
          }
          throw new Error('Emanet silinirken bir hata oluştu.');
        }

        setLoans(loans.filter(loan => loan._id !== loanId)); // Başarılıysa listeden kaldır
        alert('Emanet kaydı başarıyla silindi!');
      } catch (err) {
        console.error('Emanet silme hatası:', err);
        setError(err.message || 'Emanet silinirken bir sorun oluştu.');
        alert(`Hata: ${err.message || 'Emanet silinemedi.'}`);
      } finally {
        setLoading(false);
      }
    }
  };

  // Modal kapatıldığında
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentLoan(null);
  };

  // Emanet verme/iade sonrası başarılı olduğunda listeyi güncelle
  const handleLoanSaveSuccess = () => {
    fetchLoans(); // Emanet listesini yeniden çek
    handleCloseModal(); // Modalı kapat
  };

  if (loading) {
    return (
      <div className="admin-loans-page">
        <div className="loading-message">Emanetler yükleniyor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-loans-page">
        <div className="error-message">
          <p>{error}</p>
          {user?.role === 'admin' && (
             <button onClick={fetchLoans} className="action-button primary">Tekrar Dene</button>
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
    <div className="admin-loans-page">
      <div className="admin-loans-header">
        <h2>Emanet Yönetimi</h2>
        <button onClick={handleGiveLoan} className="add-new-loan-btn">Yeni Emanet Oluştur</button>
      </div>

      {loans.length > 0 ? (
        <div className="loans-table-container">
          <table className="loans-table">
            <thead>
              <tr>
                <th>Emanet ID</th>
                <th>Kitap Adı</th>
                <th>Ödünç Alan</th>
                <th>Emanet Tarihi</th>
                <th>Beklenen İade Tarihi</th>
                <th>İade Tarihi</th>
                <th>Durum</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {loans.map(loan => (
                <tr key={loan._id}>
                  <td>{loan._id}</td>
                  <td>{loan.book?.title || 'Kitap Bilgisi Yok'}</td>
                  <td>{loan.user?.name || 'Kullanıcı Bilgisi Yok'}</td>
                  <td>{new Date(loan.borrowDate).toLocaleDateString()}</td>
                  <td>{new Date(loan.returnDate).toLocaleDateString()}</td> {/* **Veriyi gösteriyoruz** */}
                  <td>{loan.actualReturnDate ? new Date(loan.actualReturnDate).toLocaleDateString() : 'Bekleniyor'}</td>
                  <td>
                    <span className={`loan-status-${loan.status}`}>
                      {loan.status === 'borrowed' ? 'Ödünç Verildi' : 'İade Edildi'}
                    </span>
                  </td>
                  <td className="action-buttons">
                    {loan.status === 'borrowed' && (
                      <button onClick={() => handleReturnLoan(loan._id)} className="action-button return-btn">İade Al</button>
                    )}
                    <button onClick={() => handleDeleteLoan(loan._id)} className="action-button delete-btn">Sil</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="no-loans-message">Yönetilecek emanet bulunmuyor.</p>
      )}

      {isModalOpen && (
        <LoanFormModal
          onClose={handleCloseModal}
          onSaveSuccess={handleLoanSaveSuccess}
        />
      )}
    </div>
  );
};

export default AdminLoansPage;