const express = require('express');
const multer = require('multer');
const path = require('path');

const { pool } = require('../db');

const router = express.Router();

// =====================================================
// IMAGE UPLOAD CONFIGURATION
// =====================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },

  filename: (req, file, cb) => {
    const extension =
      path.extname(file.originalname);

    const fileName =
      `clothing_${Date.now()}${extension}`;

    cb(null, fileName);
  },
});

const upload = multer({
  storage: storage,

  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

// =====================================================
// TEST
// =====================================================

router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Wardrobe route is working',
  });
});

// =====================================================
// GET WARDROBE ITEMS
// =====================================================

router.get('/:userId', async (req, res) => {
  try {
    const userId =
      Number(req.params.userId);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID.',
      });
    }

    const [items] = await pool.query(
      `SELECT
        id,
        user_id,
        name,
        category,
        color,
        image_url,
        season,
        created_at
       FROM wardrobe_items
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      items,
    });
  } catch (error) {
    console.error(
      'Get wardrobe error:',
      error
    );

    res.status(500).json({
      success: false,
      message:
        'Unable to load wardrobe.',
    });
  }
});

// =====================================================
// UPLOAD CLOTHING IMAGE
// =====================================================

router.post(
  '/upload',
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image selected.',
        });
      }

      const imageUrl =
        `/uploads/${req.file.filename}`;

      res.json({
        success: true,
        message:
          'Image uploaded successfully.',
        imageUrl,
      });
    } catch (error) {
      console.error(
        'Image upload error:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          error.message ||
          'Unable to upload image.',
      });
    }
  }
);

// =====================================================
// ADD WARDROBE ITEM
// =====================================================

router.post('/', async (req, res) => {
  try {
    const {
      user_id,
      name,
      category,
      color,
      image_url,
      season,
    } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required.',
      });
    }

    if (!name || !category) {
      return res.status(400).json({
        success: false,
        message:
          'Name and category are required.',
      });
    }

    const [result] = await pool.query(
      `INSERT INTO wardrobe_items
      (
        user_id,
        name,
        category,
        color,
        image_url,
        season
      )
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        name,
        category,
        color || null,
        image_url || null,
        season || null,
      ]
    );

    res.status(201).json({
      success: true,
      message:
        'Clothing item added successfully.',
      item: {
        id: result.insertId,
        user_id,
        name,
        category,
        color: color || null,
        image_url: image_url || null,
        season: season || null,
      },
    });
  } catch (error) {
    console.error(
      'Add wardrobe item error:',
      error
    );

    res.status(500).json({
      success: false,
      message:
        'Unable to add clothing item.',
    });
  }
});

// =====================================================
// DELETE WARDROBE ITEM
// =====================================================

router.delete('/:id', async (req, res) => {
  try {
    const id =
      Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Invalid clothing item ID.',
      });
    }

    const [result] = await pool.query(
      `DELETE FROM wardrobe_items
       WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message:
          'Clothing item not found.',
      });
    }

    res.json({
      success: true,
      message:
        'Clothing item deleted successfully.',
    });
  } catch (error) {
    console.error(
      'Delete wardrobe error:',
      error
    );

    res.status(500).json({
      success: false,
      message:
        'Unable to delete clothing item.',
    });
  }
});

// =====================================================
// ERROR HANDLER
// =====================================================

router.use(
  (error, req, res, next) => {
    console.error(
      'Wardrobe route error:',
      error
    );

    res.status(400).json({
      success: false,
      message:
        error.message ||
        'Wardrobe request failed.',
    });
  }
);

// =====================================================
// EXPORT
// =====================================================

module.exports = router;
