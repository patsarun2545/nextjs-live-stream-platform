"use client";
import { useState, useEffect, useRef, useCallback } from "react";

export default function ChatBox({ videoId, user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const bottomRef = useRef(null);
  const retryRef = useRef(null);

  // แก้จากเดิม: reconnect logic ที่ทำงานจริง
  const connect = useCallback(() => {
    const ws = new WebSocket(
      `ws://${window.location.hostname}:${process.env.NEXT_PUBLIC_PORT || 3001}/chat/${videoId}`,
    );

    ws.onopen = () => {
      setConnected(true);
      clearTimeout(retryRef.current);
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setMessages((prev) => [...prev.slice(-199), data]);
      } catch {
        /* ignore */
      }
    };

    ws.onclose = () => {
      setConnected(false);
      retryRef.current = setTimeout(connect, 3000); // reconnect จริงๆ
    };

    ws.onerror = () => ws.close();

    wsRef.current = ws;
  }, [videoId]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(retryRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || wsRef.current?.readyState !== 1 || !user) return;
    wsRef.current.send(
      JSON.stringify({
        type: "message",
        text: input.trim(),
        username: user.username,
      }),
    );
    setInput("");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: "500px",
        background: "#18181b",
        borderRadius: "8px",
        border: "1px solid #2a2a2e",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #2a2a2e",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: "14px" }}>แชทสด</span>
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: connected ? "#00c853" : "#666",
            flexShrink: 0,
          }}
        />
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        {messages.length === 0 && (
          <p
            style={{
              color: "#adadb8",
              fontSize: "13px",
              textAlign: "center",
              marginTop: "20px",
            }}
          >
            ยังไม่มีข้อความ เป็นคนแรกที่พูดสิ!
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{ fontSize: "13px", lineHeight: "1.5" }}>
            <span style={{ color: "#9147ff", fontWeight: 600 }}>
              {msg.username}
            </span>
            <span style={{ color: "#adadb8" }}>: </span>
            <span style={{ color: "#efeff1" }}>{msg.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: "12px 16px", borderTop: "1px solid #2a2a2e" }}>
        {user ? (
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="พิมพ์ข้อความ..."
              maxLength={200}
              style={{
                flex: 1,
                background: "#0e0e10",
                border: "1px solid #3a3a3d",
                borderRadius: "6px",
                padding: "8px 12px",
                color: "#efeff1",
                fontSize: "13px",
                outline: "none",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              style={{
                background: "#9147ff",
                border: "none",
                borderRadius: "6px",
                padding: "0 14px",
                color: "#fff",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
                opacity: input.trim() ? 1 : 0.5,
              }}
            >
              ส่ง
            </button>
          </div>
        ) : (
          <p
            style={{ color: "#adadb8", fontSize: "13px", textAlign: "center" }}
          >
            <a href="/login" style={{ color: "#9147ff" }}>
              เข้าสู่ระบบ
            </a>{" "}
            เพื่อร่วมแชท
          </p>
        )}
      </div>
    </div>
  );
}
