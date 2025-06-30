const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const axios = require('axios');

// Google OAuth2 configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/google/callback';

// Enhanced logging for debugging
console.log('Google OAuth configuration debug:', {
  clientId: GOOGLE_CLIENT_ID ? `${GOOGLE_CLIENT_ID.substring(0, 12)}... (${GOOGLE_CLIENT_ID.length} chars)` : 'MISSING',
  clientSecret: GOOGLE_CLIENT_SECRET ? `✓ SET (${GOOGLE_CLIENT_SECRET.length} chars)` : 'MISSING',
  redirectUri: GOOGLE_REDIRECT_URI,
  envKeys: Object.keys(process.env).filter(key => key.includes('GOOGLE'))
});

// Initiate Google OAuth
router.get('/auth', auth, async (req, res) => {
  try {
    console.log('Google auth request received');
    console.log('Environment check:', {
      GOOGLE_CLIENT_ID: !!GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!GOOGLE_CLIENT_SECRET,
      NODE_ENV: process.env.NODE_ENV
    });
    
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      console.error('Google OAuth credentials missing:', {
        hasClientId: !!GOOGLE_CLIENT_ID,
        hasClientSecret: !!GOOGLE_CLIENT_SECRET,
        clientIdValue: GOOGLE_CLIENT_ID ? 'SET' : 'UNDEFINED',
        clientSecretValue: GOOGLE_CLIENT_SECRET ? 'SET' : 'UNDEFINED'
      });
      return res.status(500).json({ message: 'Google OAuth not configured' });
    }
    
    console.log('Starting Google auth process for user:', req.user._id);
    
    // Get callback URL from query parameter or use default
    const callbackUrl = req.query.callbackUrl || GOOGLE_REDIRECT_URI;
    
    console.log('Using Google callback URL:', callbackUrl);
    
    // Generate state parameter for security
    const state = Buffer.from(JSON.stringify({
      userId: req.user._id.toString(),
      timestamp: Date.now()
    })).toString('base64');
    
    // Construct Google OAuth URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', callbackUrl);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'email profile');
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', state);
    
    console.log('Generated Google auth URL successfully');
    
    res.json({ authUrl: authUrl.toString() });
  } catch (error) {
    console.error('Google auth initiation error:', error);
    res.status(500).json({ message: `Failed to initiate Google authentication: ${error.message}` });
  }
});

// Handle Google OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    console.log('Google callback received:', { 
      hasCode: !!code, 
      hasState: !!state 
    });
    
    if (!code || !state) {
      console.error('Missing code or state in Google callback');
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
    
    console.log('Found user for Google auth:', user.address);
    
    try {
      // Exchange code for access token
      const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: GOOGLE_REDIRECT_URI,
      });
      
      const { access_token, refresh_token } = tokenResponse.data;
      
      if (!access_token) {
        throw new Error('No access token received from Google');
      }
      
      // Get user information from Google
      const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      });
      
      const googleUser = userResponse.data;
      console.log('Google user info received:', googleUser.email);
      
      // Update user with Google credentials
      await User.findByIdAndUpdate(userId, {
        googleId: googleUser.id,
        googleEmail: googleUser.email,
        googleName: googleUser.name,
        googlePicture: googleUser.picture,
        googleAccessToken: access_token,
        googleRefreshToken: refresh_token,
        email: googleUser.email // Also update the main email field
      });
      
      console.log('User updated with Google credentials');
      
      res.json({ 
        success: true, 
        email: googleUser.email,
        name: googleUser.name
      });
    } catch (googleError) {
      console.error('Google OAuth error:', googleError.response?.data || googleError.message);
      res.status(401).json({ message: `Google authentication failed: ${googleError.message}` });
    }
  } catch (error) {
    console.error('Google callback error:', error);
    res.status(500).json({ message: `Google authentication failed: ${error.message}` });
  }
});

// Disconnect Google
router.post('/disconnect', auth, async (req, res) => {
  try {
    console.log('Disconnecting Google for user:', req.user._id);
    
    // Remove Google credentials from user
    await User.findByIdAndUpdate(req.user._id, {
      $unset: {
        googleId: "",
        googleEmail: "",
        googleName: "",
        googlePicture: "",
        googleAccessToken: "",
        googleRefreshToken: "",
        email: "" // Also clear the main email field
      }
    });
    
    console.log('Google disconnected successfully');
    res.json({ success: true });
  } catch (error) {
    console.error('Google disconnect error:', error);
    res.status(500).json({ message: 'Failed to disconnect Google account' });
  }
});

// Status endpoint
router.get('/status', auth, async (req, res) => {
  try {
    res.json({
      status: 'Google OAuth status check',
      timestamp: new Date().toISOString(),
      configuration: {
        hasClientId: !!GOOGLE_CLIENT_ID,
        hasClientSecret: !!GOOGLE_CLIENT_SECRET,
        redirectUri: GOOGLE_REDIRECT_URI
      },
      user: {
        id: req.user._id,
        address: req.user.address,
        googleConnected: !!req.user.googleId,
        googleEmail: req.user.googleEmail || null
      }
    });
  } catch (error) {
    console.error('Google status check error:', error);
    res.status(500).json({ message: 'Failed to check Google status' });
  }
});

module.exports = router;