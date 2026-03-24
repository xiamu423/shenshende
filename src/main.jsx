import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { MockProvider } from './contexts/MockData.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MockProvider>
      <App />
    </MockProvider>
  </StrictMode>,
);
