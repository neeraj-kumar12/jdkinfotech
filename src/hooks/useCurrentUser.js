// src/hooks/useCurrentUser.js
import { useState, useEffect } from 'react';

export const useCurrentUser = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/current-user', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch current user');
        }

        const data = await response.json();
        if (data.success) {
          setCurrentUser(data.data);
        } else {
          throw new Error(data.message || 'Failed to fetch current user');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  return { currentUser, loading, error };
};