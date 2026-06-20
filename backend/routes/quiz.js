const router   = require('express').Router();
const auth     = require('../middleware/auth');
const validate = require('../middleware/validate');
const schema   = require('../validators/quizValidators');
const ctrl     = require('../controllers/quizController');

router.use(auth);

router.post('/create',         validate(schema.createQuiz),                            ctrl.createQuiz);
router.get ('/history',        ctrl.listMyQuizzes);
router.post('/:id/answer',
  validate(schema.idParam, { source: 'params' }),
  validate(schema.answerQuestion),                                                       ctrl.answerQuestion);
router.post('/:id/finish',
  validate(schema.idParam, { source: 'params' }),                                       ctrl.finishQuiz);

module.exports = router;