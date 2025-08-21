const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/diaryController');

// List by month
router.get('/month', ctrl.listByMonth);
// List by date
router.get('/', ctrl.listByDate);
// Get one
router.get('/:id', ctrl.getOne);
// Create
router.post('/', ctrl.create);
// Update
router.put('/:id', ctrl.update);
// Delete
router.delete('/:id', ctrl.remove);

module.exports = router;
