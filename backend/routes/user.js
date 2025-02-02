const express = require('express');
const UserStatus = require('../models/UserStatus');
const User = require('../models/User');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profiles/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Update user status endpoint
router.put('/status', async (req, res) => {
    const { userId, status } = req.body;
    try {
        const userStatus = await UserStatus.findOneAndUpdate({ user: userId }, { status }, { new: true, upsert: true });
        res.status(200).json(userStatus);
    } catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).json({ message: 'Error updating user status' });
    }
});

// Search users by name endpoint
router.get('/search/:name', async (req, res) => {
    const { name } = req.params;
    try {
        const users = await User.find({ name: { $regex: name, $options: 'i' } }); // Case insensitive search
        res.status(200).json(users);
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ message: 'Error searching users' });
    }
});

// Add user to contacts endpoint
router.post('/add-contact', async (req, res) => {
    const { userId, contactId } = req.body;
    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (!user.contacts) user.contacts = [];
        if (!user.contacts.includes(contactId)) {
            user.contacts.push(contactId);
            await user.save();
        }
        res.status(200).json({ message: 'Contact added successfully' });
    } catch (error) {
        console.error('Error adding contact:', error);
        res.status(500).json({ message: 'Error adding contact' });
    }
});

// Get all contacts
router.get('/contacts', async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('name email profilePic about isOnline');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search users by name or email
router.get('/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } },
        {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    }).select('name email profilePic about isOnline');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/profile', upload.single('profilePic'), async (req, res) => {
  try {
    const updates = req.body;
    if (req.file) {
      updates.profilePic = `/uploads/profiles/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update online status
router.put('/status', async (req, res) => {
  try {
    const { isOnline } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { isOnline },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update about status
router.put('/about', async (req, res) => {
  try {
    const { about } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { about },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
