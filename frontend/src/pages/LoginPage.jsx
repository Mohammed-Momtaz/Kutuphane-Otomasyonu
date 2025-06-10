import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux'; // Redux hook'larını import ettik
import { loginStart, loginSuccess, loginFailure } from '../redux/slices/authSlice'; // authSlice'tan action'ları import ettik

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(''); // Başarı/hata mesajları için

  const navigate = useNavigate();
  const location = useLocation(); // OTP doğrulama sayfasından gelen mesaj için

  // Redux hook'ları
  const dispatch = useDispatch(); // Action'ları göndermek için
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth); // Auth state'ini seçmek için

  // OTP doğrulama sayfasından gelen başarı mesajını göster
  useEffect(() => {
    if (location.state && location.state.successMessage) {
      setMessage(location.state.successMessage);
    }
  }, [location.state]); // location.state değiştiğinde tetikle
  
  // Kullanıcı zaten giriş yapmışsa ana sayfaya yönlendir
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]); // isAuthenticated veya navigate değiştiğinde kontrol et

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

    // Giriş işlemi başladığında Redux state'ini güncelle
    dispatch(loginStart());

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
        // Giriş başarılı olduğunda Redux state'ini güncelle
        dispatch(loginSuccess({ user: data.user, token: data.token })); // Backend'den gelen user ve token'ı payload olarak gönder
        setMessage(data.message || 'Giriş başarılı!');
        // Yönlendirme useEffect içinde isAuthenticated değiştiğinde yapılacak

        // Başarılı girişten sonra Home sayfasına veya Dashboard'a yönlendir
        setTimeout(() => {
          navigate('/'); // Ana sayfaya yönlendir
        }, 1500); // 1.5 saniye sonra yönlendir
      } else {
        // Giriş başarısız olduğunda Redux state'ini güncelle
        dispatch(loginFailure(data.message || 'Giriş başarısız oldu. Lütfen e-posta ve şifrenizi kontrol edin.'));
        setMessage(data.message || 'Giriş sırasında bir hata oluştu.');

        setErrors(data.errors || {}); // Backend'den gelen hataları göster
      }
    } catch (error) {
      console.error('Giriş isteği hatası:', error);
      // Sunucuya bağlanılamadığında Redux state'ini güncelle
      dispatch(loginFailure('Sunucuya bağlanılamadı. Lütfen tekrar deneyin.'));
      setMessage('Sunucuya bağlanılamadı. Lütfen tekrar deneyin.');
    }
  };

  return (
    <div className="login-page">
      <div className="form-container">
        <h2>Giriş Yap</h2>
        {message && (
          <p className={`form-message ${message.includes('hata') || message.includes('bağlanılamadı') ? 'error-message' : 'success-message'}`}>
            {message || error} {/* Hata mesajını Redux state'inden de alabiliriz */}
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

          <button type="submit" className="submit-btn" disabled={loading}> {/* Yüklenirken butonu devre dışı bırak */}
            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </button>
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