const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Enable CORS
app.use(cors());

// Middleware to parse JSON
app.use(express.json());

// Routes
// 1. Simple GET route at /api/categories that returns the fake JSON data
app.get('/api/categories', (req, res) => {
  const categories = [
    { id: 1, name: 'Hostels', icon: 'fa-bed' },
    { id: 2, name: 'Computer Labs', icon: 'fa-desktop' },
    { id: 3, name: 'Professors', icon: 'fa-chalkboard-user' }
  ];
  res.json(categories);
});

// 2. Simple GET route at /api/status that just returns { message: "Server is alive!" }
app.get('/api/status', (req, res) => {
  res.json({ message: 'Server is alive!' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
