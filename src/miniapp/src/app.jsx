import React from 'react';
import { createRoot } from 'react-dom/client';
import ProductGrid from './components/ProductGrid';

const App = () => {
  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', padding: 20 }}>
      <h1>escrowaNG — Marketplace</h1>
      <ProductGrid/>
    </div>
  );
};

createRoot(document.getElementById('root')).render(<App />);
