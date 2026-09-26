/**
 * Direct Messaging Routes
 * Author: Axiocruit Core Engineering
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getMyMessages,
  getConversations,
  getMessagesWithUser,
  markMessagesRead,
  sendMessage,
} = require('../controllers/messageController');

// Mounted at /api/messages
router.get('/', protect, getMyMessages);
router.get('/my-messages', protect, getMyMessages);
router.get('/conversations', protect, getConversations);
router.get('/:userId', protect, getMessagesWithUser);
router.put('/read/:userId', protect, markMessagesRead);
router.post('/', protect, sendMessage);
router.post('/send', protect, sendMessage);

module.exports = router;
