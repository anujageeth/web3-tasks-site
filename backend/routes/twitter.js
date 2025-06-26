const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Task = require('../models/Task');
const UserTask = require('../models/UserTask');
const { TwitterApi } = require('twitter-api-v2');
const OAuth = require('oauth-1.0a');
const crypto = require('crypto');
const Event = require('../models/Event');

// Log Twitter API configuration at startup
console.log('Twitter API configuration:', {
  apiKeyFirstChars: process.env.TWITTER_API_KEY ? process.env.TWITTER_API_KEY.substring(0, 4) + '...' : 'MISSING',
  apiSecretLength: process.env.TWITTER_API_SECRET ? process.env.TWITTER_API_SECRET.length : 0,
  accessTokenFirstChars: process.env.TWITTER_ACCESS_TOKEN ? process.env.TWITTER_ACCESS_TOKEN.substring(0, 4) + '...' : 'MISSING',
  accessSecretLength: process.env.TWITTER_ACCESS_SECRET ? process.env.TWITTER_ACCESS_SECRET.length : 0
});

// Create app-only client for authentication and public data
const appOnlyClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);
const readOnlyClient = appOnlyClient.readOnly;

// Create OAuth 1.0a instance for user authentication
const oauth = new OAuth({
  consumer: {
    key: process.env.TWITTER_API_KEY,
    secret: process.env.TWITTER_API_SECRET
  },
  signature_method: 'HMAC-SHA1',
  hash_function(base_string, key) {
    return crypto
      .createHmac('sha1', key)
      .update(base_string)
      .digest('base64');
  }
});

// Store OAuth tokens for use later in the authentication flow
const oauthTokens = {}; // In production, use Redis or similar

// Add a cleanup function to remove old tokens
const cleanupOldTokens = () => {
  const now = Date.now();
  const expireTime = 30 * 60 * 1000; // 30 minutes
  
  Object.keys(oauthTokens).forEach(token => {
    if (now - oauthTokens[token].timestamp > expireTime) {
      console.log('Cleaning up expired token:', token.substring(0, 10));
      delete oauthTokens[token];
    }
  });
};

// Run cleanup every 10 minutes
setInterval(cleanupOldTokens, 10 * 60 * 1000);

// Initiate Twitter auth
router.get('/auth', auth, async (req, res) => {
  try {
    console.log('Starting Twitter auth process for user:', req.user._id);
    
    // Get callback URL from query parameter
    const callbackUrl = req.query.callbackUrl || 
                       (process.env.FRONTEND_URL || 'http://localhost:3001') + '/api/twitter/callback';
    
    console.log('Using callback URL:', callbackUrl);
    
    // Request token endpoint
    const requestTokenURL = 'https://api.twitter.com/oauth/request_token';
    
    // Prepare auth header
    const requestData = {
      url: requestTokenURL,
      method: 'POST',
      data: { oauth_callback: callbackUrl }
    };
    
    // Get authorization header
    const authHeader = oauth.toHeader(oauth.authorize(requestData));
    
    // Make the request manually
    const fetch = require('node-fetch');
    const response = await fetch(requestTokenURL, {
      method: 'POST',
      headers: {
        ...authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `oauth_callback=${encodeURIComponent(callbackUrl)}`
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Twitter API error:', {
        status: response.status,
        response: errorText
      });
      throw new Error(`Twitter API error (${response.status}): ${errorText}`);
    }
    
    const responseText = await response.text();
    const responseParams = new URLSearchParams(responseText);
    
    const oauth_token = responseParams.get('oauth_token');
    const oauth_token_secret = responseParams.get('oauth_token_secret');
    
    if (!oauth_token || !oauth_token_secret) {
      console.error('Invalid response from Twitter:', responseText);
      throw new Error('Invalid response from Twitter API');
    }
    
    // Store tokens temporarily with timestamp
    oauthTokens[oauth_token] = {
      oauth_token_secret,
      userId: req.user._id.toString(),
      timestamp: Date.now()
    };
    
    // Construct auth URL
    const authUrl = `https://api.twitter.com/oauth/authorize?oauth_token=${oauth_token}`;
    
    console.log('Generated Twitter auth URL:', {
      token: oauth_token.substring(0, 10) + '...',
      url: authUrl.substring(0, 50) + '...',
    });
    
    // Send the auth URL back to the client
    res.json({ authUrl });
  } catch (error) {
    console.error('Twitter auth initiation error:', error);
    res.status(500).json({ message: `Failed to initiate Twitter authentication: ${error.message}` });
  }
});

// Handle Twitter auth callback
router.get('/callback', async (req, res) => {
  try {
    const { oauth_token, oauth_verifier } = req.query;
    
    console.log('Twitter callback received with tokens:', { 
      oauth_token: oauth_token ? oauth_token.substring(0, 10) + '...' : 'MISSING', 
      oauth_verifier: oauth_verifier ? '✓' : '✗' 
    });
    
    if (!oauth_token || !oauth_verifier || !oauthTokens[oauth_token]) {
      console.error('Invalid or expired OAuth request', { 
        hasOauthToken: !!oauth_token, 
        hasOauthVerifier: !!oauth_verifier, 
        storedTokenExists: oauth_token ? (!!oauthTokens[oauth_token]) : false,
        storedTokensCount: Object.keys(oauthTokens).length
      });
      return res.status(400).json({ message: 'Invalid or expired OAuth request' });
    }
    
    const { oauth_token_secret, userId } = oauthTokens[oauth_token];
    
    // Find the user 
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found:', userId);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('Found user for token:', user.email || user.address);
    
    try {
      const accessTokenURL = 'https://api.twitter.com/oauth/access_token';
      
      // Prepare auth header for access token request
      const requestData = {
        url: accessTokenURL,
        method: 'POST',
      };
      
      // Get authorization header with the oauth_verifier
      const authHeader = oauth.toHeader(
        oauth.authorize(requestData, {
          key: oauth_token,
          secret: oauth_token_secret,
        })
      );
      
      // Make the access token request
      const fetch = require('node-fetch');
      const response = await fetch(accessTokenURL, {
        method: 'POST',
        headers: {
          ...authHeader,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `oauth_token=${oauth_token}&oauth_verifier=${oauth_verifier}`
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Twitter access token error:', {
          status: response.status,
          response: errorText
        });
        throw new Error(`Twitter access token error: ${errorText}`);
      }
      
      const accessTokenData = await response.text();
      const accessParams = new URLSearchParams(accessTokenData);
      
      const accessToken = accessParams.get('oauth_token');
      const accessSecret = accessParams.get('oauth_token_secret');
      const twitterUserId = accessParams.get('user_id');
      const screenName = accessParams.get('screen_name');
      
      if (!accessToken || !accessSecret || !twitterUserId) {
        console.error('Invalid access token response:', accessTokenData);
        throw new Error('Failed to get valid access token');
      }
      
      console.log('Twitter login successful as:', screenName);
      
      // Update user with Twitter credentials
      await User.findByIdAndUpdate(userId, {
        twitterId: twitterUserId,
        twitterUsername: screenName,
        twitterTokenKey: accessToken,
        twitterTokenSecret: accessSecret
      });
      
      console.log('User updated with Twitter credentials');
      
      // Clean up stored token
      delete oauthTokens[oauth_token];
      
      // Return success
      res.json({ success: true, username: screenName });
    } catch (twitterError) {
      console.error('Twitter login error:', twitterError);
      console.error('Twitter login error details:', twitterError);
      res.status(401).json({ message: `Twitter login failed: ${twitterError.message}` });
    }
  } catch (error) {
    console.error('Twitter callback error:', error);
    res.status(500).json({ message: `Twitter authentication failed: ${error.message}` });
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

// Update the verify-task endpoint with a simplified version

router.post('/verify-task', auth, async (req, res) => {
  try {
    const { taskId, taskType, linkUrl } = req.body;
    
    console.log('Processing Twitter task completion:', { taskId, taskType });
    
    // Validate task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if task is of Twitter platform
    if (task.platform !== 'twitter') {
      return res.status(400).json({ message: 'This is not a Twitter task' });
    }

    // Find the event and check if it's active
    const event = await Event.findById(task.event);
    if (!event || !event.isActive) {
      return res.status(400).json({ message: 'This event is no longer active' });
    }
    
    // Check if user has joined this event
    const isParticipant = event.participants.some(
      p => p.user.toString() === req.user._id.toString()
    );
    
    if (!isParticipant) {
      return res.status(400).json({ message: 'You have not joined this event' });
    }
    
    // Check if task is already completed
    let userTask = await UserTask.findOne({ 
      user: req.user._id, 
      task: taskId 
    });
    
    if (!userTask) {
      // Create a new user task if it doesn't exist
      userTask = new UserTask({
        user: req.user._id,
        task: taskId,
        event: task.event,
        completed: false,
        pointsEarned: 0
      });
      await userTask.save();
      console.log('Created new user task record:', userTask._id);
    }
    
    if (userTask.completed) {
      return res.status(400).json({ message: 'Task already completed' });
    }
    
    // No Twitter API validation - just trust the user completed the task
    console.log(`Marking task ${taskId} as completed for user ${req.user._id}`);
    
    // Mark the task as completed
    userTask.completed = true;
    userTask.completedAt = Date.now();
    userTask.pointsEarned = task.pointsValue;
    userTask.verificationData = { 
      method: 'self_verification', 
      timestamp: Date.now(),
      platform: 'twitter',
      taskType
    };
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
      message: `Task completed! You earned ${task.pointsValue} points.`
    });
    
  } catch (error) {
    console.error('Twitter task verification error:', error);
    res.status(500).json({ message: 'Verification failed: Server error' });
  }
});

// Status endpoint to check Twitter API configuration
router.get('/status', auth, async (req, res) => {
  try {
    console.log('Twitter status check requested by user:', req.user._id);
    
    // Check if Twitter API app client is working
    let appClientStatus = { success: false, error: null };
    try {
      const result = await readOnlyClient.v2.search('web3', { max_results: 10 });
      appClientStatus = { 
        success: true, 
        tweets: result.data?.length || 0,
        meta: result.meta
      };
    } catch (appError) {
      console.error('App client error:', appError);
      appClientStatus = { success: false, error: appError.message };
    }
    
    // Check if user-specific client works (if user has Twitter connected)
    let userClientStatus = { success: false, error: null, connected: false };
    
    if (req.user.twitterId && req.user.twitterTokenKey && req.user.twitterTokenSecret) {
      try {
        const userClient = new TwitterApi({
          appKey: process.env.TWITTER_API_KEY,
          appSecret: process.env.TWITTER_API_SECRET,
          accessToken: req.user.twitterTokenKey,
          accessSecret: req.user.twitterTokenSecret
        });
        
        const userResult = await userClient.v2.me();
        userClientStatus = { 
          success: true, 
          connected: true,
          username: userResult.data.username,
          name: userResult.data.name
        };
      } catch (userError) {
        console.error('User client error:', userError);
        userClientStatus = { 
          success: false, 
          connected: true,
          error: userError.message 
        };
      }
    }
    
    res.json({ 
      status: 'Twitter API status check completed',
      timestamp: new Date().toISOString(),
      credentials: {
        hasApiKey: !!process.env.TWITTER_API_KEY,
        hasApiSecret: !!process.env.TWITTER_API_SECRET,
        hasAccessToken: !!process.env.TWITTER_ACCESS_TOKEN,
        hasAccessSecret: !!process.env.TWITTER_ACCESS_SECRET,
        hasBearerToken: !!process.env.TWITTER_BEARER_TOKEN
      },
      tokenStorage: {
        count: Object.keys(oauthTokens).length,
        keys: Object.keys(oauthTokens).map(k => k.substring(0, 8) + '...')
      },
      user: {
        id: req.user._id,
        address: req.user.address,
        twitterConnected: !!req.user.twitterId,
        twitterUsername: req.user.twitterUsername || null
      },
      appClientStatus,
      userClientStatus
    });
  } catch (error) {
    console.error('Twitter API status check error:', error);
    res.status(500).json({ 
      status: 'Twitter API connection failed', 
      error: error.message,
      credentials: {
        hasApiKey: !!process.env.TWITTER_API_KEY,
        hasApiSecret: !!process.env.TWITTER_API_SECRET,
        hasAccessToken: !!process.env.TWITTER_ACCESS_TOKEN,
        hasAccessSecret: !!process.env.TWITTER_ACCESS_SECRET,
        hasBearerToken: !!process.env.TWITTER_BEARER_TOKEN
      }
    });
  }
});

// Helper functions to parse Twitter URLs
function extractUsernameFromUrl(url) {
  // Try different URL patterns to extract username
  
  // Pattern 1: twitter.com/username
  let match = url.match(/(?:twitter\.com|x\.com)\/([^\/\?]+)(?:\/|\?|$)/);
  if (match && !['i', 'intent', 'share', 'search', 'explore', 'home', 'notifications', 'messages', 'settings'].includes(match[1])) {
    return match[1];
  }
  
  // Pattern 2: twitter.com/username/status/123
  match = url.match(/(?:twitter\.com|x\.com)\/([^\/\?]+)\/status\//);
  if (match) {
    return match[1];
  }
  
  return null;
}

function extractTweetIdFromUrl(url) {
  // Extract tweet ID from URL
  const match = url.match(/(?:twitter\.com|x\.com)\/[^\/]+\/status\/(\d+)/);
  return match ? match[1] : null;
}

module.exports = router;