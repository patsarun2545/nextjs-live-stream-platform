"use client";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav
      style={{
        background: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border)",
        height: "56px",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <Link
        href="/"
        style={{
          fontWeight: 700,
          fontSize: "20px",
          color: "var(--accent)",
          marginRight: "auto",
        }}
      >
        StreamLive
      </Link>

      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        {user ? (
          <>
            {user.role === "streamer" && (
              <Link
                href="/dashboard"
                className="btn-primary"
                style={{ width: "auto", padding: "6px 14px", fontSize: "14px" }}
              >
                Go Live
              </Link>
            )}
            <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>
              {user.username}
            </span>
            <button
              onClick={logout}
              style={{
                background: "transparent",
                border: "1px solid var(--border-input)",
                color: "var(--text-muted)",
                padding: "5px 12px",
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              ออกจากระบบ
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              style={{ fontSize: "14px", color: "var(--text-muted)" }}
            >
              เข้าสู่ระบบ
            </Link>
            <Link
              href="/register"
              className="btn-primary"
              style={{ width: "auto", padding: "6px 14px", fontSize: "14px" }}
            >
              สมัครสมาชิก
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
