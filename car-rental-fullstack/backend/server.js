require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const app     = express();
const PORT    = process.env.PORT || 5000;
 
// Allow ALL origins to fix CORS issue
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));
 
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/cars',     require('./routes/cars'));
app.use('/api/bookings', require('./routes/bookings'));
 
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
 
app.listen(PORT, () => console.log(`🚗 DriveIndia running on http://localhost:${PORT}`));
 