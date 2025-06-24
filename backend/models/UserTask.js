const mongoose = require('mongoose');

const UserTaskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  pointsEarned: {
    type: Number,
    default: 0
  },
  verificationData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

// Ensure a user can only complete a task once per event
UserTaskSchema.index({ user: 1, task: 1 }, { unique: true });

module.exports = mongoose.model('UserTask', UserTaskSchema);