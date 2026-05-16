"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useAuth } from "@/hooks/useAuth";
import { ErrorBanner } from "@/components/ui";

const FIELDS = [
  { key: "username", label: "ชื่อผู้ใช้", type: "text" },
  { key: "email", label: "อีเมล", type: "email" },
  { key: "password", label: "รหัสผ่าน", type: "password" },
];

const ROLES = [
  { value: "viewer", label: "ผู้ชม" },
  { value: "streamer", label: "สตรีมเมอร์" },
];

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "viewer",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const { data } = await axios.post("/api/auth/register", form);
      login(data.token, data.user);
      router.push("/");
    } catch (err) {
      setError(err.response?.data?.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={centerStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>สมัครสมาชิก</h1>

        <ErrorBanner message={error} />

        {FIELDS.map(({ key, label, type }) => (
          <div key={key} style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>{label}</label>
            <input
              className="input-base"
              type={type}
              value={form[key]}
              onChange={(e) =>
                setForm((p) => ({ ...p, [key]: e.target.value }))
              }
            />
          </div>
        ))}

        {/* Role selector */}
        <div style={{ marginBottom: "20px" }}>
          <label style={labelStyle}>ประเภทบัญชี</label>
          <div style={{ display: "flex", gap: "12px" }}>
            {ROLES.map(({ value, label }) => {
              const active = form.role === value;
              return (
                <label
                  key={value}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "10px",
                    borderRadius: "var(--radius)",
                    cursor: "pointer",
                    border: `1px solid ${active ? "var(--accent)" : "var(--border-input)"}`,
                    background: active ? "var(--accent-muted)" : "transparent",
                    fontSize: "14px",
                    color: active ? "var(--accent)" : "var(--text-muted)",
                    transition: `all var(--transition)`,
                  }}
                >
                  <input
                    type="radio"
                    name="role"
                    value={value}
                    checked={active}
                    onChange={() => setForm((p) => ({ ...p, role: value }))}
                    style={{ display: "none" }}
                  />
                  {label}
                </label>
              );
            })}
          </div>
        </div>

        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
        </button>

        <p style={footerStyle}>
          มีบัญชีแล้ว?{" "}
          <a href="/login" style={{ color: "var(--accent)" }}>
            เข้าสู่ระบบ
          </a>
        </p>
      </div>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const centerStyle = {
  minHeight: "80vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const cardStyle = {
  background: "var(--bg-card)",
  borderRadius: "var(--radius)",
  padding: "40px",
  width: "100%",
  maxWidth: "400px",
  border: "1px solid var(--border)",
};
const titleStyle = { fontSize: "22px", fontWeight: 700, marginBottom: "24px" };
const labelStyle = {
  display: "block",
  fontSize: "13px",
  color: "var(--text-muted)",
  marginBottom: "6px",
};
const footerStyle = {
  textAlign: "center",
  marginTop: "20px",
  fontSize: "14px",
  color: "var(--text-muted)",
};
