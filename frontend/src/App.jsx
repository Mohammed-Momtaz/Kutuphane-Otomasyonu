import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Sayfa bileşenlerini oluşturacağımız klasör:
// Şimdi HomePage'i oluşturacağız, diğerleri de buraya gelecek.
import HomePage from './pages/HomePage'; // Yeni oluşturacağımız Home sayfası
import Layout from './components/layout/Layout'; // Layout bileşenini içe aktarıyoruz
import RegisterPage from './pages/RegisterPage'; // RegisterPage'i import ediyoruz
import OTPVerifyPage from './pages/OTPVerifyPage'; // OTPVerifyPage'i import ediyoruz
import LoginPage from './pages/LoginPage'; // LoginPage'i import ediyoruz
import DashboardPage from './pages/DashboardPage'; // DashboardPage'i import ediyoruz
import BooksPage from './pages/BooksPage'; //  BooksPage'i import ediyoruz
import BookDetailPage from './pages/BookDetailPage'; // BookDetailPage'i import ediyoruz
import AdminUsersPage from './pages/AdminUsersPage'; // AdminUsersPage'i import ediyoruz
import AdminLoansPage from './pages/AdminLoansPage'; // AdminLoansPage'i import ediyoruz
import MyLoansPage from './pages/MyLoansPage'; // MyLoansPage'i import ediyoruz
import AdminBooksPage from './pages/AdminBooksPage'; // AdminBooksPage'i import ediyoruz

function App() {
  return (
    <Router>
      <Layout>
        <Routes> {/* Rotaları tanımlamak için Routes kullan */}
          <Route path="/" element={<HomePage />} /> {/* Ana sayfa rotası */}
          <Route path="/register" element={<RegisterPage />} /> {/* RegisterPage rotasını ekliyoruz */}
          <Route path="/verify-otp" element={<OTPVerifyPage />} /> {/*  OTPVerifyPage rotasını ekliyoruz */}
          <Route path="/login" element={<LoginPage />} /> {/* LoginPage rotasını ekliyoruz */}
          <Route path="/dashboard" element={<DashboardPage />} /> {/* DashboardPage rotasını ekliyoruz */}
          {/* Şifremi unuttum sayfası için rota (henüz oluşturmadık) */}
          {/* <Route path="/forgot-password" element={<ForgotPasswordPage />} /> */}
          <Route path="/books" element={<BooksPage />} /> {/* Yeni: BooksPage rotasını ekliyoruz */}
          <Route path="/books/:id" element={<BookDetailPage />} /> {/* Kitap detay sayfası rotası. :id dinamik bir parametredir. */}
          <Route path="/my-loans" element={<MyLoansPage />} /> {/* Yeni: Kullanıcının emanetleri rotası */}
          <Route path="/admin/books" element={<AdminBooksPage />} /> {/* Kitap yönetimi rotası */}
          <Route path="/admin/users" element={<AdminUsersPage />} /> {/* Kullanıcı yönetimi rotası */}
          <Route path="/admin/loans" element={<AdminLoansPage />} /> {/* Emanet yönetimi rotası */}
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;