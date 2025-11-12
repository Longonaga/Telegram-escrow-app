import React, { useEffect, useState } from 'react';
import apiClient from '../services/apiClient';
import ProductCard from './ProductCard';
import FloatingNotifyButton from './FloatingNotifyButton';

export default function ProductGrid(){
  const [products, setProducts] = useState([]);
  useEffect(() => { fetchProducts(); }, []);
  async function fetchProducts(){
    try{ const r = await apiClient.get('/api/products'); setProducts(r.products || []); }
    catch(e){ console.error(e); }
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {products.map(p => <ProductCard key={p._id} product={p} />)}
      </div>
      <FloatingNotifyButton />
    </div>
  );
}
