import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/global.css'

// Redux
import { Provider } from 'react-redux'; // Provider'ı import ettik
import store from './redux/store';     // Oluşturduğumuz store'u import ettik

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}> {/* Uygulamayı Provider ile sarmalıyoruz */}
      <App />
    </Provider>
  </StrictMode>,
)
