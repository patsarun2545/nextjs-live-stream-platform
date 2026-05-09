// src/app/HomeClient.jsx
'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import VideoCard from '@/components/VideoCard';

const CATEGORIES = ['ทั้งหมด', 'gaming', 'music', 'education', 'sports', 'lifestyle'];

export default function HomeClient() {
  const [videos,   setVideos]   = useState([]);
  const [category, setCategory] = useState('ทั้งหมด');
  const [search,   setSearch]   = useState('');
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (category !== 'ทั้งหมด') params.category = category;
    if (search) params.search = search;
    axios.get('/api/videos', { params })
      .then(res => setVideos(res.data.videos))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category, search]);

  return (
    <div className="container" style={{ paddingTop: '24px' }}>
      <input
        type="search" placeholder="ค้นหา stream..." value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%', background: '#1a1a1a', border: '1px solid #3a3a3d',
          borderRadius: '8px', padding: '10px 16px', color: '#efeff1',
          fontSize: '15px', outline: 'none', marginBottom: '16px',
        }}
      />
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)} style={{
            background:  cat === category ? '#9147ff' : '#1a1a1a',
            border:      `1px solid ${cat === category ? '#9147ff' : '#3a3a3d'}`,
            color:       cat === category ? '#fff' : '#adadb8',
            padding:     '6px 14px', borderRadius: '20px', cursor: 'pointer',
            fontSize:    '13px', fontWeight: cat === category ? 600 : 400,
          }}>{cat}</button>
        ))}
      </div>

      {loading ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px',
        }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{
              aspectRatio: '16/9', background: '#1a1a1a', borderRadius: '8px',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))}
          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
        </div>
      ) : videos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#adadb8' }}>
          <p style={{ fontSize: '32px', marginBottom: '12px' }}>📭</p>
          <p>ไม่มี stream ออนไลน์ตอนนี้</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px',
        }}>
          {videos.map(v => <VideoCard key={v._id} video={v} />)}
        </div>
      )}
    </div>
  );
}