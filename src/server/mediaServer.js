const NodeMediaServer = require("node-media-server");
const Video = require("./models/Video");
const User = require("./models/User");
const path = require("path");
const fs = require("fs");

const MEDIA_ROOT = process.env.MEDIA_ROOT
  ? path.resolve(process.env.MEDIA_ROOT)
  : path.join(process.cwd(), "media");

const config = {
  rtmp: {
    port: Number(process.env.RTMP_PORT) || 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60,
  },
  http: {
    port: Number(process.env.HLS_PORT) || 8888,
    mediaroot: MEDIA_ROOT,
    allow_origin: "*",
  },
  trans: {
    ffmpeg: process.env.FFMPEG_PATH || "/usr/bin/ffmpeg",
    tasks: [
      {
        app: "live",
        hls: true,
        hlsFlags: "[hls_time=2:hls_list_size=3:hls_flags=delete_segments]",
        dash: false,
      },
    ],
  },
};

console.log("FFMPEG PATH:", process.env.FFMPEG_PATH);
console.log("MEDIA_ROOT:", MEDIA_ROOT);
const nms = new NodeMediaServer(config);

const getStreamKey = (id, StreamPath) => {
  if (id?.streamName) return id.streamName;
  if (id?.streamPath) return id.streamPath.split("/").pop();
  if (StreamPath && StreamPath !== "undefined")
    return StreamPath.split("/").pop();
  return "";
};

const { spawn } = require("child_process");
const activeSessions = new Map();

nms.on("postPublish", async (id, StreamPath) => {
  const streamKey = getStreamKey(id, StreamPath);
  if (!streamKey) return;
  console.log(`[TRANS] postPublish — starting transcode: ${streamKey}`);

  const mediaDir = path.join(MEDIA_ROOT, "live", streamKey);
  fs.mkdirSync(mediaDir, { recursive: true });

  const ffmpegPath = process.env.FFMPEG_PATH || "/usr/bin/ffmpeg";
  const rtmpPort = Number(process.env.RTMP_PORT) || 1935;
  const m3u8Path = path.join(mediaDir, "index.m3u8");

  const args = [
    "-i",
    `rtmp://localhost:${rtmpPort}/live/${streamKey}`,
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-f",
    "hls",
    "-hls_time",
    "2",
    "-hls_list_size",
    "3",
    "-hls_flags",
    "delete_segments",
    m3u8Path,
  ];

  const proc = spawn(ffmpegPath, args);
  activeSessions.set(streamKey, proc);

  proc.stderr.on("data", () => {
    // uncomment ถ้าอยากดู log ffmpeg
    // console.log("[FFMPEG]", data.toString());
  });

  proc.on("close", (code) => {
    console.log(`[TRANS] ffmpeg exited (${code}): ${streamKey}`);
    activeSessions.delete(streamKey);
  });

  proc.on("error", (err) => {
    console.error("[TRANS] spawn error:", err.message);
  });

  console.log(`[TRANS] Started transcode: ${streamKey}`);
});

nms.on("prePublish", async (id, StreamPath) => {
  const streamKey = getStreamKey(id, StreamPath);
  console.log("[NMS] prePublish streamKey:", streamKey);
  if (!streamKey) return;
  try {
    const streamer = await User.findOne({ streamKey }).select("+streamKey");
    if (!streamer) {
      console.log(`[NMS] Rejected unknown stream key: ${streamKey}`);
      return;
    }
    const hlsUrl = `/hls/live/${streamKey}/index.m3u8`;
    await Video.findOneAndUpdate(
      { streamer: streamer._id, status: "live" },
      { hlsUrl },
      { sort: { createdAt: -1 } },
    );
    console.log(`[NMS] Stream started: ${streamer.username}`);
  } catch (err) {
    console.error("[NMS] prePublish error:", err.message);
  }
});

nms.on("donePublish", async (id, StreamPath) => {
  const streamKey = getStreamKey(id, StreamPath);
  if (!streamKey) return;

  const proc = activeSessions.get(streamKey);
  if (proc) {
    proc.kill("SIGKILL");
    activeSessions.delete(streamKey);
  }

  try {
    const streamer = await User.findOne({ streamKey });
    if (!streamer) return;
    await Video.findOneAndUpdate(
      { streamer: streamer._id, status: "live" },
      { status: "ended", endedAt: new Date() },
      { sort: { createdAt: -1 }, returnDocument: "after" },
    );
    console.log(`[NMS] Stream ended: ${streamer.username}`);
  } catch (err) {
    console.error("[NMS] donePublish error:", err.message);
  }
});

nms.on("prePlay", async (id, StreamPath) => {
  const streamKey = getStreamKey(id, StreamPath);
  if (!streamKey) return;
  try {
    const streamer = await User.findOne({ streamKey });
    if (!streamer) return;
    await Video.findOneAndUpdate(
      { streamer: streamer._id, status: "live" },
      { $inc: { viewerCount: 1 } },
      { sort: { createdAt: -1 } },
    );
  } catch {
    /* silent */
  }
});

nms.on("donePlay", async (id, StreamPath) => {
  const streamKey = getStreamKey(id, StreamPath);
  if (!streamKey) return;
  try {
    const streamer = await User.findOne({ streamKey });
    if (!streamer) return;
    await Video.findOneAndUpdate(
      { streamer: streamer._id, status: "live" },
      [
        {
          $set: {
            viewerCount: { $max: [{ $subtract: ["$viewerCount", 1] }, 0] },
          },
        },
      ],
      { sort: { createdAt: -1 } },
    );
  } catch {
    /* silent */
  }
});

module.exports = nms;
