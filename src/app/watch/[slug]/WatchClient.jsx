// src/app/watch/[slug]/WatchClient.jsx
'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import VideoPlayer from '@/components/VideoPlayer';
import ChatBox     from '@/components/ChatBox';
import { useAuth } from '@/hooks/useAuth';

export default function WatchClient({ slug }) {
  const { user }                  = useAuth();
  const [video,   setVideo]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [liked,   setLiked]       = useState(false);

  useEffect(() => {
    axios.get(`/api/videos/${slug}`)
      .then(res => setVideo(res.data.video))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  const handleLike = async () => {
    if (liked || !user) return;
    await axios.post(`/api/videos/${video._id}/like`);
    setVideo(v => ({ ...v, likes: v.likes + 1 }));
    setLiked(true);
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <span style={{ color: '#adadb8' }}>กำลังโหลด...</span>
    </div>
  );

  if (!video) return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#adadb8' }}>ไม่พบ stream นี้</div>
  );

  return (
    <div className="container" style={{ paddingTop: '20px' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start',
      }}>
        <div>
          <VideoPlayer hlsUrl={video.hlsUrl} />
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{
                width: '48px', height: '48px', flexShrink: 0, borderRadius: '50%',
                background: '#9147ff', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '20px', fontWeight: 700, color: '#fff',
              }}>{video.streamer?.username?.[0]?.toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: '18px', fontWeight: 700, lineHeight: 1.3 }}>{video.title}</h1>
                <p style={{ color: '#9147ff', fontWeight: 600, marginTop: '4px' }}>
                  {video.streamer?.username}
                </p>
                <div style={{ display: 'flex', gap: '16px', marginTop: '8px', color: '#adadb8', fontSize: '13px' }}>
                  <span>👁 {video.viewerCount?.toLocaleString()} คนดูอยู่</span>
                  <span>❤️ {video.totalViews?.toLocaleString()} วิวสะสม</span>
                  <span className="badge-live">LIVE</span>
                </div>
              </div>
              <button onClick={handleLike} disabled={liked || !user} style={{
                background: liked ? '#3a3a3d' : '#9147ff', border: 'none',
                borderRadius: '6px', padding: '8px 16px', color: '#fff',
                fontWeight: 600, cursor: liked || !user ? 'default' : 'pointer',
                fontSize: '14px', flexShrink: 0,
              }}>{liked ? '❤️ ถูกใจแล้ว' : `❤️ ${video.likes}`}</button>
            </div>
            {video.description && (
              <p style={{
                marginTop: '16px', color: '#adadb8', fontSize: '14px', lineHeight: 1.7,
                padding: '12px 16px', background: '#1a1a1a', borderRadius: '8px',
              }}>{video.description}</p>
            )}
          </div>
        </div>
        <div style={{ position: 'sticky', top: '76px' }}>
          <ChatBox videoId={video._id} user={user} />
        </div>
      </div>
    </div>
  );
}