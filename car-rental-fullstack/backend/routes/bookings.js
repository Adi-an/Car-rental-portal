const express = require('express');
const pool    = require('../config/db');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const router  = express.Router();
 
function daysBetween(a, b) { return Math.max(1, Math.round((new Date(b) - new Date(a)) / 86400000)); }
 
router.post('/', verifyToken, async (req, res) => {
  const { car_id, pickup_date, return_date } = req.body;
  if (!car_id || !pickup_date || !return_date) return res.status(400).json({ error: 'car_id, pickup_date and return_date required' });
  if (return_date <= pickup_date) return res.status(400).json({ error: 'return_date must be after pickup_date' });
  try {
    const [cars] = await pool.query('SELECT * FROM cars WHERE id = ?', [car_id]);
    if (!cars.length) return res.status(404).json({ error: 'Car not found' });
    const car = cars[0];
    const days = daysBetween(pickup_date, return_date);
    const total = car.price_per_day * days;
    const [result] = await pool.query(
      `INSERT INTO bookings (user_id, car_id, pickup_date, return_date, days, price_per_day, total_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [req.user.id, car_id, pickup_date, return_date, days, car.price_per_day, total]
    );
    res.status(201).json({ message: 'Booking created', booking_id: result.insertId, total });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
 
router.get('/my', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.*, c.name AS car_name, c.emoji FROM bookings b JOIN cars c ON b.car_id = c.id WHERE b.user_id = ? ORDER BY b.booked_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
 
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [[stats]] = await pool.query(
      `SELECT COUNT(*) AS total, SUM(status='pending') AS pending, SUM(status='accepted') AS accepted, SUM(status='rejected') AS rejected, COALESCE(SUM(CASE WHEN status='accepted' THEN total_amount ELSE 0 END),0) AS revenue FROM bookings`
    );
    res.json(stats);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
 
// ── Admin: get all bookings WITH phone number ────────────
router.get('/', requireAdmin, async (req, res) => {
  const { status } = req.query;
  try {
    let sql = `
      SELECT b.*, 
             u.name AS user_name, u.email AS user_email, u.phone AS user_phone,
             c.name AS car_name, c.emoji
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN cars  c ON b.car_id  = c.id`;
    const params = [];
    if (status && ['pending','accepted','rejected'].includes(status)) {
      sql += ' WHERE b.status = ?'; params.push(status);
    }
    sql += ' ORDER BY b.booked_at DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
 
router.patch('/:id', requireAdmin, async (req, res) => {
  const { status } = req.body;
  if (!['accepted','rejected'].includes(status)) return res.status(400).json({ error: 'status must be accepted or rejected' });
  try {
    const [result] = await pool.query('UPDATE bookings SET status = ? WHERE id = ?', [status, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Booking not found' });
    res.json({ message: `Booking ${status}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
 
module.exports = router;