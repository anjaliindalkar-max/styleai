const express = require('express');
const { pool } = require('../db');

const router = express.Router();

// =====================================================
// TEST ROUTE
// =====================================================

router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Analysis History route is working'
  });
});


// =====================================================
// GET ANALYSIS HISTORY
// =====================================================
// GET /api/analysis-history/:userId
//
// Returns all previous AI style analyses for the user.
// Newest analysis appears first.
// =====================================================

router.get('/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);

    // -------------------------------------------------
    // CHECK USER ID
    // -------------------------------------------------

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID.'
      });
    }

    // -------------------------------------------------
    // GET HISTORY
    // -------------------------------------------------

    const [history] = await pool.query(
      `
      SELECT
        id,
        user_id,
        title,
        description,
        style,
        season,
        suggestion,
        style_tip,
        why_it_works,
        alternative,
        outfit_data,
        created_at
      FROM analysis_history
      WHERE user_id = ?
      ORDER BY created_at DESC
      `,
      [userId]
    );

    // -------------------------------------------------
    // RETURN HISTORY
    // -------------------------------------------------

    return res.json({
      success: true,
      history: history
    });

  } catch (error) {
    console.error(
      'Get analysis history error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Unable to load analysis history.',
      error: error.message
    });
  }
});


// =====================================================
// DELETE ONE ANALYSIS HISTORY ITEM
// =====================================================
// DELETE /api/analysis-history/:id
// =====================================================

router.delete('/:id', async (req, res) => {
  try {
    const historyId =
      parseInt(req.params.id, 10);

    // -------------------------------------------------
    // CHECK ID
    // -------------------------------------------------

    if (isNaN(historyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid analysis history ID.'
      });
    }

    // -------------------------------------------------
    // DELETE
    // -------------------------------------------------

    const [result] = await pool.query(
      `
      DELETE FROM analysis_history
      WHERE id = ?
      `,
      [historyId]
    );

    // -------------------------------------------------
    // CHECK RESULT
    // -------------------------------------------------

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Analysis history item not found.'
      });
    }

    // -------------------------------------------------
    // SUCCESS
    // -------------------------------------------------

    return res.json({
      success: true,
      message: 'Analysis history deleted successfully.'
    });

  } catch (error) {
    console.error(
      'Delete analysis history error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Unable to delete analysis history.',
      error: error.message
    });
  }
});


// =====================================================
// DELETE ALL ANALYSIS HISTORY FOR USER
// =====================================================
// DELETE /api/analysis-history/user/:userId
// =====================================================

router.delete('/user/:userId', async (req, res) => {
  try {
    const userId =
      parseInt(req.params.userId, 10);

    // -------------------------------------------------
    // CHECK USER ID
    // -------------------------------------------------

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID.'
      });
    }

    // -------------------------------------------------
    // DELETE ALL
    // -------------------------------------------------

    const [result] = await pool.query(
      `
      DELETE FROM analysis_history
      WHERE user_id = ?
      `,
      [userId]
    );

    // -------------------------------------------------
    // SUCCESS
    // -------------------------------------------------

    return res.json({
      success: true,
      message: 'All analysis history deleted successfully.',
      deletedCount: result.affectedRows
    });

  } catch (error) {
    console.error(
      'Delete all analysis history error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Unable to delete analysis history.',
      error: error.message
    });
  }
});


// =====================================================
// EXPORT
// =====================================================

module.exports = router;
