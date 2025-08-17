import { useEffect } from 'react';
import cfg from '../runtime-config.json';

const tokenKey = 'idToken';
const expiresKey = 'expiresAt';

export function signIn() {
  const redirect = encodeURIComponent(window.location.origin);
  window.location.href = `https://${cfg.Region}.amazoncognito.com/login?client_id=${cfg.UserPoolClientId}&response_type=token&scope=openid+email&redirect_uri=${redirect}`;
}

export function signOut() {
  const redirect = encodeURIComponent(window.location.origin);
  localStorage.removeItem(tokenKey);
  localStorage.removeItem(expiresKey);
  window.location.href = `https://${cfg.Region}.amazoncognito.com/logout?client_id=${cfg.UserPoolClientId}&logout_uri=${redirect}`;
}

export function getToken(): string | null {
  const exp = Number(localStorage.getItem(expiresKey) || 0);
  if (Date.now() > exp) return null;
  return localStorage.getItem(tokenKey);
}

export function parseHash(): void {
  if (window.location.hash.includes('id_token')) {
    const hash = new URLSearchParams(window.location.hash.substring(1));
    const idToken = hash.get('id_token');
    const expiresIn = Number(hash.get('expires_in') || '3600');
    if (idToken) {
      localStorage.setItem(tokenKey, idToken);
      localStorage.setItem(expiresKey, String(Date.now() + expiresIn * 1000));
    }
    window.location.hash = '';
  }
}

export function useAuthGuard() {
  useEffect(() => {
    parseHash();
    if (!getToken()) signIn();
  }, []);
}
