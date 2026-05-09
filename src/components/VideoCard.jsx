import Link from "next/link";
import Image from "next/image";

export default function VideoCard({ video }) {
  const { title, streamer, viewerCount, thumbnail, slug, category } = video;
  return (
    <Link href={`/watch/${slug}`} style={{ display: "block" }}>
      <div
        style={{
          background: "#1a1a1a",
          borderRadius: "8px",
          overflow: "hidden",
          transition: "transform 0.15s",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            position: "relative",
            aspectRatio: "16/9",
            background: "#111",
          }}
        >
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #1a0533, #0d0d1a)",
                fontSize: "36px",
              }}
            >
              🎮
            </div>
          )}
          <span
            className="badge-live"
            style={{ position: "absolute", top: "8px", left: "8px" }}
          >
            LIVE
          </span>
          <span
            style={{
              position: "absolute",
              bottom: "8px",
              left: "8px",
              background: "rgba(0,0,0,0.75)",
              color: "#fff",
              fontSize: "12px",
              padding: "2px 8px",
              borderRadius: "4px",
            }}
          >
            👁 {viewerCount?.toLocaleString() || 0} คน
          </span>
        </div>
        <div style={{ padding: "10px 12px" }}>
          <div
            style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                flexShrink: 0,
                borderRadius: "50%",
                background: "#9147ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: 700,
                color: "#fff",
              }}
            >
              {streamer?.username?.[0]?.toUpperCase() || "?"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#efeff1",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {title}
              </p>
              <p
                style={{ fontSize: "13px", color: "#adadb8", marginTop: "2px" }}
              >
                {streamer?.username}
              </p>
              <span
                style={{
                  fontSize: "11px",
                  color: "#9147ff",
                  background: "rgba(145,71,255,0.15)",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  display: "inline-block",
                  marginTop: "4px",
                }}
              >
                {category}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
