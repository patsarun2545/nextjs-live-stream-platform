const express = require("express");
const { SitemapStream, streamToPromise } = require("sitemap");
const { Readable } = require("stream");
const Video = require("../models/Video");

const router = express.Router();

// GET /sitemap.xml
router.get("/sitemap.xml", async (req, res) => {
  try {
    res.header("Content-Type", "application/xml");
    res.header("Cache-Control", "public, max-age=3600");

    const videos = await Video.find({}, "slug updatedAt status").lean();
    const links = [
      { url: "/", changefreq: "always", priority: 1.0 },
      ...videos.map((v) => ({
        url: `/watch/${v.slug}`,
        changefreq: v.status === "live" ? "always" : "weekly",
        priority: v.status === "live" ? 0.9 : 0.6,
        lastmod: v.updatedAt,
      })),
    ];

    const stream = new SitemapStream({ hostname: process.env.SITE_URL });
    const xml = await streamToPromise(Readable.from(links).pipe(stream));
    res.send(xml.toString());
  } catch {
    res.status(500).end();
  }
});

// GET /robots.txt
router.get("/robots.txt", (req, res) => {
  res.type("text/plain").send(
    `User-agent: *
Allow: /
Disallow: /api/
Disallow: /dashboard
Disallow: /login
Disallow: /register

Sitemap: ${process.env.SITE_URL}/sitemap.xml`,
  );
});

module.exports = router;
