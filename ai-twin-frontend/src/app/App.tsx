import { useEffect, useMemo, useState } from 'react';
import { Alert, CssBaseline, Snackbar, ThemeProvider, createTheme } from '@mui/material';
import { Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppContext } from './context';
import { readAuth } from '../lib/api';
import { Shell } from './Shell';
import { AuthPage } from '../features/auth/AuthPage';
import { Dashboard } from '../features/dashboard/Dashboard';
import { TwinsPage } from '../features/twins/TwinsPage';
import { ChatPage } from '../features/chat/ChatPage';
import { MemoryPage } from '../features/memory/MemoryPage';
import { SettingsPage } from '../features/settings/SettingsPage';

const client = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
});
export default function App() {
  const [auth, setAuth] = useState(readAuth);
  const [mode, setMode] = useState<'light' | 'dark'>(() =>
    localStorage.getItem('twin.theme') === 'dark' ? 'dark' : 'light',
  );
  const [notice, setNotice] = useState('');
  useEffect(() => {
    const update = () => {
      client.clear();
      setAuth(readAuth());
    };
    window.addEventListener('auth-change', update);
    return () => window.removeEventListener('auth-change', update);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    localStorage.setItem('twin.theme', mode);
  }, [mode]);
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: mode === 'light' ? '#265c48' : '#a2d9be' },
          background: {
            default: mode === 'light' ? '#f8f9f6' : '#141b18',
            paper: mode === 'light' ? '#ffffff' : '#1b2520',
          },
          text: {
            primary: mode === 'light' ? '#203b30' : '#edf3ee',
            secondary: mode === 'light' ? '#758078' : '#a3b3a9',
          },
        },
        typography: {
          fontFamily: '"Inter", sans-serif',
          button: { textTransform: 'none', fontWeight: 600 },
        },
        shape: { borderRadius: 12 },
        components: {
          MuiButton: {
            defaultProps: { disableElevation: true },
            styleOverrides: { root: { borderRadius: 9, padding: '10px 18px' } },
          },
          MuiTextField: { defaultProps: { size: 'small', fullWidth: true } },
          MuiDialog: { styleOverrides: { paper: { borderRadius: 20 } } },
          MuiOutlinedInput: { styleOverrides: { root: { fontSize: 14 } } },
        },
      }),
    [mode],
  );
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={client}>
        <AppContext.Provider
          value={{
            auth,
            mode,
            toggleMode: () => setMode((m) => (m === 'light' ? 'dark' : 'light')),
            notify: setNotice,
          }}
        >
          <Routes>
            <Route path="/login" element={auth ? <Navigate to="/" replace /> : <AuthPage />} />
            <Route
              path="/register"
              element={auth ? <Navigate to="/" replace /> : <AuthPage register />}
            />
            <Route element={auth ? <Shell /> : <Navigate to="/login" replace />}>
              <Route index element={<Dashboard />} />
              <Route path="twins" element={<TwinsPage />} />
              <Route path="chat" element={<ChatPage key="new" />} />
              <Route path="chat/:id" element={<ChatPage />} />
              <Route path="memory" element={<MemoryPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
          <Snackbar open={!!notice} autoHideDuration={4500} onClose={() => setNotice('')}>
            <Alert severity="success" variant="filled" onClose={() => setNotice('')}>
              {notice}
            </Alert>
          </Snackbar>
        </AppContext.Provider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
