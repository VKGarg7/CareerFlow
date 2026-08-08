import { createTheme } from '@mui/material/styles'

export const muiTheme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#05060B', paper: '#101428' },
    primary: { main: '#5B5FEF', light: '#8184F5' },
    secondary: { main: '#A855F7', light: '#C084FC' },
    success: { main: '#10B981' },
    warning: { main: '#F59E0B' },
    error: { main: '#F43F5E' },
    info: { main: '#22D3EE' },
    text: { primary: '#E5E7EB', secondary: '#B4B8C7' },
  },
  typography: {
    fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCircularProgress: {
      defaultProps: { color: 'inherit' },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: 'rgba(255,255,255,0.5)',
          borderRadius: 10,
          transition: 'background-color 0.2s ease, color 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.07)',
            color: 'rgba(255,255,255,0.9)',
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          background: 'rgba(14,15,24,0.92)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10,
          fontSize: 11.5,
          fontWeight: 500,
          padding: '6px 10px',
          boxShadow: '0 12px 30px -8px rgba(0,0,0,0.5)',
        },
        arrow: { color: 'rgba(14,15,24,0.92)' },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(16px)',
          fontSize: 13.5,
        },
        standardError: {
          background: 'rgba(244,63,94,0.08)',
          color: '#FCA5A5',
        },
        standardSuccess: {
          background: 'rgba(16,185,129,0.08)',
          color: '#6EE7B7',
        },
        standardWarning: {
          background: 'rgba(245,158,11,0.08)',
          color: '#FCD34D',
        },
        standardInfo: {
          background: 'rgba(34,211,238,0.08)',
          color: '#A5F3FC',
        },
      },
    },
  },
})
