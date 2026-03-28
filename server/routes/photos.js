const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDb } = require('../db');
const { generateId } = require('../utils');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const UPLOADS_DIR = path.join(__dirname, '../uploads/food');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${req.userId}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10mb
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  },
});

// Upload a photo
router.post('/upload', upload.single('photo'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No photo uploaded' });
    const { date, meal, notes } = req.body;
    if (!date) return res.status(400).json({ error: 'date is required' });

    const db = getDb();
    const id = generateId();
    db.prepare(
      'INSERT INTO food_photos (id, user_id, date, meal, filename, notes) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, req.userId, date, meal || null, req.file.filename, notes || '');

    const photo = db.prepare('SELECT * FROM food_photos WHERE id = ?').get(id);
    res.status(201).json({ ...photo, url: `/uploads/food/${photo.filename}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

// Get photos for a date
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const photos = db.prepare(
      'SELECT * FROM food_photos WHERE user_id = ? AND date = ? ORDER BY created_at ASC'
    ).all(req.userId, date);
    res.json(photos.map(p => ({ ...p, url: `/uploads/food/${p.filename}` })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
});

// Get recent photos (last N days)
router.get('/recent', (req, res) => {
  try {
    const db = getDb();
    const days = parseInt(req.query.days) || 7;
    const photos = db.prepare(
      `SELECT * FROM food_photos WHERE user_id = ? AND date >= date('now', '-' || ? || ' days') ORDER BY date DESC, created_at ASC`
    ).all(req.userId, days);
    res.json(photos.map(p => ({ ...p, url: `/uploads/food/${p.filename}` })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recent photos' });
  }
});

// Delete a photo
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const photo = db.prepare('SELECT * FROM food_photos WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!photo) return res.status(404).json({ error: 'Photo not found' });

    const filePath = path.join(UPLOADS_DIR, photo.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    db.prepare('DELETE FROM food_photos WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

module.exports = router;
