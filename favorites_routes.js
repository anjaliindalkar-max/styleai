const express = require('express');

const { pool } = require('../db');

const router = express.Router();


// =====================================================
// GET USER FAVORITES
// =====================================================

router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const [favorites] = await pool.query(
      `SELECT
          f.id,
          f.user_id,
          f.wardrobe_item_id,
          f.created_at,
          w.name,
          w.category,
          w.color,
          w.image_url,
          w.season
       FROM favorites f
       INNER JOIN wardrobe_items w
         ON f.wardrobe_item_id = w.id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      favorites
    });

  } catch (error) {
    console.error(
      'Get favorites error:',
      error
    );

    res.status(500).json({
      success: false,
      message:
        'Unable to load favorites.'
    });
  }
});


// =====================================================
// ADD FAVORITE
// =====================================================

router.post('/', async (req, res) => {
  try {
    const {
      user_id,
      wardrobe_item_id
    } = req.body;

    if (!user_id || !wardrobe_item_id) {
      return res.status(400).json({
        success: false,
        message:
          'User ID and wardrobe item ID are required.'
      });
    }

    // Check whether item already exists
    const [existing] = await pool.query(
      `SELECT id
       FROM favorites
       WHERE user_id = ?
       AND wardrobe_item_id = ?`,
      [
        user_id,
        wardrobe_item_id
      ]
    );

    if (existing.length > 0) {
      return res.json({
        success: true,
        message:
          'Item is already in favorites.',
        favoriteId:
          existing[0].id
      });
    }

    // Check that wardrobe item exists
    const [wardrobeItem] =
        await pool.query(
      `SELECT id
       FROM wardrobe_items
       WHERE id = ?
       AND user_id = ?`,
      [
        wardrobe_item_id,
        user_id
      ]
    );

    if (wardrobeItem.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          'Wardrobe item not found.'
      });
    }

    // Add favorite
    const [result] =
        await pool.query(
      `INSERT INTO favorites
       (user_id, wardrobe_item_id)
       VALUES (?, ?)`,
      [
        user_id,
        wardrobe_item_id
      ]
    );

    res.status(201).json({
      success: true,
      message:
        'Added to favorites.',
      favoriteId:
        result.insertId
    });

  } catch (error) {
    console.error(
      'Add favorite error:',
      error
    );

    res.status(500).json({
      success: false,
      message:
        'Unable to add favorite.'
    });
  }
});


// =====================================================
// DELETE FAVORITE
// =====================================================

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      `DELETE FROM favorites
       WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message:
          'Favorite not found.'
      });
    }

    res.json({
      success: true,
      message:
        'Favorite removed.'
    });

  } catch (error) {
    console.error(
      'Delete favorite error:',
      error
    );

    res.status(500).json({
      success: false,
      message:
        'Unable to remove favorite.'
    });
  }
});


module.exports = router;
