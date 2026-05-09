'use client';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav style={{
      background: '#18181b', borderBottom: '1px solid #2a2a2e',
      height: '56px', display: 'flex', alignItems: 'center',
      padding: '0 20px', position: 'sticky', top: 0, zIndex: 100,
    }}>
      <Link href="/" style={{ fontWeight: 700, fontSize: '20px', color: '#9147ff', marginRight: 'auto' }}>
        StreamLive
      </Link>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        {user ? (
          <>
            {user.role === 'streamer' && (
              <Link href="/dashboard" style={{
                background: '#9147ff', color: '#fff',
                padding: '6px 14px', borderRadius: '6px', fontSize: '14px', fontWeight: 600,
              }}>Go Live</Link>
            )}
            <span style={{ fontSize: '14px', color: '#adadb8' }}>{user.username}</span>
            <button onClick={logout} style={{
              background: 'transparent', border: '1px solid #444', color: '#adadb8',
              padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
            }}>ออกจากระบบ</button>
          </>
        ) : (
          <>
            <Link href="/login"    style={{ fontSize: '14px', color: '#adadb8' }}>เข้าสู่ระบบ</Link>
            <Link href="/register" style={{
              background: '#9147ff', color: '#fff',
              padding: '6px 14px', borderRadius: '6px', fontSize: '14px', fontWeight: 600,
            }}>สมัครสมาชิก</Link>
          </>
        )}
      </div>
    </nav>
  );
}