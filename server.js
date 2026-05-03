require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const boardController = require('./boardController');
require('./db');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(helmet());
app.use(express.json());

const allowedOrigins = [
  'https://ieee-al-azhar-university.web.app',
  'https://ieee-al-azhar-university.firebaseapp.com',
  'http://localhost:5173',
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true);
    else cb(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.get('/api/board', async (req, res) => {
  try {
    const data = await boardController.getBoardData();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/last-chairman', async (req, res) => {
  try {
    const data = await boardController.getLastChairman();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'API is running ✅' });
});

app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found." });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});
