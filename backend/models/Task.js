const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  pointsValue: {
    type: Number,
    required: true,
    min: 1
  },
  taskType: {
    type: String,
    required: true,
    enum: [
      'follow', 'like', 'repost', 'comment', 'create_post',
      'join_server', 'send_message',
      'join_channel', 'join_group', 'start_bot',
      'subscribe', 'like_video', 'comment_video',
      'follow_page', 'like_post', 'comment_post',
      'visit',
      'custom'
    ]
  },
  platform: {
    type: String,
    required: true,
    enum: ['twitter', 'discord', 'telegram', 'youtube', 'facebook', 'instagram', 'website', 'other']
  },
  linkUrl: {
    type: String,
    required: true
  },
  isRequired: {
    type: Boolean,
    default: false
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Add metadata field to store additional information
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Keep customPlatform for backward compatibility
  customPlatform: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);