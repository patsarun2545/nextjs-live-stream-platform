import { Suspense } from 'react';
import HomeClient from './HomeClient';

export const metadata = {
  title: 'ดู Live Stream',
  description: 'ดู live stream สดทุกประเภท ฟรี ไม่มีโฆษณา',
};

export default function HomePage() {
  return (
    <Suspense fallback={<div style={{ padding: '60px', textAlign: 'center', color: '#adadb8' }}>กำลังโหลด...</div>}>
      <HomeClient />
    </Suspense>
  );
}