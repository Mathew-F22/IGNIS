import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, getToken, setToken } from './api.js';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    if (!getToken()) { setUser(null); setReady(true); return; }
    try { const { user } = await api('/me'); setUser(user); } catch { setUser(null); }
    setReady(true);
  }, []);

  useEffect(() => {
    refresh();
    const onOut = () => setUser(null);
    window.addEventListener('ignis:logout', onOut);
    return () => window.removeEventListener('ignis:logout', onOut);
  }, [refresh]);

  const login = (token, u) => { setToken(token); setUser(u); };
  const logout = () => { setToken(null); setUser(null); };
  return <AuthCtx.Provider value={{ user, setUser, ready, login, logout, refresh, isMaster: user?.role === 'mestre' }}>{children}</AuthCtx.Provider>;
}
