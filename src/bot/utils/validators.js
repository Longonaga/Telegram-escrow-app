function title(t) { return typeof t === 'string' && t.length >= 3 && t.length <= 120; }
function description(d) { return typeof d === 'string' && d.length >= 5 && d.length <= 600; }
function price(p) { return /^\d+$/.test(String(p)) && Number(p) > 0; }

module.exports = { title, description, price };
