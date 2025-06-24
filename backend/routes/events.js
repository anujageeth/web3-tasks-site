const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Task = require('../models/Task');
const UserTask = require('../models/UserTask');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Create a new event
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, startDate, endDate, imageUrl } = req.body;

    // Input validation
    if (!title || !description || !endDate) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const event = new Event({
      creator: req.user._id,
      title,
      description,
      startDate: startDate || Date.now(),
      endDate,
      imageUrl
    });

    await event.save();

    // Add to user's created events
    await User.findByIdAndUpdate(req.user._id, { 
      $push: { createdEvents: event._id } 
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all events (with pagination)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const events = await Event.find()
      .populate('creator', 'address firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Event.countDocuments();

    res.json({
      events,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single event by ID
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('creator', 'address firstName lastName')
      .populate('participants.user', 'address firstName lastName');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Get tasks for this event
    const tasks = await Task.find({ event: event._id });

    res.json({
      event,
      tasks
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update an event
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, startDate, endDate, isActive, imageUrl } = req.body;
    
    // Find event and check ownership
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if user is the creator
    if (event.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this event' });
    }
    
    // Update fields
    if (title) event.title = title;
    if (description) event.description = description;
    if (startDate) event.startDate = startDate;
    if (endDate) event.endDate = endDate;
    if (imageUrl) event.imageUrl = imageUrl;
    if (isActive !== undefined) event.isActive = isActive;
    
    await event.save();
    
    res.json(event);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete an event
router.delete('/:id', auth, async (req, res) => {
  try {
    // Find event and check ownership
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if user is the creator
    if (event.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }
    
    // Delete associated tasks
    await Task.deleteMany({ event: event._id });
    
    // Delete user task entries
    await UserTask.deleteMany({ event: event._id });
    
    // Remove from users' joined events
    await User.updateMany(
      { joinedEvents: event._id },
      { $pull: { joinedEvents: event._id } }
    );
    
    // Remove from creator's created events
    await User.updateOne(
      { _id: req.user._id },
      { $pull: { createdEvents: event._id } }
    );
    
    // Delete the event
    await Event.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Join an event
router.post('/:id/join', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if event is active
    if (!event.isActive) {
      return res.status(400).json({ message: 'This event is no longer active' });
    }
    
    // Check if user already joined
    const alreadyJoined = event.participants.some(
      participant => participant.user.toString() === req.user._id.toString()
    );
    
    if (alreadyJoined) {
      return res.status(400).json({ message: 'You have already joined this event' });
    }
    
    // Add user to participants
    event.participants.push({
      user: req.user._id,
      joinedAt: Date.now(),
      pointsEarned: 0
    });
    
    await event.save();
    
    // Add event to user's joined events
    await User.findByIdAndUpdate(req.user._id, {
      $push: { joinedEvents: event._id }
    });
    
    // Create UserTask entries for all tasks in this event
    const tasks = await Task.find({ event: event._id });
    
    const userTaskPromises = tasks.map(task => {
      const userTask = new UserTask({
        user: req.user._id,
        task: task._id,
        event: event._id,
        completed: false
      });
      return userTask.save();
    });
    
    await Promise.all(userTaskPromises);
    
    res.json({ message: 'Event joined successfully' });
  } catch (error) {
    console.error('Join event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get events created by the current user
router.get('/user/created', auth, async (req, res) => {
  try {
    const events = await Event.find({ creator: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json(events);
  } catch (error) {
    console.error('Get created events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get events joined by the current user
router.get('/user/joined', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'joinedEvents',
      options: { sort: { createdAt: -1 } }
    });
    
    res.json(user.joinedEvents);
  } catch (error) {
    console.error('Get joined events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;