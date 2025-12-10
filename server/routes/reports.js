const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Get reports with filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { operator_id, date, start_date, end_date, month } = req.query;
    
    let query = `
      SELECT r.*, o.full_name as operator_name
      FROM reports r
      JOIN operators o ON r.operator_id = o.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (operator_id) {
      query += ` AND r.operator_id = $${paramCount}`;
      params.push(operator_id);
      paramCount++;
    }

    if (date) {
      query += ` AND r.report_date = $${paramCount}`;
      params.push(date);
      paramCount++;
    }

    if (start_date && end_date) {
      query += ` AND r.report_date BETWEEN $${paramCount} AND $${paramCount + 1}`;
      params.push(start_date, end_date);
      paramCount += 2;
    }

    if (month) {
      query += ` AND DATE_TRUNC('month', r.report_date) = $${paramCount}`;
      params.push(month + '-01');
      paramCount++;
    }

    query += ' ORDER BY r.report_date DESC, r.time_slot';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get report by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT r.*, o.full_name as operator_name
       FROM reports r
       JOIN operators o ON r.operator_id = o.id
       WHERE r.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create or update report
router.post('/', authenticateToken, authorizeRoles('supervisor', 'admin'), async (req, res) => {
  try {
    const {
      operator_id,
      report_date,
      time_slot,
      total_calls_cumulative,
      incoming_accepted,
      outgoing_made,
      missed,
      time_on_line,
      time_in_calls,
      recordings
    } = req.body;

    // Validation
    if (!operator_id || !report_date || !time_slot) {
      return res.status(400).json({ error: 'Operator, date, and time slot are required' });
    }

    const validTimeSlots = ['morning', 'afternoon', 'evening'];
    if (!validTimeSlots.includes(time_slot)) {
      return res.status(400).json({ error: 'Invalid time slot' });
    }

    // Check if report already exists
    const existingReport = await db.query(
      'SELECT id FROM reports WHERE operator_id = $1 AND report_date = $2 AND time_slot = $3',
      [operator_id, report_date, time_slot]
    );

    let result;
    if (existingReport.rows.length > 0) {
      // Update existing report
      result = await db.query(
        `UPDATE reports SET
          total_calls_cumulative = $1,
          incoming_accepted = $2,
          outgoing_made = $3,
          missed = $4,
          time_on_line = $5,
          time_in_calls = $6,
          recordings = $7,
          created_by = $8
         WHERE operator_id = $9 AND report_date = $10 AND time_slot = $11
         RETURNING *`,
        [
          total_calls_cumulative || 0,
          incoming_accepted || 0,
          outgoing_made || 0,
          missed || 0,
          time_on_line || 0,
          time_in_calls || 0,
          recordings || 0,
          req.user.id,
          operator_id,
          report_date,
          time_slot
        ]
      );
    } else {
      // Create new report
      result = await db.query(
        `INSERT INTO reports (
          operator_id, report_date, time_slot,
          total_calls_cumulative, incoming_accepted, outgoing_made,
          missed, time_on_line, time_in_calls, recordings, created_by
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          operator_id,
          report_date,
          time_slot,
          total_calls_cumulative || 0,
          incoming_accepted || 0,
          outgoing_made || 0,
          missed || 0,
          time_on_line || 0,
          time_in_calls || 0,
          recordings || 0,
          req.user.id
        ]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create/Update report error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete report
router.delete('/:id', authenticateToken, authorizeRoles('supervisor', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM reports WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get daily statistics
router.get('/stats/daily', authenticateToken, async (req, res) => {
  try {
    const { date, operator_id } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    let query = `
      SELECT 
        o.id as operator_id,
        o.full_name as operator_name,
        r.report_date::text as report_date,
        r.time_slot,
        r.total_calls_cumulative,
        r.incoming_accepted,
        r.outgoing_made,
        r.missed,
        r.time_on_line,
        r.time_in_calls,
        r.recordings
      FROM operators o
      LEFT JOIN reports r ON o.id = r.operator_id AND r.report_date = $1
      WHERE o.is_active = true
    `;
    const params = [date];

    if (operator_id) {
      query += ' AND o.id = $2';
      params.push(operator_id);
    }

    query += ' ORDER BY o.full_name, r.time_slot';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get daily stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get monthly statistics
router.get('/stats/monthly', authenticateToken, async (req, res) => {
  try {
    const { month, operator_id } = req.query;

    if (!month) {
      return res.status(400).json({ error: 'Month is required (format: YYYY-MM)' });
    }

    let query = `
      SELECT 
        o.id as operator_id,
        o.full_name as operator_name,
        r.report_date::text as report_date,
        r.time_slot,
        r.total_calls_cumulative,
        r.incoming_accepted,
        r.outgoing_made,
        r.missed,
        r.time_on_line,
        r.time_in_calls,
        r.recordings
      FROM operators o
      LEFT JOIN reports r ON o.id = r.operator_id 
        AND DATE_TRUNC('month', r.report_date) = $1
      WHERE o.is_active = true
    `;
    const params = [month + '-01'];

    if (operator_id) {
      query += ' AND o.id = $2';
      params.push(operator_id);
    }

    query += ' ORDER BY o.full_name, r.report_date, r.time_slot';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get monthly stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
