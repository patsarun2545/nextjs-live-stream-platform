"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import VideoCard from "@/components/VideoCard";

const CATEGORIES = [
  "ทั้งหมด",
  "gaming",
  "music",
  "education",
  "sports",
  "lifestyle",
];
const LIMIT = 20;

export default function HomeClient() {
  const [videos, setVideos] = useState([]);
  const [category, setCategory] = useState("ทั้งหมด");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (category !== "ทั้งหมด") params.category = category;
      if (query) params.search = query;
      const { data } = await axios.get("/api/videos", { params });
      setVideos(data.videos);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [category, query, page]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Reset to page 1 when filters change — setPage(1) will trigger fetchVideos via page dependency
  // Use a ref to skip the reset on the very first render to avoid double fetch on mount
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setPage(1);
  }, [category, query]);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setQuery(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div
      className="container"
      style={{ paddingTop: "24px", paddingBottom: "40px" }}
    >
      {/* Search */}
      <input
        type="search"
        className="input-base"
        placeholder="ค้นหา stream..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: "16px", fontSize: "15px" }}
      />

      {/* Category filters */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          marginBottom: "24px",
        }}
      >
        {CATEGORIES.map((cat) => {
          const active = cat === category;
          return (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                background: active ? "var(--accent)" : "var(--bg-card)",
                border: `1px solid ${active ? "var(--accent)" : "var(--border-input)"}`,
                color: active ? "#fff" : "var(--text-muted)",
                padding: "6px 14px",
                borderRadius: "var(--radius-full)",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: active ? 600 : 400,
                transition: `all var(--transition)`,
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <SkeletonGrid />
      ) : videos.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "16px",
            }}
          >
            {videos.map((v) => (
              <VideoCard key={v._id} video={v} />
            ))}
          </div>

          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "8px",
                marginTop: "32px",
              }}
            >
              <PageButton
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
              >
                ← ก่อนหน้า
              </PageButton>
              <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                {page} / {totalPages}
              </span>
              <PageButton
                onClick={() => setPage((p) => p + 1)}
                disabled={page === totalPages}
              >
                ถัดไป →
              </PageButton>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SkeletonGrid() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "16px",
      }}
    >
      {Array.from({ length: 8 }, (_, i) => (
        <div
          key={i}
          style={{
            background: "var(--bg-card)",
            borderRadius: "var(--radius)",
            aspectRatio: "16/9",
            animation: `pulse 1.5s ease-in-out ${i * 0.08}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "80px 0",
        color: "var(--text-muted)",
      }}
    >
      <p style={{ fontSize: "40px", marginBottom: "16px" }}>📭</p>
      <p style={{ fontSize: "16px", marginBottom: "8px" }}>
        ไม่มี stream ออนไลน์ตอนนี้
      </p>
      <p style={{ fontSize: "13px" }}>ลองเปลี่ยนหมวดหมู่หรือค้นหาใหม่</p>
    </div>
  );
}

function PageButton({ onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="btn-secondary"
      style={{
        color: disabled ? "var(--text-dim)" : "var(--text-primary)",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}
