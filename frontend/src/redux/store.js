import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice'; // authSlice'ı sonra oluşturacağız

const store = configureStore({
  reducer: {
    auth: authReducer, // authReducer'ı burada tanımlıyoruz
    // Diğer reducer'lar buraya eklenecek
  },
  // Middleware'ler ve geliştirici araçları varsayılan olarak gelir
  // devTools: process.env.NODE_ENV !== 'production', // Üretimde devTools'u kapatmak için
});

export default store;