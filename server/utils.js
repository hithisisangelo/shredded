const crypto = require('crypto');

function generateId() {
  return crypto.randomBytes(12).toString('base64url');
}

function toDateString(date) {
  if (!date) date = new Date();
  return date.toISOString().split('T')[0];
}

module.exports = { generateId, toDateString };
