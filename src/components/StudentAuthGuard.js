'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentAuthGuard({ children }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/current-user', {
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Not authenticated');
        const { data } = await response.json();

        if (!data) {
          router.replace('/login');
        } else if (data.role === 'staff') {
          router.replace('/staff-dashboard');
        } else {
          setLoading(false);
        }
      } catch {
        router.replace('/login');
      }
    };
    fetchCurrentUser();
  }, [router]);

  if (loading) return null; // Or a loading spinner

  return children;
}