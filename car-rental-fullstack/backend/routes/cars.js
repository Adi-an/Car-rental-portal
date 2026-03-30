// routes/cars.js – Car listings (public)
const express = require('express');
const pool    = require('../config/db');
const router  = express.Router();

// ── GET /api/cars ─────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [cars] = await pool.query(
      'SELECT * FROM cars WHERE available = 1 ORDER BY id'
    );
    res.json(cars);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/cars/:id ─────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM cars WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Car not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
