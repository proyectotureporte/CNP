'use client';

import { useState, useEffect } from 'react';
import type { UserRole } from '@/lib/types';

interface AuthUser {
  sub: string;
  role: UserRole;
  displayName: string;
}

export function useAuth(type: 'crm' | 'admin' = 'crm') {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch(`/api/auth/me?type=${type}`);
        if (!res.ok) {
          setUser(null);
          return;
        }
        const data = await res.json();
        if (data.success && data.data) {
          setUser(data.data);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  return { user, loading };
}
