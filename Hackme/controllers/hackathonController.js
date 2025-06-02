const Hackathon = require('../models/Hackathon');
const Team = require('../models/Team');
const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, html) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: "rjmadhav1201@gmail.com",  // Your Gmail
                pass:  "Madhav@1201"  // App password
            }
        });

        const mailOptions = {
            from: "rjmadhav1201@gmail.com",
            to,
            subject,
            html
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${to}`);
    } catch (error) {
        console.error(`❌ Error sending email: ${error.message}`);
    }
};

const HackathonController = {
  // Update all hackathon statuses
  updateAllStatuses: async () => {
    try {
      await Hackathon.updateAllStatuses();
      console.log('✅ All hackathon statuses updated');
    } catch (err) {
      console.error('❌ Error updating hackathon statuses:', err);
    }
  },

  getAllHackathons: async (req, res) => {
    try {
      const { status, search, page = 1 } = req.query;
      const limit = 9; // Items per page
      const skip = (page - 1) * limit;

      // First, update all hackathon statuses
      await HackathonController.updateAllStatuses();

      // Build query to exclude 'ended' hackathons from this view
      let query = {};

      // Exclude 'ended' status unless explicitly filtered by upcoming or ongoing
      if (!status || status === 'all') {
          query.status = { $in: ['upcoming', 'ongoing'] };
      } else if (status === 'upcoming' || status === 'ongoing') {
          query.status = status;
      } else if (status === 'ended') {
          // If explicitly filtered by 'ended', return nothing for this page
          query._id = null; // Query that returns no documents
      }

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
         // Combine status query with search query using $and if both exist
         if (query.status) {
            query = { $and: [ { status: query.status }, { $or: query.$or } ] };
         }
      }

      // Get total count for pagination
      const total = await Hackathon.countDocuments(query);
      const totalPages = Math.ceil(total / limit);

      // Get hackathons with populated fields
      const hackathons = await Hackathon.find(query)
        .populate('organizer', 'name')
        .sort({ startDate: 1 })
        .skip(skip)
        .limit(limit);

      // Get counts for each status (including ended for display in filter counts)
      const statusCounts = {
        upcoming: await Hackathon.countDocuments({ status: 'upcoming' }),
        ongoing: await Hackathon.countDocuments({ status: 'ongoing' }),
        ended: await Hackathon.countDocuments({ status: 'ended' })
      };

      res.render('hackathons/index', {
        hackathons,
        currentPage: parseInt(page),
        totalPages,
        query: req.query,
        user: req.user,
        statusCounts,
        currentStatus: status || 'all'
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error loading hackathons');
      res.redirect('/');
    }
  },

  getHackathonDetails: async (req, res) => {
    try {
      const hackathon = await Hackathon.findById(req.params.id)
        .populate('organizer', 'name')
        .populate('teams')
        .populate('judges', 'name');
      
      if (!hackathon) {
        req.flash('error_msg', 'Hackathon not found');
        return res.redirect('/hackathons');
      }

      res.render('hackathons/details', { 
        hackathon,
        user: req.user // Pass user information to the view
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error loading hackathon details');
      res.redirect('/hackathons');
    }
  },

  getCreateHackathon: (req, res) => {
    res.render('hackathons/create', {
      user: req.user // Pass user information to the view
    });
  },

  createHackathon: async (req, res) => {
    try {
      const {
        title,
        description,
        startDate,
        endDate,
        registrationDeadline,
        maxTeamSize,
        prizes
      } = req.body;

      const newHackathon = new Hackathon({
        title,
        description,
        startDate,
        endDate,
        registrationDeadline,
        maxTeamSize,
        prizes,
        organizer: req.user._id
      });

      await newHackathon.save();
      req.flash('success_msg', 'Hackathon created successfully');
      res.redirect(`/hackathons/${newHackathon._id}`);
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error creating hackathon');
      res.redirect('/hackathons/create');
    }
  },

  updateHackathon: async (req, res) => {
    try {
      const hackathon = await Hackathon.findById(req.params.id);
      
      if (!hackathon) {
        return res.status(404).json({ msg: 'Hackathon not found' });
      }

      if (hackathon.organizer.toString() !== req.user._id.toString()) {
        return res.status(401).json({ msg: 'Not authorized' });
      }

      const updatedHackathon = await Hackathon.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

      res.json(updatedHackathon);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  },

  deleteHackathon: async (req, res) => {
    try {
        const hackathon = await Hackathon.findById(req.params.id);

        if (!hackathon) {
            return res.status(404).json({ msg: 'Hackathon not found' });
        }

        if (hackathon.organizer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ msg: 'Forbidden: Not authorized to delete this hackathon' });
        }

        await Hackathon.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Hackathon successfully removed' });
    } catch (err) {
        console.error(err);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'Invalid Hackathon ID' });
        }
        res.status(500).json({ msg: 'Server error' });
    }
},


registerForHackathon: async (req, res) => {
  try {
      const { name, members, project } = req.body;

      const hackathon = await Hackathon.findById(req.params.id);
      if (!hackathon) {
          req.flash('error_msg', 'Hackathon not found');
          return res.redirect('/hackathons');
      }

      // Check deadline
      if (hackathon.registrationDeadline < Date.now()) {
          req.flash('error_msg', 'Registration deadline has passed');
          return res.redirect(`/hackathons/${hackathon._id}`);
      }

      // Create team
      const team = new Team({
          name,
          hackathon: hackathon._id,
          leader: req.user._id,
          members,
          project
      });

      await team.save();

      // Link team with hackathon
      hackathon.teams.push(team._id);
      await hackathon.save();

      // Register user for hackathon
      if (!req.user.registeredHackathons.includes(hackathon._id)) {
          req.user.registeredHackathons.push(hackathon._id);
          await req.user.save();
      }

      // ✉️ Send confirmation email
      const emailContent = `
          <h1>Hackathon Registration Confirmed</h1>
          <p>Hi <strong>${req.user.name}</strong>,</p>
          <p>Your team <strong>${name}</strong> has successfully registered for the hackathon <strong>${hackathon.title}</strong>.</p>
          <p>Here are the details:</p>
          <ul>
              <li><strong>Hackathon:</strong> ${hackathon.title}</li>
              <li><strong>Team Leader:</strong> ${req.user.name}</li>
              <li><strong>Project:</strong> ${project?.title || 'Not specified'}</li>
          </ul>
          <p>Best of luck!</p>
          <p>— Hackathon Team</p>
      `;

      await sendEmail(req.user.email, `Registration for ${hackathon.title}`, emailContent);

      req.flash('success_msg', 'Registered successfully! Confirmation email sent.');
      res.redirect(`/hackathons/${hackathon._id}`);
  } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error registering for hackathon');
      res.redirect('/hackathons');
  }
},

  submitScores: async (req, res) => {
    try {
      const { teamId, scores, feedback } = req.body;
      const team = await Team.findById(teamId);
      
      if (!team) {
        return res.status(404).json({ msg: 'Team not found' });
      }

      const hackathon = await Hackathon.findById(team.hackathon);
      if (!hackathon.judges.includes(req.user._id)) {
        return res.status(401).json({ msg: 'Not authorized to judge' });
      }

      team.scores.push({
        judge: req.user._id,
        criteria: scores,
        feedback,
        totalScore: Object.values(scores).reduce((a, b) => a + b, 0)
      });

      await team.save();
      res.json({ msg: 'Scores submitted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  }
};

module.exports = HackathonController;