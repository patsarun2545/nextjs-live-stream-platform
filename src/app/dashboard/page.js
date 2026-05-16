"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useAuth } from "@/hooks/useAuth";
import { FormField, Card, Spinner } from "@/components/ui";

// ─── Hook: all dashboard data & actions ──────────────────────────────────────
function Dashboard(user) {
  const [streamKey, setStreamKey] = useState("");
  const [activeStream, setActiveStream] = useState(null);
  const [myStreams, setMyStreams] = useState([]);

  const userId = user?._id; // stable primitive — avoids re-running effects on every render

  useEffect(() => {
    if (!userId) return;
    axios
      .get("/api/stream/key")
      .then((res) => setStreamKey(res.data.streamKey))
      .catch(console.error);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    axios
      .get("/api/videos", { params: { streamer: userId } })
      .then((res) => setMyStreams(res.data.videos ?? []))
      .catch(console.error);
  }, [userId]);

  useEffect(() => {
    if (!streamKey) return;
    axios
      .get(`/api/stream/status/${streamKey}`)
      .then((res) => {
        if (res.data.live && res.data.video) setActiveStream(res.data.video);
      })
      .catch(console.error);
  }, [streamKey]);

  const resetKey = async () => {
    if (!confirm("รีเซ็ต stream key? OBS และ software อื่นต้องอัปเดต key ใหม่"))
      return false;
    const { data } = await axios.post("/api/stream/key/reset");
    setStreamKey(data.streamKey);
    return true;
  };

  const startStream = async (form) => {
    const { data } = await axios.post("/api/videos", {
      ...form,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
    setActiveStream(data.video);
    return data.video;
  };

  const endStream = async () => {
    if (!activeStream) return;
    await axios.patch(`/api/videos/${activeStream.slug ?? activeStream._id}`, {
      status: "ended",
    });
    setActiveStream(null);
  };

  return {
    streamKey,
    activeStream,
    myStreams,
    resetKey,
    startStream,
    endStream,
  };
}

// ─── Page ────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "go-live", label: "🎬 เริ่ม Stream ใหม่" },
  { id: "manage", label: "⚙️ จัดการ" },
  { id: "history", label: "📋 ประวัติ" },
  { id: "settings", label: "🔑 ตั้งค่า" },
];

const CATEGORIES = [
  "gaming",
  "music",
  "education",
  "sports",
  "lifestyle",
  "other",
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState("go-live");

  const {
    streamKey,
    activeStream,
    myStreams,
    resetKey,
    startStream,
    endStream,
  } = Dashboard(user);

  // Redirect non-streamers
  useEffect(() => {
    if (!authLoading && (!user || !["streamer", "admin"].includes(user.role))) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  // Auto-switch to manage tab when live
  useEffect(() => {
    if (activeStream) setTab("manage");
  }, [activeStream]);

  if (authLoading) return <Spinner />;

  const tabLabel = TABS.map((t) =>
    t.id === "manage" && activeStream
      ? { ...t, label: "🔴 จัดการ Stream ปัจจุบัน" }
      : t,
  );

  return (
    <div
      className="container"
      style={{ paddingTop: "28px", paddingBottom: "48px", maxWidth: "860px" }}
    >
      <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "24px" }}>
        Studio ของฉัน
      </h1>

      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          marginBottom: "28px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {tabLabel.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: "transparent",
              border: "none",
              padding: "10px 16px",
              cursor: "pointer",
              fontSize: "13px",
              marginBottom: "-1px",
              color: tab === t.id ? "var(--accent)" : "var(--text-muted)",
              fontWeight: tab === t.id ? 600 : 400,
              borderBottom:
                tab === t.id
                  ? "2px solid var(--accent)"
                  : "2px solid transparent",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "go-live" && (
        <GoLiveTab
          activeStream={activeStream}
          onStart={startStream}
          onSwitchTab={setTab}
        />
      )}
      {tab === "manage" && (
        <ManageTab
          activeStream={activeStream}
          onEnd={endStream}
          onSwitchTab={setTab}
        />
      )}
      {tab === "history" && <HistoryTab streams={myStreams} />}
      {tab === "settings" && (
        <SettingsTab streamKey={streamKey} onReset={resetKey} />
      )}
    </div>
  );
}

// ─── Tab: Go Live ─────────────────────────────────────────────────────────────
function GoLiveTab({ activeStream, onStart, onSwitchTab }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "gaming",
    tags: "",
  });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleStart = async () => {
    if (!form.title.trim()) {
      setMsg("❌ กรุณาใส่ชื่อ stream");
      return;
    }
    setLoading(true);
    setMsg("");
    try {
      await onStart(form);
      setMsg("✅ สร้าง stream สำเร็จ! เริ่มส่งสัญญาณจาก OBS ได้เลย");
      onSwitchTab("manage");
    } catch (err) {
      setMsg(`❌ ${err.response?.data?.message ?? "เกิดข้อผิดพลาด"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {activeStream && (
        <div
          style={{
            background: "var(--danger-muted)",
            border: "1px solid var(--danger-border)",
            borderRadius: "var(--radius)",
            padding: "12px 16px",
            marginBottom: "20px",
            color: "#ff6b6b",
            fontSize: "14px",
          }}
        >
          ⚠️ คุณมี stream ที่กำลัง live อยู่ ({activeStream.title}) — ไปที่แท็บ
          &quot;จัดการ&quot;
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          maxWidth: "580px",
        }}
      >
        <FormField label="ชื่อ Stream" required>
          <input
            className="input-base"
            value={form.title}
            onChange={set("title")}
            placeholder="เช่น: เล่น Elden Ring ครั้งแรก!"
            maxLength={100}
          />
        </FormField>

        <FormField label="คำอธิบาย">
          <textarea
            className="input-base"
            value={form.description}
            onChange={set("description")}
            placeholder="อธิบาย stream ของคุณ..."
            maxLength={1000}
            rows={3}
            style={{ resize: "vertical", fontFamily: "inherit" }}
          />
        </FormField>

        <FormField label="หมวดหมู่">
          <select
            className="input-base"
            value={form.category}
            onChange={set("category")}
            style={{ cursor: "pointer" }}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Tags (คั่นด้วย ,)">
          <input
            className="input-base"
            value={form.tags}
            onChange={set("tags")}
            placeholder="fps, competitive, ranked"
          />
        </FormField>

        {msg && (
          <p
            style={{
              fontSize: "14px",
              color: msg.startsWith("✅") ? "var(--success)" : "#ff6b6b",
            }}
          >
            {msg}
          </p>
        )}

        <button
          className="btn-primary"
          onClick={handleStart}
          disabled={loading || !!activeStream}
        >
          {loading ? "กำลังสร้าง..." : "🎬 สร้าง Stream"}
        </button>
      </div>

      {/* OBS guide */}
      <Card style={{ marginTop: "32px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "14px" }}>
          วิธีตั้งค่า OBS
        </h3>
        <div
          style={{
            fontSize: "13px",
            color: "var(--text-muted)",
            lineHeight: 1.8,
          }}
        >
          <p>1. เปิด OBS → Settings → Stream</p>
          <p>
            2. Service: <Code>Custom</Code>
          </p>
          <p>
            3. Server: <Code>rtmp://localhost:1935/live</Code>
          </p>
          <p>4. Stream Key: ดูได้ที่แท็บ &quot;ตั้งค่า&quot;</p>
          <p>5. กด &quot;Apply&quot; → OK → Start Streaming</p>
        </div>
      </Card>
    </div>
  );
}

// ─── Tab: Manage ──────────────────────────────────────────────────────────────
function ManageTab({ activeStream, onEnd, onSwitchTab }) {
  const handleEnd = async () => {
    if (!confirm("จบ stream?")) return;
    try {
      await onEnd();
    } catch {
      alert("เกิดข้อผิดพลาด");
    }
  };

  if (!activeStream)
    return (
      <div
        style={{
          textAlign: "center",
          padding: "40px",
          color: "var(--text-muted)",
        }}
      >
        <p style={{ fontSize: "32px", marginBottom: "12px" }}>📡</p>
        <p>ยังไม่มี stream ที่กำลัง live อยู่</p>
        <button
          className="btn-primary"
          onClick={() => onSwitchTab("go-live")}
          style={{ width: "auto", marginTop: "16px", padding: "10px 24px" }}
        >
          เริ่ม Stream ใหม่
        </button>
      </div>
    );

  const watchUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/watch/${activeStream.slug ?? activeStream._id}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "8px",
              }}
            >
              <span className="badge-live">LIVE</span>
              <h2 style={{ fontSize: "18px", fontWeight: 700 }}>
                {activeStream.title}
              </h2>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
              👁 {activeStream.viewerCount?.toLocaleString() ?? 0} คนดูอยู่
            </p>
          </div>
          <button
            onClick={handleEnd}
            style={{
              background: "var(--danger)",
              border: "none",
              borderRadius: "var(--radius)",
              padding: "10px 20px",
              color: "#fff",
              fontWeight: 700,
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            ⏹ จบ Stream
          </button>
        </div>
      </Card>

      <Card>
        <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>
          ลิงก์ดู Stream
        </h3>
        <Code block>{watchUrl}</Code>
      </Card>
    </div>
  );
}

// ─── Tab: History ─────────────────────────────────────────────────────────────
function HistoryTab({ streams }) {
  if (streams.length === 0)
    return (
      <p
        style={{
          color: "var(--text-muted)",
          textAlign: "center",
          padding: "40px",
        }}
      >
        ยังไม่มีประวัติ stream
      </p>
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {streams.map((s) => {
        const live = s.status === "live";
        return (
          <div
            key={s._id}
            style={{
              background: "var(--bg-card)",
              borderRadius: "var(--radius)",
              padding: "14px 16px",
              border: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <p style={{ fontWeight: 600, fontSize: "14px" }}>{s.title}</p>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  marginTop: "4px",
                }}
              >
                {new Date(s.createdAt).toLocaleDateString("th-TH")} • 👁{" "}
                {s.totalViews?.toLocaleString() ?? 0} วิว • ❤️ {s.likes ?? 0}
              </p>
            </div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                padding: "3px 10px",
                borderRadius: "4px",
                background: live
                  ? "rgba(233,25,22,0.15)"
                  : "rgba(100,100,100,0.15)",
                color: live ? "#ff6b6b" : "var(--text-muted)",
              }}
            >
              {live ? "LIVE" : "จบแล้ว"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Tab: Settings ────────────────────────────────────────────────────────────
function SettingsTab({ streamKey, onReset }) {
  const [showKey, setShowKey] = useState(false);
  const [keyLoading, setKeyLoading] = useState(false);

  const handleReset = async () => {
    setKeyLoading(true);
    try {
      const ok = await onReset();
      if (ok) alert("รีเซ็ต stream key สำเร็จ");
    } catch {
      alert("เกิดข้อผิดพลาด");
    } finally {
      setKeyLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "560px" }}>
      <Card>
        <h2 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "16px" }}>
          Stream Key
        </h2>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <code
            style={{
              flex: 1,
              background: "var(--bg-input)",
              border: "1px solid var(--border-input)",
              borderRadius: "var(--radius)",
              padding: "10px 14px",
              fontSize: "14px",
              color: "var(--accent)",
              wordBreak: "break-all",
              filter: showKey ? "none" : "blur(6px)",
              userSelect: showKey ? "text" : "none",
              transition: "filter 0.2s",
            }}
          >
            {streamKey || "กำลังโหลด..."}
          </code>
          <button
            className="btn-secondary"
            onClick={() => setShowKey((s) => !s)}
          >
            {showKey ? "🙈 ซ่อน" : "👁 แสดง"}
          </button>
          <button
            className="btn-secondary"
            onClick={() => {
              navigator.clipboard.writeText(streamKey);
              alert("คัดลอกแล้ว!");
            }}
          >
            📋 คัดลอก
          </button>
        </div>
        <p
          style={{
            fontSize: "12px",
            color: "var(--text-muted)",
            marginTop: "10px",
          }}
        >
          ⚠️ อย่าแชร์ stream key ให้ใคร &mdash; ใครมี key นี้สามารถ stream
          แทนคุณได้
        </p>
        <button
          onClick={handleReset}
          disabled={keyLoading}
          style={{
            marginTop: "16px",
            background: "transparent",
            border: "1px solid var(--danger)",
            color: "var(--danger)",
            borderRadius: "var(--radius)",
            padding: "8px 16px",
            cursor: keyLoading ? "not-allowed" : "pointer",
            fontSize: "13px",
            fontWeight: 600,
            opacity: keyLoading ? 0.6 : 1,
          }}
        >
          {keyLoading ? "กำลังรีเซ็ต..." : "🔄 รีเซ็ต Stream Key"}
        </button>
      </Card>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Code({ children, block }) {
  return (
    <code
      style={{
        display: block ? "block" : "inline",
        background: "var(--bg-input)",
        padding: block ? "10px 14px" : "2px 8px",
        borderRadius: "var(--radius-sm)",
        fontSize: block ? "13px" : "12px",
        color: "var(--accent)",
        wordBreak: "break-all",
      }}
    >
      {children}
    </code>
  );
}
