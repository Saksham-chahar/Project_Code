const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/profile/options
router.get('/options', async (req, res) => {
    try {
        const [departments] = await db.query("SELECT dept_id, dept_name FROM departments");
        const [hostels] = await db.query("SELECT location_id as host_id, location_name FROM campus_locations WHERE location_type = 'hostel'");
        //  const [hostels] = await db.query("SELECT host_id, hostel_name AS location_name FROM hostels");
         
        
        res.json({
            departments,
            hostels
        });
    } catch (error) {
        console.error("Error fetching profile options:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// GET /api/profile
router.get('/', async (req, res) => {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: "User ID is required" });

    try {
        const [userResult] = await db.query("SELECT full_name, email, user_type FROM users WHERE user_id = ?", [user_id]);
        if (userResult.length === 0) return res.status(404).json({ error: "User not found" });

        const user = userResult[0];

        if (user.user_type === 'student') {
            const query = `
                SELECT u.full_name, u.email, u.user_type, s.dept_id, s.host_id, s.year_of_study, d.dept_name, c.location_name as hostel_name
                FROM users u
                LEFT JOIN student_profiles s ON u.user_id = s.user_id
                LEFT JOIN departments d ON s.dept_id = d.dept_id
                LEFT JOIN campus_locations c ON s.host_id = c.location_id
                WHERE u.user_id = ?
            `;
            const [profile] = await db.query(query, [user_id]);
            return res.json(profile[0] || user);
        } else if (user.user_type === 'professor') {
            const query = `
                SELECT u.full_name, u.email, u.user_type, p.dept_id, p.designation, p.is_available, d.dept_name
                FROM users u
                LEFT JOIN professor_profiles p ON u.user_id = p.user_id
                LEFT JOIN departments d ON p.dept_id = d.dept_id
                WHERE u.user_id = ?
            `;
            const [profile] = await db.query(query, [user_id]);
            return res.json(profile[0] || user);
        } else {
            // Admin or other
            return res.json(user);
        }
    } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// PUT /api/profile
router.put('/', async (req, res) => {
    const { user_id, user_type, full_name, dept_id, host_id, year_of_study, designation, is_available } = req.body;
    
    if (!user_id || !user_type) {
        return res.status(400).json({ error: "Missing user_id or user_type" });
    }

    try {
        if (full_name) {
            await db.query("UPDATE users SET full_name = ? WHERE user_id = ?", [full_name, user_id]);
        }
        if (user_type === 'student') {
            const query = `
                INSERT INTO student_profiles (user_id, dept_id, host_id, year_of_study) 
                VALUES (?, ?, ?, ?) 
                ON DUPLICATE KEY UPDATE 
                dept_id = VALUES(dept_id), host_id = VALUES(host_id), year_of_study = VALUES(year_of_study)
            `;
            await db.query(query, [user_id, dept_id || null, host_id || null, year_of_study || null]);
        } else if (user_type === 'professor') {
            const query = `
                INSERT INTO professor_profiles (user_id, dept_id, designation, is_available) 
                VALUES (?, ?, ?, ?) 
                ON DUPLICATE KEY UPDATE 
                dept_id = VALUES(dept_id), designation = VALUES(designation), is_available = VALUES(is_available)
            `;
            await db.query(query, [user_id, dept_id || null, designation || null, is_available !== undefined ? is_available : 1]);
        }
        res.json({ message: "Profile updated successfully" });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
