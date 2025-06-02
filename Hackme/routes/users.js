const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const UserController = require('../controllers/userController');

router.get('/login', UserController.getLogin);
router.post('/login', UserController.postLogin);
router.get('/register', UserController.getRegister);
router.post('/register', UserController.postRegister);
router.get('/logout', UserController.logout);

router.get('/profile', ensureAuthenticated, UserController.getProfile);
router.put('/profile', ensureAuthenticated, UserController.updateProfile);

module.exports = router;