import { createSlice } from '@reduxjs/toolkit';

// Başlangıç durumu (initial state)
const initialState = {
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: localStorage.getItem('token') ? true : false,
  loading: false, // API istekleri için yüklenme durumu
  error: null,    // Hata mesajları için
};

const authSlice = createSlice({
  name: 'auth', // Bu dilimin adı. Eylem türlerinde 'auth/loginSuccess' gibi kullanılacak.
  initialState,
  reducers: {
    // Reducer fonksiyonları, doğrudan state'i değiştirebilir gibi görünür
    // ancak Redux Toolkit, Immer kütüphanesini kullanarak arka planda immutability'yi sağlar.
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      // Token ve kullanıcı bilgilerini localStorage'a kaydet
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      // Hata durumunda localStorage'ı temizle
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = null;
      state.loading = false;
      // Çıkış yapıldığında localStorage'ı temizle
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    // Kullanıcı bilgisini güncellemek için (örneğin profil güncellemesi)
    updateUser: (state, action) => {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('user', JSON.stringify(state.user));
    }
  },
});

// Eylem yaratıcıları otomatik olarak oluşturulur ve export edilir
export const { loginStart, loginSuccess, loginFailure, logout, updateUser } = authSlice.actions;

// Selector: Kullanıcının rolünü kolayca almak için
export const selectUserRole = (state) => state.auth.user?.role; // user varsa role'ünü döndür, yoksa undefined

// Reducer'ı export ediyoruz
export default authSlice.reducer;