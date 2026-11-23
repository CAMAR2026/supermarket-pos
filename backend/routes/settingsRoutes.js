const express = require('express');
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect);
router.get('/', getSettings);
router.put('/', authorize('admin'), upload.single('logo'), updateSettings);

module.exports = router;
