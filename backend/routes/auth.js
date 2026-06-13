const router   = require('express').Router();
const passport = require('passport');
const ctrl     = require('../controllers/authController');
const auth     = require('../middleware/auth');

router.post('/register', ctrl.register);
router.post('/login',    ctrl.login);
router.get ('/profile',  auth, ctrl.getProfile);
router.put ('/profile',  auth, ctrl.updateProfile);   
router.put ('/password', auth, ctrl.changePassword); 
router.post('/set-password', auth, ctrl.setPassword);

router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

// ✅ Fix: separate the two middlewares properly
router.get('/google/callback',
  (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user) => {
      

      if (err || !user) {
        return res.redirect(
          `${process.env.CLIENT_URL}/login?error=oauth_failed`
        );
      }

      req.user = user;

      next(); // ← THIS IS MISSING
    })(req, res, next);
  },
  ctrl.googleCallback
);

module.exports = router;