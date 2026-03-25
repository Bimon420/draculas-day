import { createClient } from '@blinkdotnew/sdk'

export function getProjectId(): string {
  const envId = import.meta.env.VITE_BLINK_PROJECT_ID;
  if (envId) return envId;
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const match = hostname.match(/^([^.]+)\.sites\.blink\.new$/);
  // Robust fallback to current project ID
  return match ? match[1] : 'draculas-day';
}

export const blink = createClient({
  projectId: getProjectId(),
  publishableKey: import.meta.env.VITE_BLINK_PUBLISHABLE_KEY,
  auth: { mode: 'managed' },
});
