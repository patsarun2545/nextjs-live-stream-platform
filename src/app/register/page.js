'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form,    setForm]    = useState({ username: '', email: '', password: '', role: 'viewer' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(''); setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/register', form);
      login(data.token, data.user);
      router.push('/');
    } catch (err) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: 'username', label: 'ชื่อผู้ใช้', type: 'text' },
    { key: 'email',    label: 'อีเมล',       type: 'email' },
    { key: 'password', label: 'รหัสผ่าน',    type: 'password' },
  ];

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        background: '#1a1a1a', borderRadius: '12px', padding: '40px',
        width: '100%', maxWidth: '400px', border: '1px solid #2a2a2e',
      }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '24px' }}>สมัครสมาชิก</h1>

        {error && (
          <div style={{
            background: 'rgba(233,25,22,0.1)', border: '1px solid rgba(233,25,22,0.3)',
            borderRadius: '8px', padding: '10px 14px', color: '#ff6b6b',
            fontSize: '14px', marginBottom: '16px',
          }}>{error}</div>
        )}

        {fields.map(({ key, label, type }) => (
          <div key={key} style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#adadb8', marginBottom: '6px' }}>
              {label}
            </label>
            <input
              type={type} value={form[key]}
              onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
              style={{
                width: '100%', background: '#0e0e10', border: '1px solid #3a3a3d',
                borderRadius: '8px', padding: '10px 14px', color: '#efeff1',
                fontSize: '14px', outline: 'none',
              }}
            />
          </div>
        ))}

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#adadb8', marginBottom: '6px' }}>
            ประเภทบัญชี
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            {[['viewer','ผู้ชม'],['streamer','สตรีมเมอร์']].map(([val, label]) => (
              <label key={val} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '8px', padding: '10px', borderRadius: '8px', cursor: 'pointer',
                border: `1px solid ${form.role === val ? '#9147ff' : '#3a3a3d'}`,
                background: form.role === val ? 'rgba(145,71,255,0.1)' : 'transparent',
                fontSize: '14px', color: form.role === val ? '#9147ff' : '#adadb8',
              }}>
                <input
                  type="radio" name="role" value={val} checked={form.role === val}
                  onChange={() => setForm(p => ({ ...p, role: val }))}
                  style={{ display: 'none' }}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading} style={{
          width: '100%', background: '#9147ff', border: 'none', borderRadius: '8px',
          padding: '12px', color: '#fff', fontWeight: 600, fontSize: '15px',
          cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
        }}>{loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}</button>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#adadb8' }}>
          มีบัญชีแล้ว?{' '}
          <a href="/login" style={{ color: '#9147ff' }}>เข้าสู่ระบบ</a>
        </p>
      </div>
    </div>
  );
}