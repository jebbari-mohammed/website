import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import StoreDownloadButton from './components/StoreDownloadButton.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <StoreDownloadButton />
  </StrictMode>,
)
