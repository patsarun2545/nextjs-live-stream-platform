'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form,    setForm]    = useState({ email: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(''); setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/login', form);
      login(data.token, data.user);
      router.push('/');
    } catch (err) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#1a1a1a', borderRadius: '12px', padding: '40px',
        width: '100%', maxWidth: '400px', border: '1px solid #2a2a2e',
      }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '24px' }}>เข้าสู่ระบบ</h1>

        {error && (
          <div style={{
            background: 'rgba(233,25,22,0.1)', border: '1px solid rgba(233,25,22,0.3)',
            borderRadius: '8px', padding: '10px 14px', color: '#ff6b6b',
            fontSize: '14px', marginBottom: '16px',
          }}>{error}</div>
        )}

        {['email', 'password'].map(field => (
          <div key={field} style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#adadb8', marginBottom: '6px' }}>
              {field === 'email' ? 'อีเมล' : 'รหัสผ่าน'}
            </label>
            <input
              type={field === 'password' ? 'password' : 'email'}
              value={form[field]}
              onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{
                width: '100%', background: '#0e0e10', border: '1px solid #3a3a3d',
                borderRadius: '8px', padding: '10px 14px', color: '#efeff1',
                fontSize: '14px', outline: 'none',
              }}
            />
          </div>
        ))}

        <button onClick={handleSubmit} disabled={loading} style={{
          width: '100%', background: '#9147ff', border: 'none', borderRadius: '8px',
          padding: '12px', color: '#fff', fontWeight: 600, fontSize: '15px',
          cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
          marginTop: '8px',
        }}>{loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</button>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#adadb8' }}>
          ยังไม่มีบัญชี?{' '}
          <a href="/register" style={{ color: '#9147ff' }}>สมัครสมาชิก</a>
        </p>
      </div>
    </div>
  );
}