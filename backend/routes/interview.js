const router   = require('express').Router();
const auth     = require('../middleware/auth');
const ctrl     = require('../controllers/interviewController');
const validate = require('../middleware/validate');
const schema   = require('../validators/interviewValidators');

router.use(auth);
router.post('/create',        validate(schema.createInterview),  ctrl.createInterview);
router.post('/submit-answer', validate(schema.submitAnswer),      ctrl.submitAnswer);
router.post('/finish',        validate(schema.finishInterview),  ctrl.finishInterview);
router.get ('/history',       validate(schema.getHistory, { source: 'query' }), ctrl.getHistory);
router.get ('/:id',           validate(schema.idParam, { source: 'params' }),   ctrl.getById);

module.exports = router;