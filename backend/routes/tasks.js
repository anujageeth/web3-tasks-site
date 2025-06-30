const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Event = require('../models/Event');
const UserTask = require('../models/UserTask');
const User = require('../models/User');
const auth = require('../middleware/auth');

function extractUsernameFromUrl(url, platform) {
  try {
    const urlObj = new URL(url);
    
    if (platform === 'twitter' || platform === 'x') {
      // Extract username from twitter.com/username or x.com/username
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      return pathParts.length > 0 ? pathParts[0] : null;
    }
    
    if (platform === 'youtube') {
      // Extract from youtube.com/@username
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      return pathParts.length > 0 ? pathParts[0].replace(/^@/, '') : null;
    }
    
    if (platform === 'instagram') {
      // Extract from instagram.com/username
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      return pathParts.length > 0 ? pathParts[0] : null;
    }
    
    if (platform === 'facebook') {
      // Extract from facebook.com/pagename
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      return pathParts.length > 0 ? pathParts[0] : null;
    }
    
    if (platform === 'telegram') {
      // Extract from t.me/channelname
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      return pathParts.length > 0 ? pathParts[0] : null;
    }
    
    return null;
  } catch (e) {
    console.error('Error extracting username from URL:', e);
    return null;
  }
}

// Helper function to generate default task descriptions
function getDefaultTaskDescription(taskType, platform, customPlatform = '', linkUrl = '') {
  // Use linkUrl instead of url variable which was undefined
  const username = linkUrl ? extractUsernameFromUrl(linkUrl, platform) : null;
  const usernameText = username ? `@${username}` : '';
  
  // Handle Twitter tasks
  if (platform === 'twitter') {
    if (taskType === 'follow') return `Follow ${usernameText || 'the account'} on Twitter`;
    if (taskType === 'like') return 'Like the tweet';
    if (taskType === 'repost') return 'Retweet the post';
    if (taskType === 'comment') return 'Comment on the tweet';
    return `${taskType.charAt(0).toUpperCase() + taskType.slice(1)} on Twitter`;
  }
  
  // Handle YouTube tasks
  if (platform === 'youtube') {
    if (taskType === 'subscribe') return `Subscribe to ${usernameText} on YouTube`;
    if (taskType === 'like_video') return 'Like the YouTube video';
    if (taskType === 'comment_video') return 'Comment on the YouTube video';
    return `${taskType.charAt(0).toUpperCase() + taskType.slice(1)} on YouTube`;
  }
  
  // Handle Instagram tasks
  if (platform === 'instagram') {
    if (taskType === 'follow') return `Follow ${usernameText} on Instagram`;
    if (taskType === 'like_post') return 'Like the Instagram post';
    if (taskType === 'comment_post') return 'Comment on the Instagram post';
    return `${taskType.charAt(0).toUpperCase() + taskType.slice(1)} on Instagram`;
  }
  
  // Handle Telegram tasks
  if (platform === 'telegram') {
    if (taskType === 'join_channel') return `Join ${usernameText} Telegram channel`;
    if (taskType === 'join_group') return `Join ${usernameText} Telegram group`;
    if (taskType === 'start_bot') return `Start the ${usernameText} Telegram bot`;
    return `${taskType.charAt(0).toUpperCase() + taskType.slice(1)} on Telegram`;
  }
  
  // Handle YouTube tasks
  if (platform === 'youtube') {
    if (taskType === 'subscribe') return 'Subscribe to the YouTube channel';
    if (taskType === 'like_video') return 'Like the YouTube video';
    if (taskType === 'comment_video') return 'Comment on the YouTube video';
    return `${taskType.charAt(0).toUpperCase() + taskType.slice(1)} on YouTube`;
  }
  
  // Handle Instagram tasks
  if (platform === 'instagram') {
    if (taskType === 'follow') return 'Follow the Instagram account';
    if (taskType === 'like_post') return 'Like the Instagram post';
    if (taskType === 'comment_post') return 'Comment on the Instagram post';
    return `${taskType.charAt(0).toUpperCase() + taskType.slice(1)} on Instagram`;
  }
  
  // Handle Facebook tasks
  if (platform === 'facebook') {
    if (taskType === 'follow_page') return 'Follow the Facebook page';
    if (taskType === 'like_post') return 'Like the Facebook post';
    if (taskType === 'comment_post') return 'Comment on the Facebook post';
    return `${taskType.charAt(0).toUpperCase() + taskType.slice(1)} on Facebook`;
  }
  
  // Handle Website tasks
  if (platform === 'website') {
    return 'Visit the website';
  }
  
  // Handle custom platforms
  if (platform === 'other' && customPlatform) {
    return `Complete the ${taskType} task on ${customPlatform}`;
  }
  
  // Generic fallback
  return `Complete the ${taskType} task`;
}

// Add task to an event
router.post('/', auth, async (req, res) => {
  try {
    const { eventId, taskType, platform, description, pointsValue, linkUrl, isRequired, customPlatform } = req.body;
    
    if (!eventId || !taskType || !platform || !pointsValue || !linkUrl) {
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
    
    // Create the task with the proper platform name
    const task = new Task({
      event: eventId,
      taskType,
      platform, // Use the standard platform or 'other'
      description: description || getDefaultTaskDescription(taskType, platform, customPlatform, linkUrl),
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
    
    // Return specific validation errors if present
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      for (const field in error.errors) {
        validationErrors[field] = error.errors[field].message;
      }
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: validationErrors 
      });
    }
    
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

// Complete a task by ID
router.post('/:id/complete', auth, async (req, res) => {
  try {
    const { proof } = req.body; // Optional proof of completion
    
    // Find the task
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Get user details to check social media connections
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check platform-specific requirements
    switch (task.platform) {
      case 'twitter':
        if (!user.twitterId) {
          return res.status(400).json({ 
            message: 'You must connect your Twitter account to complete Twitter tasks. Please go to your profile settings to connect Twitter.',
            requiresConnection: 'twitter'
          });
        }
        break;
        
      case 'telegram':
        if (!user.telegramId) {
          return res.status(400).json({ 
            message: 'You must connect your Telegram account to complete Telegram tasks. Please go to your profile settings to connect Telegram.',
            requiresConnection: 'telegram'
          });
        }
        break;
        
      case 'discord':
        if (!user.discordId) {
          return res.status(400).json({ 
            message: 'You must connect your Discord account to complete Discord tasks. Please go to your profile settings to connect Discord.',
            requiresConnection: 'discord'
          });
        }
        break;
        
      case 'youtube':
        if (!user.googleId) {
          return res.status(400).json({ 
            message: 'You must connect your Google account to complete YouTube tasks. Please go to your profile settings to connect Google.',
            requiresConnection: 'google'
          });
        }
        break;
        
      // Instagram and Facebook might also require connections in the future
      case 'instagram':
        // For now, allow without connection, but you can add this later
        break;
        
      case 'facebook':
        // For now, allow without connection, but you can add this later
        break;
        
      // Website and other platforms don't require social media connections
      case 'website':
      case 'other':
        break;
        
      default:
        // Allow completion for unknown platforms
        break;
    }
    
    // Find the user task entry
    let userTask = await UserTask.findOne({
      user: req.user._id,
      task: task._id
    });
    
    if (!userTask) {
      // If user task doesn't exist, create one (this happens for new participants)
      userTask = new UserTask({
        user: req.user._id,
        task: task._id,
        event: task.event,
        completed: false
      });
      await userTask.save();
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
      userTask.verificationData = { proof, timestamp: Date.now() };
    } else {
      userTask.verificationData = { 
        method: 'self_verification', 
        platform: task.platform,
        taskType: task.taskType,
        connectedAccount: getConnectedAccountInfo(user, task.platform),
        timestamp: Date.now() 
      };
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

// Helper function to get connected account info for verification
function getConnectedAccountInfo(user, platform) {
  switch (platform) {
    case 'twitter':
      return user.twitterUsername ? `@${user.twitterUsername}` : 'Connected';
    case 'telegram':
      return user.telegramUsername ? `@${user.telegramUsername}` : 'Connected';
    case 'discord':
      return user.discordUsername || 'Connected';
    case 'youtube':
      return user.googleEmail || 'Connected';
    default:
      return 'Not applicable';
  }
}

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

// Get task history for current user
router.get('/history', auth, async (req, res) => {
  try {
    // Get completed tasks for this user
    const userTasks = await UserTask.find({
      user: req.user._id,
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
    console.error('Get task history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;