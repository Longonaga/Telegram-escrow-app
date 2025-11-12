exports.validateTitle = (title) => typeof title === 'string' && title.trim().length >= 3 && title.trim().length <= 120;
exports.validateDescription = (d) => typeof d === 'string' && d.trim().length <= 1000;
exports.validatePrice = (p) => typeof p === 'number' && p > 0 && p < 1000000000;
exports.validateState = (s) => typeof s === 'string' && s.trim().length > 0;
