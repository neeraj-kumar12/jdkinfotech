// components/ClientSidebar.js
'use client';

import dynamic from 'next/dynamic';

const DynamicSidebar = dynamic(() => import('@/components/Sidebar'), {
    ssr: false
});

export default function ClientSidebar() {
    return <DynamicSidebar />;
}