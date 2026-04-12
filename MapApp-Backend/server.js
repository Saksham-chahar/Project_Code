const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Enable CORS for frontend
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// 2. Setup MySQL Database Connection
// We are using a pool for production readiness
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test the database connection upon launch
db.getConnection((err, connection) => {
  if (err) {
    console.error('CRITICAL: Failed to connect to the database:', err.message);
  } else {
    console.log('Successfully connected to the MySQL database.');
    connection.release();
  }
});

// 3. Basic Health Check Route (Required by Prompt)
app.get('/', (req, res) => {
  // Try querying a dummy statement just to confirm DB connectivity for this route
  db.query('SELECT 1', (err) => {
    if (err) {
      return res.status(500).json({ 
        status: 'Server is running', 
        database: 'Disconnected', 
        error: err.message 
      });
    }
    
    res.json({ 
      status: 'Server is running', 
      database: 'Connected' 
    });
  });
});

// Existing routes preserved for MapApp Frontend
app.get('/api/status', (req, res) => {
  res.json({ message: 'Server is alive!' });
});

app.get('/api/categories', (req, res) => {
  const categories = [
    { id: 1, name: 'Hostels', icon: 'fa-bed' },
    { id: 2, name: 'Computer Labs', icon: 'fa-desktop' },
    { id: 3, name: 'Professors', icon: 'fa-chalkboard-user' }
  ];
  res.json(categories);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
