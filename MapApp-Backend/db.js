const mysql = require('mysql2/promise');
require('dotenv').config();

// 1. Create the connection pool
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root', 
    password: process.env.DB_PASSWORD || '', 
    database: process.env.DB_NAME || 'map_my_campus'
});

module.exports = db;