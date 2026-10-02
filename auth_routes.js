const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const { pool } = require('../db');

const router = express.Router();
const googleClient = new OAuth2Client();


// =====================================================
// REGISTER
// =====================================================

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least 6 characters.'
      });
    }

    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO users (name, email, password)
       VALUES (?, ?, ?)`,
      [name, email, hashedPassword]
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      user: {
        id: result.insertId,
        name,
        email
      }
    });

  } catch (error) {
    console.error('Register error:', error);

    res.status(500).json({
      success: false,
      message: 'Registration failed.'
    });
  }
});


// =====================================================
// LOGIN
// =====================================================

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const [users] = await pool.query(
      `SELECT id, name, email, password
       FROM users
       WHERE email = ?`,
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const user = users[0];

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d'
      }
    );

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);

    res.status(500).json({
      success: false,
      message: 'Login failed.'
    });
  }
});


// =====================================================
// GOOGLE LOGIN
// =====================================================

router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Google ID token is required.'
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: idToken
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Google token.'
      });
    }

    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name || 'Google User';

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Google account email not available.'
      });
    }

    const [existingUsers] = await pool.query(
      `SELECT id, name, email
       FROM users
       WHERE email = ?`,
      [email]
    );

    let user;

    if (existingUsers.length > 0) {
      user = existingUsers[0];
    } else {
      const [result] = await pool.query(
        `INSERT INTO users (name, email, password)
         VALUES (?, ?, ?)`,
        [
          name,
          email,
          `google_${googleId}`
        ]
      );

      user = {
        id: result.insertId,
        name: name,
        email: email
      };
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d'
      }
    );

    res.json({
      success: true,
      message: 'Google login successful.',
      token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Google login error:', error);

    res.status(401).json({
      success: false,
      message: 'Google authentication failed.'
    });
  }
});


// =====================================================
// GET CURRENT USER
// =====================================================

router.get('/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await pool.query(
      `SELECT id, name, email, created_at
       FROM users
       WHERE id = ?`,
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    res.json({
      success: true,
      user: users[0]
    });

  } catch (error) {
    console.error('Profile error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to load profile.'
    });
  }
});


module.exports = router;
