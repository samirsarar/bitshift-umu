const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');
const errorHandler = require('./middleware/errorMiddleware');
// Samir backend practice
// Load env vars FIRST
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Allow larger payloads for avatar uploads
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req, res) =>
  res.json({ status: 'API is running', timestamp: new Date().toISOString() })
);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);

// Error Middleware (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});