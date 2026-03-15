import { useState, useEffect } from 'react';
import { blink } from '../blink/client';
import { BlinkUser } from '@blinkdotnew/sdk';

export const useAuth = () => {
  const [user, setUser] = useState<BlinkUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user);
      setIsLoading(state.isLoading);
    });
    return unsubscribe;
  }, []);

  const login = () => blink.auth.login();
  const logout = () => blink.auth.signOut();

  return { user, isLoading, login, logout, isAuthenticated: !!user };
};
