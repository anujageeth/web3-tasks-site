const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  taskType: {
    type: String,
    enum: ['follow', 'like', 'repost', 'other'],
    required: true
  },
  platform: {
    type: String,
    enum: ['twitter', 'instagram', 'facebook', 'telegram', 'discord', 'other'],
    required: true
  },
  description: {
    type: String,
    required: true
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