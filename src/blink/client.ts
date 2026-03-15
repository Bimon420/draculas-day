import { createClient } from '@blinkdotnew/sdk'

export function getProjectId(): string {
  const envId = import.meta.env.VITE_BLINK_PROJECT_ID
  if (envId) return envId
  const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
  const match = hostname.match(/^([^.]+)\.sites\.blink\.new$/)
  return match ? match[1] : 'vampire-mini-game-43gigpmr'
}

export const blink = createClient({
  projectId: getProjectId(),
  publishableKey: import.meta.env.VITE_BLINK_PUBLISHABLE_KEY || 'blnk_pk_h1hGoYzIyDQAAwuamiTjILQyUUl9G26q',
  auth: { mode: 'managed' },
})
