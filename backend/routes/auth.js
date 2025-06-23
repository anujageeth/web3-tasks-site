const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');
const User = require('../models/User');
const auth = require('../middleware/auth');

// SIWE verification
router.post('/verify', async (req, res) => {
  try {
    console.log('Received verification request:', {
      address: req.body.address,
      message: req.body.message ? req.body.message.substring(0, 30) + '...' : null,
      signature: req.body.signature ? req.body.signature.substring(0, 20) + '...' : null
    });
    
    const { address, message, signature } = req.body;
    
    if (!address || !message || !signature) {
      console.log('Missing parameters in request');
      return res.status(400).json({ message: 'Missing parameters' });
    }

    try {
      // Verify signature
      console.log('Verifying signature with ethers...');
      
      // Convert signature to proper format if needed (viem returns signatures without 0x prefix sometimes)
      const formattedSignature = signature.startsWith('0x') ? signature : `0x${signature}`;
      
      // Try to recover address from signature
      const recoveredAddress = ethers.verifyMessage(message, formattedSignature);
      
      console.log('Original address:', address.toLowerCase());
      console.log('Recovered address:', recoveredAddress.toLowerCase());
      
      if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
        console.log('Invalid signature: addresses do not match');
        return res.status(401).json({ message: 'Invalid signature: address mismatch' });
      }
      
      console.log('Signature verified successfully');

      // Find or create user
      let user = await User.findOne({ address: address.toLowerCase() });
      
      if (!user) {
        console.log('Creating new user for address:', address.toLowerCase());
        user = new User({
          address: address.toLowerCase(),
          nonce: crypto.randomBytes(16).toString('hex')
        });
      } else {
        console.log('Found existing user for address:', address.toLowerCase());
        // Update nonce for security
        user.nonce = crypto.randomBytes(16).toString('hex');
        user.lastLogin = Date.now();
      }
      
      await user.save();
      console.log('User saved with id:', user._id);
      
      // Create token
      const token = jwt.sign(
        { id: user._id, address: user.address },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      // Set cookie with more browser-compatible settings
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'lax', // Changed to 'lax' for better browser compatibility
        path: '/'
      });
      
      console.log('Authentication successful, token generated');
      // Log all response headers for debugging
      console.log('Response headers:', res.getHeaders());
      res.status(200).json({ success: true });
    } catch (verifyError) {
      console.error('Verification error:', verifyError);
      res.status(401).json({ message: `Verification error: ${verifyError.message}` });
    }
  } catch (error) {
    console.error('SIWE verification error:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
});

// Get current user
router.get('/user', auth, async (req, res) => {
  try {
    console.log('Get user request for user ID:', req.user._id);
    const user = await User.findById(req.user._id).select('-nonce');
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Test endpoint to check authentication
router.get('/test-auth', auth, (req, res) => {
  res.json({ success: true, user: { address: req.user.address } });
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    path: '/'
  });
  res.json({ success: true });
});

module.exports = router;