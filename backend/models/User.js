const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  firstName: {
    type: String,
    default: ''
  },
  lastName: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: '',
    trim: true,
    lowercase: true
  },
  nonce: {
    type: String,
    required: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  verified: {
    type: Boolean,
    default: false
  },
  createdEvents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }],
  joinedEvents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }],
  
  // Twitter auth data
  twitterId: {
    type: String,
    sparse: true
  },
  twitterUsername: String,
  twitterTokenKey: String,
  twitterTokenSecret: String,

  // Telegram auth data
  telegramId: {
    type: String,
    sparse: true
  },
  telegramUsername: String,
  telegramFirstName: String,
  telegramLastName: String,
  telegramPhotoUrl: String,

  // Discord auth data
  discordId: {
    type: String,
    sparse: true
  },
  discordUsername: String,
  discordDiscriminator: String,
  discordAccessToken: String,
  discordRefreshToken: String,

  // Google auth data
  googleId: {
    type: String,
    sparse: true
  },
  googleEmail: String,
  googleName: String,
  googlePicture: String,
  googleAccessToken: String,
  googleRefreshToken: String,

}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);