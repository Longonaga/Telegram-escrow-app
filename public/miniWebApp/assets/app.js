(async function(){
  const container = document.getElementById('products');
  container.innerText = 'Loading...';
  try {
    const res = await fetch('/api/mini/products');
    const data = await res.json();
    container.innerHTML = '';
    if (!data.ok || !data.products.length) {
      container.innerHTML = '<p>No products yet.</p>';
      return;
    }
    data.products.forEach(p => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <h3>${p.title}</h3>
        <p>${p.description || ''}</p>
        <p>₦${p.price} ${p.negotiable ? '(Negotiable)' : ''}</p>
        <p>Location: ${p.state}</p>
        <a href="https://t.me/${p.sellerTelegramId}?start=product_${p._id}" target="_blank">Chat seller</a>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    container.innerText = 'Failed to load products.';
  }
})();
