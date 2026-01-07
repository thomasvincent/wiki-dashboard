/**
 * Main App Component
 * Sets up providers and theme
 */

import React from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { lightTheme, darkTheme } from '@presentation/theme';
import { useUIStore } from '@presentation/hooks';
import { AppLayout } from '@presentation/components/dashboard/AppLayout';

// === Query Client ===

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // 1 minute
      retry: 3,
      refetchOnWindowFocus: true,
    },
  },
});

// === Theme Wrapper ===

function ThemedApp() {
  const { darkMode } = useUIStore();
  const theme = darkMode ? darkTheme : lightTheme;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppLayout />
    </ThemeProvider>
  );
}

// === Main App ===

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemedApp />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

export default App;
