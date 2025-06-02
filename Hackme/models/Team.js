const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  hackathon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hackathon',
    required: true
  },
  leader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  project: {
    title: String,
    description: String,
    githubLink: String,
    demoLink: String,
    submissionDate: Date
  },
  scores: [{
    judge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    criteria: {
      innovation: Number,
      technical: Number,
      presentation: Number,
      impact: Number
    },
    feedback: String,
    totalScore: Number
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Team', TeamSchema);