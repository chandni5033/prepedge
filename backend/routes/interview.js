const router = require('express').Router();
const auth   = require('../middleware/auth');
const ctrl   = require('../controllers/interviewController');

router.use(auth);
router.post('/create',        ctrl.createInterview);
router.post('/submit-answer', ctrl.submitAnswer);
router.post('/finish',        ctrl.finishInterview);
router.get ('/history',       ctrl.getHistory);
router.get ('/:id',           ctrl.getById);

module.exports = router;