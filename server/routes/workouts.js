const express = require('express');
const { getDb } = require('../db');
const { generateId, toDateString } = require('../utils');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Plans
router.get('/plans', (req, res) => {
  try {
    const db = getDb();
    const plans = db.prepare('SELECT * FROM workout_plans WHERE user_id = ? ORDER BY created_at DESC').all(req.userId);
    res.json(plans.map(p => ({ ...p, program_data: JSON.parse(p.program_data), active: !!p.active })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

router.post('/plans', (req, res) => {
  try {
    const { name, goal, level, days_per_week, weeks, program_data } = req.body;
    if (!name || !program_data) return res.status(400).json({ error: 'Name and program_data are required' });
    const db = getDb();
    const id = generateId();
    db.prepare(
      'INSERT INTO workout_plans (id, user_id, name, goal, level, days_per_week, weeks, program_data, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)'
    ).run(id, req.userId, name, goal || 'general', level || 'intermediate', days_per_week || 4, weeks || 4, JSON.stringify(program_data));
    const plan = db.prepare('SELECT * FROM workout_plans WHERE id = ?').get(id);
    res.status(201).json({ ...plan, program_data: JSON.parse(plan.program_data), active: !!plan.active });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create plan' });
  }
});

router.put('/plans/:id/activate', (req, res) => {
  try {
    const db = getDb();
    const plan = db.prepare('SELECT id FROM workout_plans WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    db.prepare('UPDATE workout_plans SET active = 0 WHERE user_id = ?').run(req.userId);
    db.prepare('UPDATE workout_plans SET active = 1 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to activate plan' });
  }
});

router.delete('/plans/:id', (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare('DELETE FROM workout_plans WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
    if (result.changes === 0) return res.status(404).json({ error: 'Plan not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete plan' });
  }
});

// Logs
router.get('/logs', (req, res) => {
  try {
    const db = getDb();
    const { start, end, date } = req.query;
    let query = 'SELECT * FROM workout_logs WHERE user_id = ?';
    const params = [req.userId];
    if (date) {
      query += ' AND date = ?';
      params.push(date);
    } else if (start && end) {
      query += ' AND date >= ? AND date <= ?';
      params.push(start, end);
    }
    query += ' ORDER BY date DESC';
    const logs = db.prepare(query).all(...params);
    res.json(logs.map(l => ({ ...l, exercises: JSON.parse(l.exercises), completed: !!l.completed })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

router.post('/logs', (req, res) => {
  try {
    const { date, plan_id, day_name, exercises, notes, duration_minutes, completed } = req.body;
    if (!date) return res.status(400).json({ error: 'Date is required' });
    const db = getDb();
    const existing = db.prepare('SELECT id FROM workout_logs WHERE user_id = ? AND date = ?').get(req.userId, date);
    if (existing) {
      db.prepare(
        'UPDATE workout_logs SET plan_id=?, day_name=?, exercises=?, notes=?, duration_minutes=?, completed=? WHERE id=?'
      ).run(plan_id || null, day_name || '', JSON.stringify(exercises || []), notes || '', duration_minutes || 0, completed ? 1 : 0, existing.id);
      const log = db.prepare('SELECT * FROM workout_logs WHERE id = ?').get(existing.id);
      return res.json({ ...log, exercises: JSON.parse(log.exercises), completed: !!log.completed });
    }
    const id = generateId();
    db.prepare(
      'INSERT INTO workout_logs (id, user_id, date, plan_id, day_name, exercises, notes, duration_minutes, completed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, req.userId, date, plan_id || null, day_name || '', JSON.stringify(exercises || []), notes || '', duration_minutes || 0, completed ? 1 : 0);
    const log = db.prepare('SELECT * FROM workout_logs WHERE id = ?').get(id);
    res.status(201).json({ ...log, exercises: JSON.parse(log.exercises), completed: !!log.completed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create log' });
  }
});

router.put('/logs/:id', (req, res) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM workout_logs WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!existing) return res.status(404).json({ error: 'Log not found' });
    const { plan_id, day_name, exercises, notes, duration_minutes, completed } = req.body;
    db.prepare(
      'UPDATE workout_logs SET plan_id=?, day_name=?, exercises=?, notes=?, duration_minutes=?, completed=? WHERE id=?'
    ).run(
      plan_id !== undefined ? plan_id : existing.plan_id,
      day_name !== undefined ? day_name : existing.day_name,
      JSON.stringify(exercises !== undefined ? exercises : JSON.parse(existing.exercises)),
      notes !== undefined ? notes : existing.notes,
      duration_minutes !== undefined ? duration_minutes : existing.duration_minutes,
      completed !== undefined ? (completed ? 1 : 0) : existing.completed,
      req.params.id
    );
    const log = db.prepare('SELECT * FROM workout_logs WHERE id = ?').get(req.params.id);
    res.json({ ...log, exercises: JSON.parse(log.exercises), completed: !!log.completed });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update log' });
  }
});

router.delete('/logs/:id', (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare('DELETE FROM workout_logs WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
    if (result.changes === 0) return res.status(404).json({ error: 'Log not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete log' });
  }
});

router.get('/today', (req, res) => {
  try {
    const db = getDb();
    const today = toDateString();
    const plan = db.prepare('SELECT * FROM workout_plans WHERE user_id = ? AND active = 1').get(req.userId);
    if (!plan) return res.json({ plan: null, log: null, plannedDay: null });

    const programData = JSON.parse(plan.program_data);
    const log = db.prepare('SELECT * FROM workout_logs WHERE user_id = ? AND date = ?').get(req.userId, today);

    const dayOfWeek = new Date().getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = dayNames[dayOfWeek];

    let plannedDay = null;
    if (programData.weeks && programData.weeks.length > 0) {
      const week1 = programData.weeks[0];
      if (week1.days) {
        plannedDay = week1.days.find(d => d.day === todayName) || null;
      }
    }

    res.json({
      plan: { ...plan, program_data: programData, active: true },
      log: log ? { ...log, exercises: JSON.parse(log.exercises), completed: !!log.completed } : null,
      plannedDay,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch today workout' });
  }
});

module.exports = router;
