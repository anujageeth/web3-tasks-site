const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const crypto = require('crypto');

// Telegram Bot API token
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME;

// Generate auth URL for Telegram login
router.get('/auth', auth, async (req, res) => {
  try {
    const { state, callbackUrl } = req.query;
    
    if (!state || !callbackUrl) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }
    
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_BOT_USERNAME) {
      return res.status(500).json({ message: 'Telegram bot not configured' });
    }
    
    // Create Telegram login widget URL
    const botUsername = TELEGRAM_BOT_USERNAME;
    const redirectUrl = encodeURIComponent(`${callbackUrl}?state=${state}`);
    
    // Check if we're using localhost
    const isLocalhost = callbackUrl.includes('localhost');
    
    // Add test=1 parameter for localhost development
    const url = `https://oauth.telegram.org/auth?bot_id=${botUsername}&origin=${redirectUrl}&request_access=write${isLocalhost ? '&test=1' : ''}`;
    
    res.json({ url });
  } catch (error) {
    console.error('Error generating Telegram auth URL:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Handle callback from Telegram login widget
router.post('/callback', auth, async (req, res) => {
  try {
    const telegramData = req.body;
    
    // Verify the authentication data
    const { hash, auth_date, ...userData } = telegramData;
    
    if (!hash || !auth_date || !userData.id) {
      return res.status(400).json({ message: 'Invalid Telegram data' });
    }
    
    // Check if auth_date is not too old (within 24 hours)
    const authTime = parseInt(auth_date, 10);
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime - authTime > 86400) { // 86400 seconds = 24 hours
      return res.status(400).json({ message: 'Telegram auth data expired' });
    }
    
    // Create a sorted string of key=value pairs for verification
    const dataCheckString = Object.keys({ ...userData, auth_date })
      .sort()
      .map(key => `${key}=${key === 'auth_date' ? auth_date : userData[key]}`)
      .join('\n');
    
    // Create the secret key by hashing the bot token with SHA256
    const secretKey = crypto.createHash('sha256')
      .update(TELEGRAM_BOT_TOKEN)
      .digest();
    
    // Generate the hash for verification
    const calculatedHash = crypto.createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');
    
    // Verify that the hash matches
    if (calculatedHash !== hash) {
      return res.status(401).json({ message: 'Authentication data verification failed' });
    }
    
    // Authentication successful, update user record
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.telegramId = userData.id;
    user.telegramUsername = userData.username || '';
    user.telegramFirstName = userData.first_name || '';
    user.telegramLastName = userData.last_name || '';
    user.telegramPhotoUrl = userData.photo_url || '';
    
    await user.save();
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing Telegram callback:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Disconnect Telegram account
router.post('/disconnect', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove Telegram data
    user.telegramId = undefined;
    user.telegramUsername = undefined;
    user.telegramFirstName = undefined;
    user.telegramLastName = undefined;
    user.telegramPhotoUrl = undefined;
    
    await user.save();
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error disconnecting Telegram account:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;