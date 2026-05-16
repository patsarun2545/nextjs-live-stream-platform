const express = require("express");
const mongoose = require("mongoose");
const Video = require("../models/Video");
const User = require("../models/User");
const { protect, streamerOnly } = require("../middleware/auth");

const router = express.Router();

const isObjectId = (v) => mongoose.isValidObjectId(v);

// GET /api/videos
router.get("/", async (req, res) => {
  try {
    const {
      category,
      search,
      page = 1,
      limit = 20,
      streamer,
      status,
    } = req.query;

    if (search) {
      const videos = await Video.search(search, Number(limit));
      return res.json({ videos, total: videos.length });
    }

    const filter = {};

    if (streamer) {
      if (!isObjectId(streamer)) {
        return res.status(400).json({ message: "streamer id ไม่ถูกต้อง" });
      }
      filter.streamer = streamer;
    } else {
      filter.status = status || "live";
    }

    if (category) filter.category = category;

    const skip = (Number(page) - 1) * Number(limit);
    const [videos, total] = await Promise.all([
      Video.find(filter)
        .populate("streamer", "username avatar")
        .sort({ viewerCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Video.countDocuments(filter),
    ]);

    res.json({ videos, total, page: Number(page) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/videos/:slug
router.get("/:slug", async (req, res) => {
  try {
    const video = await Video.findOne({ slug: req.params.slug })
      .populate("streamer", "username avatar followers role")
      .populate("comments.user", "username avatar")
      .lean();

    if (!video) return res.status(404).json({ message: "ไม่พบ stream นี้" });

    Video.findByIdAndUpdate(video._id, { $inc: { totalViews: 1 } }).exec();

    res.json({ video });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/videos
router.post("/", protect, streamerOnly, async (req, res) => {
  try {
    const { title, description, category, tags } = req.body;

    const user = await User.findById(req.user._id).select("+streamKey");
    const video = await Video.create({
      title,
      description,
      category,
      tags: tags || [],
      streamer: req.user._id,
      hlsUrl: `/hls/live/${user.streamKey}/index.m3u8`,
      status: "live",
    });

    await video.populate("streamer", "username avatar");
    res.status(201).json({ video });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH /api/videos/:slug
router.patch("/:slug", protect, streamerOnly, async (req, res) => {
  try {
    const param = req.params.slug;
    const query = isObjectId(param) ? { _id: param } : { slug: param };
    const video = await Video.findOne(query);

    if (!video) return res.status(404).json({ message: "ไม่พบ stream" });

    if (video.streamer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "ไม่ใช่เจ้าของ stream นี้" });
    }

    const ALLOWED_FIELDS = [
      "title",
      "description",
      "category",
      "tags",
      "thumbnail",
      "status",
    ];
    ALLOWED_FIELDS.forEach((f) => {
      if (req.body[f] !== undefined) video[f] = req.body[f];
    });

    if (req.body.status === "ended" && !video.endedAt) {
      video.endedAt = new Date();
    }

    await video.save();
    res.json({ video });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/videos/:id/comments
router.post("/:id/comments", protect, async (req, res) => {
  try {
    const text = req.body.text?.trim();
    if (!text) return res.status(400).json({ message: "กรุณาใส่ข้อความ" });

    const video = await Video.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          comments: {
            $each: [{ user: req.user._id, text }],
            $position: 0,
            $slice: 200,
          },
        },
      },
      { new: true },
    ).populate("comments.user", "username avatar");

    res.status(201).json({ comment: video.comments[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/videos/:id/like
router.post("/:id/like", protect, async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true },
    );
    if (!video) return res.status(404).json({ message: "ไม่พบ stream นี้" });
    res.json({ likes: video.likes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
