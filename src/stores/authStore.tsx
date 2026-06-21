// @ts-nocheck
// DashInsight - Auth Store Provider
import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { authApi, type User, type Client } from '../services/api';

const TOKEN_KEY = 'dashinsight_token';
const USER_KEY = 'dashinsight_user';
const CLIENT_KEY = 'dashinsight_client';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; }
  });
  const [client, setClient] = useState<Client | null>(() => {
    try { return JSON.parse(localStorage.getItem(CLIENT_KEY) || 'null'); } catch { return null; }
  });
  const [clientActive, setClientActive] = useState(true);
  const [clientExpiredMessage, setClientExpiredMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token) { setLoading(false); return; }
      try {
        const res = await authApi.getMe(token);
        if (!cancelled) {
          setUser(res.user);
          setClient(res.client);
          localStorage.setItem(USER_KEY, JSON.stringify(res.user));
          if (res.client) localStorage.setItem(CLIENT_KEY, JSON.stringify(res.client));
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Gagal memuat data pengguna:', error);
          setToken(null);
          setUser(null);
          setClient(null);
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          localStorage.removeItem(CLIENT_KEY);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [token]);

  const refreshMe = useCallback(async () => {
    if (!token) return;
    try {
      const res = await authApi.getMe(token);
      setUser(res.user);
      setClient(res.client);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      if (res.client) localStorage.setItem(CLIENT_KEY, JSON.stringify(res.client));
    } catch (error) {
      console.error('Gagal menyegarkan data pengguna:', error);
      setToken(null);
      setUser(null);
      setClient(null);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(CLIENT_KEY);
    }
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await authApi.login(email, password);
      setToken(res.token);
      setUser(res.user);
      setClient(res.client);
      setClientActive(res.clientActive);
      setClientExpiredMessage(res.clientExpiredMessage);
      localStorage.setItem(TOKEN_KEY, res.token);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      if (res.client) localStorage.setItem(CLIENT_KEY, JSON.stringify(res.client));
      return {};
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login gagal';
      return { error: message };
    }
  }, []);

  const logout = useCallback(async () => {
    if (token) {
      try { await authApi.logout(token); } catch { /* ignore */ }
    }
    setToken(null);
    setUser(null);
    setClient(null);
    setClientActive(true);
    setClientExpiredMessage('');
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(CLIENT_KEY);
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, user, client, clientActive, clientExpiredMessage, loading, login, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
}
