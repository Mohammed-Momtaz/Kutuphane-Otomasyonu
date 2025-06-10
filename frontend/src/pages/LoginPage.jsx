import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(''); // Başarı/hata mesajları için

  const navigate = useNavigate();
  const location = useLocation(); // OTP doğrulama sayfasından gelen mesaj için

  // OTP doğrulama sayfasından gelen başarı mesajını göster
  useEffect(() => {
    if (location.state && location.state.successMessage) {
      setMessage(location.state.successMessage);
      // Mesajı gösterdikten sonra URL state'ini temizleyebiliriz
      // Ancak bu, sayfayı yenilediğinde mesajın kaybolmasına neden olur.
      // Geçici çözüm olarak, mesajı göstermeye devam edebiliriz.
      // Eğer tek seferlik göstermek isterseniz: navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]); // location.state değiştiğinde tetikle

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    let newErrors = {};
    if (!formData.email) {
      newErrors.email = 'E-posta gerekli.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi girin.';
    }
    if (!formData.password) {
      newErrors.password = 'Şifre gerekli.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); // Önceki mesajı temizle
    setErrors({}); // Önceki hataları temizle

    if (!validateForm()) {
      setMessage('Lütfen formdaki hataları düzeltin.');
      return;
    }

    try {
      // Burası, backend'e giriş isteği göndereceğimiz yer
      // Backend API URL'ini buraya girin (örneğin: 'http://localhost:4000/api/v1/auth/login')
      const response = await fetch('http://localhost:4000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Giriş başarılı!');
        // TODO: Backend'den gelen token'ı (JWT) kaydet
        // Örneğin: localStorage.setItem('token', data.token);
        // TODO: Redux/Context API ile kullanıcı durumunu güncelle
        // Örneğin: dispatch(loginSuccess(data.user, data.token));

        // Başarılı girişten sonra Home sayfasına veya Dashboard'a yönlendir
        setTimeout(() => {
          navigate('/'); // Ana sayfaya yönlendir
        }, 1500); // 1.5 saniye sonra yönlendir
      } else {
        setMessage(data.message || 'Giriş sırasında bir hata oluştu.');
        setErrors(data.errors || {}); // Backend'den gelen hataları göster
      }
    } catch (error) {
      console.error('Giriş isteği hatası:', error);
      setMessage('Sunucuya bağlanılamadı. Lütfen tekrar deneyin.');
    }
  };

  return (
    <div className="login-page">
      <div className="form-container">
        <h2>Giriş Yap</h2>
        {message && (
          <p className={`form-message ${message.includes('hata') || message.includes('bağlanılamadı') ? 'error-message' : 'success-message'}`}>
            {message}
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">E-posta</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'input-error' : ''}
            />
            {errors.email && <p className="error-text">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Şifre</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'input-error' : ''}
            />
            {errors.password && <p className="error-text">{errors.password}</p>}
          </div>

          <button type="submit" className="submit-btn">Giriş Yap</button>
        </form>
        <p className="forgot-password-link-text">
          <Link to="/forgot-password" className="login-link">Şifremi Unuttum?</Link>
        </p>
        <p className="register-link-text">
          Hesabın yok mu? <Link to="/register" className="register-link">Kayıt Ol</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;