const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: function(req, file, cb) {
    // Allow images, videos, and documents
    if (file.mimetype.startsWith('image/') || 
        file.mimetype.startsWith('video/') || 
        file.mimetype === 'application/pdf' ||
        file.mimetype === 'application/msword' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Get messages between two users
router.get('/:userId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { senderId: req.user.id, receiverId: req.params.userId },
        { senderId: req.params.userId, receiverId: req.user.id }
      ],
      deleted: false,
      deletedFor: { $ne: req.user.id }
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

// Send a message
router.post('/', upload.single('file'), auth, async (req, res) => {
  try {
    const { text, receiverId } = req.body;
    const messageData = {
      senderId: req.user.id,
      receiverId,
      text,
      delivered: false,
      seen: false
    };

    if (req.file) {
      messageData.file = req.file.filename;
      messageData.fileType = req.file.mimetype;
      messageData.fileName = req.file.originalname;
      messageData.type = req.file.mimetype.startsWith('image/') ? 'image' :
                        req.file.mimetype.startsWith('video/') ? 'video' : 'document';
    }

    const message = new Message(messageData);
    await message.save();

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Error sending message' });
  }
});

// Update message
router.put('/:messageId', auth, async (req, res) => {
  try {
    const message = await Message.findOne({
      _id: req.params.messageId,
      senderId: req.user.id
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found or unauthorized' });
    }

    message.text = req.body.text;
    message.edited = true;
    const updatedMessage = await message.save();
    res.json(updatedMessage);
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({ message: 'Error updating message' });
  }
});

// Delete message
router.delete('/:messageId', auth, async (req, res) => {
  try {
    const message = await Message.findOneAndDelete({
      _id: req.params.messageId,
      senderId: req.user.id
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found or unauthorized' });
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Error deleting message' });
  }
});

// Mark message as delivered
router.put('/:messageId/deliver', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.receiverId.toString() === req.user.id) {
      message.delivered = true;
      await message.save();
      res.json(message);
    } else {
      res.status(403).json({ message: 'Not authorized' });
    }
  } catch (error) {
    console.error('Error marking message as delivered:', error);
    res.status(500).json({ message: 'Error updating message' });
  }
});

// Mark message as seen
router.put('/:messageId/seen', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.receiverId.toString() === req.user.id) {
      message.seen = true;
      await message.save();
      res.json(message);
    } else {
      res.status(403).json({ message: 'Not authorized' });
    }
  } catch (error) {
    console.error('Error marking message as seen:', error);
    res.status(500).json({ message: 'Error updating message' });
  }
});

// Delete message for user
router.delete('/:messageId', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.senderId.toString() === req.user.id || 
        message.receiverId.toString() === req.user.id) {
      message.deletedFor.push(req.user.id);
      
      // If both users have deleted the message, mark it as fully deleted
      if (message.deletedFor.length === 2) {
        message.deleted = true;
        
        // Delete file if it exists
        if (message.file) {
          const filePath = path.join('uploads', message.file);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      }
      
      await message.save();
      res.json({ message: 'Message deleted' });
    } else {
      res.status(403).json({ message: 'Not authorized' });
    }
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Error deleting message' });
  }
});

// Clear chat
router.delete('/clear/:userId', auth, async (req, res) => {
  try {
    await Message.updateMany(
      {
        $or: [
          { senderId: req.user.id, receiverId: req.params.userId },
          { senderId: req.params.userId, receiverId: req.user.id }
        ]
      },
      {
        $addToSet: { deletedFor: req.user.id }
      }
    );

    // Find messages that both users have deleted
    const messagesToDelete = await Message.find({
      $or: [
        { senderId: req.user.id, receiverId: req.params.userId },
        { senderId: req.params.userId, receiverId: req.user.id }
      ],
      deletedFor: { $size: 2 }
    });

    // Delete files for fully deleted messages
    for (const message of messagesToDelete) {
      if (message.file) {
        const filePath = path.join('uploads', message.file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    // Mark messages as fully deleted
    await Message.updateMany(
      { _id: { $in: messagesToDelete.map(m => m._id) } },
      { deleted: true }
    );

    res.json({ message: 'Chat cleared' });
  } catch (error) {
    console.error('Error clearing chat:', error);
    res.status(500).json({ message: 'Error clearing chat' });
  }
});

// Clear chat
router.delete('/chat/:userId', auth, async (req, res) => {
  try {
    await Message.deleteMany({
      $or: [
        { senderId: req.user.id, receiverId: req.params.userId },
        { senderId: req.params.userId, receiverId: req.user.id }
      ]
    });
    res.json({ message: 'Chat cleared successfully' });
  } catch (error) {
    console.error('Error clearing chat:', error);
    res.status(500).json({ message: 'Error clearing chat' });
  }
});

module.exports = router;
