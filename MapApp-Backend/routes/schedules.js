const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/schedules
router.get('/', async (req, res) => {
    const userId = req.user ? req.user.id : req.query.user_id;

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized: Missing user context." });
    }

    try {
        const query = `
            SELECT 
                s.schedule_id, 
                s.day_of_week, 
                s.title, 
                s.start_time, 
                s.end_time, 
                s.location_id, 
                c.location_name
            FROM schedules s
            LEFT JOIN campus_locations c ON s.location_id = c.location_id
            WHERE s.user_id = ?
            ORDER BY 
                FIELD(s.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
                s.start_time
        `;
        const [rows] = await db.query(query, [userId]);
        res.json(rows);
    } catch (err) {
        console.error("Database Error in GET /api/schedules ->", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// POST /api/schedules
router.post('/', async (req, res) => {
    // Rely on req.user.id if middleware is used, fallback to req.body.user_id otherwise
    const userId = req.user ? req.user.id : req.body.user_id;
    const { schedules } = req.body;

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized: Missing user context." });
    }

    if (!Array.isArray(schedules)) {
        return res.status(400).json({ error: "Invalid schedule format. Expected a flat array." });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Clear existing user timetable
        await connection.execute('DELETE FROM schedules WHERE user_id = ?', [userId]);

        // 2. Perform a Bulk Insert if there are scheduled items
        if (schedules.length > 0) {
            const query = `
                INSERT INTO schedules (user_id, day_of_week, title, location_id, start_time, end_time) 
                VALUES ?
            `;
            
            // Format array of arrays for MySQL Bulk Insert, securely converting "" to NULL
            const values = schedules.map(item => [
                userId,
                item.day_of_week,
                item.title,
                item.location_id === "" ? null : item.location_id,
                item.start_time === "" ? null : item.start_time,
                item.end_time === "" ? null : item.end_time
            ]);

            // Note: Use .query() instead of .execute() for bulk inserts with arrays in mysql2
            await connection.query(query, [values]);
        }

        await connection.commit();
        res.json({ message: "Timetable updated successfully", savedCount: schedules.length });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Transaction Error saving timetable:", error);
        res.status(500).json({ error: "Internal Server Error" });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;
