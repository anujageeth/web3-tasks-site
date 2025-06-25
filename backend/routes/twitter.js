const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Task = require('../models/Task');
const UserTask = require('../models/UserTask');
const TwitterAPI = require('twitter-api-v2').TwitterApi;
const OAuth = require('oauth-1.0a');
const crypto = require('crypto');

// Log Twitter API configuration at startup
console.log('Twitter API configuration:', {
  apiKeyFirstChars: process.env.TWITTER_API_KEY ? process.env.TWITTER_API_KEY.substring(0, 4) + '...' : 'MISSING',
  apiSecretLength: process.env.TWITTER_API_SECRET ? process.env.TWITTER_API_SECRET.length : 0,
  accessTokenFirstChars: process.env.TWITTER_ACCESS_TOKEN ? process.env.TWITTER_ACCESS_TOKEN.substring(0, 4) + '...' : 'MISSING',
  accessSecretLength: process.env.TWITTER_ACCESS_SECRET ? process.env.TWITTER_ACCESS_SECRET.length : 0
});

// Twitter OAuth setup with improved configuration
const twitterClient = new TwitterAPI({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  // Remove access token and secret - they're not needed for OAuth flows
  // accessToken: process.env.TWITTER_ACCESS_TOKEN,
  // accessSecret: process.env.TWITTER_ACCESS_SECRET,
  // Set API version explicitly
  version: '2', // Use v2 API by default
  // Rate limit handling
  rateLimitPlugin: {
    // Wait for rate limit reset when hitting limits
    maxRetries: 3,
    retryDelay: 5000,
  }
});

// Create OAuth 1.0a instance
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

// Add timestamp to stored tokens for cleanup
// const oauthTokens = {}; 

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

// Handle Twitter auth callback - FIX: Remove auth middleware for callback
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
      // Create a client specifically for this callback
      const callbackClient = new TwitterAPI({
        appKey: process.env.TWITTER_API_KEY,
        appSecret: process.env.TWITTER_API_SECRET,
        accessToken: oauth_token,
        accessSecret: oauth_token_secret,
      });
      
      // Log in to get access credentials
      const { client, accessToken, accessSecret, screenName, userId: twitterUserId } = 
        await callbackClient.login(oauth_verifier);
      
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

// Add this route for diagnosing Twitter API issues

// Status endpoint to check Twitter API configuration
router.get('/status', auth, async (req, res) => {
  try {
    // Check if Twitter API client is working
    const result = await twitterClient.v2.get('tweets/search/recent', { 
      query: 'test', 
      max_results: 1
    });
    
    res.json({ 
      status: 'Twitter API connection successful', 
      credentials: {
        hasApiKey: !!process.env.TWITTER_API_KEY,
        hasApiSecret: !!process.env.TWITTER_API_SECRET,
        hasAccessToken: !!process.env.TWITTER_ACCESS_TOKEN,
        hasAccessSecret: !!process.env.TWITTER_ACCESS_SECRET
      },
      tokenStorage: {
        count: Object.keys(oauthTokens).length,
        keys: Object.keys(oauthTokens).map(k => k.substring(0, 8) + '...')
      },
      user: {
        id: req.user._id,
        address: req.user.address,
        twitterConnected: !!req.user.twitterId
      }
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
        hasAccessSecret: !!process.env.TWITTER_ACCESS_SECRET
      }
    });
  }
});

// Test Twitter client connectivity on startup
(async () => {
  try {
    console.log('Testing Twitter API connection...');
    // Simple test API call
    const testResponse = await twitterClient.v2.get('tweets/search/recent', { 
      query: 'web3', 
      max_results: 1
    });
    console.log('Twitter API connection successful!');
  } catch (error) {
    console.error('WARNING: Twitter API connection test failed:', error.message);
    console.error('Please check your Twitter API credentials.');
  }
})();

module.exports = router;