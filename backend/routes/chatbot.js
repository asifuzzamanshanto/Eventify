// backend/routes/chatbot.js
const express = require('express');
const router = express.Router();
const { chatSuggest } = require('../controllers/aiController');

router.post('/ask', chatSuggest);   // canonical
router.post('/chat', chatSuggest);  // alias (optional)

module.exports = router;
