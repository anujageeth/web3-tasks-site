const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const Event = require('../models/Event');
const UserTask = require('../models/UserTask');

// Get the current user's profile
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-nonce');
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/', auth, async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;
    
    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }
    }
    
    // Find and update the user
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update fields only if they are provided
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (email !== undefined) user.email = email;
    
    await user.save();
    
    // Return the updated user (without nonce)
    res.json({
      _id: user._id,
      address: user.address,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile by address
router.get('/:address', auth, async (req, res) => {
  try {
    const address = req.params.address.toLowerCase();
    
    // Find user by address
    const user = await User.findOne({ address }).select('-nonce -twitterTokenKey -twitterTokenSecret');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get count of created and joined events
    const createdEvents = await Event.find({ creator: user._id });
    const joinedEvents = user.joinedEvents ? user.joinedEvents.length : 0;
    
    res.json({
      _id: user._id,
      address: user.address,
      firstName: user.firstName,
      lastName: user.lastName,
      totalPoints: user.totalPoints,
      twitterId: user.twitterId,
      twitterUsername: user.twitterUsername,
      verified: user.verified,  // Add this line
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      createdEvents: createdEvents,
      joinedEvents: joinedEvents
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's completed tasks
router.get('/:address/tasks', auth, async (req, res) => {
  try {
    const address = req.params.address.toLowerCase();
    
    // Find user by address
    const user = await User.findOne({ address });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get completed tasks for this user
    const userTasks = await UserTask.find({
      user: user._id,
      completed: true
    })
    .populate('task event')
    .sort({ completedAt: -1 });
    
    // Format the response
    const taskHistory = userTasks.map(ut => ({
      _id: ut._id,
      eventId: ut.event._id,
      eventTitle: ut.event.title,
      taskId: ut.task._id,
      taskType: ut.task.taskType,
      platform: ut.task.platform,
      description: ut.task.description,
      pointsEarned: ut.pointsEarned,
      completedAt: ut.completedAt
    }));
    
    res.json(taskHistory);
  } catch (error) {
    console.error('Get user tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;