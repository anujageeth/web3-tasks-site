const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Event = require('../models/Event');
const UserTask = require('../models/UserTask');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Add task to an event
router.post('/', auth, async (req, res) => {
  try {
    const { eventId, taskType, platform, description, pointsValue, linkUrl, isRequired } = req.body;
    
    if (!eventId || !taskType || !platform || !description || !pointsValue || !linkUrl) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    // Verify event exists and user is the creator
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    if (event.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to add tasks to this event' });
    }
    
    const task = new Task({
      event: eventId,
      taskType,
      platform,
      description,
      pointsValue: Number(pointsValue),
      linkUrl,
      isRequired: Boolean(isRequired)
    });
    
    await task.save();
    
    // Update event total points
    event.totalPoints += task.pointsValue;
    await event.save();
    
    // Create UserTask entries for all participants
    if (event.participants && event.participants.length > 0) {
      const userTaskPromises = event.participants.map(participant => {
        const userTask = new UserTask({
          user: participant.user,
          task: task._id,
          event: event._id,
          completed: false
        });
        return userTask.save();
      });
      
      await Promise.all(userTaskPromises);
    }
    
    res.status(201).json(task);
  } catch (error) {
    console.error('Add task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get tasks for an event
router.get('/event/:eventId', async (req, res) => {
  try {
    const tasks = await Task.find({ event: req.params.eventId })
      .sort({ createdAt: 1 });
    
    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a task
router.put('/:id', auth, async (req, res) => {
  try {
    const { taskType, platform, description, pointsValue, linkUrl, isRequired } = req.body;
    
    // Find task and associated event
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Verify user is the event creator
    const event = await Event.findById(task.event);
    
    if (!event) {
      return res.status(404).json({ message: 'Associated event not found' });
    }
    
    if (event.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }
    
    // Calculate point difference for event total
    const pointDifference = pointsValue ? (Number(pointsValue) - task.pointsValue) : 0;
    
    // Update task fields
    if (taskType) task.taskType = taskType;
    if (platform) task.platform = platform;
    if (description) task.description = description;
    if (pointsValue) task.pointsValue = Number(pointsValue);
    if (linkUrl) task.linkUrl = linkUrl;
    if (isRequired !== undefined) task.isRequired = Boolean(isRequired);
    
    await task.save();
    
    // Update event total points
    if (pointDifference !== 0) {
      event.totalPoints += pointDifference;
      await event.save();
    }
    
    res.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a task
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Verify user is the event creator
    const event = await Event.findById(task.event);
    
    if (!event) {
      return res.status(404).json({ message: 'Associated event not found' });
    }
    
    if (event.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }
    
    // Update event total points
    event.totalPoints -= task.pointsValue;
    await event.save();
    
    // Delete associated user task entries
    await UserTask.deleteMany({ task: task._id });
    
    // Delete the task
    await Task.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark task as completed by user
router.post('/:id/complete', auth, async (req, res) => {
  try {
    const { proof } = req.body; // Optional proof of completion
    
    // Find the task
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Find the user task entry
    let userTask = await UserTask.findOne({
      user: req.user._id,
      task: task._id
    });
    
    if (!userTask) {
      return res.status(404).json({ message: 'You have not joined this event' });
    }
    
    if (userTask.completed) {
      return res.status(400).json({ message: 'Task already completed' });
    }
    
    // Find event to check if it's still active
    const event = await Event.findById(task.event);
    
    if (!event || !event.isActive) {
      return res.status(400).json({ message: 'Event is no longer active' });
    }
    
    // Mark task as completed
    userTask.completed = true;
    userTask.completedAt = Date.now();
    userTask.pointsEarned = task.pointsValue;
    
    if (proof) {
      userTask.verificationData = { proof };
    }
    
    await userTask.save();
    
    // Update user's total points
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { totalPoints: task.pointsValue }
    });
    
    // Update participant's points in the event
    await Event.updateOne(
      { 
        _id: event._id,
        'participants.user': req.user._id 
      },
      { 
        $inc: { 'participants.$.pointsEarned': task.pointsValue } 
      }
    );
    
    res.json({ 
      success: true,
      pointsEarned: task.pointsValue,
      message: `Task completed! You earned ${task.pointsValue} points.`
    });
  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get tasks status for current user in an event
router.get('/user/event/:eventId', auth, async (req, res) => {
  try {
    const userTasks = await UserTask.find({
      user: req.user._id,
      event: req.params.eventId
    }).populate('task');
    
    res.json(userTasks);
  } catch (error) {
    console.error('Get user tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;