"use client";
import { useState, useEffect, useRef, useCallback } from "react";

const MAX_MESSAGES = 200;

// Bug fix: use wss:// in production (https pages block ws://)
function buildWsUrl(videoId) {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const port = process.env.NEXT_PUBLIC_WS_PORT || 3001;
  return `${protocol}://${window.location.hostname}:${port}/chat/${videoId}`;
}

export default function ChatBox({ videoId, user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const bottomRef = useRef(null);
  const retryRef = useRef(null);
  const mountedRef = useRef(true); // track mount state to prevent post-unmount retries

  const connect = useCallback(() => {
    const ws = new WebSocket(buildWsUrl(videoId));

    ws.onopen = () => {
      setConnected(true);
      clearTimeout(retryRef.current);
    };
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setMessages((prev) => [...prev.slice(-(MAX_MESSAGES - 1)), data]);
      } catch {
        /* ignore malformed frames */
      }
    };
    ws.onclose = () => {
      setConnected(false);
      if (mountedRef.current) {
        retryRef.current = setTimeout(connect, 3000);
      }
    };
    ws.onerror = () => ws.close();

    wsRef.current = ws;
  }, [videoId]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      clearTimeout(retryRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || wsRef.current?.readyState !== WebSocket.OPEN || !user)
      return;
    wsRef.current.send(
      JSON.stringify({
        type: "message",
        text: input.trim(),
        username: user.username,
      }),
    );
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span style={{ fontWeight: 600, fontSize: "14px" }}>แชทสด</span>
        <span
          style={{
            ...styles.dot,
            background: connected ? "#00c853" : "var(--text-dim)",
          }}
        />
      </div>

      {/* Messages */}
      <div style={styles.messageList}>
        {messages.length === 0 && (
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "13px",
              textAlign: "center",
              marginTop: "20px",
            }}
          >
            ยังไม่มีข้อความ เป็นคนแรกที่พูดสิ!
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{ fontSize: "13px", lineHeight: 1.5 }}>
            <span style={{ color: "var(--accent)", fontWeight: 600 }}>
              {msg.username}
            </span>
            <span style={{ color: "var(--text-muted)" }}>: </span>
            <span style={{ color: "var(--text-primary)" }}>{msg.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={styles.inputArea}>
        {user ? (
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              className="input-base"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="พิมพ์ข้อความ..."
              maxLength={200}
              style={{
                borderRadius: "var(--radius-sm)",
                padding: "8px 12px",
                fontSize: "13px",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="btn-primary"
              style={{
                width: "auto",
                padding: "0 14px",
                fontSize: "13px",
                borderRadius: "var(--radius-sm)",
              }}
            >
              ส่ง
            </button>
          </div>
        ) : (
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "13px",
              textAlign: "center",
            }}
          >
            <a href="/login" style={{ color: "var(--accent)" }}>
              เข้าสู่ระบบ
            </a>{" "}
            เพื่อร่วมแชท
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    minHeight: "500px",
    background: "var(--bg-secondary)",
    borderRadius: "var(--radius)",
    border: "1px solid var(--border)",
    overflow: "hidden",
  },
  header: {
    padding: "12px 16px",
    borderBottom: "1px solid var(--border)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    flexShrink: 0,
  },
  messageList: {
    flex: 1,
    overflowY: "auto",
    padding: "12px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  inputArea: {
    padding: "12px 16px",
    borderTop: "1px solid var(--border)",
  },
};
