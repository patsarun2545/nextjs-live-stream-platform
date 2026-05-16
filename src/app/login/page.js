"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useAuth } from "@/hooks/useAuth";
import { ErrorBanner } from "@/components/ui";

const FIELDS = [
  { key: "email", label: "อีเมล", type: "email" },
  { key: "password", label: "รหัสผ่าน", type: "password" },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const { data } = await axios.post("/api/auth/login", form);
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
        <h1 style={titleStyle}>เข้าสู่ระบบ</h1>

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
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
        ))}

        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={loading}
          style={{ marginTop: "8px" }}
        >
          {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </button>

        <p style={footerStyle}>
          ยังไม่มีบัญชี?{" "}
          <a href="/register" style={{ color: "var(--accent)" }}>
            สมัครสมาชิก
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
