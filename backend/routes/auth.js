const router   = require('express').Router();
const passport = require('passport');
const ctrl     = require('../controllers/authController');
const auth     = require('../middleware/auth');
const validate = require('../middleware/validate');
const schema   = require('../validators/authValidators');

router.post('/register', validate(schema.register), ctrl.register);
router.post('/login',    validate(schema.login),    ctrl.login);
router.get ('/profile',  auth, ctrl.getProfile);
router.put ('/profile',  auth, validate(schema.updateProfile),  ctrl.updateProfile);
router.put ('/password', auth, validate(schema.changePassword), ctrl.changePassword);
router.post('/set-password', auth, validate(schema.setPassword), ctrl.setPassword);

router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);


router.get('/google/callback',
  (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user) => {
      

      if (err || !user) {
        return res.redirect(
          `${process.env.CLIENT_URL}/login?error=oauth_failed`
        );
      }

      req.user = user;

      next(); 
    })(req, res, next);
  },
  ctrl.googleCallback
);

module.exports = router;