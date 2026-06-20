const router   = require('express').Router();
const auth     = require('../middleware/auth');
const validate = require('../middleware/validate');
const schema   = require('../validators/resourceValidators');
const ctrl     = require('../controllers/resourceController');

router.use(auth);
router.get('/', validate(schema.listResources, { source: 'query' }), ctrl.listResources);

module.exports = router;