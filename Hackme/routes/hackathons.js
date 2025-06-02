const express = require('express');
const router = express.Router();
const { ensureAuthenticated, isOrganizer } = require('../middleware/auth');
const HackathonController = require('../controllers/hackathonController');
const Hackathon = require("../models/Hackathon");

// Public routes
router.get('/', HackathonController.getAllHackathons);
// Organizer routes
router.get('/create', ensureAuthenticated, isOrganizer, HackathonController.getCreateHackathon);
router.post('/create', ensureAuthenticated, isOrganizer, HackathonController.createHackathon);
router.get('/:id/register', ensureAuthenticated, async (req, res) => {
    try {
        const hackathon = await Hackathon.findById(req.params.id);

        if (!hackathon) {
            return res.status(404).json({ msg: 'Hackathon not found' });
        }

        res.render("hackathons/register.ejs", {
            hackathon,    // Pass the specific hackathon
            user: req.user // Pass the logged-in user
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});
router.put('/:id', ensureAuthenticated, isOrganizer, HackathonController.updateHackathon);
router.delete('/:id', ensureAuthenticated, isOrganizer, HackathonController.deleteHackathon);


router.get('/:id', HackathonController.getHackathonDetails);

// Protected routes

router.get('/:id/register', ensureAuthenticated, async (req, res) => {
    try {
        const hackathon = await Hackathon.findById(req.params.id);

        if (!hackathon) {
            return res.status(404).json({ msg: 'Hackathon not found' });
        }

        res.render("hackathons/register.ejs", {
            hackathon,    // Pass the specific hackathon
            user: req.user // Pass the logged-in user
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.post('/:id/register', ensureAuthenticated, HackathonController.registerForHackathon);



// Judge routes
router.post('/:id/submit-scores', ensureAuthenticated, HackathonController.submitScores);

module.exports = router;