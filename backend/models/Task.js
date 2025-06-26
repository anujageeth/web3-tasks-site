const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  taskType: {
    type: String,
    enum: ['follow', 'like', 'repost', 'comment', 'create_post', 'join_server', 'send_message', 
           'join_channel', 'join_group', 'start_bot', 'subscribe', 'like_video', 'comment_video',
           'follow_page', 'like_post', 'comment_post', 'visit', 'custom'],
    required: true
  },
  platform: {
    type: String,
    enum: ['twitter', 'instagram', 'facebook', 'telegram', 'discord', 'youtube', 'website', 'other'],
    required: true
  },
  description: {
    type: String,
    required: false
  },
  pointsValue: {
    type: Number,
    required: true,
    min: 1
  },
  linkUrl: {
    type: String,
    required: true
  },
  isRequired: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);