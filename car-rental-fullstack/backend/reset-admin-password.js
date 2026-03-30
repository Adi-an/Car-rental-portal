 
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool   = require('./config/db');
 
async function resetAdmin() {
  try {
    const password = 'Admin@123';
    const hash = await bcrypt.hash(password, 10);
    console.log('Generated hash:', hash);
 
    // Delete old admin
    await pool.query('DELETE FROM admins WHERE email = ?', ['admin@driveindia.com']);
 
    // Insert new admin with correct hash
    await pool.query(
      'INSERT INTO admins (name, email, password) VALUES (?, ?, ?)',
      ['Admin', 'admin@driveindia.com', hash]
    );
 
    console.log('✅ Admin password reset successfully!');
    console.log('Email: admin@driveindia.com');
    console.log('Password: Admin@123');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}
 
resetAdmin();