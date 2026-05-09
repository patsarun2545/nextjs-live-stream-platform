const express   = require('express');
const jwt       = require('jsonwebtoken');
const rateLimit = require('express-rate-limit'); // แก้จากเดิม: เพิ่ม rate limit
const User      = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// แก้จากเดิม: rate limit บน auth routes กัน brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 นาที
  max: 10,
  message: { message: 'ลองใหม่อีกครั้งใน 15 นาที' },
  standardHeaders: true,
  legacyHeaders: false,
});

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(400).json({
        message: existing.email === email
          ? 'อีเมลนี้ถูกใช้งานแล้ว'
          : 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว',
      });
    }
    const user = new User({
      username,
      email,
      passwordHash: password,
      role: role === 'streamer' ? 'streamer' : 'viewer',
    });
    if (user.role === 'streamer') user.generateStreamKey();
    await user.save();
    const token = signToken(user._id);
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    const token = signToken(user._id);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => res.json({ user: req.user }));

// PATCH /api/auth/me
router.patch('/me', protect, async (req, res) => {
  try {
    const allowed = ['username', 'avatar'];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true, runValidators: true,
    });
    res.json({ user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;