// src/components/layout/Layout.jsx

import React from 'react';
// Adım 1: Header bileşenini içe aktarıyoruz
import Header from './Header'; // Aynı klasörde olduğu için './Header' kullanıyoruz
import Footer from './Footer'; //  Footer'ı import ediyoruz

const Layout = ({ children }) => {
  return (
    <div className="app-container">
      {/* Adım 2: Header bileşenini kullanıyoruz */}
      <Header /> 

      <main className="main-content">
        {children} {/* Sayfa içeriği buraya gelecek */}
      </main>

      <Footer /> {/* **Yeni: Footer bileşenini buraya ekliyoruz** */}
    </div>
  );
};

export default Layout;