// server.js — Custom Express + Next.js + WebSocket
// แก้ปัญหาเดิม: ไม่มี top-level await, ES Module ถูกต้อง

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const express = require("express");
const cors = require("cors");
const compression = require("compression");
const helmet = require("helmet");
const mongoose = require("mongoose");
const { WebSocketServer } = require("ws");
require("dotenv").config({ path: ".env.local" });

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  const server = express();

  // ── Middleware ─────────────────────────────────────────────────
  server.use(cors());
  server.use(compression({ level: 6 }));
  server.use(express.json());
  server.use(
    helmet({
      contentSecurityPolicy: false, // Next.js จัดการ CSP เอง
    }),
  );

  // ── Static: HLS files (proxy จาก NMS port 8888) ───────────────
  // แก้ปัญหาเดิม: HLS อยู่ port 8888 ต่างจาก app → CORS error
  const { createProxyMiddleware } = require("http-proxy-middleware");
  server.use(
    "/hls",
    createProxyMiddleware({
      target: `http://localhost:${process.env.HLS_PORT || 8888}`,
      changeOrigin: true,
    }),
  );

  // ── MongoDB ────────────────────────────────────────────────────
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1); // แก้จากเดิม: graceful exit แทน silent crash
  }

  // ── API Routes ────────────────────────────────────────────────
  const authRoutes = require("./src/server/routes/auth");
  const videoRoutes = require("./src/server/routes/videos");
  const streamRoutes = require("./src/server/routes/stream");
  const seoRoutes = require("./src/server/routes/seo");

  server.use("/api/auth", authRoutes);
  server.use("/api/videos", videoRoutes);
  server.use("/api/stream", streamRoutes);
  server.use("/", seoRoutes); // sitemap.xml, robots.txt

  // ── Next.js handler (SSR + static) ───────────────────────────
  server.all("/{*any}", (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // ── HTTP + WebSocket Server ───────────────────────────────────
  const httpServer = createServer(server);

  // WebSocket chat — แก้ปัญหาเดิม: path ต้องรองรับ /chat/:videoId
  const wss = new WebSocketServer({ server: httpServer });

  // เก็บ clients แยกตาม videoId
  const rooms = new Map(); // Map<videoId, Set<WebSocket>>

  wss.on("connection", (ws, req) => {
    // รับ path /chat/<videoId>
    const match = req.url.match(/^\/chat\/([a-f0-9]{24})$/);
    if (!match) {
      ws.terminate();
      return;
    }

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

        // broadcast ไปทุกคนในห้องเดียวกัน
        rooms.get(videoId)?.forEach((client) => {
          if (client.readyState === 1) client.send(payload);
        });
      } catch {
        // ignore parse errors
      }
    });

    ws.on("close", () => {
      rooms.get(videoId)?.delete(ws);
      if (rooms.get(videoId)?.size === 0) rooms.delete(videoId);
    });

    ws.on("error", () => ws.close());
  });

  // ── Start ────────────────────────────────────────────────────
  const PORT = process.env.PORT || 3001;
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });

  // ── Node Media Server (RTMP → HLS) ────────────────────────────
  const nms = require("./src/server/mediaServer");
  nms.run();
  console.log(`📡 RTMP on port ${process.env.RTMP_PORT || 1935}`);
  console.log(`📺 HLS  on port ${process.env.HLS_PORT || 8888}`);
});
