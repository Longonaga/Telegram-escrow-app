const axios = require('axios');

const FALLBACK = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta',
  'Ebonyi','Edo','Ekiti','Enugu','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi',
  'Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara','FCT'
];

async function getStates() {
  try {
    // Example public API — replace with a real one or keep fallback
    const resp = await axios.get('https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/states.json', { timeout: 5000 });
    // attempt to extract Nigerian states — file contains many countries; fallback if anything unexpected
    const arr = resp.data.filter(s => String(s.country_code).toUpperCase() === 'NG').map(s => s.name);
    if (arr && arr.length) return arr;
    return FALLBACK;
  } catch (e) {
    return FALLBACK;
  }
}

module.exports = { getStates };
