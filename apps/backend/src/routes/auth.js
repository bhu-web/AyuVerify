const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'ayuverify_secret_key_2026';

// Register Stakeholder
router.post('/register', async (req, res) => {
  try {
    const { id, name, email, password, role, publicKey } = req.body;

    if (!id || !name || !email || !password || !role || !publicKey) {
      return res.status(400).json({ error: 'All fields including publicKey are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO users (id, name, email, password_hash, role, public_key)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.run(query, [id, name, email, hashedPassword, role, publicKey], function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ message: 'User registered successfully', userId: id });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login Stakeholder
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

      const token = jwt.sign(
        { userId: user.id, role: user.role, publicKey: user.public_key },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          publicKey: user.public_key
        }
      });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;