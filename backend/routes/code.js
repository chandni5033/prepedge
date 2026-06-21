const router   = require('express').Router();
const auth     = require('../middleware/auth');
const validate = require('../middleware/validate');
const schema   = require('../validators/codeValidators');
const ctrl     = require('../controllers/codeController');


router.post('/run', auth, validate(schema.runCode), ctrl.runCode);

module.exports = router;