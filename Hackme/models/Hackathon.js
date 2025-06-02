const mongoose = require('mongoose');

const HackathonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  registrationDeadline: {
    type: Date,
    required: true
  },
  maxTeamSize: {
    type: Number,
    required: true
  },
  prizes: [{
    rank: Number,
    description: String,
    value: String
  }],
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teams: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }],
  judges: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'ended'],
    default: 'upcoming'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Method to update hackathon status based on dates
HackathonSchema.methods.updateStatus = function() {
  const now = new Date();
  
  if (now < this.startDate) {
    this.status = 'upcoming';
  } else if (now >= this.startDate && now <= this.endDate) {
    this.status = 'ongoing';
  } else {
    this.status = 'ended';
  }
  
  return this.status;
};

// Pre-save middleware to update status before saving
HackathonSchema.pre('save', function(next) {
  this.updateStatus();
  next();
});

// Static method to update all hackathons' status
HackathonSchema.statics.updateAllStatuses = async function() {
  const hackathons = await this.find();
  for (let hackathon of hackathons) {
    hackathon.updateStatus();
    await hackathon.save();
  }
};

module.exports = mongoose.model('Hackathon', HackathonSchema);