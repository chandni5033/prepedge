const router = require('express').Router();
const auth   = require('../middleware/auth');
const ctrl   = require('../controllers/analyticsController');

router.use(auth);
router.get('/dashboard', ctrl.getDashboard);
router.get('/progress',  ctrl.getProgress);

module.exports = router;