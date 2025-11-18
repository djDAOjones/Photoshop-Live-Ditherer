/**
 * @file index.tsx
 * @description Main entry point for Dithering Studio UXP plugin
 */

console.log('Dithering Studio: Script loading...');

import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './styles.css';

console.log('Dithering Studio: Imports loaded');

// Render app using legacy method (UXP compatible)
const root = document.getElementById('root');
console.log('Dithering Studio: Root element', root);

if (root) {
  console.log('Dithering Studio: Rendering React app');
  ReactDOM.render(<App />, root);
  console.log('Dithering Studio: React app rendered');
} else {
  console.error('Root element not found');
}
