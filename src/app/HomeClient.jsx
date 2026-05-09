'use client';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import VideoCard from '@/components/VideoCard';

const CATEGORIES = ['ทั้งหมด', 'gaming', 'music', 'education', 'sports', 'lifestyle'];

export default function HomeClient() {
  const [videos,   setVideos]   = useState([]);
  const [category, setCategory] = useState('ทั้งหมด');
  const [search,   setSearch]   = useState('');
  const [query,    setQuery]    = useState('');
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);

  const LIMIT = 20;

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (category !== 'ทั้งหมด') params.category = category;
      if (query) params.search = query;

      const { data } = await axios.get('/api/videos', { params });
      setVideos(data.videos);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [category, query, page]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // reset page เมื่อ filter เปลี่ยน
  useEffect(() => {
    setPage(1);
  }, [category, query]);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setQuery(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="container" style={{ paddingTop: '24px', paddingBottom: '40px' }}>

      {/* Search bar */}
      <input
        type="search"
        placeholder="ค้นหา stream..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%', background: '#1a1a1a', border: '1px solid #3a3a3d',
          borderRadius: '8px', padding: '10px 16px', color: '#efeff1',
          fontSize: '15px', outline: 'none', marginBottom: '16px',
        }}
      />

      {/* Category filters */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            style={{
              background: cat === category ? '#9147ff' : '#1a1a1a',
              border:     `1px solid ${cat === category ? '#9147ff' : '#3a3a3d'}`,
              color:      cat === category ? '#fff' : '#adadb8',
              padding: '6px 14px', borderRadius: '20px', cursor: 'pointer',
              fontSize: '13px', fontWeight: cat === category ? 600 : 400,
              transition: 'all 0.15s',
            }}
          >{cat}</button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <SkeletonGrid />
      ) : videos.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
          }}>
            {videos.map(v => <VideoCard key={v._id} video={v} />)}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex', justifyContent: 'center', gap: '8px',
              marginTop: '32px',
            }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={pageBtnStyle(false, page === 1)}
              >← ก่อนหน้า</button>

              <span style={{ color: '#adadb8', fontSize: '14px', alignSelf: 'center' }}>
                {page} / {totalPages}
              </span>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={pageBtnStyle(false, page === totalPages)}
              >ถัดไป →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '16px',
    }}>
      {[...Array(8)].map((_, i) => (
        <div key={i} style={{
          background: '#1a1a1a', borderRadius: '8px',
          aspectRatio: '16/9',
          animation: 'pulse 1.5s ease-in-out infinite',
          animationDelay: `${i * 0.08}s`,
        }} />
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '80px 0', color: '#adadb8' }}>
      <p style={{ fontSize: '40px', marginBottom: '16px' }}>📭</p>
      <p style={{ fontSize: '16px', marginBottom: '8px' }}>ไม่มี stream ออนไลน์ตอนนี้</p>
      <p style={{ fontSize: '13px' }}>ลองเปลี่ยนหมวดหมู่หรือค้นหาใหม่</p>
    </div>
  );
}

function pageBtnStyle(active, disabled) {
  return {
    background: active ? '#9147ff' : '#1a1a1a',
    border: '1px solid #3a3a3d',
    color: disabled ? '#555' : '#efeff1',
    padding: '8px 16px', borderRadius: '8px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '13px',
    opacity: disabled ? 0.5 : 1,
  };
}