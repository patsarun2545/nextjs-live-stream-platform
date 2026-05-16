const NodeMediaServer = require("node-media-server");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const Video = require("./models/Video");
const User = require("./models/User");

const MEDIA_ROOT = process.env.MEDIA_ROOT
  ? path.resolve(process.env.MEDIA_ROOT)
  : path.join(process.cwd(), "media");

const RTMP_PORT = Number(process.env.RTMP_PORT) || 1935;
const HLS_PORT = Number(process.env.HLS_PORT) || 8888;
const FFMPEG_PATH = process.env.FFMPEG_PATH || "/usr/bin/ffmpeg";

const nms = new NodeMediaServer({
  rtmp: {
    port: RTMP_PORT,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60,
  },
  http: {
    port: HLS_PORT,
    mediaroot: MEDIA_ROOT,
    allow_origin: "*",
  },
  trans: {
    ffmpeg: FFMPEG_PATH,
    tasks: [
      {
        app: "live",
        hls: true,
        hlsFlags: "[hls_time=1:hls_list_size=3:hls_flags=delete_segments]",
        dash: false,
      },
    ],
  },
});

// Map<streamKey, ChildProcess>
const activeSessions = new Map();

function getStreamKey(id, StreamPath) {
  if (id?.streamName) return id.streamName;
  if (id?.streamPath) return id.streamPath.split("/").pop();
  if (StreamPath && StreamPath !== "undefined")
    return StreamPath.split("/").pop();
  return "";
}

nms.on("prePublish", async (id, StreamPath) => {
  const streamKey = getStreamKey(id, StreamPath);
  if (!streamKey) return;

  try {
    const streamer = await User.findOne({ streamKey }).select("+streamKey");
    if (!streamer) {
      console.log(`[NMS] Rejected unknown stream key: ${streamKey}`);
      return;
    }

    await Video.findOneAndUpdate(
      { streamer: streamer._id, status: "live" },
      { hlsUrl: `/hls/live/${streamKey}/index.m3u8` },
      { sort: { createdAt: -1 } },
    );

    console.log(`[NMS] Stream started: ${streamer.username}`);
  } catch (err) {
    console.error("[NMS] prePublish error:", err.message);
  }
});

nms.on("postPublish", async (id, StreamPath) => {
  const streamKey = getStreamKey(id, StreamPath);
  if (!streamKey) return;

  const mediaDir = path.join(MEDIA_ROOT, "live", streamKey);
  fs.mkdirSync(mediaDir, { recursive: true });

  const m3u8Path = path.join(mediaDir, "index.m3u8");
  const args = [
    "-i",
    `rtmp://localhost:${RTMP_PORT}/live/${streamKey}`,
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

  const proc = spawn(FFMPEG_PATH, args);
  activeSessions.set(streamKey, proc);

  proc.on("close", (code) => {
    console.log(`[TRANS] ffmpeg exited (${code}): ${streamKey}`);
    activeSessions.delete(streamKey);
  });

  proc.on("error", (err) => {
    console.error("[TRANS] spawn error:", err.message);
  });

  console.log(`[TRANS] Started transcode: ${streamKey}`);
});

nms.on("donePublish", async (id, StreamPath) => {
  const streamKey = getStreamKey(id, StreamPath);
  if (!streamKey) return;

  activeSessions.get(streamKey)?.kill("SIGKILL");
  activeSessions.delete(streamKey);

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
