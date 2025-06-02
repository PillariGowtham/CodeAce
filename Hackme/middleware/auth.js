module.exports = {
  ensureAuthenticated: (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    req.flash('error_msg', 'Please log in to view this resource');
    res.redirect('/users/login');
  },
  
  isOrganizer: (req, res, next) => {
    if (req.user && req.user.role === 'organizer') {
      return next();
    }
    req.flash('error_msg', 'Access denied. Organizers only.');
    res.redirect('/dashboard');
  },

  isJudge: (req, res, next) => {
    if (req.user && req.user.role === 'judge') {
      return next();
    }
    req.flash('error_msg', 'Access denied. Judges only.');
    res.redirect('/dashboard');
  }
};