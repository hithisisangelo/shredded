const express = require('express');
const { getDb } = require('../db');
const { generateId } = require('../utils');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  try {
    const db = getDb();
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const logs = db.prepare(
      'SELECT * FROM cardio_logs WHERE user_id = ? AND date = ? ORDER BY created_at ASC'
    ).all(req.userId, date);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cardio logs' });
  }
});

router.post('/', (req, res) => {
  try {
    const { date, activity, duration_minutes, calories_burned, notes } = req.body;
    if (!date || !activity || !duration_minutes) return res.status(400).json({ error: 'date, activity, and duration_minutes are required' });
    const db = getDb();
    const id = generateId();
    db.prepare(
      'INSERT INTO cardio_logs (id, user_id, date, activity, duration_minutes, calories_burned, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, req.userId, date, activity, duration_minutes, calories_burned || 0, notes || '');
    const log = db.prepare('SELECT * FROM cardio_logs WHERE id = ?').get(id);
    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add cardio log' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare('DELETE FROM cardio_logs WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
    if (result.changes === 0) return res.status(404).json({ error: 'Log not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete cardio log' });
  }
});

module.exports = router;
