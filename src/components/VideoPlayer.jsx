'use client';
import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

export default function VideoPlayer({ hlsUrl }) {
  const videoRef  = useRef(null);
  const hlsRef    = useRef(null);
  const [error,   setError]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [muted,   setMuted]   = useState(true);

  useEffect(() => {
    if (!hlsUrl || !videoRef.current) return;
    const video = videoRef.current;
    setError(null);
    setLoading(true);

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari — native HLS
      video.src = hlsUrl;
      video.play().catch(() => {});
      setLoading(false);
      return;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        liveSyncDurationCount:       3,
        liveMaxLatencyDurationCount: 6,
        enableWorker:                true,
        lowLatencyMode:              true,
      });

      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
        setLoading(false);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setError('ไม่สามารถโหลด stream ได้ กรุณารอสักครู่...');
          setLoading(false);
          setTimeout(() => hls.loadSource(hlsUrl), 5000);
        }
      });

      hlsRef.current = hls;
    } else {
      setError('Browser ของคุณไม่รองรับ HLS');
      setLoading(false);
    }

    return () => { hlsRef.current?.destroy(); };
  }, [hlsUrl]);

  return (
    <div style={{ position: 'relative', background: '#000', borderRadius: '8px', overflow: 'hidden' }}>
      {loading && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.7)', zIndex: 2, flexDirection: 'column', gap: '12px',
        }}>
          <div style={{
            width: '40px', height: '40px', border: '3px solid #444',
            borderTop: '3px solid #9147ff', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <span style={{ color: '#adadb8', fontSize: '14px' }}>กำลังโหลด stream...</span>
        </div>
      )}

      {error && !loading && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.85)', zIndex: 2, flexDirection: 'column', gap: '8px',
        }}>
          <span style={{ fontSize: '32px' }}>📡</span>
          <span style={{ color: '#adadb8', fontSize: '14px', textAlign: 'center', padding: '0 20px' }}>
            {error}
          </span>
        </div>
      )}

      <video
        ref={videoRef} muted={muted} autoPlay playsInline controls
        style={{ width: '100%', aspectRatio: '16/9', display: 'block' }}
      />

      {muted && !loading && !error && (
        <button onClick={() => setMuted(false)} style={{
          position: 'absolute', bottom: '60px', left: '50%',
          transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.8)',
          color: '#fff', border: '1px solid #555', padding: '8px 20px',
          borderRadius: '20px', cursor: 'pointer', fontSize: '13px', zIndex: 3,
        }}>คลิกเพื่อเปิดเสียง</button>
      )}
    </div>
  );
}