import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // useNavigate'ı ekledik

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({}); // Hata mesajlarını tutmak için
  const [message, setMessage] = useState(''); // Başarı/genel mesajlar için
  const navigate = useNavigate(); // useNavigate hook'unu başlattık

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    let newErrors = {};
    if (!formData.name) newErrors.name = 'İsim gerekli.';
    if (!formData.email) {
      newErrors.email = 'E-posta gerekli.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi girin.';
    }
    if (!formData.password) {
      newErrors.password = 'Şifre gerekli.';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalı.';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Şifreler uyuşmuyor.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Hata yoksa true döner
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
      // Burası, backend'e kayıt isteği göndereceğimiz yer
      // Şimdilik sadece konsola logluyoruz ve bir mesaj gösteriyoruz
      console.log('Kayıt Formu Gönderildi:', formData);

      // Backend API URL'ini buraya girin (örneğin: 'http://localhost:4000/api/v1/auth/register')
      const response = await fetch('http://localhost:4000/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password
            // confirmPassword backend'e gönderilmez, sadece frontend doğrulaması içindir
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Kayıt başarılı! Lütfen e-posta adresinize gönderilen kodu doğrulayın.');
        // Başarılı kayıttan sonra OTP doğrulama sayfasına yönlendir
        // Kullanıcının e-postasını OTP sayfasına state olarak geçirebiliriz
        navigate('/verify-otp', { state: { email: formData.email, message: data.message } });

        // Formu temizlemiyoruz, çünkü yönlendirme yapıyoruz
        // setFormData({ name: '', email: '', password: '', confirmPassword: '' });
      } else {
        setMessage(data.message || 'Kayıt sırasında bir hata oluştu.');
        setErrors(data.errors || {}); // Backend'den gelen hataları göster
      }
    } catch (error) {
      console.error('Kayıt isteği hatası:', error);
      setMessage('Sunucuya bağlanılamadı. Lütfen tekrar deneyin.');
    }
  };

  return (
    <div className="register-page">
      <div className="form-container">
        <h2>Kayıt Ol</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">İsim</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? 'input-error' : ''}
            />
            {errors.name && <p className="error-text">{errors.name}</p>}
          </div>

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

          <div className="form-group">
            <label htmlFor="confirmPassword">Şifreyi Onayla</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={errors.confirmPassword ? 'input-error' : ''}
            />
            {errors.confirmPassword && <p className="error-text">{errors.confirmPassword}</p>}
          </div>
        {message && (
            <p className={`form-message ${message.includes('hata') ? 'error-message' : 'success-message'}`}>
            {message}
            </p>
        )}
          <button type="submit" className="submit-btn">Kayıt Ol</button>
        </form>
        <p className="login-link-text">
          Zaten hesabın var mı? <Link to="/login" className="login-link">Giriş Yap</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;