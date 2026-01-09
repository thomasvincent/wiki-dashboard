/**
 * Error Boundary Component
 * Catches JavaScript errors in child components and displays fallback UI
 * Prevents entire app from crashing due to component errors
 */

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { Box, Button, Typography, Alert, Paper } from '@mui/material';
import { Refresh as RefreshIcon, Home as HomeIcon } from '@mui/icons-material';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = (): void => {
    this.handleReset();
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50vh',
            p: 3,
          }}
        >
          <Paper elevation={0} sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
            <Alert severity="error" sx={{ mb: 3 }}>
              Something went wrong
            </Alert>

            <Typography variant="h6" gutterBottom>
              An error occurred in this section
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {this.state.error?.message || 'Unknown error'}
            </Typography>

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  mb: 3,
                  maxHeight: 150,
                  overflow: 'auto',
                  bgcolor: 'grey.50',
                  textAlign: 'left',
                }}
              >
                <Typography
                  variant="caption"
                  component="pre"
                  sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', fontSize: '0.7rem' }}
                >
                  {this.state.errorInfo.componentStack}
                </Typography>
              </Paper>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button variant="contained" startIcon={<RefreshIcon />} onClick={this.handleReset}>
                Try Again
              </Button>
              <Button variant="outlined" startIcon={<HomeIcon />} onClick={this.handleGoHome}>
                Go to Overview
              </Button>
            </Box>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

// === Functional Error Fallback (for use with react-error-boundary) ===

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        p: 3,
      }}
    >
      <Alert severity="error" sx={{ mb: 2 }}>
        Something went wrong
      </Alert>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {error.message}
      </Typography>
      <Button variant="contained" onClick={resetErrorBoundary}>
        Try Again
      </Button>
    </Box>
  );
}

export default ErrorBoundary;
