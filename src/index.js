import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import './styles/index.css';
import './styles/components/common.css';
import './styles/components/Calendar.css';
import './styles/components/ContactList.css';
import './styles/components/ContactForm.css';
import './styles/components/Settings.css';
import './i18n';

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
);

if (process.env.NODE_ENV === 'production') {
  console.log = () => {};
  console.error = () => {};
  console.debug = () => {};
}

window.addEventListener('error', function(e) {
  if (process.env.NODE_ENV === 'production') {
    // You can add error reporting service here
    console.error('Global error:', e);
  }
}); 