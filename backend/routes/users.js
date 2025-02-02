const router = require('express').Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get all users except current user and blocked users
router.get('/', auth, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.userId);
        const users = await User.find({
            _id: { 
                $ne: req.user.userId,
                $nin: currentUser.blockedUsers
            }
        }).select('-password');
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
});

// Search users by name
router.get('/search/:query', auth, async (req, res) => {
    try {
        const searchQuery = req.params.query;
        const users = await User.find({
            _id: { 
                $ne: req.user.userId,
                $nin: req.user.blockedUsers
            },
            name: { $regex: searchQuery, $options: 'i' }
        }).select('-password');
        res.json(users);
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ message: 'Error searching users' });
    }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: 'Error fetching profile' });
    }
});

// Get specific user profile
router.get('/:userId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Error fetching user' });
    }
});

// Block a user
router.post('/block/:userId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        const userToBlock = await User.findById(req.params.userId);

        if (!userToBlock) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.blockedUsers.includes(userToBlock._id)) {
            return res.status(400).json({ message: 'User is already blocked' });
        }

        user.blockedUsers.push(userToBlock._id);
        await user.save();

        res.json({ message: 'User blocked successfully' });
    } catch (error) {
        console.error('Error blocking user:', error);
        res.status(500).json({ message: 'Error blocking user' });
    }
});

// Unblock a user
router.post('/unblock/:userId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        const userToUnblock = await User.findById(req.params.userId);

        if (!userToUnblock) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.blockedUsers.includes(userToUnblock._id)) {
            return res.status(400).json({ message: 'User is not blocked' });
        }

        user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== userToUnblock._id.toString());
        await user.save();

        res.json({ message: 'User unblocked successfully' });
    } catch (error) {
        console.error('Error unblocking user:', error);
        res.status(500).json({ message: 'Error unblocking user' });
    }
});

// Get blocked users
router.get('/blocked', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).populate('blockedUsers', '-password');
        res.json(user.blockedUsers);
    } catch (error) {
        console.error('Error fetching blocked users:', error);
        res.status(500).json({ message: 'Error fetching blocked users' });
    }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { name, about, profilePic } = req.body;
        const updateData = {};
        
        if (name) updateData.name = name;
        if (about) updateData.about = about;
        if (profilePic) updateData.profilePic = profilePic;

        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { $set: updateData },
            { new: true }
        ).select('-password');

        res.json(user);
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Error updating profile' });
    }
});

module.exports = router;
