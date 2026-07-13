const express = require('express');
const router = express.Router();
const { getGroceries, createGrocery, updateGrocery, deleteGrocery, getInventory } = require('../controllers/groceryController');
const { protect } = require('../middleware/auth');
const { validate, groceryRules, objectIdRule } = require('../middleware/validate');

router.use(protect);

router.get('/inventory', getInventory);

router.route('/')
  .get(getGroceries)
  .post(groceryRules, validate, createGrocery);

router.route('/:id')
  .put(objectIdRule, updateGrocery)
  .delete(objectIdRule, validate, deleteGrocery);

module.exports = router;
