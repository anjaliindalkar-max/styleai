const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// =====================================================
// LOAD ENVIRONMENT VARIABLES FIRST
// =====================================================

dotenv.config();

// =====================================================
// IMPORT DATABASE AND ROUTES
// =====================================================

const { testDatabaseConnection } = require('./db');

const authRoutes = require('./routes/auth_routes');
const wardrobeRoutes = require('./routes/wardrobe_routes');
const favoriteRoutes = require('./routes/favorite_routes');
const plannerRoutes = require('./routes/planner_routes');
const aiRoutes = require('./routes/ai_routes');

// =====================================================
// CREATE APP
// =====================================================

const app = express();

const PORT = process.env.PORT || 5000;

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true
  })
);

// =====================================================
// STATIC UPLOADS
// =====================================================

app.use(
  '/uploads',
  express.static('uploads')
);

// =====================================================
// TEST ROUTE
// =====================================================

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'StyleAI Backend is running'
  });
});

// =====================================================
// HEALTH CHECK
// =====================================================

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'StyleAI API is working'
  });
});

// =====================================================
// ROUTES
// =====================================================

app.use(
  '/api/auth',
  authRoutes
);

app.use(
  '/api/wardrobe',
  wardrobeRoutes
);

app.use(
  '/api/favorites',
  favoriteRoutes
);

app.use(
  '/api/planner',
  plannerRoutes
);

app.use(
  '/api/ai',
  aiRoutes
);

// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, async () => {

  console.log(
    `StyleAI server running on port ${PORT}`
  );

  await testDatabaseConnection();

});
