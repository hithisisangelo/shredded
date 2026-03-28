const express = require('express');
const { getDb } = require('../db');
const { generateId } = require('../utils');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/logs', (req, res) => {
  try {
    const db = getDb();
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const logs = db.prepare('SELECT * FROM food_logs WHERE user_id = ? AND date = ? ORDER BY created_at ASC').all(req.userId, date);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch nutrition logs' });
  }
});

router.post('/logs', (req, res) => {
  try {
    const { date, meal, food_name, calories, protein, carbs, fat, fiber, serving_size, serving_unit, quantity, barcode } = req.body;
    if (!date || !meal || !food_name) return res.status(400).json({ error: 'date, meal, and food_name are required' });
    const db = getDb();
    const id = generateId();
    db.prepare(
      'INSERT INTO food_logs (id, user_id, date, meal, food_name, calories, protein, carbs, fat, fiber, serving_size, serving_unit, quantity, barcode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, req.userId, date, meal, food_name, calories || 0, protein || 0, carbs || 0, fat || 0, fiber || 0, serving_size || 100, serving_unit || 'g', quantity || 1, barcode || null);
    const log = db.prepare('SELECT * FROM food_logs WHERE id = ?').get(id);
    res.status(201).json(log);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add food log' });
  }
});

router.put('/logs/:id', (req, res) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM food_logs WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!existing) return res.status(404).json({ error: 'Log not found' });
    const { quantity, serving_size, calories, protein, carbs, fat } = req.body;
    db.prepare(
      'UPDATE food_logs SET quantity=?, serving_size=?, calories=?, protein=?, carbs=?, fat=? WHERE id=?'
    ).run(
      quantity !== undefined ? quantity : existing.quantity,
      serving_size !== undefined ? serving_size : existing.serving_size,
      calories !== undefined ? calories : existing.calories,
      protein !== undefined ? protein : existing.protein,
      carbs !== undefined ? carbs : existing.carbs,
      fat !== undefined ? fat : existing.fat,
      req.params.id
    );
    const log = db.prepare('SELECT * FROM food_logs WHERE id = ?').get(req.params.id);
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update food log' });
  }
});

router.delete('/logs/:id', (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare('DELETE FROM food_logs WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
    if (result.changes === 0) return res.status(404).json({ error: 'Log not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete food log' });
  }
});

router.get('/summary', (req, res) => {
  try {
    const db = getDb();
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const row = db.prepare(
      'SELECT COALESCE(SUM(calories * quantity), 0) as calories, COALESCE(SUM(protein * quantity), 0) as protein, COALESCE(SUM(carbs * quantity), 0) as carbs, COALESCE(SUM(fat * quantity), 0) as fat, COALESCE(SUM(fiber * quantity), 0) as fiber FROM food_logs WHERE user_id = ? AND date = ?'
    ).get(req.userId, date);
    res.json({ date, ...row });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch nutrition summary' });
  }
});

router.get('/history', (req, res) => {
  try {
    const db = getDb();
    const days = parseInt(req.query.days) || 30;
    const rows = db.prepare(
      `SELECT date, COALESCE(SUM(calories * quantity), 0) as calories, COALESCE(SUM(protein * quantity), 0) as protein, COALESCE(SUM(carbs * quantity), 0) as carbs, COALESCE(SUM(fat * quantity), 0) as fat FROM food_logs WHERE user_id = ? AND date >= date('now', '-' || ? || ' days') GROUP BY date ORDER BY date ASC`
    ).all(req.userId, days);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch nutrition history' });
  }
});

module.exports = router;
