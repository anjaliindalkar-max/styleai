const express = require('express');
const { pool } = require('../db');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const router = express.Router();

// =====================================================
// AI TEST
// =====================================================

router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'StyleAI AI route is working'
  });
});

// =====================================================
// HELPERS
// =====================================================

function cleanText(value) {
  return (value || '').toString().trim().toLowerCase();
}

function hasAny(text, words) {
  const value = cleanText(text);

  return words.some((word) =>
    value.includes(word)
  );
}

function hasCategory(item, words) {
  return hasAny(item.category, words);
}

// =====================================================
// DETERMINE STYLE
// =====================================================

function determineStyle(description) {
  const text = cleanText(description);

  if (
    hasAny(text, [
      'wedding',
      'marriage',
      'bridal',
      'ceremony',
      'formal'
    ])
  ) {
    return 'Formal';
  }

  if (
    hasAny(text, [
      'office',
      'work',
      'interview',
      'meeting'
    ])
  ) {
    return 'Smart Casual';
  }

  if (
    hasAny(text, [
      'party',
      'date',
      'dinner',
      'evening',
      'night out'
    ])
  ) {
    return 'Party / Evening';
  }

  if (
    hasAny(text, [
      'gym',
      'workout',
      'sport',
      'sports'
    ])
  ) {
    return 'Sporty';
  }

  if (
    hasAny(text, [
      'beach',
      'summer',
      'vacation',
      'holiday'
    ])
  ) {
    return 'Summer';
  }

  if (
    hasAny(text, [
      'college',
      'school',
      'university',
      'campus'
    ])
  ) {
    return 'College Casual';
  }

  return 'Casual';
}

// =====================================================
// DETERMINE SEASON
// =====================================================

function determineSeason(description) {
  const text = cleanText(description);

  if (
    hasAny(text, [
      'summer',
      'hot',
      'sunny',
      'beach'
    ])
  ) {
    return 'Summer';
  }

  if (
    hasAny(text, [
      'winter',
      'cold',
      'chilly'
    ])
  ) {
    return 'Winter';
  }

  if (
    hasAny(text, [
      'monsoon',
      'rain',
      'rainy'
    ])
  ) {
    return 'Monsoon';
  }

  return null;
}

// =====================================================
// CLOTHING TYPES
// =====================================================

function getTops(items) {
  return items.filter((item) =>
    hasCategory(item, [
      'top',
      'shirt',
      't-shirt',
      'tshirt',
      'blouse',
      'kurti',
      'hoodie',
      'sweater',
      'tank',
      'crop'
    ])
  );
}

function getBottoms(items) {
  return items.filter((item) =>
    hasCategory(item, [
      'bottom',
      'jean',
      'jeans',
      'pant',
      'trouser',
      'short',
      'skirt'
    ])
  );
}

function getDresses(items) {
  return items.filter((item) =>
    hasCategory(item, [
      'dress',
      'gown'
    ])
  );
}

function getShoes(items) {
  return items.filter((item) =>
    hasCategory(item, [
      'shoe',
      'sneaker',
      'boot',
      'sandal',
      'footwear',
      'heels'
    ])
  );
}

function getAccessories(items) {
  return items.filter((item) =>
    hasCategory(item, [
      'accessory',
      'bag',
      'watch',
      'belt',
      'scarf',
      'hat',
      'cap',
      'jewelry',
      'jewellery'
    ])
  );
}

function getOuterwear(items) {
  return items.filter((item) =>
    hasCategory(item, [
      'outerwear',
      'jacket',
      'coat',
      'blazer',
      'cardigan'
    ])
  );
}

// =====================================================
// COLOR COMPATIBILITY
// =====================================================

function colorsWorkTogether(color1, color2) {
  const a = cleanText(color1);
  const b = cleanText(color2);

  if (!a || !b) {
    return true;
  }

  if (a === b) {
    return true;
  }

  const neutralColors = [
    'black',
    'white',
    'grey',
    'gray',
    'beige',
    'cream',
    'brown',
    'navy'
  ];

  if (
    neutralColors.includes(a) ||
    neutralColors.includes(b)
  ) {
    return true;
  }

  const combinations = {
    blue: [
      'white',
      'black',
      'grey',
      'gray',
      'beige',
      'cream',
      'brown'
    ],

    red: [
      'black',
      'white',
      'grey',
      'gray',
      'navy'
    ],

    green: [
      'white',
      'black',
      'beige',
      'cream',
      'brown'
    ],

    pink: [
      'white',
      'black',
      'grey',
      'gray',
      'beige'
    ],

    yellow: [
      'black',
      'white',
      'blue',
      'navy',
      'brown'
    ],

    purple: [
      'white',
      'black',
      'grey',
      'gray',
      'beige'
    ],

    orange: [
      'white',
      'black',
      'blue',
      'navy',
      'brown'
    ]
  };

  if (combinations[a]?.includes(b)) {
    return true;
  }

  if (combinations[b]?.includes(a)) {
    return true;
  }

  return false;
}

// =====================================================
// FIND MENTIONED ITEM
// =====================================================

function findMentionedItem(items, description) {
  const text = cleanText(description);

  return items.find((item) => {
    const name = cleanText(item.name);

    return (
      name !== '' &&
      text.includes(name)
    );
  });
}

// =====================================================
// PICK BEST ITEM
// =====================================================

function pickBestItem(items, description) {
  if (items.length === 0) {
    return null;
  }

  const text = cleanText(description);

  const sorted = [...items].sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    if (
      cleanText(a.name) &&
      text.includes(cleanText(a.name))
    ) {
      scoreA += 100;
    }

    if (
      cleanText(b.name) &&
      text.includes(cleanText(b.name))
    ) {
      scoreB += 100;
    }

    if (
      cleanText(a.color) &&
      text.includes(cleanText(a.color))
    ) {
      scoreA += 30;
    }

    if (
      cleanText(b.color) &&
      text.includes(cleanText(b.color))
    ) {
      scoreB += 30;
    }

    return scoreB - scoreA;
  });

  return sorted[0];
}

// =====================================================
// FIND BEST BOTTOM
// =====================================================

function findBestBottom(
  bottoms,
  description,
  top
) {
  if (bottoms.length === 0) {
    return null;
  }

  const text = cleanText(description);

  const sorted = [...bottoms].sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    if (
      cleanText(a.name) &&
      text.includes(cleanText(a.name))
    ) {
      scoreA += 100;
    }

    if (
      cleanText(b.name) &&
      text.includes(cleanText(b.name))
    ) {
      scoreB += 100;
    }

    if (
      cleanText(a.color) &&
      text.includes(cleanText(a.color))
    ) {
      scoreA += 30;
    }

    if (
      cleanText(b.color) &&
      text.includes(cleanText(b.color))
    ) {
      scoreB += 30;
    }

    if (
      top &&
      colorsWorkTogether(
        top.color,
        a.color
      )
    ) {
      scoreA += 25;
    }

    if (
      top &&
      colorsWorkTogether(
        top.color,
        b.color
      )
    ) {
      scoreB += 25;
    }

    return scoreB - scoreA;
  });

  return sorted[0];
}

// =====================================================
// FIND BEST SHOES
// =====================================================

function findBestShoes(
  shoes,
  description,
  bottom
) {
  if (shoes.length === 0) {
    return null;
  }

  const text = cleanText(description);

  const sorted = [...shoes].sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    if (
      cleanText(a.name) &&
      text.includes(cleanText(a.name))
    ) {
      scoreA += 100;
    }

    if (
      cleanText(b.name) &&
      text.includes(cleanText(b.name))
    ) {
      scoreB += 100;
    }

    if (
      bottom &&
      colorsWorkTogether(
        bottom.color,
        a.color
      )
    ) {
      scoreA += 20;
    }

    if (
      bottom &&
      colorsWorkTogether(
        bottom.color,
        b.color
      )
    ) {
      scoreB += 20;
    }

    return scoreB - scoreA;
  });

  return sorted[0];
}

// =====================================================
// CREATE OUTFIT SUGGESTION
// =====================================================

function createSuggestion({
  style,
  top,
  bottom,
  dress,
  shoes,
  accessory,
  outerwear
}) {
  let suggestion = '';

  if (dress) {
    suggestion =
      `Try ${dress.name}`;

    if (shoes) {
      suggestion +=
        ` with ${shoes.name}`;
    }

    if (accessory) {
      suggestion +=
        ` and ${accessory.name}`;
    }

    suggestion +=
      `. This creates a ${style.toLowerCase()} look.`;

    if (outerwear) {
      suggestion +=
        ` Add ${outerwear.name} if needed.`;
    }

    return suggestion;
  }

  if (top && bottom) {
    suggestion =
      `Try ${top.name} with ${bottom.name}`;

    if (shoes) {
      suggestion +=
        ` and ${shoes.name}`;
    }

    suggestion +=
      `. This creates a ${style.toLowerCase()} outfit.`;

    if (accessory) {
      suggestion +=
        ` Add ${accessory.name} to complete the look.`;
    }

    if (outerwear) {
      suggestion +=
        ` You can layer ${outerwear.name} if needed.`;
    }

    return suggestion;
  }

  if (top) {
    return (
      `Start with ${top.name}. ` +
      `Add a suitable bottom and footwear for a complete outfit.`
    );
  }

  if (bottom) {
    return (
      `Start with ${bottom.name}. ` +
      `Pair it with a suitable top and footwear for a complete look.`
    );
  }

  return (
    'Add more categorized clothing items to your wardrobe ' +
    'so StyleAI can create a complete outfit.'
  );
}

// =====================================================
// STYLE TIP
// =====================================================

function createStyleTip(style) {
  switch (style) {
    case 'Formal':
      return 'Choose clean, coordinated pieces and keep accessories simple.';

    case 'Smart Casual':
      return 'Combine polished clothing with one relaxed piece for a balanced look.';

    case 'Party / Evening':
      return 'Use coordinated colors and add one noticeable accessory.';

    case 'Sporty':
      return 'Choose comfortable clothing and practical footwear.';

    case 'Summer':
      return 'Prefer breathable clothing and lighter colors when possible.';

    case 'College Casual':
      return 'Keep the outfit comfortable, simple and easy to wear throughout the day.';

    default:
      return 'Keep the colors balanced and choose pieces that are comfortable together.';
  }
}

// =====================================================
// WHY THIS OUTFIT WORKS
// =====================================================

function createWhyItWorks({
  style,
  top,
  bottom,
  dress,
  shoes,
  accessory
}) {
  const reasons = [];

  reasons.push(
    `This outfit is suitable for a ${style.toLowerCase()} occasion.`
  );

  if (dress) {
    reasons.push(
      `${dress.name} gives the outfit a coordinated base.`
    );
  }

  if (top && bottom) {
    if (
      colorsWorkTogether(
        top.color,
        bottom.color
      )
    ) {
      reasons.push(
        `${top.name} and ${bottom.name} have compatible colors.`
      );
    } else {
      reasons.push(
        'The top and bottom create a balanced contrast.'
      );
    }
  }

  if (shoes) {
    reasons.push(
      `${shoes.name} completes the outfit with footwear.`
    );
  }

  if (accessory) {
    reasons.push(
      `${accessory.name} adds a finishing touch.`
    );
  }

  return reasons.join(' ');
}

// =====================================================
// ALTERNATIVE OUTFIT
// =====================================================

function createAlternative(
  items,
  selectedTop,
  selectedBottom
) {
  const tops = getTops(items);
  const bottoms = getBottoms(items);

  const alternativeTop =
    tops.find(
      (item) =>
        item.id !== selectedTop?.id
    );

  const alternativeBottom =
    bottoms.find(
      (item) =>
        item.id !== selectedBottom?.id
    );

  if (
    alternativeTop &&
    alternativeBottom
  ) {
    return (
      `Alternative: try ${alternativeTop.name} ` +
      `with ${alternativeBottom.name}.`
    );
  }

  if (alternativeTop) {
    return (
      `Alternative: try ${alternativeTop.name} ` +
      'with another bottom from your wardrobe.'
    );
  }

  if (alternativeBottom) {
    return (
      `Alternative: try ${alternativeBottom.name} ` +
      'with another top from your wardrobe.'
    );
  }

  return null;
}

// =====================================================
// AI STYLE ANALYSIS
// =====================================================

router.post('/analyze', async (req, res) => {
  try {

    const {
      user_id,
      description,
      image_url
    } = req.body;

    // -------------------------------------------------
    // CHECK USER
    // -------------------------------------------------

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required.'
      });
    }

    // -------------------------------------------------
    // CHECK DESCRIPTION
    // -------------------------------------------------

    if (
      !description ||
      description.toString().trim() === ''
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Please describe what outfit you want.'
      });
    }

    // -------------------------------------------------
    // GET USER WARDROBE
    // -------------------------------------------------

    const [items] = await pool.query(
      `SELECT
        id,
        name,
        category,
        color,
        image_url,
        season
       FROM wardrobe_items
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [user_id]
    );

    // -------------------------------------------------
    // EMPTY WARDROBE
    // -------------------------------------------------

    if (items.length === 0) {

      const emptyAnalysis = {

        description,

        style:
          determineStyle(description),

        requestedSeason:
          determineSeason(description),

        suggestion:
          'Add clothes to your wardrobe first so StyleAI can create a personalized outfit.',

        styleTip:
          'Start by adding a top, bottom and footwear.',

        whyItWorks:
          'StyleAI needs wardrobe items to create a personalized recommendation.',

        alternative: null,

        outfit: {
          top: null,
          bottom: null,
          dress: null,
          shoes: null,
          accessory: null,
          outerwear: null
        },

        wardrobe: []
      };

      // SAVE EMPTY-WARDROBE ANALYSIS
      try {

        await pool.query(
          `INSERT INTO analysis_history
            (
              user_id,
              image_url,
              analysis_data
            )
           VALUES (?, ?, ?)`,
          [
            user_id,
            image_url || null,
            JSON.stringify(emptyAnalysis)
          ]
        );

      } catch (historyError) {

        console.error(
          'Unable to save empty wardrobe analysis:',
          historyError
        );
      }

      return res.json({

        success: true,

        message:
          'Your wardrobe is empty.',

        analysis:
          emptyAnalysis
      });
    }

    // -------------------------------------------------
    // DETERMINE STYLE
    // -------------------------------------------------

    const style =
      determineStyle(description);

    const requestedSeason =
      determineSeason(description);

    // -------------------------------------------------
    // GET CLOTHING TYPES
    // -------------------------------------------------

    const tops =
      getTops(items);

    const bottoms =
      getBottoms(items);

    const dresses =
      getDresses(items);

    const shoes =
      getShoes(items);

    const accessories =
      getAccessories(items);

    const outerwear =
      getOuterwear(items);

    // -------------------------------------------------
    // FIND MENTIONED ITEM
    // -------------------------------------------------

    const mentionedItem =
      findMentionedItem(
        items,
        description
      );

    // -------------------------------------------------
    // SELECT DRESS
    // -------------------------------------------------

    let dress = null;

    if (
      mentionedItem &&
      hasCategory(
        mentionedItem,
        ['dress', 'gown']
      )
    ) {

      dress = mentionedItem;

    } else if (
      style === 'Formal' &&
      dresses.length > 0
    ) {

      dress =
        pickBestItem(
          dresses,
          description
        );
    }

    // -------------------------------------------------
    // SELECT TOP
    // -------------------------------------------------

    let top = null;

    if (!dress) {

      if (
        mentionedItem &&
        hasCategory(
          mentionedItem,
          [
            'top',
            'shirt',
            't-shirt',
            'tshirt',
            'blouse',
            'kurti',
            'hoodie',
            'sweater'
          ]
        )
      ) {

        top = mentionedItem;

      } else {

        top =
          pickBestItem(
            tops,
            description
          );
      }
    }

    // -------------------------------------------------
    // SELECT BOTTOM
    // -------------------------------------------------

    let bottom = null;

    if (!dress) {

      bottom =
        findBestBottom(
          bottoms,
          description,
          top
        );
    }

    // -------------------------------------------------
    // SELECT SHOES
    // -------------------------------------------------

    const selectedShoes =
      findBestShoes(
        shoes,
        description,
        bottom
      );

    // -------------------------------------------------
    // SELECT ACCESSORY
    // -------------------------------------------------

    let accessory = null;

    if (accessories.length > 0) {

      accessory =
        pickBestItem(
          accessories,
          description
        );
    }

    // -------------------------------------------------
    // SELECT OUTERWEAR
    // -------------------------------------------------

    let selectedOuterwear = null;

    if (
      requestedSeason === 'Winter' ||
      style === 'Smart Casual'
    ) {

      selectedOuterwear =
        pickBestItem(
          outerwear,
          description
        );
    }

    // -------------------------------------------------
    // CREATE SUGGESTION
    // -------------------------------------------------

    const suggestion =
      createSuggestion({
        style,
        top,
        bottom,
        dress,
        shoes: selectedShoes,
        accessory,
        outerwear: selectedOuterwear
      });

    // -------------------------------------------------
    // CREATE STYLE TIP
    // -------------------------------------------------

    const styleTip =
      createStyleTip(style);

    // -------------------------------------------------
    // CREATE WHY IT WORKS
    // -------------------------------------------------

    const whyItWorks =
      createWhyItWorks({
        style,
        top,
        bottom,
        dress,
        shoes: selectedShoes,
        accessory
      });

    // -------------------------------------------------
    // CREATE ALTERNATIVE
    // -------------------------------------------------

    const alternative =
      createAlternative(
        items,
        top,
        bottom
      );

    // -------------------------------------------------
    // FINAL ANALYSIS RESULT
    // -------------------------------------------------

    const analysisResult = {

      description,

      style,

      requestedSeason,

      suggestion,

      styleTip,

      whyItWorks,

      alternative,

      outfit: {

        top,

        bottom,

        dress,

        shoes:
          selectedShoes,

        accessory,

        outerwear:
          selectedOuterwear

      },

      wardrobe:
        items
    };

    // -------------------------------------------------
    // SAVE ANALYSIS HISTORY
    // -------------------------------------------------

    try {

      await pool.query(
        `INSERT INTO analysis_history
          (
            user_id,
            image_url,
            analysis_data
          )
         VALUES (?, ?, ?)`,
        [
          user_id,
          image_url || null,
          JSON.stringify(
            analysisResult
          )
        ]
      );

    } catch (historyError) {

      console.error(
        'Unable to save analysis history:',
        historyError
      );
    }

    // -------------------------------------------------
    // SEND RESULT
    // -------------------------------------------------

    return res.json({

      success: true,

      message:
        'Style recommendation generated successfully.',

      analysis:
        analysisResult
    });

  } catch (error) {

    console.error(
      'AI analysis error:',
      error
    );

    return res.status(500).json({

      success: false,

      message:
        'Unable to generate style analysis.'
    });
  }
});

// =====================================================
// VIRTUAL TRY-ON UPLOAD
// =====================================================

const uploadFolder =
  path.join(
    __dirname,
    '../uploads/virtual_try_on'
  );

if (!fs.existsSync(uploadFolder)) {

  fs.mkdirSync(
    uploadFolder,
    {
      recursive: true
    }
  );
}

const storage =
  multer.diskStorage({

    destination:
      (req, file, cb) => {

        cb(
          null,
          uploadFolder
        );
      },

    filename:
      (req, file, cb) => {

        const uniqueName =
          `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;

        cb(
          null,
          uniqueName
        );
      }
  });

const upload =
  multer({
    storage:
      storage
  });

router.post(
  '/virtual-try-on',

  upload.fields([
    {
      name: 'person',
      maxCount: 1
    },
    {
      name: 'clothing',
      maxCount: 1
    }
  ]),

  async (req, res) => {

    try {

      if (
        !req.files ||
        !req.files.person ||
        !req.files.clothing
      ) {

        return res.status(400).json({

          success: false,

          message:
            'Both person and clothing images are required.'
        });
      }

      const personImage =
        req.files.person[0];

      const clothingImage =
        req.files.clothing[0];

      return res.json({

        success: true,

        message:
          'Images uploaded successfully.',

        personImage:
          `/uploads/virtual_try_on/${personImage.filename}`,

        clothingImage:
          `/uploads/virtual_try_on/${clothingImage.filename}`
      });

    } catch (error) {

      console.error(
        'Virtual Try-On upload error:',
        error
      );

      return res.status(500).json({

        success: false,

        message:
          'Unable to upload Virtual Try-On images.'
      });
    }
  }
);

// =====================================================
// ANALYSIS IMAGE UPLOAD
// =====================================================

const analysisUploadDir =
  path.join(
    __dirname,
    '../uploads/analysis'
  );

if (!fs.existsSync(analysisUploadDir)) {

  fs.mkdirSync(
    analysisUploadDir,
    {
      recursive: true
    }
  );
}

const analysisStorage =
  multer.diskStorage({

    destination:
      function (req, file, cb) {

        cb(
          null,
          analysisUploadDir
        );
      },

    filename:
      function (req, file, cb) {

        const extension =
          path.extname(
            file.originalname
          );

        const filename =
          'analysis_' +
          Date.now() +
          extension;

        cb(
          null,
          filename
        );
      }
  });

const analysisUpload =
  multer({
    storage:
      analysisStorage
  });

// =====================================================
// UPLOAD ANALYSIS IMAGE
// POST /api/ai/upload-analysis-image
// =====================================================

router.post(
  '/upload-analysis-image',

  analysisUpload.single('image'),

  async (req, res) => {

    try {

      if (!req.file) {

        return res.status(400).json({

          success: false,

          message:
            'No image uploaded.'
        });
      }

      const imageUrl =
        `/uploads/analysis/${req.file.filename}`;

      return res.json({

        success: true,

        message:
          'Analysis image uploaded successfully.',

        image_url:
          imageUrl
      });

    } catch (error) {

      console.error(
        'Analysis image upload error:',
        error
      );

      return res.status(500).json({

        success: false,

        message:
          'Unable to upload analysis image.'
      });
    }
  }
);

// =====================================================
// GET ANALYSIS HISTORY
// =====================================================

router.get(
  '/history/:userId',

  async (req, res) => {

    try {

      const userId =
        Number(
          req.params.userId
        );

      if (!userId) {

        return res.status(400).json({

          success: false,

          message:
            'Invalid user ID.'
        });
      }

      const [rows] =
        await pool.query(
          `SELECT
            id,
            user_id,
            image_url,
            analysis_data,
            created_at
           FROM analysis_history
           WHERE user_id = ?
           ORDER BY created_at DESC`,
          [userId]
        );

      const history =
        rows.map((row) => {

          let analysis = {};

          try {

            analysis =
              JSON.parse(
                row.analysis_data
              );

          } catch (error) {

            console.error(
              'Unable to parse analysis_data:',
              error
            );
          }

          return {

            id:
              row.id,

            user_id:
              row.user_id,

            image_url:
              row.image_url,

            created_at:
              row.created_at,

            analysis:
              analysis
          };
        });

      return res.json({

        success: true,

        history:
          history
      });

    } catch (error) {

      console.error(
        'Get analysis history error:',
        error
      );

      return res.status(500).json({

        success: false,

        message:
          'Unable to load analysis history.'
      });
    }
  }
);

// =====================================================
// DELETE ANALYSIS HISTORY
// =====================================================

router.delete(
  '/history/:id',

  async (req, res) => {

    try {

      const id =
        Number(
          req.params.id
        );

      if (!id) {

        return res.status(400).json({

          success: false,

          message:
            'Invalid analysis ID.'
        });
      }

      const [result] =
        await pool.query(
          `DELETE FROM analysis_history
           WHERE id = ?`,
          [id]
        );

      if (
        result.affectedRows === 0
      ) {

        return res.status(404).json({

          success: false,

          message:
            'Analysis history item not found.'
        });
      }

      return res.json({

        success: true,

        message:
          'Analysis removed from history.'
      });

    } catch (error) {

      console.error(
        'Delete analysis history error:',
        error
      );

      return res.status(500).json({

        success: false,

        message:
          'Unable to delete analysis history.'
      });
    }
  }
);

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;
