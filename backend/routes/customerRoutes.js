const express = require('express');
const {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require('../controllers/customerController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);
router.get('/', getCustomers);
router.post('/', authorize('admin', 'cashier'), createCustomer);
router.put('/:id', authorize('admin', 'cashier'), updateCustomer);
router.delete('/:id', authorize('admin'), deleteCustomer);

module.exports = router;
