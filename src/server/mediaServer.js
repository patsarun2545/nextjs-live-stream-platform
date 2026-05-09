const NodeMediaServer = require('node-media-server');
const Video = require('./models/Video');
const User  = require('./models/User');

const MEDIA_ROOT = process.env.MEDIA_ROOT || './media';

const config = {
  rtmp: {
    port:         Number(process.env.RTMP_PORT) || 1935,
    chunk_size:   60000,
    gop_cache:    true,
    ping:         30,
    ping_timeout: 60,
  },
  http: {
    port:        Number(process.env.HLS_PORT) || 8888,
    mediaroot:   MEDIA_ROOT,
    allow_origin: '*',
  },
  trans: {
    ffmpeg: process.env.FFMPEG_PATH || '/usr/bin/ffmpeg',
    tasks: [
      {
        app:      'live',
        hls:      true,
        hlsFlags: '[hls_time=2:hls_list_size=3:hls_flags=delete_segments]',
        dash:     false,
      },
    ],
  },
};

const nms = new NodeMediaServer(config);

nms.on('prePublish', async (id, StreamPath, params) => {
  const streamKey = (StreamPath || '').split('/').pop();
  if (!streamKey) return;
  try {
    const streamer = await User.findOne({ streamKey }).select('+streamKey');
    if (!streamer) {
      const session = nms.getSession(id);
      session.reject();
      console.log(`[NMS] Rejected unknown stream key: ${streamKey}`);
      return;
    }
    const hlsUrl = `/hls/live/${streamKey}/index.m3u8`;
    await Video.findOneAndUpdate(
      { streamer: streamer._id, status: 'live' },
      { hlsUrl },
      { sort: { createdAt: -1 } }
    );
    console.log(`[NMS] Stream started: ${streamer.username}`);
  } catch (err) {
    console.error('[NMS] prePublish error:', err.message);
  }
});

nms.on('donePublish', async (id, StreamPath, params) => {
  const streamKey = (StreamPath || '').split('/').pop();
  if (!streamKey) return;
  try {
    const streamer = await User.findOne({ streamKey });
    if (!streamer) return;
    await Video.findOneAndUpdate(
      { streamer: streamer._id, status: 'live' },
      { status: 'ended', endedAt: new Date() },
      { sort: { createdAt: -1 }, new: true }
    );
    console.log(`[NMS] Stream ended: ${streamer.username}`);
  } catch (err) {
    console.error('[NMS] donePublish error:', err.message);
  }
});

nms.on('prePlay', async (id, StreamPath, params) => {
  const streamKey = (StreamPath || '').split('/').pop();
  if (!streamKey) return;
  try {
    const streamer = await User.findOne({ streamKey });
    if (!streamer) return;
    await Video.findOneAndUpdate(
      { streamer: streamer._id, status: 'live' },
      { $inc: { viewerCount: 1 } },
      { sort: { createdAt: -1 } }
    );
  } catch { /* silent */ }
});

nms.on('donePlay', async (id, StreamPath, params) => {
  const streamKey = (StreamPath || '').split('/').pop();
  if (!streamKey) return;
  try {
    const streamer = await User.findOne({ streamKey });
    if (!streamer) return;
    await Video.findOneAndUpdate(
      { streamer: streamer._id, status: 'live' },
      [{ $set: { viewerCount: { $max: [{ $subtract: ['$viewerCount', 1] }, 0] } } }],
      { sort: { createdAt: -1 } }
    );
  } catch { /* silent */ }
});

module.exports = nms;