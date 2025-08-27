// backend/routes/chatbot.js
const express = require('express');
const router = express.Router();
const { ask } = require('../controllers/aiController'); // your handler

router.post('/ask', ask);

module.exports = router;