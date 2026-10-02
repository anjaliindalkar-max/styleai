const express = require('express');
const { pool } = require('../db');

const router = express.Router();

// =====================================================
// GET USER OUTFIT PLANS
// =====================================================

router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const [plans] = await pool.query(
      `SELECT
          id,
          user_id,
          title,
          outfit_date,
          notes,
          created_at
       FROM planner_outfits
       WHERE user_id = ?
       ORDER BY outfit_date ASC, created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      plans: plans,
    });
  } catch (error) {
    console.error('Get planner outfits error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to load outfit plans.',
    });
  }
});

// =====================================================
// ADD OUTFIT PLAN
// =====================================================

router.post('/', async (req, res) => {
  try {
    const {
      user_id,
      title,
      outfit_date,
      notes,
    } = req.body;

    if (!user_id || !title || !outfit_date) {
      return res.status(400).json({
        success: false,
        message:
            'User ID, title and outfit date are required.',
      });
    }

    const [result] = await pool.query(
      `INSERT INTO planner_outfits
       (user_id, title, outfit_date, notes)
       VALUES (?, ?, ?, ?)`,
      [
        user_id,
        title,
        outfit_date,
        notes || null,
      ]
    );

    // =================================================
    // GET THE NEWLY CREATED OUTFIT
    // =================================================

    const [newPlans] = await pool.query(
      `SELECT
          id,
          user_id,
          title,
          outfit_date,
          notes,
          created_at
       FROM planner_outfits
       WHERE id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Outfit plan added.',
      plan: newPlans[0],
    });
  } catch (error) {
    console.error('Add planner outfit error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to add outfit plan.',
    });
  }
});

// =====================================================
// UPDATE OUTFIT PLAN
// =====================================================

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      outfit_date,
      notes,
    } = req.body;

    if (!title || !outfit_date) {
      return res.status(400).json({
        success: false,
        message:
            'Title and outfit date are required.',
      });
    }

    const [result] = await pool.query(
      `UPDATE planner_outfits
       SET
         title = ?,
         outfit_date = ?,
         notes = ?
       WHERE id = ?`,
      [
        title,
        outfit_date,
        notes || null,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Outfit plan not found.',
      });
    }

    // =================================================
    // RETURN UPDATED RECORD
    // =================================================

    const [updatedPlans] = await pool.query(
      `SELECT
          id,
          user_id,
          title,
          outfit_date,
          notes,
          created_at
       FROM planner_outfits
       WHERE id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Outfit plan updated successfully.',
      plan: updatedPlans[0],
    });
  } catch (error) {
    console.error('Update planner outfit error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to update outfit plan.',
    });
  }
});

// =====================================================
// DELETE OUTFIT PLAN
// =====================================================

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      'DELETE FROM planner_outfits WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Outfit plan not found.',
      });
    }

    res.json({
      success: true,
      message: 'Outfit plan deleted.',
    });
  } catch (error) {
    console.error(
      'Delete planner outfit error:',
      error
    );

    res.status(500).json({
      success: false,
      message: 'Unable to delete outfit plan.',
    });
  }
});

module.exports = router;
