/**
 * Direct Messaging Controller
 * Author: Axiocruit Core Engineering
 */

const mongoose = require('mongoose');
const Message = require('../models/Message');

// @desc    Get all incoming messages for logged-in user (Inbox)
// @route   GET /api/messages/my-messages OR GET /api/messages
// @access  Private
exports.getMyMessages = async (req, res) => {
  try {
    const messages = await Message.find({ receiverId: req.user._id })
      .populate('senderId', 'name role avatar companyName profilePicture')
      .sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    console.error('[MessageController][MyMessages] Error:', err.message);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
};

// @desc    Get conversations grouped by contact
// @route   GET /api/messages/conversations
// @access  Private
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    // Find all messages involving this user
    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    })
      .sort({ createdAt: -1 })
      .populate('senderId', 'name role profilePicture')
      .populate('receiverId', 'name role profilePicture');

    // Group by the other person
    const conversationMap = {};
    for (const msg of messages) {
      if (!msg.senderId || !msg.receiverId) continue;

      const otherId =
        msg.senderId._id.toString() === userId
          ? msg.receiverId._id.toString()
          : msg.senderId._id.toString();

      if (!conversationMap[otherId]) {
        const otherUser =
          msg.senderId._id.toString() === userId ? msg.receiverId : msg.senderId;

        conversationMap[otherId] = {
          contact: {
            _id: otherUser._id,
            name: otherUser.name,
            role: otherUser.role,
            profilePicture: otherUser.profilePicture,
          },
          lastMessage: {
            content: msg.content,
            createdAt: msg.createdAt,
            senderId: { _id: msg.senderId._id.toString() },
          },
          unreadCount: 0,
        };
      }

      // Count unread messages from the other person
      if (msg.senderId._id.toString() !== userId && !msg.isRead) {
        conversationMap[otherId].unreadCount += 1;
      }
    }

    const conversations = Object.values(conversationMap);
    res.json(conversations);
  } catch (err) {
    console.error('[MessageController][Conversations] Error:', err.message);
    res.status(500).json({ message: 'Failed to load conversations' });
  }
};

// @desc    Get full chat history with a specific user
// @route   GET /api/messages/:userId OR GET /api/messages/history/:userId
// @access  Private
exports.getMessagesWithUser = async (req, res) => {
  try {
    const otherId = req.params.userId;
    if (!mongoose.Types.ObjectId.isValid(otherId)) {
      return res.status(404).json({ message: 'User not found' });
    }

    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: otherId },
        { senderId: otherId, receiverId: myId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate('senderId', 'name profilePicture')
      .populate('receiverId', 'name');

    res.json(messages);
  } catch (err) {
    console.error('[MessageController][History] Error:', err.message);
    res.status(500).json({ message: 'Failed to load messages' });
  }
};

// @desc    Mark all messages from userId as read
// @route   PUT /api/messages/read/:userId
// @access  Private
exports.markMessagesRead = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(404).json({ message: 'User not found' });
    }

    await Message.updateMany(
      { senderId: req.params.userId, receiverId: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[MessageController][MarkRead] Error:', err.message);
    res.status(500).json({ message: 'Failed to mark messages as read' });
  }
};

// @desc    Send a new direct message
// @route   POST /api/messages OR POST /api/messages/send
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;

    if (!receiverId || !content?.trim()) {
      return res.status(400).json({ message: 'receiverId and content are required' });
    }

    const message = await Message.create({
      senderId: req.user._id,
      receiverId,
      content: content.trim(),
    });

    const populated = await Message.findById(message._id)
      .populate('senderId', 'name profilePicture')
      .populate('receiverId', 'name');

    res.status(201).json(populated);
  } catch (err) {
    console.error('[MessageController][SendMessage] Error:', err.message);
    res.status(500).json({ message: 'Failed to send message' });
  }
};
