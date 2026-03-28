const express = require('express');
const { getDb } = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT key, value FROM user_settings WHERE user_id = ?').all(req.userId);
    const settings = Object.fromEntries(rows.map(r => [r.key, r.value]));
    // Never send the actual API key to the client — just indicate if it's set
    if (settings.anthropic_api_key) {
      settings.anthropic_api_key = '••••••••••••••••';
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.post('/', (req, res) => {
  try {
    const db = getDb();
    const settings = req.body;
    if (!settings || typeof settings !== 'object') return res.status(400).json({ error: 'Settings object required' });

    const upsert = db.prepare(
      "INSERT INTO user_settings (user_id, key, value, updated_at) VALUES (?, ?, ?, datetime('now')) ON CONFLICT(user_id, key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at"
    );

    const upsertMany = db.transaction((entries) => {
      for (const [key, value] of entries) {
        upsert.run(req.userId, key, value !== null && value !== undefined ? String(value) : null);
      }
    });

    // Don't overwrite the API key if the masked placeholder was sent back
    const entries = Object.entries(settings).filter(([key, value]) => {
      if (key === 'anthropic_api_key' && value === '••••••••••••••••') return false;
      return true;
    });
    upsertMany(entries);

    const rows = db.prepare('SELECT key, value FROM user_settings WHERE user_id = ?').all(req.userId);
    const allSettings = Object.fromEntries(rows.map(r => [r.key, r.value]));
    // Mask the key before sending back
    if (allSettings.anthropic_api_key) {
      allSettings.anthropic_api_key = '••••••••••••••••';
    }
    res.json(allSettings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

module.exports = router;
