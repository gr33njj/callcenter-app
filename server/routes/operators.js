const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Get all operators
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, full_name, is_active, created_at FROM operators WHERE is_active = true ORDER BY full_name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get operators error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single operator
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT id, full_name, is_active, created_at FROM operators WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Operator not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get operator error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create operator
router.post('/', authenticateToken, authorizeRoles('supervisor', 'admin'), async (req, res) => {
  try {
    const { full_name } = req.body;

    if (!full_name || full_name.trim() === '') {
      return res.status(400).json({ error: 'Full name is required' });
    }

    const result = await db.query(
      'INSERT INTO operators (full_name) VALUES ($1) RETURNING id, full_name, is_active, created_at',
      [full_name.trim()]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create operator error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update operator
router.put('/:id', authenticateToken, authorizeRoles('supervisor', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name } = req.body;

    if (!full_name || full_name.trim() === '') {
      return res.status(400).json({ error: 'Full name is required' });
    }

    const result = await db.query(
      'UPDATE operators SET full_name = $1 WHERE id = $2 RETURNING id, full_name, is_active, created_at',
      [full_name.trim(), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Operator not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update operator error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete operator (soft delete)
router.delete('/:id', authenticateToken, authorizeRoles('supervisor', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'UPDATE operators SET is_active = false WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Operator not found' });
    }

    res.json({ message: 'Operator deleted successfully' });
  } catch (error) {
    console.error('Delete operator error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
