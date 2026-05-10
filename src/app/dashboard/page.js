"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [streamKey, setStreamKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [keyLoading, setKeyLoading] = useState(false);

  const [activeStream, setActiveStream] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "gaming",
    tags: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formMsg, setFormMsg] = useState("");

  const [myStreams, setMyStreams] = useState([]);
  const [tab, setTab] = useState("go-live");

  const getAuth = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
  });

  // Redirect ถ้าไม่ใช่ streamer
  useEffect(() => {
    if (!authLoading && (!user || !["streamer", "admin"].includes(user.role))) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  // โหลด stream key
  useEffect(() => {
    if (!user) return;
    axios
      .get("/api/stream/key", getAuth())
      .then((res) => setStreamKey(res.data.streamKey))
      .catch(console.error);
  }, [user]);

  // โหลดประวัติ stream
  useEffect(() => {
    if (!user) return;
    axios
      .get("/api/videos", { params: { streamer: user._id }, ...getAuth() })
      .then((res) => setMyStreams(res.data.videos || []))
      .catch(console.error);
  }, [user]);

  // ตรวจสอบ stream ที่กำลัง live อยู่
  useEffect(() => {
    if (!streamKey) return;
    axios
      .get(`/api/stream/status/${streamKey}`)
      .then((res) => {
        if (res.data.live && res.data.video) {
          setActiveStream(res.data.video);
          setTab("manage");
        }
      })
      .catch(console.error);
  }, [streamKey]);

  const resetKey = async () => {
    if (!confirm("รีเซ็ต stream key? OBS และ software อื่นต้องอัปเดต key ใหม่"))
      return;
    setKeyLoading(true);
    try {
      const { data } = await axios.post("/api/stream/key/reset", {}, getAuth());
      setStreamKey(data.streamKey);
      alert("รีเซ็ต stream key สำเร็จ");
    } catch {
      alert("เกิดข้อผิดพลาด");
    } finally {
      setKeyLoading(false);
    }
  };

  const startStream = async () => {
    if (!form.title.trim()) {
      setFormMsg("❌ กรุณาใส่ชื่อ stream");
      return;
    }
    setFormLoading(true);
    setFormMsg("");
    try {
      const { data } = await axios.post(
        "/api/videos",
        {
          ...form,
          tags: form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        },
        getAuth(),
      );
      setActiveStream(data.video);
      setFormMsg("✅ สร้าง stream สำเร็จ! เริ่มส่งสัญญาณจาก OBS ได้เลย");
      setTab("manage");
    } catch (err) {
      setFormMsg(`❌ ${err.response?.data?.message || "เกิดข้อผิดพลาด"}`);
    } finally {
      setFormLoading(false);
    }
  };

  const endStream = async () => {
    if (!activeStream) return;
    if (!confirm("จบ stream?")) return;
    try {
      await axios.patch(
        `/api/videos/${activeStream.slug || activeStream._id}`,
        {
          status: "ended",
        },
        getAuth(),
      );
      setActiveStream(null);
      setTab("go-live");
      alert("จบ stream สำเร็จ");
    } catch {
      alert("เกิดข้อผิดพลาด");
    }
  };

  if (authLoading)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "60vh",
        }}
      >
        <span style={{ color: "#adadb8" }}>กำลังโหลด...</span>
      </div>
    );

  return (
    <div
      className="container"
      style={{ paddingTop: "28px", paddingBottom: "48px", maxWidth: "860px" }}
    >
      <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "24px" }}>
        Studio ของฉัน
      </h1>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          marginBottom: "28px",
          borderBottom: "1px solid #2a2a2e",
          paddingBottom: "0",
        }}
      >
        {[
          { id: "go-live", label: "🎬 เริ่ม Stream ใหม่" },
          {
            id: "manage",
            label: activeStream ? "🔴 จัดการ Stream ปัจจุบัน" : "⚙️ จัดการ",
          },
          { id: "history", label: "📋 ประวัติ" },
          { id: "settings", label: "🔑 ตั้งค่า" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: "transparent",
              border: "none",
              padding: "10px 16px",
              color: tab === t.id ? "#9147ff" : "#adadb8",
              borderBottom:
                tab === t.id ? "2px solid #9147ff" : "2px solid transparent",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: tab === t.id ? 600 : 400,
              marginBottom: "-1px",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Go Live */}
      {tab === "go-live" && (
        <div>
          {activeStream && (
            <div
              style={{
                background: "rgba(233,25,22,0.08)",
                border: "1px solid rgba(233,25,22,0.25)",
                borderRadius: "8px",
                padding: "12px 16px",
                marginBottom: "20px",
                color: "#ff6b6b",
                fontSize: "14px",
              }}
            >
              ⚠️ คุณมี stream ที่กำลัง live อยู่ ({activeStream.title}) —
              ไปที่แท็บ &quot;จัดการ&quot; เพื่อจัดการหรือจบ stream
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
            <FormField label="ชื่อ Stream *" required>
              <input
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="เช่น: เล่น Elden Ring ครั้งแรก!"
                maxLength={100}
                style={inputStyle}
              />
            </FormField>

            <FormField label="คำอธิบาย">
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="อธิบาย stream ของคุณ..."
                maxLength={1000}
                rows={3}
                style={{
                  ...inputStyle,
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
            </FormField>

            <FormField label="หมวดหมู่">
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((p) => ({ ...p, category: e.target.value }))
                }
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                {[
                  "gaming",
                  "music",
                  "education",
                  "sports",
                  "lifestyle",
                  "other",
                ].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Tags (คั่นด้วย ,)">
              <input
                value={form.tags}
                onChange={(e) =>
                  setForm((p) => ({ ...p, tags: e.target.value }))
                }
                placeholder="fps, competitive, ranked"
                style={inputStyle}
              />
            </FormField>

            {formMsg && (
              <p
                style={{
                  fontSize: "14px",
                  color: formMsg.startsWith("✅") ? "#4caf50" : "#ff6b6b",
                }}
              >
                {formMsg}
              </p>
            )}

            <button
              onClick={startStream}
              disabled={formLoading || !!activeStream}
              style={{
                background: "#9147ff",
                border: "none",
                borderRadius: "8px",
                padding: "12px",
                color: "#fff",
                fontWeight: 700,
                fontSize: "15px",
                cursor:
                  formLoading || !!activeStream ? "not-allowed" : "pointer",
                opacity: formLoading || !!activeStream ? 0.6 : 1,
              }}
            >
              {formLoading ? "กำลังสร้าง..." : "🎬 สร้าง Stream"}
            </button>
          </div>

          {/* OBS Setup guide */}
          <div
            style={{
              marginTop: "32px",
              background: "#1a1a1a",
              borderRadius: "10px",
              padding: "20px",
              border: "1px solid #2a2a2e",
            }}
          >
            <h3
              style={{
                fontSize: "15px",
                fontWeight: 600,
                marginBottom: "14px",
              }}
            >
              วิธีตั้งค่า OBS
            </h3>
            <div
              style={{ fontSize: "13px", color: "#adadb8", lineHeight: 1.8 }}
            >
              <p>1. เปิด OBS → Settings → Stream</p>
              <p>
                2. Service: <code style={codeStyle}>Custom</code>
              </p>
              <p>
                3. Server:{" "}
                <code style={codeStyle}>rtmp://localhost:1935/live</code>
              </p>
              <p>4. Stream Key: ดูได้ที่แท็บ &quot;ตั้งค่า&quot;</p>
              <p>5. กด &quot;Apply&quot; → OK → Start Streaming</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Manage active stream */}
      {tab === "manage" && (
        <div>
          {!activeStream ? (
            <div
              style={{ textAlign: "center", padding: "40px", color: "#adadb8" }}
            >
              <p style={{ fontSize: "32px", marginBottom: "12px" }}>📡</p>
              <p>ยังไม่มี stream ที่กำลัง live อยู่</p>
              <button
                onClick={() => setTab("go-live")}
                style={{
                  marginTop: "16px",
                  background: "#9147ff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 24px",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                เริ่ม Stream ใหม่
              </button>
            </div>
          ) : (
            <div>
              <div
                style={{
                  background: "#1a1a1a",
                  borderRadius: "10px",
                  padding: "20px",
                  border: "1px solid #2a2a2e",
                  marginBottom: "20px",
                }}
              >
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
                    <p style={{ color: "#adadb8", fontSize: "14px" }}>
                      👁 {activeStream.viewerCount?.toLocaleString() || 0}{" "}
                      คนดูอยู่
                    </p>
                  </div>
                  <button
                    onClick={endStream}
                    style={{
                      background: "#e91916",
                      border: "none",
                      borderRadius: "8px",
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
              </div>

              <div
                style={{
                  background: "#1a1a1a",
                  borderRadius: "10px",
                  padding: "20px",
                  border: "1px solid #2a2a2e",
                }}
              >
                <h3
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    marginBottom: "12px",
                  }}
                >
                  ลิงก์ดู Stream
                </h3>
                <code
                  style={{
                    display: "block",
                    background: "#0e0e10",
                    padding: "10px 14px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    color: "#9147ff",
                    wordBreak: "break-all",
                  }}
                >
                  {typeof window !== "undefined" ? window.location.origin : ""}
                  /watch/{activeStream.slug || activeStream._id}
                </code>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: History */}
      {tab === "history" && (
        <div>
          {myStreams.length === 0 ? (
            <p
              style={{ color: "#adadb8", textAlign: "center", padding: "40px" }}
            >
              ยังไม่มีประวัติ stream
            </p>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {myStreams.map((s) => (
                <div
                  key={s._id}
                  style={{
                    background: "#1a1a1a",
                    borderRadius: "8px",
                    padding: "14px 16px",
                    border: "1px solid #2a2a2e",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <p style={{ fontWeight: 600, fontSize: "14px" }}>
                      {s.title}
                    </p>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#adadb8",
                        marginTop: "4px",
                      }}
                    >
                      {new Date(s.createdAt).toLocaleDateString("th-TH")} • 👁{" "}
                      {s.totalViews?.toLocaleString() || 0} วิว • ❤️{" "}
                      {s.likes || 0}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "3px 10px",
                      borderRadius: "4px",
                      background:
                        s.status === "live"
                          ? "rgba(233,25,22,0.15)"
                          : "rgba(100,100,100,0.15)",
                      color: s.status === "live" ? "#ff6b6b" : "#adadb8",
                    }}
                  >
                    {s.status === "live" ? "LIVE" : "จบแล้ว"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Settings (Stream Key) */}
      {tab === "settings" && (
        <div style={{ maxWidth: "560px" }}>
          <div
            style={{
              background: "#1a1a1a",
              borderRadius: "10px",
              padding: "20px",
              border: "1px solid #2a2a2e",
            }}
          >
            <h2
              style={{
                fontSize: "15px",
                fontWeight: 600,
                marginBottom: "16px",
              }}
            >
              Stream Key
            </h2>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <code
                style={{
                  flex: 1,
                  background: "#0e0e10",
                  border: "1px solid #3a3a3d",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  fontSize: "14px",
                  color: "#9147ff",
                  wordBreak: "break-all",
                  filter: showKey ? "none" : "blur(6px)",
                  userSelect: showKey ? "text" : "none",
                  transition: "filter 0.2s",
                }}
              >
                {streamKey || "กำลังโหลด..."}
              </code>
              <button
                onClick={() => setShowKey((s) => !s)}
                style={secondaryBtnStyle}
              >
                {showKey ? "🙈 ซ่อน" : "👁 แสดง"}
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(streamKey);
                  alert("คัดลอกแล้ว!");
                }}
                style={secondaryBtnStyle}
              >
                📋 คัดลอก
              </button>
            </div>
            <p
              style={{ fontSize: "12px", color: "#adadb8", marginTop: "10px" }}
            >
              ⚠️ อย่าแชร์ stream key ให้ใคร &mdash; ใครมี key นี้สามารถ stream
              แทนคุณได้
            </p>
            <button
              onClick={resetKey}
              disabled={keyLoading}
              style={{
                marginTop: "16px",
                background: "transparent",
                border: "1px solid #e91916",
                color: "#e91916",
                borderRadius: "8px",
                padding: "8px 16px",
                cursor: keyLoading ? "not-allowed" : "pointer",
                fontSize: "13px",
                fontWeight: 600,
                opacity: keyLoading ? 0.6 : 1,
              }}
            >
              {keyLoading ? "กำลังรีเซ็ต..." : "🔄 รีเซ็ต Stream Key"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helpers
function FormField({ label, required, children }) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: "13px",
          color: "#adadb8",
          marginBottom: "6px",
        }}
      >
        {label}
        {required && <span style={{ color: "#ff6b6b" }}> *</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  background: "#0e0e10",
  border: "1px solid #3a3a3d",
  borderRadius: "8px",
  padding: "10px 14px",
  color: "#efeff1",
  fontSize: "14px",
  outline: "none",
};

const secondaryBtnStyle = {
  background: "#242424",
  border: "1px solid #3a3a3d",
  borderRadius: "8px",
  padding: "8px 12px",
  color: "#efeff1",
  cursor: "pointer",
  fontSize: "13px",
  whiteSpace: "nowrap",
};

const codeStyle = {
  background: "#0e0e10",
  padding: "2px 8px",
  borderRadius: "4px",
  fontSize: "12px",
  color: "#9147ff",
};
