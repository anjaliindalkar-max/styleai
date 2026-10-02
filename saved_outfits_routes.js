const express = require('express');
const { pool } = require('../db');

const router = express.Router();


// =====================================================
// GET SAVED OUTFITS
// =====================================================

router.get('/:userId', async (req, res) => {
  try {

    const { userId } = req.params;

    const [outfits] = await pool.query(
      `
      SELECT
        so.id,
        so.user_id,
        so.title,
        so.description,
        so.created_at
      FROM saved_outfits so
      WHERE so.user_id = ?
      ORDER BY so.created_at DESC
      `,
      [userId]
    );

    for (const outfit of outfits) {

      const [items] = await pool.query(
        `
        SELECT
          soi.id,
          soi.wardrobe_item_id,
          w.name,
          w.category,
          w.color,
          w.image_url,
          w.season
        FROM saved_outfit_items soi
        INNER JOIN wardrobe_items w
          ON soi.wardrobe_item_id = w.id
        WHERE soi.saved_outfit_id = ?
        ORDER BY soi.id ASC
        `,
        [outfit.id]
      );

      outfit.items = items;
    }

    res.json({
      success: true,
      outfits
    });

  } catch (error) {

    console.error(
      'Get saved outfits error:',
      error
    );

    res.status(500).json({
      success: false,
      message: 'Unable to load saved outfits.'
    });
  }
});


// =====================================================
// SAVE COMPLETE OUTFIT
// =====================================================

router.post('/', async (req, res) => {

  let connection;

  try {

    const {
      user_id,
      title,
      description,
      wardrobe_item_ids
    } = req.body;


    // =================================================
    // VALIDATE USER
    // =================================================

    if (!user_id) {

      return res.status(400).json({
        success: false,
        message: 'User ID is required.'
      });
    }


    // =================================================
    // VALIDATE TITLE
    // =================================================

    if (
      !title ||
      title.toString().trim() === ''
    ) {

      return res.status(400).json({
        success: false,
        message: 'Outfit title is required.'
      });
    }


    // =================================================
    // VALIDATE ITEMS
    // =================================================

    if (
      !Array.isArray(wardrobe_item_ids) ||
      wardrobe_item_ids.length === 0
    ) {

      return res.status(400).json({
        success: false,
        message:
          'At least one clothing item is required.'
      });
    }


    // =================================================
    // CONVERT ITEM IDS
    // =================================================

    const uniqueIds = [
      ...new Set(
        wardrobe_item_ids
          .map((id) => Number(id))
          .filter(
            (id) =>
              Number.isInteger(id) &&
              id > 0
          )
      )
    ];


    if (uniqueIds.length === 0) {

      return res.status(400).json({
        success: false,
        message: 'Invalid clothing items.'
      });
    }


    // =================================================
    // DATABASE CONNECTION
    // =================================================

    connection =
      await pool.getConnection();


    await connection.beginTransaction();


    // =================================================
    // CHECK USER'S WARDROBE ITEMS
    // =================================================

    const placeholders =
      uniqueIds
        .map(() => '?')
        .join(',');


    const [wardrobeItems] =
      await connection.query(
        `
        SELECT id
        FROM wardrobe_items
        WHERE user_id = ?
        AND id IN (${placeholders})
        `,
        [
          user_id,
          ...uniqueIds
        ]
      );


    if (
      wardrobeItems.length !==
      uniqueIds.length
    ) {

      await connection.rollback();

      return res.status(403).json({
        success: false,
        message:
          'One or more clothing items do not belong to this user.'
      });
    }


    // =================================================
    // CREATE SAVED OUTFIT
    // =================================================

    const [outfitResult] =
      await connection.query(
        `
        INSERT INTO saved_outfits
        (
          user_id,
          title,
          description
        )
        VALUES (?, ?, ?)
        `,
        [
          user_id,
          title.toString().trim(),
          description
            ? description.toString().trim()
            : null
        ]
      );


    const savedOutfitId =
      outfitResult.insertId;


    // =================================================
    // SAVE OUTFIT ITEMS
    // =================================================

    for (
      const wardrobeItemId
      of uniqueIds
    ) {

      await connection.query(
        `
        INSERT INTO saved_outfit_items
        (
          saved_outfit_id,
          wardrobe_item_id
        )
        VALUES (?, ?)
        `,
        [
          savedOutfitId,
          wardrobeItemId
        ]
      );
    }


    // =================================================
    // COMMIT
    // =================================================

    await connection.commit();


    res.status(201).json({

      success: true,

      message:
        'Outfit saved successfully.',

      savedOutfitId

    });

  } catch (error) {

    if (connection) {
      await connection.rollback();
    }


    console.error(
      'Save outfit error:',
      error
    );


    res.status(500).json({

      success: false,

      message:
        'Unable to save outfit.'

    });

  } finally {

    if (connection) {
      connection.release();
    }
  }
});


// =====================================================
// DELETE COMPLETE SAVED OUTFIT
// =====================================================

router.delete('/:id', async (req, res) => {

  try {

    const { id } = req.params;


    const [result] =
      await pool.query(
        `
        DELETE FROM saved_outfits
        WHERE id = ?
        `,
        [id]
      );


    if (
      result.affectedRows === 0
    ) {

      return res.status(404).json({
        success: false,
        message:
          'Saved outfit not found.'
      });
    }


    res.json({

      success: true,

      message:
        'Saved outfit removed.'

    });

  } catch (error) {

    console.error(
      'Delete saved outfit error:',
      error
    );


    res.status(500).json({

      success: false,

      message:
        'Unable to remove saved outfit.'

    });
  }
});


module.exports = router;
