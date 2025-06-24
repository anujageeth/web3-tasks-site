const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Task = require('../models/Task');
const UserTask = require('../models/UserTask');
const TwitterAPI = require('twitter-api-v2').TwitterApi;

// Twitter OAuth 1.0a setup
const twitterClient = new TwitterAPI({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

// Store OAuth tokens for use later in the authentication flow
const oauthTokens = {}; // In production, use Redis or similar

// Initiate Twitter auth
router.get('/auth', auth, async (req, res) => {
  try {
    const callbackUrl = req.query.callbackUrl || `${process.env.FRONTEND_URL}/api/twitter/callback`;
    
    // Get auth link from Twitter
    const { url, oauth_token, oauth_token_secret } = await twitterClient.generateAuthLink(callbackUrl);
    
    // Store tokens temporarily (with user ID for association)
    oauthTokens[oauth_token] = {
      oauth_token_secret,
      userId: req.user._id.toString()
    };
    
    // Send the auth URL back to the client
    res.json({ authUrl: url });
  } catch (error) {
    console.error('Twitter auth initiation error:', error);
    res.status(500).json({ message: 'Failed to initiate Twitter authentication' });
  }
});

// Handle Twitter auth callback
router.get('/callback', async (req, res) => {
  try {
    const { oauth_token, oauth_verifier } = req.query;
    
    if (!oauth_token || !oauth_verifier || !oauthTokens[oauth_token]) {
      return res.status(400).json({ message: 'Invalid or expired OAuth request' });
    }
    
    const { oauth_token_secret, userId } = oauthTokens[oauth_token];
    
    // Finalize auth with Twitter
    const client = new TwitterAPI({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
    });
    
    // Get the final access tokens
    const { accessToken, accessSecret, screenName, userId: twitterId } = 
      await client.login(oauth_verifier, { 
        key: oauth_token, 
        secret: oauth_token_secret 
      });
    
    // Update user with Twitter credentials
    await User.findByIdAndUpdate(userId, {
      twitterId,
      twitterUsername: screenName,
      twitterTokenKey: accessToken,
      twitterTokenSecret: accessSecret
    });
    
    // Clean up stored token
    delete oauthTokens[oauth_token];
    
    // Redirect back to frontend
    res.json({ success: true, username: screenName });
  } catch (error) {
    console.error('Twitter callback error:', error);
    res.status(500).json({ message: 'Twitter authentication failed' });
  }
});

// Disconnect Twitter
router.post('/disconnect', auth, async (req, res) => {
  try {
    // Remove Twitter credentials from user
    await User.findByIdAndUpdate(req.user._id, {
      $unset: {
        twitterId: "",
        twitterUsername: "",
        twitterTokenKey: "",
        twitterTokenSecret: ""
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Twitter disconnect error:', error);
    res.status(500).json({ message: 'Failed to disconnect Twitter account' });
  }
});

// Verify Twitter task completion
router.post('/verify-task', auth, async (req, res) => {
  try {
    const { taskId, taskType, linkUrl } = req.body;
    
    // Check if user has Twitter connected
    if (!req.user.twitterId || !req.user.twitterTokenKey || !req.user.twitterTokenSecret) {
      return res.status(400).json({ 
        message: 'Twitter account not connected',
        twitterRequired: true
      });
    }
    
    // Validate task
    const task = await Task.findById(taskId);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if task is of Twitter platform
    if (task.platform !== 'twitter') {
      return res.status(400).json({ message: 'This is not a Twitter task' });
    }
    
    // Check if task is already completed
    const userTask = await UserTask.findOne({ user: req.user._id, task: taskId });
    
    if (!userTask) {
      return res.status(404).json({ message: 'User task not found' });
    }
    
    if (userTask.completed) {
      return res.status(400).json({ message: 'Task already completed' });
    }
    
    // Parse Twitter content ID from URL
    let contentId;
    try {
      // Extract username and tweet ID from URL patterns like:
      // https://twitter.com/username/status/1234567890
      // https://x.com/username/status/1234567890
      const urlMatch = linkUrl.match(/(?:twitter\.com|x\.com)\/(.+?)\/status\/(\d+)/);
      
      if (!urlMatch) {
        throw new Error('Could not parse Twitter URL');
      }
      
      const username = urlMatch[1];
      contentId = urlMatch[2]; // Tweet ID
      
      // Create a user-specific Twitter client
      const userTwitterClient = new TwitterAPI({
        appKey: process.env.TWITTER_API_KEY,
        appSecret: process.env.TWITTER_API_SECRET,
        accessToken: req.user.twitterTokenKey,
        accessSecret: req.user.twitterTokenSecret
      });
      
      let verified = false;
      
      // Verify based on task type
      switch (taskType) {
        case 'follow':
          // Extract username from URL patterns like:
          // https://twitter.com/username
          // https://x.com/username
          const followUrlMatch = linkUrl.match(/(?:twitter\.com|x\.com)\/([^\/]+)$/);
          const followUsername = followUrlMatch ? followUrlMatch[1] : username;
          
          // Check if user follows the account
          const followingResponse = await userTwitterClient.v2.following(req.user.twitterId, {
            max_results: 100 // Adjust as needed
          });
          
          // Look for the username in the following list
          verified = followingResponse.data.some(u => 
            u.username.toLowerCase() === followUsername.toLowerCase()
          );
          break;
          
        case 'like':
          // Check if user liked the tweet
          const likedTweets = await userTwitterClient.v2.likedTweets(req.user.twitterId, {
            max_results: 100 // Adjust as needed
          });
          
          verified = likedTweets.data.some(tweet => tweet.id === contentId);
          break;
          
        case 'repost':
          // Check for retweets
          const userTweets = await userTwitterClient.v2.userTimeline(req.user.twitterId, {
            max_results: 100 // Adjust as needed
          });
          
          verified = userTweets.data.some(tweet => 
            tweet.referenced_tweets && 
            tweet.referenced_tweets.some(rt => rt.type === 'retweeted' && rt.id === contentId)
          );
          break;
          
        default:
          return res.status(400).json({ message: 'Unsupported task type for verification' });
      }
      
      if (verified) {
        // Mark the task as completed
        userTask.completed = true;
        userTask.completedAt = Date.now();
        userTask.pointsEarned = task.pointsValue;
        userTask.verificationData = { method: 'twitter_api', timestamp: Date.now() };
        await userTask.save();
        
        // Update user's total points
        await User.findByIdAndUpdate(req.user._id, {
          $inc: { totalPoints: task.pointsValue }
        });
        
        // Update event participant points
        await Event.updateOne(
          { _id: task.event, 'participants.user': req.user._id },
          { $inc: { 'participants.$.pointsEarned': task.pointsValue } }
        );
        
        return res.json({
          success: true,
          pointsEarned: task.pointsValue,
          message: `Task verified and completed! You earned ${task.pointsValue} points.`
        });
      } else {
        return res.status(400).json({ 
          message: `Verification failed. Make sure you've ${
            taskType === 'follow' ? 'followed the account' : 
            taskType === 'like' ? 'liked the tweet' : 
            'retweeted the post'
          } and try again.`
        });
      }
      
    } catch (error) {
      console.error('Twitter content verification error:', error);
      return res.status(400).json({ 
        message: 'Could not verify task. Please check the URL and try again.' 
      });
    }
    
  } catch (error) {
    console.error('Twitter task verification error:', error);
    res.status(500).json({ message: 'Verification error' });
  }
});

module.exports = router;