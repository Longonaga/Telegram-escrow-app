module.exports = {
  validateText: (text, min=2, max=100) => text && text.length >= min && text.length <= max,
  validatePrice: (price) => !isNaN(price) && price > 0,
  validateImages: (images) => Array.isArray(images) && images.length > 0 && images.length <= 5
};
