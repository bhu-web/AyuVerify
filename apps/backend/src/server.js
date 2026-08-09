const express = require('express');
const cors = require('cors');
const { initDB } = require('./config/db');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Initialize Database
initDB();

// API Routes
app.use('/api/v1/auth', authRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'AyuVerify Backend Service Running', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`🚀 AyuVerify Backend running on http://localhost:${PORT}`);
});