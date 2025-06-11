import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const MyLoansPage = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [myLoans, setMyLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null); // Başarı mesajları için

  // Kimlik doğrulama kontrolü
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { message: 'Emanetlerinizi görmek için giriş yapmalısınız.' } });
      return;
    }
    // Adminler bu sayfayı kullanmaz, kendi dashboard'larında farklı bir emanet yönetimi var
    if (user?.role === 'admin') {
      navigate('/dashboard', { state: { message: 'Adminler için emanet yönetimi farklı bir bölümdedir.' } });
      return;
    }
    fetchMyLoans(); // Normal kullanıcı ise emanetlerini çek
  }, [isAuthenticated, user, navigate]);

  // Kullanıcının kendi emanetlerini API'den çekme fonksiyonu
  const fetchMyLoans = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:4000/api/v1/me/borrowed-books', { // Backend'deki user loans endpoint'i
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Emanetlerinizi görüntüleme yetkiniz yok. Lütfen tekrar giriş yapın.');
        }
        throw new Error('Emanetleriniz yüklenirken bir hata oluştu.');
      }
      const data = await response.json();
      setMyLoans(data.borrowedBooks || []); // Backend'den gelen loans objesini set ediyoruz
    } catch (err) {
      console.error('Kullanıcı emanetleri çekme hatası:', err);
      setError(err.message || 'Emanetleriniz yüklenirken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Kitap iade etme işlemi
  const handleReturnBook = async (borrowingId) => {
    if (window.confirm('Bu kitabı iade etmek istediğinizden emin misiniz?')) {
      try {
        setLoading(true); // Yükleme durumuna geç
        setError(null);
        setMessage(null);
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:4000/api/v1/book/return', { // Belirttiğiniz endpoint
          method: 'POST', // POST isteği
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ borrowingId: borrowingId }), // borrowingId'yi body olarak gönder
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error('Bu işlemi yapmaya yetkiniz yok. Lütfen tekrar giriş yapın.');
          }
          throw new Error(data.message || 'Kitap iade edilirken bir hata oluştu.');
        }

        setMessage(data.message || 'Kitap başarıyla iade edildi!');
        // İade başarılıysa listeyi güncelle: İade edilen emaneti "returned" olarak işaretle
        setMyLoans(prevLoans =>
          prevLoans.map(borrowedBooks =>
            borrowedBooks._id === borrowingId ? { ...borrowedBooks, status: 'returned', actualReturnDate: new Date().toISOString() } : borrowedBooks
          )
        );
      } catch (err) {
        console.error('Kitap iade hatası:', err);
        setError(err.message || 'Kitap iade edilirken bir sorun oluştu.');
      } finally {
        setLoading(false); // Yükleme durumundan çık
      }
    }
  };


  if (loading) {
    return (
      <div className="my-loans-page">
        <div className="loading-message">Emanetleriniz yükleniyor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-loans-page">
        <div className="error-message">
          <p>{error}</p>
          {isAuthenticated && ( // Sadece giriş yapmışsa tekrar dene butonu göster
             <button onClick={fetchMyLoans} className="action-button primary">Tekrar Dene</button>
          )}
        </div>
      </div>
    );
  }

  // Kullanıcı admin ise veya kimlik doğrulanmamışsa, yönlendirme zaten yapıldı
  if (!isAuthenticated || user?.role === 'admin') {
      return null;
  }

  return (
    <div className="my-loans-page">
      <div className="my-loans-header">
        <h2>Emanetlerim</h2>
      </div>

      {message && <p className="form-message success-message">{message}</p>}

      {myLoans.length > 0 ? (
        <div className="my-loans-table-container">
          <table className="my-loans-table">
            <thead>
              <tr>
                <th>Kitap Adı</th>
                <th>Emanet Tarihi</th>
                <th>Beklenen İade Tarihi</th>
                <th>İade Tarihi</th>
                <th>Durum</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {myLoans.map(borrowedBooks => (
                <tr key={borrowedBooks._id}>
                  <td>{borrowedBooks.book?.title || 'Kitap Bilgisi Yok'}</td> {/* bookId populate edilmiş olmalı */}
                  <td>{new Date(borrowedBooks.borrowDate).toLocaleDateString()}</td>
                  <td>{new Date(borrowedBooks.returnDate).toLocaleDateString()}</td>
                  <td>{borrowedBooks.actualReturnDate ? new Date(borrowedBooks.actualReturnDate).toLocaleDateString() : 'Bekleniyor'}</td>
                  <td>
                    <span className={`loan-status-${borrowedBooks.status}`}>
                      {borrowedBooks.status === 'borrowed' ? 'Ödünç Verildi' : 'İade Edildi'}
                    </span>
                  </td>
                  <td className="action-buttons">
                    {borrowedBooks.status === 'borrowed' && (
                      <button onClick={() => handleReturnBook(borrowedBooks._id)} className="action-button return-btn">İade Et</button>
                    )}
                    {borrowedBooks.status === 'returned' && (
                      <button className="action-button returned-btn">İade Et</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="no-loans-message">Henüz ödünç aldığınız bir kitap bulunmuyor.</p>
      )}
    </div>
  );
};

export default MyLoansPage;