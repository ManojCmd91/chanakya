const express = require('express');
const router = express.Router();
const { registerBusUser } = require('../controllers/busController');

// POST route for registering a bus user, handled by the controller function
router.post('/register-bus-user', registerBusUser);

module.exports = router;
