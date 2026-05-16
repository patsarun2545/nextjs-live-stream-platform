const { createServer } = require("http");
const { parse } = require("url");
const path = require("path");
const next = require("next");
const express = require("express");
const cors = require("cors");
const compression = require("compression");
const helmet = require("helmet");
const { WebSocketServer, WebSocket } = require("ws");
require("dotenv").config({ path: ".env.local" });

const MEDIA_ROOT = process.env.MEDIA_ROOT
  ? path.resolve(process.env.MEDIA_ROOT)
  : path.join(process.cwd(), "media");

const PORT = process.env.PORT || 3001;
const dev = process.env.NODE_ENV !== "production";

async function start() {
  const nextApp = next({ dev });
  const handle = nextApp.getRequestHandler();
  await nextApp.prepare();

  const server = express();

  // ── Middleware ────────────────────────────────────────────────
  server.use(cors());
  server.use(compression({ level: 6 }));
  server.use(express.json());
  server.use(helmet({ contentSecurityPolicy: false }));

  // ── HLS static files (proxied from media folder to avoid CORS issues) ──
  server.use(
    "/hls",
    express.static(MEDIA_ROOT, {
      setHeaders: (res) => {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Cache-Control", "no-cache");
      },
    }),
  );

  // ── Database ──────────────────────────────────────────────────
  const connectDB = require("./src/server/db");
  await connectDB();

  // ── API Routes ────────────────────────────────────────────────
  server.use("/api/auth", require("./src/server/routes/auth"));
  server.use("/api/videos", require("./src/server/routes/videos"));
  server.use("/api/stream", require("./src/server/routes/stream"));
  server.use("/", require("./src/server/routes/seo"));

  // ── Next.js (SSR + static) ────────────────────────────────────
  server.all("/{*any}", (req, res) => handle(req, res, parse(req.url, true)));

  // ── HTTP + WebSocket ──────────────────────────────────────────
  const httpServer = createServer(server);
  setupWebSocket(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });

  // ── Media server (RTMP → HLS) ─────────────────────────────────
  const nms = require("./src/server/mediaServer");
  nms.run();
  console.log(`📡 RTMP on port ${process.env.RTMP_PORT || 1935}`);
  console.log(`📺 HLS  on port ${process.env.HLS_PORT || 8888}`);
}

function setupWebSocket(httpServer) {
  const wss = new WebSocketServer({ server: httpServer });

  // Map<videoId, Set<WebSocket>>
  const rooms = new Map();

  wss.on("connection", (ws, req) => {
    const match = req.url.match(/^\/chat\/([a-f0-9]{24})$/);
    if (!match) return ws.terminate();

    const videoId = match[1];
    if (!rooms.has(videoId)) rooms.set(videoId, new Set());
    rooms.get(videoId).add(ws);

    ws.on("message", (raw) => {
      try {
        const data = JSON.parse(raw.toString());
        if (data.type !== "message" || !data.text?.trim()) return;

        const payload = JSON.stringify({
          username: (data.username || "ผู้ไม่ระบุชื่อ").substring(0, 30),
          text: data.text.trim().substring(0, 200),
          timestamp: Date.now(),
        });

        rooms.get(videoId)?.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) client.send(payload);
        });
      } catch {
        /* ignore parse errors */
      }
    });

    ws.on("close", () => {
      rooms.get(videoId)?.delete(ws);
      if (rooms.get(videoId)?.size === 0) rooms.delete(videoId);
    });

    ws.on("error", () => ws.close());
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
