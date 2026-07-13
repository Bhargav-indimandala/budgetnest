const express = require('express');
const router = express.Router();
const { getAssets, createAsset, updateAsset, deleteAsset } = require('../controllers/assetController');
const { protect } = require('../middleware/auth');
const { validate, assetRules, objectIdRule } = require('../middleware/validate');

router.use(protect);

router.route('/')
  .get(getAssets)
  .post(assetRules, validate, createAsset);

router.route('/:id')
  .put(objectIdRule, updateAsset)
  .delete(objectIdRule, validate, deleteAsset);

module.exports = router;
