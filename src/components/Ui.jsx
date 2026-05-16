// components/ui.jsx
// Shared headless-style primitives — keeps inline styles out of every component.

"use client";

// ─── FormField ───────────────────────────────────────────────────────────────
export function FormField({ label, required, children }) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: "13px",
          color: "var(--text-muted)",
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

// ─── ErrorBanner ─────────────────────────────────────────────────────────────
export function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div
      style={{
        background: "var(--danger-muted)",
        border: "1px solid var(--danger-border)",
        borderRadius: "var(--radius)",
        padding: "10px 14px",
        color: "#ff6b6b",
        fontSize: "14px",
        marginBottom: "16px",
      }}
    >
      {message}
    </div>
  );
}

// ─── Avatar ──────────────────────────────────────────────────────────────────
export function Avatar({ username, size = 40 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: "50%",
        background: "var(--accent)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.4,
        fontWeight: 700,
        color: "#fff",
      }}
    >
      {username?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

// ─── Spinner ─────────────────────────────────────────────────────────────────
export function Spinner({ label = "กำลังโหลด..." }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "60vh",
        gap: "12px",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: "3px solid #444",
          borderTop: "3px solid var(--accent)",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>
        {label}
      </span>
    </div>
  );
}

// ─── Tag ─────────────────────────────────────────────────────────────────────
export function Tag({ children }) {
  return (
    <span
      style={{
        fontSize: "11px",
        color: "var(--accent)",
        background: "var(--accent-light)",
        padding: "2px 8px",
        borderRadius: "4px",
        display: "inline-block",
      }}
    >
      {children}
    </span>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────
export function Card({ children, style }) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        borderRadius: "var(--radius-lg)",
        padding: "20px",
        border: "1px solid var(--border)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
