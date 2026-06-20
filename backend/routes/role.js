const router   = require('express').Router();
const auth     = require('../middleware/auth');
const validate = require('../middleware/validate');
const schema   = require('../validators/roleValidators');
const ctrl     = require('../controllers/roleController');

router.use(auth);

router.get ('/',                                            ctrl.listRoles);
router.get ('/attempts',                                     ctrl.listMyAttempts);
router.post('/:slug/start',
  validate(schema.slugParam, { source: 'params' }),          ctrl.startRoleAttempt);
router.get ('/attempts/:attemptId',
  validate(schema.attemptIdParam, { source: 'params' }),     ctrl.getRoleAttempt);
router.post('/attempts/:attemptId/rounds/:order/begin',
  validate(schema.roundParam, { source: 'params' }),         ctrl.beginRound);
router.post('/attempts/:attemptId/rounds/:order/complete',
  validate(schema.roundParam, { source: 'params' }),         ctrl.completeRound);
router.post('/attempts/:attemptId/finish',
  validate(schema.attemptIdParam, { source: 'params' }),     ctrl.finishRoleAttempt);

module.exports = router;