import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ColorManagement } from 'three';
import App from './App';
import { initSentry } from './services/sentry';

// Correct sRGB↔linear handling for the 3D scenes (lerps build THREE.Color from sRGB hex).
ColorManagement.enabled = true;

initSentry();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
