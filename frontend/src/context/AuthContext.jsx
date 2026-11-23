import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('pos_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const persist = (token, nextUser) => {
    localStorage.setItem('pos_token', token);
    localStorage.setItem('pos_user', JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    persist(data.token, data.user);
    try {
      const { data: store } = await api.get('/settings');
      setSettings(store);
    } catch {
      setSettings(null);
    }
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_user');
    setUser(null);
  };

  useEffect(() => {
    const boot = async () => {
      const token = localStorage.getItem('pos_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const [{ data: me }, { data: store }] = await Promise.all([
          api.get('/auth/me'),
          api.get('/settings'),
        ]);
        localStorage.setItem('pos_user', JSON.stringify(me.user));
        setUser(me.user);
        setSettings(store);
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };
    boot();
  }, []);

  const refreshSettings = async () => {
    const { data } = await api.get('/settings');
    setSettings(data);
    return data;
  };

  const value = useMemo(
    () => ({ user, settings, loading, login, logout, refreshSettings, setSettings }),
    [user, settings, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
