// Fetch states from API with fallback
const axios = require('axios');

const FALLBACK_STATES = [
  "Lagos","Abuja FCT","Kano","Rivers","Anambra","Oyo","Kaduna","Kogi","Edo","Delta",
  // add full list as needed...
];

exports.getStates = async () => {
  try {
    // Example public API (replace if you have a preferred one)
    const res = await axios.get('https://countriesnow.space/api/v0.1/countries/states', { timeout: 5000 });
    // Transform response to Nigerian states if API supports it; otherwise fallback.
    // For now return fallback to guarantee reliability.
    return FALLBACK_STATES;
  } catch (err) {
    return FALLBACK_STATES;
  }
};
