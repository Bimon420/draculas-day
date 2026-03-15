import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import { BlinkProvider, BlinkAuthProvider } from '@blinkdotnew/react'
import App from './App'
import { getProjectId } from './blink/client'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BlinkProvider projectId={getProjectId()} publishableKey={import.meta.env.VITE_BLINK_PUBLISHABLE_KEY || 'blnk_pk_h1hGoYzIyDQAAwuamiTjILQyUUl9G26q'}>
      <BlinkAuthProvider>
        <Toaster position="top-right" />
        <App />
      </BlinkAuthProvider>
    </BlinkProvider>
  </React.StrictMode>,
)
