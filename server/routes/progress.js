const express = require('express');
const { getDb } = require('../db');
const { generateId } = require('../utils');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/bodyweight', (req, res) => {
  try {
    const db = getDb();
    const days = parseInt(req.query.days) || 90;
    const rows = db.prepare(
      "SELECT date, weight_lbs FROM body_logs WHERE user_id = ? AND weight_lbs IS NOT NULL AND date >= date('now', '-' || ? || ' days') ORDER BY date ASC"
    ).all(req.userId, days);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bodyweight data' });
  }
});

router.post('/bodyweight', (req, res) => {
  try {
    const db = getDb();
    const { date, weight_lbs, notes } = req.body;
    const logDate = date || new Date().toISOString().split('T')[0];
    if (!weight_lbs) return res.status(400).json({ error: 'weight_lbs is required' });

    const existing = db.prepare('SELECT id FROM body_logs WHERE user_id = ? AND date = ?').get(req.userId, logDate);
    if (existing) {
      db.prepare('UPDATE body_logs SET weight_lbs = ?, notes = ? WHERE id = ?').run(weight_lbs, notes || '', existing.id);
      const row = db.prepare('SELECT * FROM body_logs WHERE id = ?').get(existing.id);
      return res.json(row);
    }
    const id = generateId();
    db.prepare('INSERT INTO body_logs (id, user_id, date, weight_lbs, notes) VALUES (?, ?, ?, ?, ?)').run(id, req.userId, logDate, weight_lbs, notes || '');
    const row = db.prepare('SELECT * FROM body_logs WHERE id = ?').get(id);
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to log bodyweight' });
  }
});

router.get('/strength', (req, res) => {
  try {
    const db = getDb();
    const exercise = req.query.exercise;
    if (!exercise) return res.status(400).json({ error: 'exercise query param required' });
    const days = parseInt(req.query.days) || 90;

    const logs = db.prepare(
      "SELECT date, exercises FROM workout_logs WHERE user_id = ? AND completed = 1 AND date >= date('now', '-' || ? || ' days') ORDER BY date ASC"
    ).all(req.userId, days);

    const strengthData = [];
    for (const log of logs) {
      const exercises = JSON.parse(log.exercises);
      const match = exercises.find(e => e.name.toLowerCase().includes(exercise.toLowerCase()));
      if (match && match.sets && match.sets.length > 0) {
        const maxWeight = Math.max(...match.sets.filter(s => s.weight).map(s => parseFloat(s.weight) || 0));
        if (maxWeight > 0) {
          strengthData.push({ date: log.date, maxWeight });
        }
      }
    }
    res.json(strengthData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch strength data' });
  }
});

router.get('/exercises', (req, res) => {
  try {
    const db = getDb();
    const logs = db.prepare('SELECT exercises FROM workout_logs WHERE user_id = ? AND completed = 1').all(req.userId);
    const exerciseSet = new Set();
    for (const log of logs) {
      const exercises = JSON.parse(log.exercises);
      exercises.forEach(e => { if (e.name) exerciseSet.add(e.name); });
    }
    res.json(Array.from(exerciseSet).sort());
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch exercises' });
  }
});

router.get('/volume', (req, res) => {
  try {
    const db = getDb();
    const weeks = parseInt(req.query.weeks) || 8;
    const logs = db.prepare(
      "SELECT date, exercises FROM workout_logs WHERE user_id = ? AND completed = 1 AND date >= date('now', '-' || ? || ' days') ORDER BY date ASC"
    ).all(req.userId, weeks * 7);

    const weeklyVolume = {};
    for (const log of logs) {
      const date = new Date(log.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeklyVolume[weekKey]) weeklyVolume[weekKey] = 0;
      const exercises = JSON.parse(log.exercises);
      for (const exercise of exercises) {
        if (exercise.sets) {
          for (const set of exercise.sets) {
            if (set.completed && set.reps && set.weight) {
              weeklyVolume[weekKey] += (parseFloat(set.reps) || 0) * (parseFloat(set.weight) || 0);
            }
          }
        }
      }
    }

    const result = Object.entries(weeklyVolume)
      .map(([week, volume]) => ({ week, volume: Math.round(volume) }))
      .sort((a, b) => a.week.localeCompare(b.week));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch volume data' });
  }
});

router.get('/measurements', (req, res) => {
  try {
    const db = getDb();
    const days = parseInt(req.query.days) || 90;
    const rows = db.prepare(
      "SELECT * FROM body_logs WHERE user_id = ? AND date >= date('now', '-' || ? || ' days') ORDER BY date DESC"
    ).all(req.userId, days);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch measurements' });
  }
});

router.post('/measurements', (req, res) => {
  try {
    const db = getDb();
    const { date, weight_lbs, chest, waist, hips, arms, legs, notes } = req.body;
    const logDate = date || new Date().toISOString().split('T')[0];

    const existing = db.prepare('SELECT id FROM body_logs WHERE user_id = ? AND date = ?').get(req.userId, logDate);
    if (existing) {
      db.prepare(
        'UPDATE body_logs SET weight_lbs=?, chest=?, waist=?, hips=?, arms=?, legs=?, notes=? WHERE id=?'
      ).run(weight_lbs || null, chest || null, waist || null, hips || null, arms || null, legs || null, notes || '', existing.id);
      const row = db.prepare('SELECT * FROM body_logs WHERE id = ?').get(existing.id);
      return res.json(row);
    }
    const id = generateId();
    db.prepare(
      'INSERT INTO body_logs (id, user_id, date, weight_lbs, chest, waist, hips, arms, legs, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, req.userId, logDate, weight_lbs || null, chest || null, waist || null, hips || null, arms || null, legs || null, notes || '');
    const row = db.prepare('SELECT * FROM body_logs WHERE id = ?').get(id);
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to log measurements' });
  }
});

module.exports = router;
