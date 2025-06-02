const User = require('../models/User');
const passport = require('passport');
const bcrypt = require('bcryptjs');

const UserController = {
  getLogin: (req, res) => {
    res.render('users/login');
  },

  postLogin: (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) {
            req.flash('error_msg', 'Invalid username or password.');
            return res.redirect('/users/login');
        }
        req.logIn(user, (err) => {
            if (err) return next(err);
            req.flash('success_msg', 'Successfully logged in! Welcome back.');
            return res.redirect('/dashboard');
        });
    })(req, res, next);
},

  getRegister: (req, res) => {
    res.render('users/register');
  },

  postRegister: async (req, res) => {
    try {
      const { name, email, password, password2, role } = req.body;
      const errors = [];
      if (password !== password2) {
        errors.push({ msg: 'Passwords do not match' });
      }

      if (errors.length > 0) {
        return res.render('users/register', {
          errors,
          name,
          email,
          role
        });
      }

      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        errors.push({ msg: 'Email is already registered' });
        console.log("email already exists");
        return res.render('users/register', {
          errors,
          name,
          email,
          role
        });
      }

      // Create new user
      const newUser = new User({
        name,
        email,
        password,
        role
      });

      await newUser.save();
      console.log("user registered");
      req.flash('success_msg', 'You are now registered and can log in');
      res.redirect('/users/login');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Registration failed');
      res.redirect('/users/register');
    }
  },

  logout: (req, res) => {
    req.logout((err) => {
      if (err) {
          console.error("Logout error:", err);
          return res.send(err);
      }
  });
    req.flash('success_msg', 'You are logged out');
    res.redirect('/users/login');
  },

  getProfile: async (req, res) => {
    try {
      const user = await User.findById(req.user._id)
        .populate('team')
        .populate('registeredHackathons');
      res.render('users/profile', { user });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error loading profile');
      res.redirect('/dashboard');
    }
  },

  updateProfile: async (req, res) => {
    try {
      const { name, bio, skills } = req.body;
      await User.findByIdAndUpdate(req.user._id, {
        name,
        bio,
        skills: skills.split(',').map(skill => skill.trim())
      });
      req.flash('success_msg', 'Profile updated successfully');
      res.redirect('/users/profile');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error updating profile');
      res.redirect('/users/profile');
    }
  }
};

module.exports = UserController;