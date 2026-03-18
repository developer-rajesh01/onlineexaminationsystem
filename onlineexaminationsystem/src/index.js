import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import "./responsive.css";
import App from './App';
import reportWebVitals from './reportWebVitals';
import "./utils/fetchInterceptor";

import { BrowserRouter } from "react-router-dom";

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
    <BrowserRouter basename="/onlineexaminationsystem">
      <App />
    </BrowserRouter>
);

reportWebVitals();