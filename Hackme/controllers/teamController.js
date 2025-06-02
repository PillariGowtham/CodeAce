const Team = require('../models/Team');
const User = require('../models/User');
const Hackathon = require('../models/Hackathon');

const TeamController = {
  createTeam: async (req, res) => {
    try {
      const { name, hackathonId } = req.body;

      const hackathon = await Hackathon.findById(hackathonId);
      if (!hackathon) {
        req.flash('error_msg', 'Hackathon not found');
        return res.redirect('/hackathons');
      }

      const newTeam = new Team({
        name,
        hackathon: hackathonId,
        leader: req.user._id,
        members: [req.user._id]
      });

      await newTeam.save();

      // Update user's team
      req.user.team = newTeam._id;
      await req.user.save();

      // Add team to hackathon
      hackathon.teams.push(newTeam._id);
      await hackathon.save();

      req.flash('success_msg', 'Team created successfully');
      res.redirect(`/teams/${newTeam._id}`);
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error creating team');
      res.redirect('/hackathons');
    }
  },

  getTeamDetails: async (req, res) => {
    try {
      const team = await Team.findById(req.params.id)
        .populate('leader', 'name email')
        .populate('members', 'name email')
        .populate('hackathon');

      if (!team) {
        req.flash('error_msg', 'Team not found');
        return res.redirect('/hackathons');
      }

      res.render('teams/details', { team });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error loading team details');
      res.redirect('/hackathons');
    }
  },

  joinTeam: async (req, res) => {
    try {
      const team = await Team.findById(req.params.id)
        .populate('hackathon');

      if (!team) {
        req.flash('error_msg', 'Team not found');
        return res.redirect('/hackathons');
      }

      if (team.members.length >= team.hackathon.maxTeamSize) {
        req.flash('error_msg', 'Team is full');
        return res.redirect(`/teams/${team._id}`);
      }

      if (team.members.includes(req.user._id)) {
        req.flash('error_msg', 'You are already in this team');
        return res.redirect(`/teams/${team._id}`);
      }

      team.members.push(req.user._id);
      await team.save();

      req.user.team = team._id;
      await req.user.save();

      req.flash('success_msg', 'Successfully joined team');
      res.redirect(`/teams/${team._id}`);
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error joining team');
      res.redirect('/hackathons');
    }
  },

  leaveTeam: async (req, res) => {
    try {
      const team = await Team.findById(req.params.id);

      if (!team) {
        req.flash('error_msg', 'Team not found');
        return res.redirect('/hackathons');
      }

      if (team.leader.toString() === req.user._id.toString()) {
        req.flash('error_msg', 'Team leader cannot leave the team');
        return res.redirect(`/teams/${team._id}`);
      }

      team.members = team.members.filter(
        member => member.toString() !== req.user._id.toString()
      );
      await team.save();

      req.user.team = null;
      await req.user.save();

      req.flash('success_msg', 'Successfully left team');
      res.redirect('/hackathons');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error leaving team');
      res.redirect('/hackathons');
    }
  },

  updateProject: async (req, res) => {
    try {
      const { title, description, githubLink, demoLink } = req.body;
      const team = await Team.findById(req.params.id);

      if (!team) {
        return res.status(404).json({ msg: 'Team not found' });
      }

      if (team.leader.toString() !== req.user._id.toString()) {
        return res.status(401).json({ msg: 'Not authorized' });
      }

      team.project = {
        title,
        description,
        githubLink,
        demoLink
      };

      await team.save();
      res.json(team);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  },

  submitProject: async (req, res) => {
    try {
      const team = await Team.findById(req.params.id)
        .populate('hackathon');

      if (!team) {
        return res.status(404).json({ msg: 'Team not found' });
      }

      if (team.leader.toString() !== req.user._id.toString()) {
        return res.status(401).json({ msg: 'Not authorized' });
      }

      if (team.hackathon.endDate < Date.now()) {
        return res.status(400).json({ msg: 'Submission deadline has passed' });
      }

      team.project.submissionDate = Date.now();
      await team.save();

      res.json({ msg: 'Project submitted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  }
};

module.exports = TeamController;