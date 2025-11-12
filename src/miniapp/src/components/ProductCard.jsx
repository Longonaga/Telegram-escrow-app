import React from 'react';

export default function ProductCard({ product }){
  function openChat(){
    // send message to bot via Telegram Web App
    if (window.TelegramWebApp && window.TelegramWebApp.openTelegram) {
      // Some Telegram environments provide methods — fallback: Post message to bot via WebApp
    }
    // fallback: open a deep link to chat with seller (tg://user?id=... not supported widely). Instead, call the WebApp to send a callback to the bot.
    window.TelegramWebApp?.sendData(JSON.stringify({ action: 'select_product', productId: product._id }));
  }

  const img = product.images && product.images.length ? (product.images[0].url || product.images[0].file_id) : '';
  return (
    <div style={{ border: '1px solid #eee', padding: 12, borderRadius: 8, background: '#fff' }}>
      <div style={{ height: 140, background: '#f7f7f7', borderRadius: 6, marginBottom: 8 }}>
        {img ? <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }} alt=""/> : null}
      </div>
      <h3 style={{ margin: '4px 0' }}>{product.title}</h3>
      <p style={{ color: '#444', fontSize: 13 }}>{product.description.slice(0,100)}...</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <strong>₦{product.price}</strong>
        <button onClick={openChat}>Chat & Negotiate</button>
      </div>
    </div>
  );
}
