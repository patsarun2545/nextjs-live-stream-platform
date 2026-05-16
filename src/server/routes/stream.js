const express = require("express");
const User = require("../models/User");
const Video = require("../models/Video");
const { protect, streamerOnly } = require("../middleware/auth");

const router = express.Router();

// GET /api/stream/key
router.get("/key", protect, streamerOnly, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("+streamKey");
    res.json({ streamKey: user.streamKey });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/stream/key/reset
router.post("/key/reset", protect, streamerOnly, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("+streamKey");
    user.generateStreamKey();
    await user.save();
    res.json({ streamKey: user.streamKey });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/stream/status/:streamKey  (public)
router.get("/status/:streamKey", async (req, res) => {
  try {
    const streamer = await User.findOne({
      streamKey: req.params.streamKey,
    }).select("_id username");
    if (!streamer) return res.status(404).json({ live: false });

    const video = await Video.findOne(
      { streamer: streamer._id, status: "live" },
      "title viewerCount hlsUrl slug",
    ).lean();

    res.json({
      live: !!video,
      video: video || null,
      streamer: { username: streamer.username },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
