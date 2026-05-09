'use client';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import VideoPlayer from '@/components/VideoPlayer';
import ChatBox     from '@/components/ChatBox';
import { useAuth } from '@/hooks/useAuth';

export default function WatchClient({ slug }) {
  const { user }              = useAuth();
  const [video,   setVideo]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked,   setLiked]   = useState(false);
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);
  const commentRef            = useRef(null);

  useEffect(() => {
    axios.get(`/api/videos/${slug}`)
      .then(res => setVideo(res.data.video))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  const handleLike = async () => {
    if (liked || !user) return;
    try {
      await axios.post(`/api/videos/${video._id}/like`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setVideo(v => ({ ...v, likes: v.likes + 1 }));
      setLiked(true);
    } catch { /* silent */ }
  };

  const handleComment = async () => {
    if (!comment.trim() || !user || posting) return;
    setPosting(true);
    try {
      const { data } = await axios.post(
        `/api/videos/${video._id}/comments`,
        { text: comment.trim() },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setVideo(v => ({
        ...v,
        comments: [data.comment, ...(v.comments || [])],
      }));
      setComment('');
      commentRef.current?.focus();
    } catch (err) {
      alert(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setPosting(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <span style={{ color: '#adadb8' }}>กำลังโหลด...</span>
    </div>
  );

  if (!video) return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <p style={{ fontSize: '40px', marginBottom: '16px' }}>🔍</p>
      <p style={{ color: '#adadb8' }}>ไม่พบ stream นี้</p>
    </div>
  );

  return (
    <div className="container" style={{ paddingTop: '20px', paddingBottom: '40px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 340px',
        gap: '20px',
        alignItems: 'start',
      }}>

        {/* Left: Player + Info + Comments */}
        <div>
          <VideoPlayer hlsUrl={video.hlsUrl} />

          {/* Stream info */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{
                width: '48px', height: '48px', flexShrink: 0,
                borderRadius: '50%', background: '#9147ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', fontWeight: 700, color: '#fff',
              }}>
                {video.streamer?.username?.[0]?.toUpperCase()}
              </div>

              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: '18px', fontWeight: 700, lineHeight: 1.3 }}>
                  {video.title}
                </h1>
                <p style={{ color: '#9147ff', fontWeight: 600, marginTop: '4px', fontSize: '14px' }}>
                  {video.streamer?.username}
                </p>
                <div style={{
                  display: 'flex', gap: '16px', marginTop: '8px',
                  color: '#adadb8', fontSize: '13px', flexWrap: 'wrap',
                }}>
                  <span>👁 {video.viewerCount?.toLocaleString() || 0} คนดูอยู่</span>
                  <span>📊 {video.totalViews?.toLocaleString() || 0} วิวสะสม</span>
                  <span className="badge-live">LIVE</span>
                  <span style={{
                    fontSize: '11px', color: '#9147ff',
                    background: 'rgba(145,71,255,0.15)',
                    padding: '2px 8px', borderRadius: '4px',
                  }}>{video.category}</span>
                </div>
              </div>

              {/* Like button */}
              <button
                onClick={handleLike}
                disabled={liked || !user}
                title={!user ? 'กรุณา login เพื่อกด Like' : ''}
                style={{
                  background: liked ? '#2a2a2e' : '#9147ff',
                  border: 'none', borderRadius: '8px',
                  padding: '8px 16px', color: '#fff',
                  fontWeight: 600, cursor: (liked || !user) ? 'default' : 'pointer',
                  fontSize: '14px', flexShrink: 0,
                  opacity: !user ? 0.5 : 1,
                }}
              >
                {liked ? '❤️ ถูกใจแล้ว' : `❤️ ${video.likes || 0}`}
              </button>
            </div>

            {/* Description */}
            {video.description && (
              <p style={{
                marginTop: '16px', color: '#adadb8', fontSize: '14px',
                lineHeight: 1.7, padding: '12px 16px',
                background: '#1a1a1a', borderRadius: '8px',
              }}>
                {video.description}
              </p>
            )}

            {/* Tags */}
            {video.tags?.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                {video.tags.map(tag => (
                  <span key={tag} style={{
                    fontSize: '12px', color: '#9147ff',
                    background: 'rgba(145,71,255,0.12)',
                    padding: '3px 10px', borderRadius: '20px',
                  }}>#{tag}</span>
                ))}
              </div>
            )}
          </div>

          {/* Comments section */}
          <div style={{ marginTop: '28px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
              ความคิดเห็น ({video.comments?.length || 0})
            </h2>

            {user ? (
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <div style={{
                  width: '36px', height: '36px', flexShrink: 0,
                  borderRadius: '50%', background: '#9147ff',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: '13px',
                }}>
                  {user.username?.[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
                  <input
                    ref={commentRef}
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleComment()}
                    placeholder="เพิ่มความคิดเห็น..."
                    maxLength={300}
                    style={{
                      flex: 1, background: '#1a1a1a', border: '1px solid #3a3a3d',
                      borderRadius: '8px', padding: '8px 14px', color: '#efeff1',
                      fontSize: '14px', outline: 'none',
                    }}
                  />
                  <button
                    onClick={handleComment}
                    disabled={!comment.trim() || posting}
                    style={{
                      background: '#9147ff', border: 'none', borderRadius: '8px',
                      padding: '0 16px', color: '#fff', fontWeight: 600,
                      fontSize: '13px', cursor: comment.trim() ? 'pointer' : 'default',
                      opacity: comment.trim() && !posting ? 1 : 0.5,
                    }}
                  >{posting ? '...' : 'ส่ง'}</button>
                </div>
              </div>
            ) : (
              <p style={{ color: '#adadb8', fontSize: '14px', marginBottom: '20px' }}>
                <a href="/login" style={{ color: '#9147ff' }}>เข้าสู่ระบบ</a> เพื่อแสดงความคิดเห็น
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {video.comments?.map((c, i) => (
                <div key={c._id || i} style={{ display: 'flex', gap: '10px' }}>
                  <div style={{
                    width: '34px', height: '34px', flexShrink: 0,
                    borderRadius: '50%', background: '#3a3a3d',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '12px',
                    color: '#efeff1', fontWeight: 700,
                  }}>
                    {c.user?.username?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>
                        {c.user?.username || 'ผู้ใช้'}
                      </span>
                      <span style={{ fontSize: '11px', color: '#555' }}>
                        {new Date(c.createdAt).toLocaleDateString('th-TH')}
                      </span>
                    </div>
                    <p style={{ fontSize: '14px', color: '#adadb8', marginTop: '4px', lineHeight: 1.6 }}>
                      {c.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Chat */}
        <div style={{ position: 'sticky', top: '76px' }}>
          <ChatBox videoId={video._id} user={user} />
        </div>
      </div>
    </div>
  );
}