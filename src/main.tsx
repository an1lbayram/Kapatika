import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#0284c7',
    },
    // Default error.main (#f44336) with white contained-button text falls to a
    // 3.68:1 contrast ratio, below the WCAG AA 4.5:1 minimum for bold 14px
    // text (axe: color-contrast). red-700 clears it comfortably (~5.9:1).
    error: {
      main: '#b91c1c',
    },
    background: {
      default: '#070a12',
      paper: '#0f172a',
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  shape: {
    borderRadius: 12,
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
)
