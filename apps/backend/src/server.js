const express = require('express');
const cors = require('cors');
const { initDB } = require('./config/db');
const authRoutes = require('./routes/auth');
const batchRoutes = require('./routes/batches');
const verifyWebRoutes = require('./routes/verifyWeb');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Set basic headers to allow local DevTools connects
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self' 'unsafe-inline'; connect-src 'self' http://localhost:*;"
  );
  next();
});

// Ignore Chrome/Edge DevTools auto-discovery requests silently (prevents 404 logs)
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.status(204).end();
});

// Initialize Database
initDB();

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/batches', batchRoutes);
app.use('/verify', verifyWebRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'AyuVerify Backend Service Running', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`🚀 AyuVerify Backend running on http://localhost:${PORT}`);
});