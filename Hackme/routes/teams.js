const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const TeamController = require('../controllers/teamController');

router.post('/create', ensureAuthenticated, TeamController.createTeam);
router.get('/:id', ensureAuthenticated, TeamController.getTeamDetails);
router.post('/:id/join', ensureAuthenticated, TeamController.joinTeam);
router.post('/:id/leave', ensureAuthenticated, TeamController.leaveTeam);
router.put('/:id/project', ensureAuthenticated, TeamController.updateProject);
router.post('/:id/submit', ensureAuthenticated, TeamController.submitProject);

module.exports = router;