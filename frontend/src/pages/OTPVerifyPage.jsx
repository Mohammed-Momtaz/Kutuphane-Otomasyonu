import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom'; // useLocation'ı ekledik

const OTPVerifyPage = () => {
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(''); // Yönlendirmeden gelen e-posta
  const navigate = useNavigate();
  const location = useLocation(); // Yönlendirmeden gelen state'i almak için

  // Register sayfasından gelen e-posta ve mesajı al
  useEffect(() => {
    if (location.state && location.state.email) {
      setEmail(location.state.email);
      setMessage(location.state.message || 'E-posta adresinize bir doğrulama kodu gönderildi. Lütfen girin.');
    } else {
      // Eğer doğrudan bu sayfaya gelindiyse (state olmadan),
      // belki bir hata mesajı gösterilebilir veya login'e yönlendirilebilir.
      setMessage('Doğrulama kodu için e-posta adresi bulunamadı. Lütfen tekrar kayıt olun.');
      // İsteğe bağlı: navigate('/register');
    }
  }, [location.state]); // location.state değiştiğinde tetikle

  const handleOtpChange = (e) => {
    setOtp(e.target.value);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!otp) {
      setMessage('Lütfen doğrulama kodunu girin.');
      return;
    }

    try {
      // Backend API URL'ini buraya girin (örneğin: 'http://localhost:4000/api/v1/auth/verify-otp')
      const response = await fetch('http://localhost:4000/api/v1/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }), // E-posta ve OTP kodunu gönderiyoruz
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'E-posta doğrulandı! Şimdi giriş yapabilirsiniz.');
        // Başarılı doğrulamadan sonra login sayfasına yönlendir
        setTimeout(() => {
          navigate('/login', { state: { successMessage: 'Hesabınız başarıyla doğrulandı. Giriş yapabilirsiniz.' } });
        }, 1500); // 1.5 saniye sonra yönlendir
      } else {
        setMessage(data.message || 'Kod doğrulanamadı. Lütfen tekrar deneyin.');
      }
    } catch (error) {
      console.error('OTP doğrulama isteği hatası:', error);
      setMessage('Sunucuya bağlanılamadı. Lütfen tekrar deneyin.');
    }
  };

  // OTP kodunu tekrar gönderme fonksiyonu (opsiyonel)
  const handleResendOtp = async () => {
    setMessage('');
    try {
      // Backend API URL'ini buraya girin (örneğin: 'http://localhost:4000/api/v1/resend-otp')
      const response = await fetch('http://localhost:4000/api/v1/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }), // Hangi e-postaya tekrar kod gönderileceğini belirt
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Yeni doğrulama kodu e-posta adresinize gönderildi.');
      } else {
        setMessage(data.message || 'Kod tekrar gönderilemedi.');
      }
    } catch (error) {
      console.error('OTP tekrar gönderme hatası:', error);
      setMessage('Sunucuya bağlanılamadı. Lütfen tekrar deneyin.');
    }
  };


  return (
    <div className="otp-verify-page">
      <div className="form-container"> {/* Aynı form container stilini kullanıyoruz */}
        <h2>E-posta Doğrulama</h2>
        {message && (
          <p className={`form-message ${message.includes('hata') || message.includes('bağlanılamadı') || message.includes('doğrulanamadı') ? 'error-message' : 'success-message'}`}>
            {message}
          </p>
        )}
        {email ? (
          <>
            <p className="verification-info-text">
              **{email}** adresine gönderilen 6 haneli doğrulama kodunu girin.
            </p>
            <form onSubmit={handleVerifyOtp}>
              <div className="form-group">
                <label htmlFor="otp">Doğrulama Kodu</label>
                <input
                  type="text" // OTP genellikle sayıdır, ama text olarak da alıp backend'de kontrol edebiliriz
                  id="otp"
                  name="otp"
                  value={otp}
                  onChange={handleOtpChange}
                  maxLength="6" // Genellikle 6 haneli olur
                  className="text-center" // Kodu ortalamak için stil
                />
                {/* Hata gösterimi (isteğe bağlı, şimdilik sadece genel mesaj var) */}
              </div>

              <button type="submit" className="submit-btn">Kodu Doğrula</button>
            </form>
            <p className="resend-otp-text">
              Kodu almadınız mı? <Link to="#" onClick={handleResendOtp} className="login-link">Tekrar Gönder</Link>
            </p>
          </>
        ) : (
            <p className="error-message">E-posta adresi bulunamadı. Lütfen kayıt sayfasından tekrar deneyin.</p>
        )}

        <p className="login-link-text">
          <Link to="/register" className="login-link">Kayıt Sayfasına Geri Dön</Link>
        </p>
      </div>
    </div>
  );
};

export default OTPVerifyPage;