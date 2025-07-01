const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Submit feedback
router.post('/', auth, async (req, res) => {
  try {
    const { type, section, description } = req.body;

    // Validation
    if (!type || !section || !description) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!['error', 'suggestion'].includes(type)) {
      return res.status(400).json({ message: 'Invalid feedback type' });
    }

    const validSections = ['home', 'login', 'logout', 'dashboard', 'events', 'tasks', 'profile', 'account connect', 'other'];
    if (!validSections.includes(section)) {
      return res.status(400).json({ message: 'Invalid section' });
    }

    if (description.length < 10 || description.length > 500) {
      return res.status(400).json({ message: 'Description must be between 10 and 500 characters' });
    }

    // Create feedback
    const feedback = new Feedback({
      user: req.user._id,
      type,
      section,
      description: description.trim()
    });

    await feedback.save();

    console.log(`New ${type} feedback submitted by user ${req.user.address} for section: ${section}`);

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback: {
        _id: feedback._id,
        type: feedback.type,
        section: feedback.section,
        description: feedback.description,
        createdAt: feedback.createdAt
      }
    });
  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({ message: 'Failed to submit feedback' });
  }
});

// Get user's feedback history (optional)
router.get('/my-feedback', auth, async (req, res) => {
  try {
    const feedback = await Feedback.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select('-user -adminNotes');

    res.json(feedback);
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({ message: 'Failed to get feedback' });
  }
});

// Admin routes (for future use)
router.get('/admin/all', auth, async (req, res) => {
  try {
    // Add admin check here in the future
    const feedback = await Feedback.find()
      .populate('user', 'address firstName lastName')
      .sort({ createdAt: -1 });

    res.json(feedback);
  } catch (error) {
    console.error('Get all feedback error:', error);
    res.status(500).json({ message: 'Failed to get feedback' });
  }
});

module.exports = router;