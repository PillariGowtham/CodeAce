const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const Hackathon = require('../models/Hackathon');

router.get('/', async (req, res) => {
  try {
    const hackathons = await Hackathon.find({ status: 'upcoming' })
      .populate('organizer', 'name')
      .sort({ startDate: 1 })
      .limit(5);
    
    res.render('index', { hackathons });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading hackathons');
    res.render('index', { hackathons: [] });
  }
}); 

router.get('/dashboard', ensureAuthenticated, async (req, res) => {
  try {
    let data = {};
    
    if (req.user.role === 'participant') {
      data.registeredHackathons = await Hackathon.find({
        _id: { $in: req.user.registeredHackathons }
      }).populate('organizer', 'name');
    } else if (req.user.role === 'organizer') {
      data.organizedHackathons = await Hackathon.find({
        organizer: req.user._id
      });
    } else if (req.user.role === 'judge') {
      data.assignedHackathons = await Hackathon.find({
        judges: req.user._id
      });
    }
    
    res.render('dashboard', { data });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading dashboard');
    res.redirect('/');
  }
});

module.exports = router;