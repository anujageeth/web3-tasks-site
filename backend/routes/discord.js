const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const axios = require('axios');

// Discord OAuth2 configuration
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || 'http://localhost:3001/api/discord/callback';

// Log Discord configuration at startup
console.log('Discord OAuth configuration:', {
  clientId: DISCORD_CLIENT_ID ? DISCORD_CLIENT_ID.substring(0, 8) + '...' : 'MISSING',
  clientSecret: DISCORD_CLIENT_SECRET ? '✓ SET' : 'MISSING',
  redirectUri: DISCORD_REDIRECT_URI
});

// Initiate Discord OAuth
router.get('/auth', auth, async (req, res) => {
  try {
    console.log('Starting Discord auth process for user:', req.user._id);
    
    if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
      return res.status(500).json({ message: 'Discord OAuth not configured' });
    }
    
    // Get callback URL from query parameter or use default
    const callbackUrl = req.query.callbackUrl || DISCORD_REDIRECT_URI;
    
    console.log('Using Discord callback URL:', callbackUrl);
    
    // Generate state parameter for security (you should store this temporarily)
    const state = Buffer.from(JSON.stringify({
      userId: req.user._id.toString(),
      timestamp: Date.now()
    })).toString('base64');
    
    // Construct Discord OAuth URL
    const authUrl = new URL('https://discord.com/api/oauth2/authorize');
    authUrl.searchParams.set('client_id', DISCORD_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', callbackUrl);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'identify');
    authUrl.searchParams.set('state', state);
    
    console.log('Generated Discord auth URL');
    
    res.json({ authUrl: authUrl.toString() });
  } catch (error) {
    console.error('Discord auth initiation error:', error);
    res.status(500).json({ message: `Failed to initiate Discord authentication: ${error.message}` });
  }
});

// Handle Discord OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    console.log('Discord callback received:', { 
      hasCode: !!code, 
      hasState: !!state 
    });
    
    if (!code || !state) {
      console.error('Missing code or state in Discord callback');
      return res.status(400).json({ message: 'Missing authorization code or state' });
    }
    
    // Decode and verify state
    let stateData;
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    } catch (e) {
      console.error('Invalid state parameter:', e);
      return res.status(400).json({ message: 'Invalid state parameter' });
    }
    
    const { userId, timestamp } = stateData;
    
    // Check if state is not too old (5 minutes)
    if (Date.now() - timestamp > 5 * 60 * 1000) {
      console.error('State parameter expired');
      return res.status(400).json({ message: 'Authorization expired' });
    }
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found:', userId);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('Found user for Discord auth:', user.address);
    
    try {
      // Exchange code for access token
      const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: DISCORD_REDIRECT_URI,
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      const { access_token, refresh_token } = tokenResponse.data;
      
      if (!access_token) {
        throw new Error('No access token received from Discord');
      }
      
      // Get user information from Discord
      const userResponse = await axios.get('https://discord.com/api/users/@me', {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      });
      
      const discordUser = userResponse.data;
      console.log('Discord user info received:', discordUser.username);
      
      // Update user with Discord credentials
      await User.findByIdAndUpdate(userId, {
        discordId: discordUser.id,
        discordUsername: discordUser.username,
        discordDiscriminator: discordUser.discriminator,
        discordAccessToken: access_token,
        discordRefreshToken: refresh_token
      });
      
      console.log('User updated with Discord credentials');
      
      res.json({ 
        success: true, 
        username: discordUser.username,
        discriminator: discordUser.discriminator
      });
    } catch (discordError) {
      console.error('Discord OAuth error:', discordError.response?.data || discordError.message);
      res.status(401).json({ message: `Discord authentication failed: ${discordError.message}` });
    }
  } catch (error) {
    console.error('Discord callback error:', error);
    res.status(500).json({ message: `Discord authentication failed: ${error.message}` });
  }
});

// Disconnect Discord
router.post('/disconnect', auth, async (req, res) => {
  try {
    console.log('Disconnecting Discord for user:', req.user._id);
    
    // Remove Discord credentials from user
    await User.findByIdAndUpdate(req.user._id, {
      $unset: {
        discordId: "",
        discordUsername: "",
        discordDiscriminator: "",
        discordAccessToken: "",
        discordRefreshToken: ""
      }
    });
    
    console.log('Discord disconnected successfully');
    res.json({ success: true });
  } catch (error) {
    console.error('Discord disconnect error:', error);
    res.status(500).json({ message: 'Failed to disconnect Discord account' });
  }
});

// Status endpoint
router.get('/status', auth, async (req, res) => {
  try {
    res.json({
      status: 'Discord OAuth status check',
      timestamp: new Date().toISOString(),
      configuration: {
        hasClientId: !!DISCORD_CLIENT_ID,
        hasClientSecret: !!DISCORD_CLIENT_SECRET,
        redirectUri: DISCORD_REDIRECT_URI
      },
      user: {
        id: req.user._id,
        address: req.user.address,
        discordConnected: !!req.user.discordId,
        discordUsername: req.user.discordUsername || null
      }
    });
  } catch (error) {
    console.error('Discord status check error:', error);
    res.status(500).json({ message: 'Failed to check Discord status' });
  }
});

module.exports = router;